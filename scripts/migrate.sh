#!/bin/bash
# Long-Horizon: Migrate brain structure
# Usage: ./migrate.sh [project-path] [target-version]

set -e

PATH="${1:-$(pwd)}"
TARGET_VERSION="${2:-1.0}"
LH_DIR="${PATH}/.long-horizon"
CONFIG_FILE="${LH_DIR}/config.json"

if [ ! -f "${CONFIG_FILE}" ]; then
  echo "Error: No config.json found. Run ./init.sh first."
  exit 1
fi

CURRENT_VERSION=$(grep -oP '"version":\s*"\K[^"]+' "${CONFIG_FILE}" 2>/dev/null || echo "0.0")

echo "Current version: ${CURRENT_VERSION}"
echo "Target version: ${TARGET_VERSION}"

if [ "${CURRENT_VERSION}" = "${TARGET_VERSION}" ]; then
  echo "Already at target version. No migration needed."
  exit 0
fi

if [ "$(printf '%s\n' "${CURRENT_VERSION}" "${TARGET_VERSION}" | sort -V | head -1)" = "${CURRENT_VERSION}" ] && [ "${CURRENT_VERSION}" != "${TARGET_VERSION}" ]; then
  mkdir -p "${LH_DIR}/brain/patterns"
  mkdir -p "${LH_DIR}/brain/metrics"
  echo "Created: brain/patterns/, brain/metrics/"
fi

echo "Migration to v${TARGET_VERSION} complete."
