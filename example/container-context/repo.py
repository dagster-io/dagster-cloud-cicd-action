from dagster import Field, RunRequest, StringSource, job, op, repository


@op(
    config_schema={
        "must_be_bar": Field(
            StringSource,
        )
    },
)
def foo_op(context):
    must_be_bar = context.op_config["must_be_bar"]
    if must_be_bar != "bar":
        raise Exception(f"Job fails if must_be_bar is not bar, instead was {must_be_bar}")


@op()
def foo_op_2(_):
    pass


@job
def foo_job():
    foo_op()
    foo_op_2()


@job
def other_foo_job():
    foo_op()


@repository
def foo_repo():
    return [foo_job, other_foo_job]
