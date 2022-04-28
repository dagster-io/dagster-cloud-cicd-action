const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");
const { DagsterCloudClient } = require("./dagsterCloud");
const {
  getProcess,
  getLocations,
  buildDockerImages,
  createCommentOnCommit,
} = require("./utils");

async function run() {
  try {
    const commitSha = github.context.payload.pull_request.head.sha;
    const imageTag = commitSha.substring(0, 6);

    const locationFile = core.getInput("location-file");

    const locations = await getLocations(locationFile);

    const parallel = core.getBooleanInput("parallel");
    const process = getProcess(parallel);

    await buildDockerImages(process, locationFile, locations, imageTag);

    await core.group("Create code preview", async () => {
      const dagitUrl = core.getInput("dagit-url");
      const endpoint = `${dagitUrl}/graphql`;

      const apiToken = core.getInput("api-token");

      const client = new DagsterCloudClient(endpoint, apiToken);

      const codePreview = {
        commitMessage: github.context.payload.pull_request.head.label,
        branchName: github.context.payload.pull_request.head.ref,
        branchUrl: github.context.payload.pull_request.html_url,
        commitSha: commitSha,
        commitUrl: `${github.context.payload.pull_request.html_url}/commits/${commitSha}`,
      };

      const codePreviewId = await client.createCodePreview(codePreview);

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

        const imageName = `${location["registry"]}:${imageTag}`;
        const pythonFileArg = pythonFile ? ["--python-file", pythonFile] : [];
        const packageNameArg = packageName ? ["--package-name", packageName] : [];
        const moduleNameArg = moduleName ? ["--module-name", moduleName] : [];
        const workingDirectoryArg = workingDirectory ? ["--working-directory", workingDirectory]: [];
        const executablePathArg = executablePath ? ["--executable-path", executablePath] : [];
        const attributeArg = attribute ? ["--attribute", attribute] : [];

        await exec.exec(
          "docker",
          [
            "run",
            imageName,
            "dagster-cloud",
            "workspace",
            "snapshot",
            locationName,
            codePreviewId,
            "--url",
            dagitUrl,
            "--api-token",
            apiToken,
            "--image",
            imageName,
          ]
            .concat(pythonFileArg)
            .concat(packageNameArg)
            .concat(moduleNameArg)
            .concat(workingDirectoryArg)
            .concat(executablePathArg)
            .concat(attributeArg)
        );

        core.info(
          `Successfully created repository location for code preview ${codePreviewId}`
        );

        await createCommentOnCommit(codePreviewId);
      });
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
