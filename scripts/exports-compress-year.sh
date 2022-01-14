#!/bin/bash

# cd to project root
PROJECT_ROOT="$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )/.."
cd "$PROJECT_ROOT"

datePrefix=$1 # e.g. 2021

find ./exports/* -name "$datePrefix-*" -print > /tmp/export-files.manifest
if  [ ! -s /tmp/export-files.manifest ]; then
  echo "No files found!"
  exit 1
fi

tar -czf ./exports/exports-"$datePrefix".tar --files-from /tmp/export-files.manifest
find ./exports/* -name "$datePrefix-*" | xargs rm
rm /tmp/export-files.manifest
