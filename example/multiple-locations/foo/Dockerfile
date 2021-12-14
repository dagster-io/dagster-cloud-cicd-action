FROM python:3.8-slim

ENV DAGSTER_VERSION=0.13.12

ADD foo /foo
ADD setup.py .
RUN pip install -e .
