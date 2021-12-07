FROM python:3.8-slim AS first-stage

ENV DAGSTER_VERSION=0.12.14

RUN pip install \
    dagster==${DAGSTER_VERSION} \
    dagster-cloud==${DAGSTER_VERSION}

WORKDIR /opt/dagster/app

COPY repo.py /opt/dagster/app

FROM python:3.8-slim AS second-stage