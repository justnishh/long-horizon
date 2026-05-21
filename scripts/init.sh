#!/bin/bash
# Long-Horizon: Initialize project brain
# Usage: ./init.sh [project-path]

set -e

PROJECT_PATH="${1:-$(pwd)}"
LH_DIR="${PROJECT_PATH}/.long-horizon"

echo "Initializing Long-Horizon in ${PROJECT_PATH}..."

mkdir -p "${LH_DIR}/brain/decisions"
mkdir -p "${LH_DIR}/brain/roadmap"
mkdir -p "${LH_DIR}/brain/lessons"
mkdir -p "${LH_DIR}/brain/patterns"
mkdir -p "${LH_DIR}/brain/context"
mkdir -p "${LH_DIR}/brain/metrics"
mkdir -p "${LH_DIR}/sessions"

PROJECT_NAME=$(basename "${PROJECT_PATH}")

cat > "${LH_DIR}/brain/project.json" << EOF
{
  "name": "${PROJECT_NAME}",
  "initialized": "$(date +%Y-%m-%d)",
  "tech_stack": [],
  "goals": [],
  "version": "1.0"
}
EOF

cat > "${LH_DIR}/brain/context/state.json" << EOF
{
  "current_task": null,
  "last_session": null,
  "total_tasks": 0,
  "quality_score": 1.0,
  "sessions_count": 0
}
EOF

if [ -f "$(dirname "$0")/../config/default-config.json" ]; then
  cp "$(dirname "$0")/../config/default-config.json" "${LH_DIR}/config.json"
else
  cat > "${LH_DIR}/config.json" << 'CONFIG'
{
  "version": "1.0",
  "compaction": {
    "message_threshold": 50,
    "token_threshold_pct": 70,
    "task_threshold": 10
  },
  "validation": {
    "enabled": true,
    "test_command": "",
    "lint_command": "",
    "max_retries": 3
  },
  "reflection": {
    "enabled": true,
    "frequency_sessions": 3
  },
  "vector_db": {
    "auto_detect": true,
    "engine": "agentdb"
  },
  "git": {
    "auto_commit": true,
    "commit_prefix": "lh/",
    "session_tag": true
  }
}
CONFIG
fi

cat > "${LH_DIR}/brain/roadmap/current.md" << EOF
# Current Sprint

## Active Goals
1. [Goal 1]
2. [Goal 2]

## In Progress

## Blocked

## Recent Wins

---

*Updated: $(date +%Y-%m-%d)*
EOF

cat > "${LH_DIR}/brain/context/handoff-in.md" << EOF
# Handoff — First Session

## Current State

Long-Horizon initialized. Project ready for development.

## Next Steps

1. Define project goals in brain/roadmap/current.md
2. Make first architectural decisions

## Blockers

None
EOF

echo ""
echo "=== Long-Horizon Initialized ==="
echo "Location: ${LH_DIR}"
echo ""
echo "Next: Start working, then before closing run /lh handoff"
