#!/bin/bash

# cd to project root
PROJECT_ROOT="$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )/.."
cd "$PROJECT_ROOT"

PID=$(pgrep -f "export.js")
if [[ $PID ]]; then
	echo "App is already running on PID $PID"
	exit 1;
fi

echo "Starting app!"
mkdir -p logs
nohup ./src/export.js >> ./logs/stdout.log 2>&1 &
