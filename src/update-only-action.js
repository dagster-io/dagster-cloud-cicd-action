const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");
const { DagsterCloudClient } = require("./dagsterCloud");
const { getProcess, getLocations, buildDockerImages, updateLocations } = require("./utils");

async function run() {
  try {
    const imageTag = core.getInput("image-tag");

    const locationFile = core.getInput("location-file");

    const locations = await getLocations(locationFile);

    const parallel = core.getBooleanInput("parallel"); 
    const process = getProcess(parallel);

    const dagitUrl = core.getInput("dagit-url");
    const endpoint = `${dagitUrl}/graphql`;
    const apiToken = core.getInput("api-token");
    const client = new DagsterCloudClient(endpoint, apiToken);

    await updateLocations(process, client, locations, imageTag);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
