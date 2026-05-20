<p align="center">
  <img src="https://img.shields.io/badge/AI-Autonomous-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Memory-Graph%20Brain-ff69b4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Dependencies-Zero-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/npm/v/long-horizon?style=for-the-badge&color=orange" />
  <img src="https://img.shields.io/github/stars/anthropics/long-horizon?style=for-the-badge" />
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
  <a href="#graph-viewer">Graph Viewer</a>
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

---

## Quick Start

```bash
# Install (or use npx — zero install needed)
npx long-horizon init

# Install for your AI tool
npx long-horizon adapt cursor    # or: windsurf, aider, claude, codex, all

# That's it. Give your AI a task:
# "Build a REST API with authentication"
# It will decompose → execute → loop → done. No hand-holding.
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

One root node → everything connects → traverse from any knowledge to related knowledge.

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

## Graph Viewer

Interactive force-directed visualization of your AI's brain:

```bash
npx long-horizon viewer
```

Opens a browser with your knowledge graph — drag nodes, see connections, watch it grow.

---

## CLI Commands

```bash
lh init                    # Initialize graph brain
lh status                  # Loop progress + graph stats
lh graph [id] [depth]      # Traverse the knowledge graph
lh node <id>               # Inspect a specific node
lh add-node <type> <title> # Create a node manually
lh add-edge <src> <rel> <tgt>  # Link two nodes
lh adapt [tool|all|list]   # Install for your AI tool
lh viewer                  # Open graph visualization
lh compact                 # Compact context, preserve graph
lh reflect                 # Analyze graph for patterns
lh validate                # Check graph integrity
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
│  │ • status    │  │  │    (central registry)    │ │ │
│  │ • subtasks  │  │  ├─────────────────────────┤ │ │
│  │ • iteration │  │  │ decisions/ lessons/      │ │ │
│  │ • % done    │  │  │ patterns/  tasks/        │ │ │
│  │ • queue     │  │  │ milestones/ context/     │ │ │
│  └─────────────┘  │  └─────────────────────────┘ │ │
│                    └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Why Zero Dependencies?

- **Instant install** — `npx` just works, no waiting
- **No supply chain risk** — nothing to audit
- **Works offline** — no network calls
- **Tiny** — the whole thing is ~30KB
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

---

## How the Loop Actually Works

The SKILL.md file contains instructions that tell your AI:

> "You are autonomous. When given a task, decompose it into subtasks. Execute them one by one. Never ask 'should I continue?' — just continue. Update loop-state.json every iteration. Process memory queue every 3 iterations. Only stop when 100% done or truly blocked after 3 retries."

The AI reads this, follows it, and becomes self-driving. No daemon. No background process. The instructions ARE the loop.

---

## Contributing

PRs welcome. The codebase is intentionally simple — pure Node.js, no build step, no transpilation.

```bash
git clone https://github.com/anthropics/long-horizon
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
