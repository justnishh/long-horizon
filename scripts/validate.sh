#!/bin/bash
# Long-Horizon: Validate brain integrity
# Usage: ./validate.sh [project-path]

set -e

PROJECT_PATH="${1:-$(pwd)}"
LH_DIR="${PROJECT_PATH}/.long-horizon"

if [ ! -d "${LH_DIR}" ]; then
  echo "Error: No .long-horizon directory found. Run ./init.sh first."
  exit 1
fi

ERRORS=()
WARNINGS=()

REQUIRED_DIRS=(
  "brain"
  "brain/decisions"
  "brain/roadmap"
  "brain/lessons"
  "brain/patterns"
  "brain/context"
  "brain/metrics"
  "sessions"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "${LH_DIR}/${dir}" ]; then
    ERRORS+=("Missing directory: ${dir}")
  fi
done

declare -A REQUIRED_FILES
REQUIRED_FILES["brain/project.json"]="project identity"
REQUIRED_FILES["brain/context/state.json"]="session state"
REQUIRED_FILES["brain/roadmap/current.md"]="current roadmap"
REQUIRED_FILES["config.json"]="configuration"

for file in "${!REQUIRED_FILES[@]}"; do
  if [ ! -f "${LH_DIR}/${file}" ]; then
    WARNINGS+=("Missing file: ${file} (${REQUIRED_FILES[$file]})")
  fi
done

echo "=== Long-Horizon Validation ==="
echo "Path: ${LH_DIR}"
echo ""

if [ ${#ERRORS[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
  echo "Status: HEALTHY"
  exit 0
fi

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "Errors:"
  for e in "${ERRORS[@]}"; do echo "  ✗ $e"; done
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo "Warnings:"
  for w in "${WARNINGS[@]}"; do echo "  ⚠ $w"; done
fi

[ ${#ERRORS[@]} -gt 0 ] && echo "Status: UNHEALTHY" && exit 1
echo "Status: DEGRADED" && exit 1
