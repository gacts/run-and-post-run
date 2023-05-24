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
  const options = {cwd: input.workingDirectory, env: process.env, silent: true}

  return (async () => {
    for (const command of commands) {
      if (command !== "") {
        core.info(`\x1b[1m$ ${command}\x1b[0m`)

        let output = input.shell === ""
          ? await exec.getExecOutput(command, [], options)
          : await exec.getExecOutput(input.shell, ['-c', command], options)

        output.stdout = output.stdout.trim()

        if (output.stdout !== "") {
          core.info(output.stdout)
        }

        output.stderr = output.stderr.trim()

        if (output.stderr !== "") {
          core.info(output.stderr)
        }

        if (output.exitCode !== 0) {
          core.setFailed(`Command failed with exit code ${output.exitCode}`)
        }
      }
    }
  })().catch(error => core.setFailed(error.message))
}
