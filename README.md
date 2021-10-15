# Dagster Cloud CI GitHub Action

GitHub Action to update Dagster Cloud repo locations, building and pushing Docker images when pipeline code is updated.

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
        uses: dagster-io/dagster-cloud-ci-action@v0.1.0
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
  foo:
    build: ./foo_src
    registry: dagster-io/foo
    python_file: repo.py
  bar:
    build: ./bar_src
    registry: dagster-io/bar
    python_module: bar
```



## Customization

### Inputs
| Name                            | Description                                                                                  |
|---------------------------------|----------------------------------------------------------------------------------------------|
| `dagit-url`                     | **(Required)** URL to your Dagit Cloud instance, including the deployment path.              |
| `api-token`                     | **(Required)** Dagster Cloud Agent API token.                                                |
| `location-file`                 | Path to the `locations.yaml` file defining the repo locations to update. Defaults to `/locations.yaml` in the repo root. |
| `image-tag`                     | Tag for the built Docker images, defaults to the first 6 chars of git hash.                  |
| `parallel`                      | Whether to build and push Docker images in parallel. Defaults to `true`.                     |
