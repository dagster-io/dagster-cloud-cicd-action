const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const fs = require('fs');
const YAML = require('yaml');

async function installCloudCLI() {
  await exec.exec('pip', ['install', 'dagster-cloud'])
}

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
      core.error(`Error reading locations.yaml: ${error}`, file = locationFile);
    });

    const parallel = core.getBooleanInput('parallel');
    const process = parallel ? inParallel : inSeries;

    await core.group('Build Docker images', async () => {
      await process(locations, async ([_, location]) => {
        const imageName = `${location['registry']}:${imageTag}`;
        await exec.exec('docker',
          ['build', '.', '-t', imageName],
          options = {'cwd': location['build']}
        );
      });
    });

    await core.group('Push Docker image', async () => {
      await process(locations, async ([_, location]) => {
        const imageName = `${location['registry']}:${imageTag}`;
        await exec.exec('docker', ['push', imageName]);
      });
    });

    await core.group('Setup dagster cloud CLI', async () => {
      await installCloudCLI();
    });

    await core.group('Update workspace locations', async () => {
      const dagitUrl = core.getInput('dagit-url');
      const apiToken = core.getInput('api-token');

      await process(locations, async ([locationName, location]) => {
        const imageName = `${location['registry']}:${imageTag}`;

        const pythonFile = location['python_file'];
        const packageName = location['package_name'];
        if (!(pythonFile || packageName) || (pythonFile && packageName)) {
          core.error(`Must provide exactly one of python_file or package_name on location ${locationName}.`)
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
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();