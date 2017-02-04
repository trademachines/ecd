# ECD - EC2 Container Service Deployment [![Build Status](https://travis-ci.org/trademachines/ecd.svg?branch=master)](https://travis-ci.org/trademachines/ecd) [![Coverage Status](https://coveralls.io/repos/github/trademachines/ecd/badge.svg?branch=master)](https://coveralls.io/github/trademachines/ecd?branch=master)

# Motivation
We wanted to automate our deployment to AWS ECS with additional separation of concerns and some
convenience on top of it. To achieve this we developed this service running on AWS Lambda to do
the job of assembling a Task Definition and updating existing services inside an ECS cluster for us.

# How it works
We basically directly write the ECS Task Definitions as a configuration file. We just have the
comfort of composing it from different reusable fragments with full control per service.
When we run a deployment, we trigger the Lambda function through a call, either providing the
configuration with the call or fetching it from a central repository (the one that houses the
reusable fragments).

# Installation
We use a [Terraform module](/trademachines/tf-ecd) to provision the resources and Travis to deploy
the code to AWS Lambda. Convenient and straightforward.

# More
Additional information is provided in the [docs](docs) directory.
