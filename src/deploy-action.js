const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");
const { DagsterCloudClient } = require("./dagsterCloud");
const { getProcess, getLocations, buildDockerImages } = require("./utils");

async function run() {
  try {
    const imageTag =
      core.getInput("image-tag") || github.context.sha.substring(0, 6);

    const locationFile = core.getInput("location-file");

    const locations = await getLocations(locationFile);

    const parallel = core.getBooleanInput("parallel");
    const process = getProcess(parallel);

    await buildDockerImages(process, locationFile, locations, imageTag);

    await core.group("Push Docker image", async () => {
      await process(locations, async ([_, location]) => {
        const imageName = `${location["registry"]}:${imageTag}`;
        await exec.exec("docker", ["push", imageName]);
      });
    });

    await core.group("Update workspace locations", async () => {
      const dagitUrl = core.getInput("dagit-url");
      const endpoint = `${dagitUrl}/graphql`;

      const apiToken = core.getInput("api-token");

      const client = new DagsterCloudClient(endpoint, apiToken);

      await process(locations, async ([locationName, location]) => {
        const pythonFile = location["python_file"];
        const packageName = location["package_name"];
        const moduleName = location["module_name"];
        const workingDirectory = location["working_directory"];
        const executablePath = location["executable_path"];
        const attribute = location["attribute"];

        if (
          [pythonFile, packageName, moduleName].filter((x) => !!x).length != 1
        ) {
          core.error(
            `Must provide exactly one of python_file, package_name, or module_name on location ${locationName}.`
          );
        }

        // Optionally include some experimental git data in the location metadata
        // used for some rich linking UI
        const includeGitData = core.getBooleanInput("experimental-git-data");
        const sha = github.context.sha;
        const shortSha = sha.substr(0, 6);
        const url =
          `https://github.com/${github.context.repo.owner}/` +
          `${github.context.repo.repo}/tree/${shortSha}/${location["build"]}`;

        const locationData = {
          name: locationName,
          image: `${location["registry"]}:${imageTag}`,
          pythonFile: pythonFile,
          packageName: packageName,
          moduleName: moduleName,
          workingDirectory: workingDirectory,
          executablePath: executablePath,
          attribute: attribute,
          commitHash: includeGitData ? sha : undefined,
          url: includeGitData ? url : undefined,
        };

        const result = await client.updateLocation(locationData);
        core.info(`Successfully updated location ${result}`);
      });
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
