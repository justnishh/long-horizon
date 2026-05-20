const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getLhDir(cwd = process.cwd()) {
  return path.join(cwd, '.long-horizon');
}

function getIndexPath(cwd) {
  return path.join(getLhDir(cwd), 'brain', 'graph-index.json');
}

function readIndex(cwd) {
  const p = getIndexPath(cwd);
  if (!fs.existsSync(p)) throw new Error('No graph-index.json found. Run `lh init` first.');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeIndex(index, cwd) {
  fs.writeFileSync(getIndexPath(cwd), JSON.stringify(index, null, 2), 'utf8');
}

function generateId(type) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hash = crypto.randomBytes(3).toString('hex');
  return `${type}-${date}-${hash}`;
}

function addNode(cwd, { type, title, content, tags = [], connectTo, relation, weight = 0.7 }) {
  const index = readIndex(cwd);
  const id = generateId(type);
  const now = new Date().toISOString();
  const dir = path.join(getLhDir(cwd), 'brain', `${type}s`);
  fs.mkdirSync(dir, { recursive: true });

  const edgesYaml = connectTo && relation
    ? `\n  - target: "${connectTo}"\n    relation: "${relation}"`
    : '';
  const tagsYaml = tags.map(t => `"${t}"`).join(', ');

  const nodeFile = `---
id: "${id}"
type: "${type}"
created: "${now}"
updated: "${now}"
status: "active"
edges:${edgesYaml}
tags: [${tagsYaml}]
weight: ${weight}
---

# ${title}

## Content

${content || ''}

## Context

Created during autonomous loop execution.

## Backlinks

`;

  fs.writeFileSync(path.join(dir, `${id}.md`), nodeFile, 'utf8');

  // Update index
  index.nodes[id] = {
    type, title,
    file: `brain/${type}s/${id}.md`,
    edges_out: connectTo ? [connectTo] : [],
    edges_in: [],
    tags, weight
  };

  if (connectTo && relation) {
    index.edges.push({ source: id, target: connectTo, relation });
    if (index.nodes[connectTo]) {
      index.nodes[connectTo].edges_in.push(id);
    }
  }

  index.stats.total_nodes++;
  if (connectTo) index.stats.total_edges++;
  index.stats.last_updated = now;

  writeIndex(index, cwd);
  return id;
}

function addEdge(cwd, { source, target, relation }) {
  const index = readIndex(cwd);
  index.edges.push({ source, target, relation });
  if (index.nodes[source]) index.nodes[source].edges_out.push(target);
  if (index.nodes[target]) index.nodes[target].edges_in.push(source);
  index.stats.total_edges++;
  index.stats.last_updated = new Date().toISOString();
  writeIndex(index, cwd);
}

function getNode(cwd, id) {
  const index = readIndex(cwd);
  const entry = index.nodes[id];
  if (!entry) return null;
  const filePath = path.join(getLhDir(cwd), entry.file);
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  return { ...entry, id, content };
}

function traverse(cwd, startId, depth = 2) {
  const index = readIndex(cwd);
  if (!startId) startId = index.root_node;
  const visited = new Set();
  const result = [];
  const queue = [{ id: startId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth: d } = queue.shift();
    if (visited.has(id) || d > depth) continue;
    visited.add(id);
    const node = index.nodes[id];
    if (!node) continue;
    result.push({ id, ...node, depth: d });
    for (const out of (node.edges_out || [])) {
      queue.push({ id: out, depth: d + 1 });
    }
    for (const inc of (node.edges_in || [])) {
      queue.push({ id: inc, depth: d + 1 });
    }
  }
  return result;
}

function query(cwd, { type, tags, limit = 20 }) {
  const index = readIndex(cwd);
  let results = Object.entries(index.nodes).map(([id, n]) => ({ id, ...n }));
  if (type) results = results.filter(n => n.type === type);
  if (tags && tags.length) results = results.filter(n => tags.some(t => (n.tags || []).includes(t)));
  return results.slice(0, limit);
}

function stats(cwd) {
  const index = readIndex(cwd);
  const types = {};
  for (const [, node] of Object.entries(index.nodes)) {
    types[node.type] = (types[node.type] || 0) + 1;
  }
  return { ...index.stats, types, root_node: index.root_node };
}

module.exports = { getLhDir, readIndex, writeIndex, generateId, addNode, addEdge, getNode, traverse, query, stats };
