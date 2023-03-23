const core = require("@actions/core"); // https://github.com/actions/toolkit/tree/main/packages/core
const exec = require("@actions/exec"); // https://github.com/actions/toolkit/tree/main/packages/exec

// read action inputs
const input = {
  post: core.getInput('post', {required: true}),
  workingDirectory: core.getInput('working-directory'),
};

(async () => {
  const command = input.post

  if (command !== "") {
    await exec.exec(command, [], {cwd: input.workingDirectory});
  }
})();
