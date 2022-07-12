from dagster import RunRequest, pipeline, repository, schedule, sensor, solid


@solid()
def foo_solid(_):
    pass


@solid()
def foo_solid_2(_):
    pass


@pipeline
def foo_pipeline():
    foo_solid()
    foo_solid_2()


@pipeline
def other_foo_pipeline():
    foo_solid()


@repository
def foo_repo():
    return [foo_pipeline]
