# Advanced Configuration

## Vector DB Setup (Tier 2)

Long-Horizon auto-detects AgentDB for semantic search. Install with:

```bash
npm install -g @agent-db/cli
# or
npx agentdb install
```

Once installed, Long-Horizon will automatically:
- Index all `.long-horizon/brain/` files into vectors
- Enable semantic search via `/lh search <query>`
- Pull relevant memories into session context on INIT
- Detect pattern similarities across sessions

### Configuring AgentDB

```json
{
  "vector_db": {
    "auto_detect": true,
    "engine": "agentdb",
    "connection": {
      "host": "localhost",
      "port": 8543
    }
  }
}
```

## Custom Compaction Rules

Override defaults in `.long-horizon/config.json`:

```json
{
  "compaction": {
    "message_threshold": 100,
    "token_threshold_pct": 80,
    "task_threshold": 20,
    "custom_patterns": {
      "preserve": ["SECURITY_*", "API_CHANGE_*"],
      "compress": ["DEBUG_*"],
      "discard": ["TYPO_FIX_*"]
    }
  }
}
```

## CI/CD Integration

Add Long-Horizon validation to your CI pipeline:

```yaml
# .github/workflows/lh-validate.yml
name: Long-Horizon Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate Brain
        run: |
          if [ -f ".long-horizon/validate.sh" ]; then
            bash .long-horizon/validate.sh
          fi
      - name: Check ADR Consistency
        run: |
          echo "Checking ADR numbering..."
          ls .long-horizon/brain/decisions/ 2>/dev/null | sort
```

## Multi-Project Memory

Long-Horizon can link projects via shared brain:

```json
{
  "memory_links": [
    {"path": "../shared-library/.long-horizon", "type": "dependency"},
    {"path": "../docs/.long-horizon", "type": "reference"}
  ]
}
```

This enables cross-project pattern sharing and dependency-aware context.

## Custom Agent Definitions

Extend the 7 default agent roles with your own:

```json
{
  "agents": {
    "docs-writer": {
      "responsibility": "Documentation maintenance",
      "files": ["docs/**/*.md"]
    },
    "perf-engineer": {
      "responsibility": "Performance optimization",
      "files": ["brain/metrics/performance.json"]
    }
  }
}
```
