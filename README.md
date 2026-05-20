<p align="center">
  <img src="https://img.shields.io/badge/AI-Autonomous-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Memory-Graph%20Brain-ff69b4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Dependencies-Zero-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/npm/v/long-horizon?style=for-the-badge&color=orange" />
  <img src="https://img.shields.io/github/stars/justnishh/long-horizon?style=for-the-badge" />
</p>

<h1 align="center">🧠 Long-Horizon</h1>

<p align="center">
  <strong>Give your AI one prompt. It builds the entire project.</strong><br>
  <em>Autonomous execution loop + graph-connected memory that grows like a brain.</em>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#works-with">Works With</a> •
  <a href="#live-brain-viewer">Live Brain Viewer</a> •
  <a href="#mcp-server">MCP Server</a>
</p>

---

## The Problem

You prompt your AI. It does one thing. Stops. You prompt again. It forgot what it did. You re-explain. It makes the same mistake. You rage-quit.

**Long-Horizon fixes this permanently.**

## The Solution

```bash
npx long-horizon init
```

Now your AI:
1. **Self-loops** — executes subtask after subtask without stopping
2. **Never forgets** — builds a connected knowledge graph as it works
3. **Resumes perfectly** — picks up exactly where it left off after any interruption
4. **Self-heals** — graph index auto-repairs if corrupted

---

## Quick Start

```bash
# Initialize in your project
npx long-horizon init

# Install for your AI tool
npx long-horizon adapt cursor    # or: windsurf, aider, claude, codex, all

# Start the live brain viewer
npx long-horizon live

# Give your AI a task — it loops autonomously until done
```

---

## How It Works

### 1. The Autonomous Loop

```
You: "Build auth system"

AI (iteration 1): Creates user model ✓
AI (iteration 2): Adds password hashing ✓
AI (iteration 3): Builds login endpoint ✓
AI (iteration 4): Adds JWT tokens ✓
AI (iteration 5): Writes tests ✓
AI (iteration 6): Adds error handling ✓
AI: "Done. 6 iterations, 100% complete."
```

**No prompting between steps.** The AI is the loop.

### 2. The Graph Brain

Every decision, lesson, and pattern becomes a connected node:

```
                    ┌─────────────┐
          ┌────────│  ROOT NODE  │────────┐
          │        │  (project)  │        │
          ▼        └─────────────┘        ▼
    ┌──────────┐                    ┌──────────┐
    │ decision │────leads_to───────▶│   task   │
    │ "Use JWT"│                    │"Build API"│
    └────┬─────┘                    └────┬─────┘
         │                               │
         │ caused_by                     │ learned_from
         ▼                               ▼
    ┌──────────┐                    ┌──────────┐
    │  lesson  │◄────related───────▶│ pattern  │
    │"No local │                    │"Repo     │
    │ storage" │                    │ pattern" │
    └──────────┘                    └──────────┘
```

### 3. Parallel Memory

While the AI works, it simultaneously queues knowledge updates. Every 3 iterations, it flushes — creating nodes, linking edges. **Work and memory happen at the same time.**

---

## Works With

| Tool | Command | How |
|------|---------|-----|
| **Cursor** | `lh adapt cursor` | Writes `.cursorrules` |
| **Windsurf** | `lh adapt windsurf` | Writes `.windsurfrules` |
| **Claude Code / Kiro** | `lh adapt claude` | Writes `.claude/skills/` |
| **Aider** | `lh adapt aider` | Writes `CONVENTIONS.md` + `.aider.conf.yml` |
| **OpenAI Codex** | `lh adapt codex` | Writes `AGENTS.md` |
| **Any AI tool** | `lh adapt generic` | Writes `CLAUDE.md` (universal) |
| **All at once** | `lh adapt all` | Installs everything |

---

## Live Brain Viewer

Real-time cyberpunk neural interface that shows your AI's brain growing:

```bash
npx long-horizon live
```

Opens at `http://localhost:3333` with:
- 🖤 Animated grid background with neon glowing nodes
- ⚡ Particle trails flowing along edges like neural signals
- 🔊 Sound effects when new nodes appear (toggleable)
- 📊 Side panel with stats and node list
- 🖱️ Drag nodes, hover for details

---

## MCP Server

Expose graph operations as MCP tools for AI agents:

```bash
npx long-horizon mcp
```

11 tools available: `lh_init`, `lh_add_node`, `lh_add_edge`, `lh_search`, `lh_get_node`, `lh_traverse`, `lh_status`, `lh_loop_start`, `lh_loop_iterate`, `lh_loop_complete_subtask`, `lh_loop_finalize`

---

## CLI Commands

```bash
# Core
lh init                    # Initialize graph brain
lh status                  # Loop progress + graph stats
lh repair                  # Rebuild graph index from node files

# Graph
lh graph [id] [depth]      # Traverse the knowledge graph
lh node <id>               # Inspect a specific node
lh add-node <type> <title> # Create a node manually
lh add-edge <src> <rel> <tgt>  # Link two nodes
lh search <query>          # Search nodes by title, tags, content

# Visualization
lh viewer                  # Graph snapshot (static HTML)
lh live                    # Real-time brain viewer
lh share                   # Generate shareable brain HTML

# Export
lh export obsidian         # Export as Obsidian vault with [[wikilinks]]
lh export markdown         # Export as Markdown wiki
lh export json             # Export as single JSON file

# Maintenance
lh stats                   # Brain growth metrics + hub analysis
lh sync                    # Commit brain to git + push
lh compact                 # Compact context, preserve graph
lh reflect                 # Analyze graph health + patterns
lh validate                # Check integrity + auto-repair

# Integration
lh adapt [tool|all|list]   # Install for your AI tool
lh mcp                     # Start MCP server (stdio)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    YOUR AI TOOL                       │
│  (Cursor / Windsurf / Claude / Aider / Codex)       │
├─────────────────────────────────────────────────────┤
│                   SKILL.md                           │
│  Instructions: "You are autonomous. Loop until done. │
│  Build the graph. Never stop until 100% complete."  │
├─────────────────────────────────────────────────────┤
│              .long-horizon/                          │
│  ┌─────────────┐  ┌──────────────────────────────┐ │
│  │ loop-state  │  │         brain/                │ │
│  │   .json     │  │  ┌─────────────────────────┐ │ │
│  │             │  │  │    graph-index.json      │ │ │
│  │ • status    │  │  │    (self-healing index)  │ │ │
│  │ • subtasks  │  │  ├─────────────────────────┤ │ │
│  │ • iteration │  │  │ decisions/ lessons/      │ │ │
│  │ • % done    │  │  │ patterns/  tasks/        │ │ │
│  │ • queue     │  │  │ milestones/ context/     │ │ │
│  └─────────────┘  │  └─────────────────────────┘ │ │
│                    └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Autonomous Loop** | AI self-triggers through subtasks until 100% done |
| **Graph Memory** | Connected nodes with typed edges (leads_to, caused_by, etc.) |
| **Self-Healing Index** | Auto-rebuilds graph-index.json from node files if corrupted |
| **Live Viewer** | Real-time cyberpunk visualization with sound effects |
| **MCP Server** | 11 tools for direct AI integration |
| **Universal Adapters** | One command for Cursor, Windsurf, Claude, Aider, Codex |
| **Search** | Full-text search across titles, tags, and content |
| **Export** | Obsidian vault, Markdown wiki, or JSON |
| **Shareable Brain** | Generate standalone HTML anyone can open |
| **Git Sync** | Auto-commit brain to git |
| **Conflict Detection** | Warns when new knowledge contradicts existing |
| **Weight Decay** | Old unused nodes fade, recent ones stay prominent |
| **Stats Dashboard** | Terminal metrics with bar charts and hub analysis |

---

## Why Zero Dependencies?

- **Instant install** — `npx` just works, no waiting
- **No supply chain risk** — nothing to audit
- **Works offline** — no network calls
- **Tiny** — ~34KB packed
- **Node 16+** — runs everywhere

---

## vs. Other Approaches

| Approach | Problem | Long-Horizon |
|----------|---------|--------------|
| Prompt chaining | Manual, breaks on errors | **Autonomous loop, self-heals** |
| RAG/Vector DB | Heavy, needs infra | **Zero deps, filesystem only** |
| Custom GPTs | Locked to one platform | **Works with any AI tool** |
| Memory plugins | Flat, no connections | **Graph brain with edges** |
| Session logs | Write-only, never read | **Traversable, queryable** |
| MCP memory servers | Memory only, no execution | **Memory + autonomous execution** |

---

## Contributing

PRs welcome. The codebase is intentionally simple — pure Node.js, no build step, no transpilation.

```bash
git clone https://github.com/justnishh/long-horizon
cd long-horizon
node bin/lh.js help
```

---

## License

MIT

---

<p align="center">
  <strong>One prompt. Full project. Connected memory.</strong><br>
  <em>Stop babysitting your AI.</em>
</p>
