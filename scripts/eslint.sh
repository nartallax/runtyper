#!/usr/bin/env bash

set -e
cd `dirname "$0"`
cd ..

./node_modules/.bin/eslint . --ext .ts --max-warnings 1