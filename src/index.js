const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const YAML = require('yaml');
const {DagsterCloudClient} = require('./dagsterCloud');

const writeFileAsync = util.promisify(fs.writeFile);

async function inParallel(locations, processingFunction) {
  await Promise.all(Object.entries(locations).map(processingFunction));
}

async function inSeries(locations, processingFunction) {
  for (const location of locations) {
    await processingFunction(location);
  }
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dagster-cloud-ci'));
}

async function writeRequirementsDockerfile(baseImage) {
  const dockerfilePath = path.join(tmpDir(), 'Dockerfile');
  await writeFileAsync(dockerfilePath, `
FROM ${baseImage}

COPY requirements.txt .
RUN pip install -r requirements.txt

WORKDIR /opt/dagster/app

COPY . /opt/dagster/app
  `);
  return dockerfilePath;
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
        const basePath = path.parse(locationFile).dir;
        const buildPath = path.join(basePath, location['build']);

        let dockerfile = path.join(buildPath, 'Dockerfile');
        const baseImage = location['base_image'];

        if (!fs.existsSync(dockerfile)) {
          const requirementsFile = path.join(buildPath, 'requirements.txt');

          if (!fs.existsSync(requirementsFile) || !baseImage) {
            core.error("Supplied build path must either contain Dockerfile, or requirements.txt with base_image");
          }

          dockerfile = await writeRequirementsDockerfile(baseImage);
        } else {
          if (baseImage) {
            core.error("No need to specify base_image for location if build path contains Dockerfile");
          }

          dockerfile = './Dockerfile';
        }

        const imageName = `${location['registry']}:${imageTag}`;

        let dockerArguments = [
          'build', '.',
          '--label', `sha=${github.context.sha}`,
          '-f', dockerfile,
          '-t', imageName
        ];
        
        if (location['target']) {
          dockerArguments = dockerArguments.concat(['--target', location['target']]);
        }

        await exec.exec('docker',
          dockerArguments,
          options = {'cwd': buildPath}
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
        const shortSha = sha.substr(0, 6);
        const url = `https://github.com/${github.context.repo.owner}/`
          + `${github.context.repo.repo}/tree/${shortSha}/${location['build']}`;

        const locationData = {
          name: locationName,
          image: `${location['registry']}:${imageTag}`,
          pythonFile: pythonFile,
          packageName: packageName,
          sha: includeGitData ? sha : undefined,
          url: includeGitData ? url : undefined
        }

        const result = await client.updateLocation(locationData);
        core.info(`Successfully updated location ${result}`);
      });
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();