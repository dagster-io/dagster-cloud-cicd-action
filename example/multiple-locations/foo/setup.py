from setuptools import find_packages, setup

setup(
    name="foo",
    version="dev",
    author="Elementl",
    author_email="hello@elementl.com",
    classifiers=[
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Operating System :: OS Independent",
    ],
    packages=find_packages(),
    install_requires=[
        "dagster",
        "dagster-cloud",
    ],
)
