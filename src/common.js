const core = require("@actions/core"); // https://github.com/actions/toolkit/tree/main/packages/core
const exec = require("@actions/exec"); // https://github.com/actions/toolkit/tree/main/packages/exec
const process = require("process");

// read action inputs
const input = {
  run: core.getMultilineInput('run'),
  post: core.getMultilineInput('post', {required: true}),
  workingDirectory: core.getInput('working-directory'),
  shell: core.getInput('shell'),
};

export async function run() {
  return runCommands(joinMultilineCommands(input.run))
}

export async function post() {
  return runCommands(joinMultilineCommands(input.post))
}

/**
 * @param {String[]} commands
 * @return {String[]}
 */
function joinMultilineCommands(commands) {
  const result = []
  const re = /\\\s*$/
  const buf = []

  for (const cmd of commands) {
    buf.push(cmd.replace(re, '')) // push command into buffer

    if (!re.test(cmd)) { // if command not ends with \
      result.push(buf.join(' ')) // join buffer and push into result

      buf.length = 0 // clear buffer
    }
  }

  return result
}

/**
 * @param {String[]} commands
 */
async function runCommands(commands) {
  /** @type {import('@actions/exec/lib/interfaces').ExecOptions} */
  const options = {
    cwd: input.workingDirectory,
    env: process.env,
    silent: true,
    listeners: {
      stdline: (data) => core.info(data),
      errline: (data) => core.info(data),
    },
  }

  return (async () => {
    for (const command of commands) {
      if (command !== "") {
        core.info(`\x1b[1m$ ${command}\x1b[0m`)

        let exitCode = input.shell === ""
          ? await exec.exec(command, [], options)
          : await exec.exec(input.shell, ['-c', command], options)

        if (exitCode !== 0) {
          core.setFailed(`Command failed with exit code ${exitCode}`)
        }
      }
    }
  })().catch(error => core.setFailed(error.message))
}
