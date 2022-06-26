#!/bin/bash

# cd to project root
PROJECT_ROOT="$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )/.."
cd "$PROJECT_ROOT"

datePrefix=$1 # e.g. 2021

find ./exports/* -name "$datePrefix*" -print > ./export-files.manifest
if  [ ! -s ./export-files.manifest ]; then
  echo "No files found!"
  exit 1
fi

echo "Going to compress $(wc -l < ./export-files.manifest | sed 's/ //g') files"
tar -czf ./exports/exports-"$datePrefix".tar --files-from ./export-files.manifest

echo "Deleting files"
cat ./export-files.manifest | xargs rm

echo "Deleting manifest file"
rm ./export-files.manifest
