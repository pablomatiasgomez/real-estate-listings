#!/bin/bash

# cd to project root
PROJECT_ROOT="$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )/.."
cd "$PROJECT_ROOT"

PID=$(pgrep -f "main.js diff-check")
if [[ $PID ]]; then
	echo "App is already running on PID $PID"
	exit 1;
fi

echo "Starting app!"
mkdir -p logs
nohup ./src/main.js diff-check -c ./config.json >> ./logs/stdout.log 2>&1 &
