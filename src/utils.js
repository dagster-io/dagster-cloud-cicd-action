const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");
const fs = require("fs");
const YAML = require("yaml");
const path = require("path");
const os = require("os");
const util = require("util");


export async function getLocations(locationFile) {
  const locations = await core
    .group("Read locations.yaml", async () => {
      const locationsFile = fs.readFileSync(locationFile, "utf8");
      return YAML.parse(locationsFile).locations;
    })
    .catch((error) => {
      core.error(`Error reading locations.yaml: ${error}`, (file = locations));
    });

  return locations;
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dagster-cloud-ci"));
}

async function writeRequirementsDockerfile(baseImage) {
  const dockerfilePath = path.join(tmpDir(), "Dockerfile");
  const writeFileAsync = util.promisify(fs.writeFile);

  await writeFileAsync(
    dockerfilePath,
    `
  FROM ${baseImage}

  COPY requirements.txt .
  RUN pip install -r requirements.txt

  WORKDIR /opt/dagster/app

  COPY . /opt/dagster/app
    `
  );

  return dockerfilePath;
}

export function getProcess(parallel) {
  return parallel ? inParallel : inSeries;
}

async function inParallel(locations, processingFunction) {
  await Promise.all(Object.entries(locations).map(processingFunction));
}

async function inSeries(locations, processingFunction) {
  for (const location of locations) {
    await processingFunction(location);
  }
}

export async function buildDockerImages(
  process,
  locationFile,
  locations,
  imageTag
) {
  await core.group("Build Docker images", async () => {
    await process(locations, async ([_, location]) => {
      const basePath = path.parse(locationFile).dir;
      const buildPath = path.join(basePath, location["build"]);

      let dockerfile = path.join(buildPath, "Dockerfile");
      const baseImage = location["base_image"];

      if (!fs.existsSync(dockerfile)) {
        const requirementsFile = path.join(buildPath, "requirements.txt");

        if (!fs.existsSync(requirementsFile) || !baseImage) {
          core.error(
            "Supplied build path must either contain Dockerfile, or requirements.txt with base_image"
          );
        }

        dockerfile = await writeRequirementsDockerfile(baseImage);
      } else {
        if (baseImage) {
          core.error(
            "No need to specify base_image for location if build path contains Dockerfile"
          );
        }

        dockerfile = "./Dockerfile";
      }

      const imageName = `${location["registry"]}:${imageTag}`;

      let dockerArguments = [
        "build",
        ".",
        "--label",
        `sha=${github.context.sha}`,
        "-f",
        dockerfile,
        "-t",
        imageName,
      ];

      if (location["target"]) {
        dockerArguments = dockerArguments.concat([
          "--target",
          location["target"],
        ]);
      }

      if (location["dockerfile"]) {
        dockerArguments = dockerArguments.concat([
          "--file",
          location["dockerfile"],
        ]);
      }

      await exec.exec("docker", dockerArguments, { cwd: buildPath });
    });
  });
}

export async function updateLocations(process, client, locations, imageTag) {
  await core.group("Update workspace locations", async () => {
    await process(locations, async ([locationName, location]) => {
      const pythonFile = location["python_file"];
      const packageName = location["package_name"];
      const moduleName = location["module_name"];
      const workingDirectory = location["working_directory"];
      const executablePath = location["executable_path"];
      const attribute = location["attribute"];
      const containerContext = location["container_context"]

      if (
        [pythonFile, packageName, moduleName].filter((x) => !!x).length != 1
      ) {
        core.error(
          `Must provide exactly one of python_file, package_name, or module_name on location ${locationName}.`
        );
      }

      // Git metadata, used for rich linkbacks
      const sha = github.context.sha;
      const shortSha = sha.substr(0, 6);
      const url =
        `https://github.com/${github.context.repo.owner}/` +
        `${github.context.repo.repo}/tree/${shortSha}`;

      const locationData = {
        location_name: locationName,
        code_source: {
          python_file: pythonFile,
          package_name: packageName,
          module_name: moduleName,
        },
        image: `${location["registry"]}:${imageTag}`,
        working_directory: workingDirectory,
        executable_path: executablePath,
        attribute: attribute,
        git: {
          commit_hash: sha,
          url: url
        },
        container_context: containerContext,
      };

      const result = await client.updateLocation(locationData);
      core.info(`Updated location ${result}.`);
    });
  });
}

function getOctokit() {
  const githubToken = core.getInput("github-token");
  const octokit = github.getOctokit(githubToken);

  return octokit
}


async function findCommentsForEvent() {
  core.debug("find comments for event");

  const octokit = getOctokit()

  if (github.context.eventName === "commit") {
    core.debug('event is "commit", use "listCommentsForCommit"');
    return octokit.rest.repos.listCommentsForCommit({
      ...github.context.repo,
      commit_sha: github.context.sha,
    });
  }
  if (github.context.eventName === "pull_request") {
    core.debug('event is "pull_request", use "listComments"');
    return octokit.rest.issues.listComments({
      ...github.context.repo,
      issue_number: github.context.issue.number,
    });
  }
  core.error("not supported event_type");
  return { data: [] };
}

async function findPreviousComment(text) {
  const { data: comments } = await findCommentsForEvent();

  const dagsterCloudCodePreviewURLComment = comments.find((comment) =>
    comment.body.startsWith(text)
  );
  if (dagsterCloudCodePreviewURLComment) {
    core.info("previous comment found");
    return dagsterCloudCodePreviewURLComment.id;
  }
  core.info("previous comment not found");
  return null;
}

export async function createCommentOnCommit(codePreviewId) {
  const dagitUrl = core.getInput("dagit-url");
  const commentHeader = "A preview of your Dagster code locations is being automatically created with Dagster Cloud.";
  const commentId = await findPreviousComment(commentHeader);
  const commentBody = `${commentHeader}

✅ Preview: [${dagitUrl}/preview/${codePreviewId}/workspace](${dagitUrl}/preview/${codePreviewId}/workspace)
  `;
  const octokit = getOctokit()

  if (commentId) {
    await octokit.rest.issues.updateComment({
      ...github.context.repo,
      comment_id: commentId,
      body: commentBody,
    });
  } else {
    await octokit.rest.issues.createComment({
      ...github.context.repo,
      issue_number: github.context.issue.number,
      body: commentBody,
    });
  }
}
