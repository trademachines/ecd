#!/usr/bin/env bash

set -e

docker-compose build --no-cache
docker-compose run libucl
cp -f out/libucl.so ./../src/core/resources/
git add ../src/core/resources/libucl.so
