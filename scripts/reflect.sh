#!/bin/bash
# Long-Horizon: Run reflection analysis
# Usage: ./reflect.sh [project-path]

set -e

PATH="${1:-$(pwd)}"
LH_DIR="${PATH}/.long-horizon"

if [ ! -d "${LH_DIR}" ]; then
  echo "Error: No .long-horizon directory found. Run ./init.sh first."
  exit 1
fi

LESSONS_DIR="${LH_DIR}/brain/lessons"
PATTERNS_DIR="${LH_DIR}/brain/patterns"
DECISIONS_DIR="${LH_DIR}/brain/decisions"

LESSON_COUNT=0
PATTERN_COUNT=0
DECISION_COUNT=0

[ -d "${LESSONS_DIR}" ] && LESSON_COUNT=$(find "${LESSONS_DIR}" -name "*.md" | wc -l)
[ -d "${PATTERNS_DIR}" ] && PATTERN_COUNT=$(find "${PATTERNS_DIR}" -name "*.md" | wc -l)
[ -d "${DECISIONS_DIR}" ] && DECISION_COUNT=$(find "${DECISIONS_DIR}" -name "*.md" | wc -l)

REFLECTION_FILE="${LESSONS_DIR}/reflect-$(date +%Y-%m-%d).md"

cat > "${REFLECTION_FILE}" << EOF
# Reflection — $(date +%Y-%m-%d)

## Memory Statistics
- Architecture Decisions: ${DECISION_COUNT}
- Lessons Learned: ${LESSON_COUNT}
- Patterns Discovered: ${PATTERN_COUNT}

## Analysis Areas

### Mistakes
Review brain/lessons/ for recurring issues.

### Patterns
Review brain/patterns/ for valuable patterns to formalize.

### Architecture Health
Review brain/decisions/ for decision consistency.

### Quality Trends
Review brain/ for quality scores over time.

## Recommendations

1. Review recent lessons for actionable improvements
2. Check ADR consistency if >3 decisions without review
3. Update roadmap with current reality
EOF

echo "Reflection written: ${REFLECTION_FILE}"
echo "Decisions: ${DECISION_COUNT} | Lessons: ${LESSON_COUNT} | Patterns: ${PATTERN_COUNT}"
