FROM python:3.8-slim

RUN pip install \
    dagster \
    dagster-cloud

WORKDIR /opt/dagster/app

COPY repo.py /opt/dagster/app