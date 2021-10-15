from dagster import RunRequest, pipeline, repository, schedule, sensor, solid


@solid()
def foo_solid(_):
    pass


@pipeline
def foo_pipeline():
    foo_solid()


@pipeline
def other_foo_pipeline():
    foo_solid()


@repository
def foo_repo():
    return [foo_pipeline]
