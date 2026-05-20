#!/bin/bash
# Long-Horizon: Compact session context
# Usage: ./compact.sh [project-path] [session-name]

set -e

PATH="${1:-$(pwd)}"
SESSION_NAME="${2:-session-$(date +%Y%m%d-%H%M%S)}"
LH_DIR="${PATH}/.long-horizon"

if [ ! -d "${LH_DIR}" ]; then
  echo "Error: No .long-horizon directory found. Run ./init.sh first."
  exit 1
fi

TODAY_DIR="${LH_DIR}/sessions/$(date +%Y-%m-%d)"
mkdir -p "${TODAY_DIR}"

cat > "${TODAY_DIR}/${SESSION_NAME}.md" << EOF
# ${SESSION_NAME} — $(date +%Y-%m-%d %H:%M)

**Status:** Compacted

## Summary

Session automatically compacted. Permanent knowledge preserved in brain/.

## Key Outcomes

- Review brain/decisions/ for decisions made
- Review brain/lessons/ for lessons learned
- Review brain/patterns/ for patterns identified
- Review brain/roadmap/current.md for progress
EOF

echo "Context compacted: ${TODAY_DIR}/${SESSION_NAME}.md"
