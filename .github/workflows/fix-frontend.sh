#!/usr/bin/env bash
set -e

if [ -d "fronted" ] && [ ! -d "frontend" ]; then
  mkdir -p frontend
  cp -a fronted/. frontend/
  echo "Created frontend/ from fronted/ without deleting legacy folder."
else
  echo "Nothing to do: frontend/ already exists or fronted/ is missing."
fi
