from setuptools import find_packages, setup

setup(
    name="marketlens",
    version="0.1.0",
    package_dir={"": "backend/src"},
    packages=find_packages(where="backend/src"),
)
