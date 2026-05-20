# Migration Guide

## v0.x → v1.0

### Breaking Changes
- Brain directory structure changed: `brain/decisions/` replaces flat `brain/` ADR files
- New required directories: `patterns/`, `metrics/`

### Migration Steps

```bash
# 1. Run migration script
./scripts/migrate.ps1 -TargetVersion "1.0"

# 2. Move existing ADR files
Move-Item .long-horizon/brain/*.md .long-horizon/brain/decisions/

# 3. Create new directories (if not auto-created)
New-Item -ItemType Directory -Path .long-horizon/brain/patterns -Force
New-Item -ItemType Directory -Path .long-horizon/brain/metrics -Force

# 4. Update config.json version
# Set "version": "1.0"

# 5. Validate
./scripts/validate.ps1
```

### New Features in v1.0
- `/lh search` command (with or without AgentDB)
- Multi-agent coordination via filesystem
- Automatic reflection every 3 sessions
- Quality scoring and metrics tracking
