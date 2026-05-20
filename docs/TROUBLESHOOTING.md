# Troubleshooting

## Brain Files Missing or Corrupted

**Symptom:** `/lh status` returns errors or unexpected state.

**Fix:**
```bash
# Validate brain integrity
./scripts/validate.ps1

# Re-initialize missing files (preserves existing)
./scripts/init.ps1
```

## Context Compaction Not Running Automatically

**Symptom:** Context grows without compaction.

**Checks:**
1. Verify `config.json` has compaction enabled
2. Check `message_threshold` isn't set too high
3. Run manual compaction: `/lh compact`

## Git Auto-Commit Failures

**Symptom:** "Git auto-commit failed" on handoff.

**Fix:**
```bash
# Check git status
git status

# Commit manually
git add .long-horizon/
git commit -m "lh/session/YYYY-MM-DD-NNN: manual commit"
```

## AgentDB Not Detected

**Symptom:** Tier 2 features unavailable.

**Fix:**
1. Verify AgentDB is installed: `npx agentdb --version`
2. Check `auto_detect` is `true` in config
3. Set explicit engine path in config

## Session Handoff Not Preserving Context

**Symptom:** Next session doesn't pick up where previous left off.

**Fix:**
1. Run `/lh handoff` before closing every session
2. Check `brain/context/handoff-in.md` exists
3. Verify handoff was committed to git

## Validation Gates Failing

**Symptom:** Quality score dropping.

**Checks:**
1. Review `brain/lessons/` for recurring issues
2. Check test command is configured in `config.json`
3. Run `/lh reflect` for pattern analysis
