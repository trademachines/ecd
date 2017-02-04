#!/usr/bin/env bash

set -e

docker build -t "trademachines/ecd" .
docker push "trademachines/ecd"
