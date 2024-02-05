# .#!/usr/bin/env bash
# set -e
# set -x
MY_PATH=$(realpath $(dirname "$0"))
# PROJECT_ROOT=$(realpath ${MY_PATH}/../..)

## treated as a completely separate project (not even a workspace), create an empty yarn.lock file in it.
# touch yarn.lock
# rm -rf node_modules
# rm -rf .terra
# yarn install
# rm yarn.lock
# rm -rf ./output
# mkdir -p ./output/rtc/headfile
# mkdir -p ./output/rtc/cppfile




rm -rf ./output
mkdir -p ./output/rtc/headfile
mkdir -p ./output/rtc/cppfile


npm exec terra -- run \
    --config ${MY_PATH}/config/headfile_configs.yaml \
    --output-dir=./output/rtc/headfile \

# npm exec terra -- run \
#     --config ${MY_PATH}/config/cppfile_configs.yaml \
#     --output-dir=./output/rtc/cppfile \