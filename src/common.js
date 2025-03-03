import process from 'node:process'

import parseStringArgs from './string-argv'
import createTmpFile from './tmpfile'

import * as core from '@actions/core' // https://github.com/actions/toolkit/tree/main/packages/core
import { exec } from '@actions/exec' // https://github.com/actions/toolkit/tree/main/packages/exec

// read action inputs
const input = {
  run: core.getInput('run'),
  post: core.getInput('post', { required: true }),
  workingDirectory: core.getInput('working-directory'),
  shell: core.getInput('shell'),
  postShell: core.getInput('post-shell'),
  verbose: core.getBooleanInput('verbose'),
}

const newLine = core.platform.isWindows ? '\r\n' : '\n'

export async function run() {
  return runCommand(input.run, input.shell)
}

export async function post() {
  return runCommand(input.post, input.postShell ? input.postShell : input.shell)
}

/**
 * @param {String} commands
 * @param {String} shell
 *
 * @return {Promise<void>}
 */
async function runCommand(commands, shell) {
  /** @type {import('@actions/exec/lib/interfaces').ExecOptions} */
  const options = {
    cwd: input.workingDirectory,
    env: process.env,
    silent: !(input.verbose || core.isDebug()),
    listeners: {
      stdline: (data) => core.info(data),
      errline: (data) => core.info(data),
    },
  }

  core.debug('debug mode enabled')
  core.debug(`is silent ${options.silent}`)

  let shellCommand, argFormat

  if (shell === '') {
    if (core.platform.isWindows) {
      shellCommand = 'pwsh'
    } else {
      shellCommand = 'sh'
    }
    argFormat = getArgFormat(shellCommand)
  } else {
    const spl = shell.split(' ', 2)
    shellCommand = spl[0]
    argFormat = parseStringArgs(spl[1])

    if (argFormat.length === 0) {
      argFormat = getArgFormat(shellCommand)
    }
  }

  if (argFormat.length === 0 || !isArgsContainsPlaceholder(argFormat)) {
    throw new Error(
      "Invalid shell option. Shell must be a valid built-in (bash, sh, cmd, powershell, pwsh) or a format string containing '{0}'"
    )
  }

  let content = fixupScript(shellCommand, commands)

  if (core.platform.isWindows) {
    content = content.replace('\r\n', '\n').replace('\n', '\r\n')
  }

  const scriptFile = await createTmpFile(getFileExt(shellCommand))

  return scriptFile.handl
    .write(Buffer.from(content, 'utf8'))
    .then(() => scriptFile.handl.close())
    .catch((err) => {
      throw new Error('Failed to write to temporary file', { cause: err })
    })
    .then(() =>
      argFormat.map((arg) =>
        arg.replace('{0}', core.toPlatformPath(scriptFile.name))
      )
    )
    .then((args) => exec(shellCommand, args, options))
    .then((exitCode) => {
      if (exitCode !== 0)
        throw new Error(`Command failed with exit code ${exitCode}`)
    })
    .catch((err) => {
      throw new Error('Command execution failed', { cause: err })
    })
    .finally(() => scriptFile.delete())
}

/**
 * Get the shell command and args format for the given script type
 *
 * @param scriptType {string}
 * @return {string[]}
 */
function getArgFormat(scriptType) {
  switch (scriptType) {
    case 'cmd':
      return ['/D', '/E:ON', '/V:OFF', '/S', '/C', 'CALL', '{0}']
    case 'powershell':
    case 'pwsh':
      return ['-command', ". '{0}'"]
    case 'bash':
      return ['--noprofile', '--norc', '-e', '-o', 'pipefail', '{0}']
    case 'sh':
      return ['-c', '{0}']
    case 'python':
      return ['{0}']
  }

  return []
}

/**
 * Get the file extension for the given script type
 *
 * @param scriptType {string}
 * @return {string}
 */
function getFileExt(scriptType) {
  switch (scriptType) {
    case 'cmd':
      return '.cmd'
    case 'powershell':
    case 'pwsh':
      return '.ps1'
    case 'bash':
    case 'sh':
      return '.sh'
    case 'python':
      return '.py'
  }
  return ''
}

/**
 * Fixup the script contents for the given script type
 *
 * @param scriptType{string}
 * @param contents{string}
 * @return {string}
 */
function fixupScript(scriptType, contents) {
  switch (scriptType) {
    case 'cmd':
      contents = `@echo off${newLine}${contents}`
      break
    case 'powershell':
    case 'pwsh':
      const prepend = "$ErrorActionPreference = 'stop'"
      const append =
        'if ((Test-Path -LiteralPath variable:\\LASTEXITCODE)) { exit $LASTEXITCODE }'
      contents = `${prepend}${newLine}${contents}${newLine}${append}`
      break
  }

  return contents
}

/**
 * Check if the args contain a placeholder
 *
 * @param args {string[]}
 * @return {boolean}
 */
function isArgsContainsPlaceholder(args) {
  for (const arg of args) {
    if (arg.includes('{0}')) {
      return true
    }
  }
  return false
}
