# Multiple Locations Example

This [`locations.yaml`](./locations.yaml) file specifies multiple code locations, which are built and pushed
to separate ECR repositories concurrently by the GitHub Action. The GitHub actions workflow
for this example can be found at
[`.github/workflows/example-multiple-locations.yml`](../../.github/workflows/example-multiple-locations.yml).

`parallel: false` can be supplied as an input to the GitHub Action to build and push each location
sequentially, for debug purposes.