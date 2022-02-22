FROM python:3.8-slim AS first-stage

RUN pip install \
    dagster \
    dagster-cloud

WORKDIR /opt/dagster/app

COPY repo.py /opt/dagster/app

FROM python:3.8-slim AS second-stage