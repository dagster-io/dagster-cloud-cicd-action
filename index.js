const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

async function installCloudCLI() {
  await exec.exec('pip', ['install', 'dagster-cloud'])
}

async function run() {
  try {
    const registry = core.getInput('registry');
    const imageTag = core.getInput('image-tag') || github.context.sha.substring(0, 6);

    const imageName = `${registry}:${imageTag}`;

    const buildPath = core.getInput('build-path');

    const githubUrl =
      await core.group('Build Docker image', async () => {
        await exec.exec('docker', ['build', '.', '-t', imageName], options = {'cwd': buildPath});
      });
    await core.group('Push Docker image', async () => {
      await exec.exec('docker', ['push', imageName]);
    });
    await core.group('Setup dagster cloud CLI', async () => {
      await installCloudCLI();
    });
    await core.group('Update workspace location', async () => {
      const locationName = core.getInput('location-name');
      const dagitUrl = core.getInput('dagit-url');
      const apiToken = core.getInput('api-token');

      const pythonFile = core.getInput('python-file');
      const packageName = core.getInput('package-name');
      if (!(pythonFile || packageName) || (pythonFile && packageName)) {
        core.error('Must provide exactly one of `python-file` or `package-name` parameters.')
      }
      const codeParams = pythonFile ? ['-f', pythonFile] : ['-p', packageName];
      await exec.exec('dagster-cloud',
        [
          'workspace',
          'update-location', locationName,
          '--upsert',
          '--image', imageName,
          ...codeParams,
          '--url', dagitUrl,
          '--api-token', apiToken
        ]
      );
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();