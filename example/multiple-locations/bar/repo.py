from dagster import RunRequest, pipeline, repository, schedule, sensor, solid


@solid()
def bar_solid(_):
    pass


@pipeline
def bar_pipeline():
    bar_solid()


@pipeline
def other_bar_pipeline():
    bar_solid()


@repository
def bar_repo():
    return [bar_pipeline]
