const fs = require('fs');
const path = require('path');
const { getLhDir, generateId } = require('./graph');

function init(cwd = process.cwd()) {
  const lhDir = getLhDir(cwd);
  const brainDir = path.join(lhDir, 'brain');

  // Idempotency: don't overwrite existing brain
  if (fs.existsSync(path.join(brainDir, 'graph-index.json'))) {
    try {
      const index = JSON.parse(fs.readFileSync(path.join(brainDir, 'graph-index.json'), 'utf8'));
      return { rootId: index.root_node, lhDir, projectName: path.basename(cwd) };
    } catch {}
  }

  const projectName = path.basename(cwd).replace(/["\\\n\r]/g, '');

  try {

  const dirs = [
    path.join(brainDir, 'decisions'),
    path.join(brainDir, 'lessons'),
    path.join(brainDir, 'patterns'),
    path.join(brainDir, 'tasks'),
    path.join(brainDir, 'milestones'),
    path.join(brainDir, 'context'),
    path.join(lhDir, 'sessions')
  ];

  for (const dir of dirs) fs.mkdirSync(dir, { recursive: true });

  const rootId = generateId('context');
  const now = new Date().toISOString();

  // Root node file
  const rootNode = `---
id: "${rootId}"
type: "context"
created: "${now}"
updated: "${now}"
status: "active"
edges: []
tags: ["root", "project"]
weight: 1.0
---

# ${projectName} — Root Node

## Content

Root node of the ${projectName} project graph. All knowledge connects back here.

## Context

Initialized by Long-Horizon v2.

## Backlinks

`;
  fs.writeFileSync(path.join(brainDir, 'context', `${rootId}.md`), rootNode, 'utf8');

  // Graph index
  const graphIndex = {
    version: '2.0',
    root_node: rootId,
    nodes: {
      [rootId]: {
        type: 'context', title: `${projectName} — Root Node`,
        file: `brain/context/${rootId}.md`,
        edges_out: [], edges_in: [],
        tags: ['root', 'project'], weight: 1.0
      }
    },
    edges: [],
    stats: { total_nodes: 1, total_edges: 0, last_updated: now }
  };
  fs.writeFileSync(path.join(brainDir, 'graph-index.json'), JSON.stringify(graphIndex, null, 2), 'utf8');

  // Loop state
  const loopState = {
    version: '2.0',
    loop: {
      status: 'idle', task_id: null, task_description: null,
      started_at: null, iteration: 0, max_iterations: 100,
      subtasks: [], completed_subtasks: [], blocked_subtasks: [],
      completion_criteria: [], completion_pct: 0,
      last_action: null, last_action_at: null,
      errors: [], should_continue: true
    },
    memory_queue: { pending_nodes: [], pending_edges: [] }
  };
  fs.writeFileSync(path.join(lhDir, 'loop-state.json'), JSON.stringify(loopState, null, 2), 'utf8');

  // Config
  const config = {
    version: '2.0',
    loop: { max_iterations: 100, memory_flush_interval: 3, max_retries_per_subtask: 3, auto_compact_threshold_pct: 80 },
    graph: { max_traversal_depth: 3, context_nodes_limit: 10, auto_backlink: true },
    validation: { enabled: true, test_command: '', lint_command: '' },
    git: { auto_commit: true, commit_on_milestone: true }
  };
  fs.writeFileSync(path.join(lhDir, 'config.json'), JSON.stringify(config, null, 2), 'utf8');

  return { rootId, lhDir, projectName };
  } catch (e) {
    throw new Error(`Failed to initialize Long-Horizon: ${e.message}`);
  }
}

module.exports = { init };
