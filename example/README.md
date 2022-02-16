# Examples

This folder contains a number of examples of potential use cases of the Dagster Cloud CI/CD Action.

- [`minimal`](./minimal): A minimal example which builds a single code location from a Dockerfile.
- [`requirements-txt`](./requirements-txt): A lightweight example which builds from a `requirements.txt`
file instead of a Dockerfile.
- [`multiple-locations`](./multiple-locations): An example containing multiple code locations,
which are built and pushed separately.
- [`docker-target-stage`](./docker-target-stage): An example which specifies the [Docker target stage](https://docs.docker.com/develop/develop-images/multistage-build/) to build in a multistage Dockerfile.
- [`update-only`](./update-only): An example which uses the update only action, with a custom build-and-push process. Here, the action is only responsible for notifying Dagster Cloud that a new image is available.