const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const fs = require('fs');
const YAML = require('yaml');
const { DagsterCloudClient } = require('./dagsterCloud');

async function inParallel(locations, processingFunction) {
  await Promise.all(Object.entries(locations).map(processingFunction));
}

async function inSeries(locations, processingFunction) {
  for (const location of locations) {
    await processingFunction(location);
  }
}

async function run() {
  try {
    const imageTag = core.getInput('image-tag') || github.context.sha.substring(0, 6);

    const locationFile = core.getInput('location-file');

    const locations = await core.group('Read locations.yaml', async () => {
      const locationsFile = fs.readFileSync(locationFile, 'utf8');
      return YAML.parse(locationsFile).locations;
    }).catch(error => {
      core.error(`Error reading locations.yaml: ${error}`, file = locations);
    });

    const parallel = core.getBooleanInput('parallel');
    const process = parallel ? inParallel : inSeries;

    await core.group('Build Docker images', async () => {
      await process(locations, async ([_, location]) => {
        const imageName = `${location['registry']}:${imageTag}`;
        await exec.exec('docker',
          [
            'build', '.',
            '--label', `sha=${github.context.sha}`,
            '-t', imageName
          ],
          options = { 'cwd': location['build'] }
        );
      });
    });

    await core.group('Push Docker image', async () => {
      await process(locations, async ([_, location]) => {
        const imageName = `${location['registry']}:${imageTag}`;
        await exec.exec('docker', ['push', imageName]);
      });
    });

    await core.group('Update workspace locations', async () => {
      const dagitUrl = core.getInput('dagit-url');
      const endpoint = `${dagitUrl}/graphql`

      const apiToken = core.getInput('api-token');

      const client = new DagsterCloudClient(endpoint, apiToken);

      await process(locations, async ([locationName, location]) => {
        const pythonFile = location['python_file'];
        const packageName = location['package_name'];
        if (!(pythonFile || packageName) || (pythonFile && packageName)) {
          core.error(`Must provide exactly one of python_file or package_name on location ${locationName}.`)
        }

        // Optionally include some experimental git data in the location metadata
        // used for some rich linking UI
        const includeGitData = core.getBooleanInput('experimental-git-data');
        const sha = github.context.sha;
        const url = `https://github.com/${github.context.repo.owner}/`
          + `${github.context.repo.repo}/tree/${sha}/${location['build']}`;

        const locationData = {
          name: locationName,
          image: `${location['registry']}:${imageTag}`,
          pythonFile: pythonFile,
          packageName: packageName,
          sha: includeGitData ? sha : undefined,
          url: includeGitData ? url : undefined
        }

        const result = await client.updateLocation(locationData);
      });
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();