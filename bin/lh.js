#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const cmd = args[0];
const cwd = process.cwd();

const C = { reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', purple: '\x1b[35m', cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', blue: '\x1b[34m' };

function log(msg) { console.log(msg); }
function heading(msg) { log(`\n${C.purple}${C.bold}${msg}${C.reset}`); }
function success(msg) { log(`${C.green}✓${C.reset} ${msg}`); }
function info(msg) { log(`${C.cyan}›${C.reset} ${msg}`); }
function warn(msg) { log(`${C.yellow}!${C.reset} ${msg}`); }
function error(msg) { log(`${C.red}✗${C.reset} ${msg}`); process.exit(1); }

const commands = {
  init() {
    const { init } = require('../src/init');
    const { rootId, lhDir, projectName } = init(cwd);
    heading('Long-Horizon initialized');
    success(`Project: ${projectName}`);
    success(`Root node: ${rootId}`);
    success(`Brain: ${lhDir}`);
    log('');
    info('Give your AI a task — it will self-execute until done.');
    info('Run `lh adapt` to install for your AI tool.');

    // Auto-start live viewer
    try {
      require('child_process').execFileSync('node', [path.join(__dirname, '..', 'src', 'auto-viewer.js'), cwd], { stdio: 'inherit' });
    } catch {}
  },

  status() {
    const graph = require('../src/graph');
    const loop = require('../src/loop');
    const gs = graph.stats(cwd);
    const ls = loop.status(cwd);

    heading('Loop Status');
    info(`Status: ${ls.status === 'running' ? C.green : ls.status === 'blocked' ? C.red : C.dim}${ls.status}${C.reset}`);
    if (ls.task_description) info(`Task: ${ls.task_description}`);
    info(`Iteration: ${ls.iteration} | Completion: ${ls.completion_pct}%`);
    if (ls.subtasks.length) {
      log('');
      ls.subtasks.forEach(s => {
        const icon = s.status === 'done' ? `${C.green}✓` : s.status === 'blocked' ? `${C.red}✗` : `${C.dim}○`;
        log(`  ${icon}${C.reset} #${s.id}: ${s.description}`);
      });
    }

    heading('Graph Brain');
    info(`Nodes: ${gs.total_nodes} | Edges: ${gs.total_edges}`);
    if (gs.types) {
      Object.entries(gs.types).forEach(([t, c]) => log(`  ${C.dim}${t}: ${c}${C.reset}`));
    }
  },

  graph() {
    const graph = require('../src/graph');
    const startId = args[1] || null;
    const depth = parseInt(args[2]) || 2;
    const nodes = graph.traverse(cwd, startId, depth);

    heading('Graph Traversal');
    nodes.forEach(n => {
      const indent = '  '.repeat(n.depth);
      const color = { context: C.purple, decision: C.cyan, task: C.blue, lesson: C.green, pattern: C.yellow, milestone: C.bold }[n.type] || '';
      log(`${indent}${color}● ${n.title}${C.reset} ${C.dim}(${n.id})${C.reset}`);
    });
  },

  node() {
    const graph = require('../src/graph');
    const id = args[1];
    if (!id) error('Usage: lh node <id>');
    const n = graph.getNode(cwd, id);
    if (!n) error(`Node not found: ${id}`);

    heading(n.title);
    info(`Type: ${n.type} | Weight: ${n.weight}`);
    info(`Tags: ${(n.tags || []).join(', ')}`);
    info(`Edges out: ${(n.edges_out || []).join(', ') || 'none'}`);
    info(`Edges in: ${(n.edges_in || []).join(', ') || 'none'}`);
    if (n.content) { log(''); log(n.content); }
  },

  'add-node'() {
    const graph = require('../src/graph');
    const type = args[1];
    const title = args.slice(2).join(' ');
    if (!type || !title) error('Usage: lh add-node <type> <title>');
    const index = graph.readIndex(cwd);
    const id = graph.addNode(cwd, { type, title, connectTo: index.root_node, relation: 'related' });
    success(`Created: ${id}`);
  },

  'add-edge'() {
    const graph = require('../src/graph');
    const [, source, relation, target] = args;
    if (!source || !relation || !target) error('Usage: lh add-edge <source> <relation> <target>');
    graph.addEdge(cwd, { source, target, relation });
    success(`Edge: ${source} →[${relation}]→ ${target}`);
  },

  search() {
    const graph = require('../src/graph');
    const query = args.slice(1).join(' ');
    if (!query) error('Usage: lh search <query>');
    const results = graph.search(cwd, query);

    if (results.length === 0) {
      warn(`No results for "${query}"`);
      return;
    }

    heading(`Search: "${query}" (${results.length} results)`);
    results.forEach(r => {
      const color = { context: C.purple, decision: C.cyan, task: C.blue, lesson: C.green, pattern: C.yellow, milestone: C.bold }[r.type] || '';
      log(`  ${color}● ${r.title}${C.reset} ${C.dim}[${r.type}] ${r.id}${C.reset}`);
    });
  },

  adapt() {
    const adapters = require('../src/adapters');
    const adapter = args[1] || 'all';

    if (adapter === 'list') {
      heading('Available Adapters');
      adapters.list().forEach(a => log(`  ${C.cyan}${a.key}${C.reset} — ${a.name} (${a.files.join(', ')})`));
      return;
    }

    const results = adapters.install(cwd, adapter);
    heading('Adapters Installed');
    results.forEach(r => success(`${r.name} → ${r.file}`));
  },

  viewer() {
    const graph = require('../src/graph');
    const index = graph.readIndex(cwd);
    const viewerSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'viewer.html'), 'utf8');
    
    // Embed graph data directly into HTML so it works without a server
    const injected = viewerSrc.replace(
      '// Also try to load from URL param or fetch local\n' +
      'const params = new URLSearchParams(location.search);\n' +
      'if (params.get(\'file\')) {\n' +
      '  fetch(params.get(\'file\')).then(r => r.json()).then(loadGraph).catch(() => {});\n' +
      '} else {\n' +
      '  fetch(\'.long-horizon/brain/graph-index.json\').then(r => r.json()).then(loadGraph).catch(() => {});\n' +
      '}',
      `// Embedded graph data\nconst GRAPH_DATA = ${JSON.stringify(index)};\nloadGraph(GRAPH_DATA);`
    );

    const dest = path.join(cwd, 'brain-viewer.html');
    fs.writeFileSync(dest, injected, 'utf8');
    success(`Graph viewer created: brain-viewer.html`);
    info(`Embedded ${Object.keys(index.nodes).length} nodes, ${index.edges.length} edges`);

    // Try to open in browser (non-blocking)
    try {
      const { spawn } = require('child_process');
      if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', dest], { detached: true, stdio: 'ignore' }).unref();
      else if (process.platform === 'darwin') spawn('open', [dest], { detached: true, stdio: 'ignore' }).unref();
      else spawn('xdg-open', [dest], { detached: true, stdio: 'ignore' }).unref();
    } catch {}
  },

  live() {
    const { spawn } = require('child_process');
    const viewer = spawn('node', [path.join(__dirname, '..', 'src', 'live-viewer.js'), cwd], { stdio: 'inherit' });
    
    // Open browser after short delay
    setTimeout(() => {
      try {
        if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', 'http://localhost:3333'], { detached: true, stdio: 'ignore' }).unref();
        else if (process.platform === 'darwin') spawn('open', ['http://localhost:3333'], { detached: true, stdio: 'ignore' }).unref();
        else spawn('xdg-open', ['http://localhost:3333'], { detached: true, stdio: 'ignore' }).unref();
      } catch {}
    }, 500);
  },

  compact() {
    const graph = require('../src/graph');
    const loop = require('../src/loop');
    const gs = graph.stats(cwd);
    const ls = loop.status(cwd);
    const sessDir = path.join(cwd, '.long-horizon', 'sessions', new Date().toISOString().slice(0, 10));
    fs.mkdirSync(sessDir, { recursive: true });

    const content = `# Compaction — ${new Date().toISOString()}\n\n## State\n- Graph: ${gs.total_nodes} nodes, ${gs.total_edges} edges\n- Loop: ${ls.status} (${ls.completion_pct}%)\n- Iteration: ${ls.iteration}\n\n## Resume\n1. Read loop-state.json\n2. Read graph-index.json\n3. Continue from next pending subtask\n`;
    const file = path.join(sessDir, `compact-${Date.now()}.md`);
    fs.writeFileSync(file, content, 'utf8');
    success(`Compacted. Graph preserved (${gs.total_nodes} nodes, ${gs.total_edges} edges)`);
  },

  reflect() {
    const graph = require('../src/graph');
    const index = graph.readIndex(cwd);
    const types = {};
    const orphans = [];

    for (const [id, node] of Object.entries(index.nodes)) {
      types[node.type] = (types[node.type] || 0) + 1;
      if (id !== index.root_node && !(node.edges_out || []).length && !(node.edges_in || []).length) {
        orphans.push(id);
      }
    }

    heading('Graph Reflection');
    info(`Nodes: ${index.stats.total_nodes} | Edges: ${index.stats.total_edges}`);
    log('');
    Object.entries(types).forEach(([t, c]) => log(`  ${t}: ${c}`));
    if (orphans.length) { log(''); warn(`${orphans.length} orphan nodes (disconnected)`); orphans.forEach(o => log(`  ${C.dim}${o}${C.reset}`)); }
    if (index.stats.total_edges < index.stats.total_nodes) { warn('Graph is sparse — look for missing connections'); }
  },

  validate() {
    const graph = require('../src/graph');
    const loop = require('../src/loop');
    const errors = [];

    try { graph.readIndex(cwd); } catch { errors.push('graph-index.json missing or invalid'); }
    try { loop.status(cwd); } catch { errors.push('loop-state.json missing or invalid'); }

    const index = graph.readIndex(cwd);
    for (const edge of (index.edges || [])) {
      if (!index.nodes[edge.source]) errors.push(`Broken edge: source ${edge.source} not found`);
      if (!index.nodes[edge.target]) errors.push(`Broken edge: target ${edge.target} not found`);
    }
    for (const [id, node] of Object.entries(index.nodes)) {
      const file = path.join(cwd, '.long-horizon', node.file);
      if (!fs.existsSync(file)) errors.push(`Missing file: ${node.file} for node ${id}`);
    }

    if (errors.length === 0) {
      success(`All checks passed (${index.stats.total_nodes} nodes, ${index.stats.total_edges} edges)`);
    } else {
      error(`${errors.length} errors:\n${errors.map(e => `  ! ${e}`).join('\n')}`);
    }
  },

  help() {
    log(`
${C.purple}${C.bold}Long-Horizon${C.reset} — Autonomous AI Engineering with Graph Memory

${C.bold}USAGE${C.reset}
  lh <command> [options]

${C.bold}COMMANDS${C.reset}
  ${C.cyan}init${C.reset}              Initialize graph brain + loop state
  ${C.cyan}status${C.reset}            Show loop progress + graph stats
  ${C.cyan}graph${C.reset} [id] [depth] Traverse graph from node (default: root)
  ${C.cyan}node${C.reset} <id>          Show specific node + connections
  ${C.cyan}add-node${C.reset} <type> <title>  Create a new node
  ${C.cyan}add-edge${C.reset} <src> <rel> <tgt>  Link two nodes
  ${C.cyan}search${C.reset} <query>       Search nodes by title, tags, or content
  ${C.cyan}adapt${C.reset} [tool|all|list]  Install for AI tool (cursor/windsurf/aider/claude/codex)
  ${C.cyan}viewer${C.reset}            Open interactive graph visualization (snapshot)
  ${C.cyan}live${C.reset}              Live-updating graph viewer (real-time)
  ${C.cyan}compact${C.reset}           Compact context, preserve graph
  ${C.cyan}reflect${C.reset}           Analyze graph health + patterns
  ${C.cyan}validate${C.reset}          Check graph integrity

${C.bold}QUICK START${C.reset}
  ${C.dim}$ npx long-horizon init${C.reset}
  ${C.dim}$ npx long-horizon adapt cursor${C.reset}
  ${C.dim}$ # Give your AI a task — it loops autonomously${C.reset}

${C.bold}PHILOSOPHY${C.reset}
  One prompt → autonomous execution → connected memory.
  The AI is the loop. The graph is the brain.
`);
  }
};

// Run
const handler = commands[cmd];
if (!handler) {
  if (cmd) warn(`Unknown command: ${cmd}`);
  commands.help();
} else {
  try { handler(); } catch (e) { error(e.message); }
}
