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
  /** @type {String[]} */
  const result = []
  const re = /[\\ ]+$/

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i]

    if (re.test(command)) {
      if (result.length !== 0) { // if not first command
        result[result.length - 1] += ' ' + command.replace(re, '')

        continue
      } else if (i !== commands.length - 1) { // is not last command
        result.push(command.replace(re, ''))

        continue
      }
    }

    result.push(command)
  }

  return result
}

/**
 * @param {String[]} commands
 */
async function runCommands(commands) {
  return (async () => {
    for (const command of commands) {
      if (command !== "") {
        await exec.exec(input.shell, ['-c', command], {cwd: input.workingDirectory, env: process.env});
      }
    }
  })().catch(error => core.setFailed(error.message))
}
