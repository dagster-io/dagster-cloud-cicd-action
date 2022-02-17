# This represents a custom build and push process.
#
# While the build/push in this example could be performed by the CI/CD deploy action,
# any nonstandard build/push process could be used here.

DIRECTORY=`dirname ${BASH_SOURCE[0]}`

docker build $DIRECTORY -t "764506304434.dkr.ecr.us-west-2.amazonaws.com/github-action-demo-minimal:${IMAGE_TAG}"

docker push "764506304434.dkr.ecr.us-west-2.amazonaws.com/github-action-demo-minimal:${IMAGE_TAG}"