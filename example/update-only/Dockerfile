FROM python:3.8-slim

ENV DAGSTER_VERSION=0.13.12

RUN pip install \
    dagster==${DAGSTER_VERSION} \
    dagster-cloud==${DAGSTER_VERSION}

WORKDIR /opt/dagster/app

COPY repo.py /opt/dagster/app