#!/usr/bin/env bash

set -e

export CC=gcc
cd /tmp
curl -sSL -O https://github.com/vstakhov/libucl/archive/master.tar.gz
tar xfz master.tar.gz
cd libucl-master
./autogen.sh
./configure --enable-urls
make
cp -f src/.libs/libucl.so /build/out/
