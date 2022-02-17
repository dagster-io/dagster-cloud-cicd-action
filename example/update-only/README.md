# Update Only Example

This is a minimal example of a repo set up to use the update only action. This action relies on a new image already built and pushed.
The tag for this image must be specified with the `image-tag` parameter to the action, which is then responsible for notifying Dagster Cloud that a new image is ready to use.

The GitHub actions workflow for this example can be found at
[`.github/workflows/example-update-only.yml`](../../.github/workflows/example-update-only.yml).
