#!/bin/bash
set -e

echo "=== Long-Horizon Installer ==="

SKILL_DIR="${HOME}/.claude/skills/long-horizon"
REPO_URL="https://github.com/YOUR_ORG/long-horizon.git"

# Detect platform
case "$(uname -s)" in
  Linux*)   MACHINE=linux;;
  Darwin*)  MACHINE=mac;;
  CYGWIN*|MINGW*|MSYS*) MACHINE=windows;;
  *)        MACHINE=unknown;;
esac

echo "Platform: ${MACHINE}"

# Create skill directory
mkdir -p "${SKILL_DIR}"

# Download SKILL.md
if command -v curl &> /dev/null; then
  echo "Downloading Long-Horizon skill..."
  curl -fsSL "${REPO_URL}/raw/main/SKILL.md" -o "${SKILL_DIR}/SKILL.md"
elif command -v wget &> /dev/null; then
  wget -q "${REPO_URL}/raw/main/SKILL.md" -O "${SKILL_DIR}/SKILL.md"
else
  echo "Please install curl or wget, then re-run this script."
  exit 1
fi

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Long-Horizon installed to: ${SKILL_DIR}"
echo ""
echo "To use in any project:"
echo "  1. Open your project in Claude Code / OpenCode"
echo "  2. Run: /lh init"
echo "  3. Start working"
echo "  4. Before closing: /lh handoff"
echo ""
