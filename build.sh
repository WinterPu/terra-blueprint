# .#!/usr/bin/env bash
# set -e
# set -x
# MY_PATH=$(realpath $(dirname "$0"))
# PROJECT_ROOT=$(realpath ${MY_PATH}/../..)

# treated as a completely separate project (not even a workspace), create an empty yarn.lock file in it.
touch yarn.lock
rm -rf node_modules
rm -rf .terra
yarn install
rm yarn.lock

npm exec terra -- run \
    --config ./config/types_configs.yaml \
    --output-dir=./packages/@iris/rtc/generate \

npm exec terra -- run \
    --config ./config/binding_configs.yaml \
    --output-dir=./packages/rtc \