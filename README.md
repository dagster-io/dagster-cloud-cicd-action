# Dagster Cloud CI GitHub Action

GitHub Action to update Dagster Cloud repo locations, building and pushing Docker images when pipeline code is updated.

## Usage

This action requires that access to the target Docker registry is set up, and that the
Git repository is cloned using the [`actions/checkout`](https://github.com/actions/checkout)
action.

### Example Job
This example uses the [`docker/login-action`](https://github.com/docker/login-action) action to set up Docker registry access. ECR users may want to use the [`aws-actions/amazon-ecr-login`](https://github.com/aws-actions/amazon-ecr-login) action instead.


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
          registry: dagster/example-location
          dagit-url: https://hooli.dagster.cloud/prod
          api-token: ${{ secrets.DAGSTER_AGENT_TOKEN }}
          location-name: example-location
          python-file: repo.py
```

### Multiple Repo Locations
To update multiple repo locations, you can use multiple invocations of the CI action.


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

      - name: First Location
        uses: dagster-io/dagster-cloud-ci-action@v0.1.0
        with:
          registry: dagster/first-location
          dagit-url: https://hooli.dagster.cloud/prod
          api-token: ${{ secrets.DAGSTER_AGENT_TOKEN }}
          location-name: first-location
          build-path: src/first-pipeline
          python-file: repo.py

      - name: Second Location
        uses: dagster-io/dagster-cloud-ci-action@v0.1.0
        with:
          registry: dagster/second-location
          dagit-url: https://hooli.dagster.cloud/prod
          api-token: ${{ secrets.DAGSTER_AGENT_TOKEN }}
          location-name: second-location
          build-path: src/second-pipeline
          python-file: repo.py
```

## Customization

### Inputs
| Name                            | Description                                                                                  |
|---------------------------------|----------------------------------------------------------------------------------------------|
| `registry`                      | **(Required)** Docker registry to push to.                                                   |
| `dagit-url`                     | **(Required)** URL to your Dagit Cloud instance, including the deployment path.              |
| `api-token`                     | **(Required)** Dagster Cloud Agent API token.                                                |
| `location-name`                 | **(Required)** Name for the repo location to create or update.                               |
| `python-file`                   | Python file where the repository lives in the built Docker image. One of `python-file` or `package-name` is required. |
| `package-name`                  | Python package where the repository lives in the built Docker image. One of `python-file` or `package-name` is required. |
| `build-path`                    | Path to the directory containing the Dockerfile from the root of the repository. Defaults to the root. |
| `image-tag`                     | Tag for the built Docker image, defaults to the first 6 chars of git hash.                   |
