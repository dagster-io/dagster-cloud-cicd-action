# Dagster Cloud CI/CD GitHub Action

GitHub Action to update Dagster Cloud code locations, building and pushing Docker images when pipeline code is updated.

## Quickstart

Want to get started right away, or look at a functional example for reference? We provide a [quickstart template repo](https://github.com/dagster-io/dagster-cloud-cicd-action-quickstart) which you can use to get CI for your Cloud instance up and running quickly.

## Usage

This action requires that access to the target Docker registry is set up, and that the
Git repository is cloned using the [`actions/checkout`](https://github.com/actions/checkout)
action.

The action utilizes a `locations.yaml` file which describes each of the Dagster Cloud repo
locations to be built and updated. If this `locations.yaml` file is not located at the repo root,
it must be specified with the `location-file` input.

### Example Job

This example uses the [`docker/login-action`](https://github.com/docker/login-action) action to set up Docker registry access. ECR users may want to use the [`aws-actions/amazon-ecr-login`](https://github.com/aws-actions/amazon-ecr-login) action instead. To speed up Docker builds, you may also
use the [`satackey/action-docker-layer-caching`](https://github.com/satackey/action-docker-layer-caching) action.

```yaml
on:
  push:
    branches:
      - main

jobs:
  dagster-cloud:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v1

      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build images & update Dagster Cloud
        uses: dagster-io/dagster-cloud-cicd-action/deploy@v0.2.0
        with:
          dagit-url: https://hooli.dagster.cloud/prod
          api-token: ${{ secrets.DAGSTER_AGENT_TOKEN }}
```

### Example `locations.yaml`

This locations file indicates that two locations, `foo` and `bar`, should be built. These
locations have
Dockerfiles located at `/foo_src/Dockerfile` and `/bar_src/Dockerfile`, and are pushed to the
`dagster-io/foo` and `dagster-io/bar` registries, respectively.

```yaml
locations:
  # Location name
  foo:
    # Path to build directory, which must contain a Dockerfile or
    # requirements.txt file, relative to the locations.yaml folder
    build: ./foo_src

    # The base Docker image to use, if providing only a requirements.txt
    # file and no Dockerfile
    base_image: python:3.8-slim

    # Docker registry to push the built Docker image to
    registry: dagster-io/foo

    # Python file containing the job repo
    # Can alternatively supply package_name, as below
    python_file: repo.py

  bar:
    build: ./bar_src
    registry: dagster-io/bar
    package_name: bar
```

### More Examples

More examples are provided in the [`example` folder](./example).

## Customization

### Inputs

| Name            | Description                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `dagit-url`     | **(Required)** URL to your Dagit Cloud instance, including the deployment path.                                          |
| `api-token`     | **(Required)** Dagster Cloud Agent API token.                                                                            |
| `location-file` | Path to the `locations.yaml` file defining the code locations to update. Defaults to `/locations.yaml` in the repo root. |
| `image-tag`     | Tag for the built Docker images, defaults to the first 6 chars of git hash.                                              |
| `parallel`      | Whether to build and push Docker images in parallel. Defaults to `true`.                                                 |
| `include-git-metadata`      | Whether to include the commit hash and backlink in created code locations. Defaults to `true`.               |

### `locations.yaml` Properties

Each location specified in the `locations.yaml` can have the following properties:

| Name                | Description                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `build`             | **(Required)** Path to the build directory relative to the `locations.yaml`'s folder. Build directory must contain a `Dockerfile` or `requirements.txt` file.                              |
| `registry`          | **(Required)** Docker registry to push the built Docker image to.                                                                                                                          |
| `package_name`      | Installed Python package containing the [Dagster Repository](https://docs.dagster.io/concepts/repositories-workspaces/repositories). Can alternatively use `python_file` or `module_name`. |
| `module_name`       | Python module containing the [Dagster Repository](https://docs.dagster.io/concepts/repositories-workspaces/repositories). Can alternatively use `python_file` or `package_name`.           |
| `python_file`       | Python file containing the [Dagster Repository](https://docs.dagster.io/concepts/repositories-workspaces/repositories). Can alternatively use `package_name` or `module_name`.             |
| `working_directory` | (Optional) Working directory to use for importing Python modules when loading the repository.                                                                                              |
| `executable_path`   | (Optional) Path to reach the executable to use for the Python environment to load the repository. Defaults to the installed `dagster` command-line entry point.                            |
| `attribute`         | (Optional) Specifies either a repository or a function that returns a repository. Can be used when the code contains multiple repositories but only one should be included.                |
| `base_image`        | If the build directory only contains a `requirements.txt` file and no `Dockerfile`, specifies the base Docker image to use to build the code location.                                     |
| `target`            | If providing a multistage `Dockerfile`, can be used to specify the [target stage](https://docs.docker.com/develop/develop-images/multistage-build/) to build.                              |

## Developing the CI/CD Action

The CI/CD action is run from the packaged files in the `dist/*` folder. When making a change, be sure to repackage the files:

```sh
npm run prepare
```
