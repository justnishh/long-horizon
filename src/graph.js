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
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    throw new Error(`graph-index.json is corrupted. Run \`lh repair\` to rebuild. (${e.message})`);
  }
}

function writeIndex(index, cwd) {
  const p = getIndexPath(cwd);
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(index, null, 2), 'utf8');
  fs.renameSync(tmp, p);
}

function generateId(type) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hash = crypto.randomBytes(3).toString('hex');
  return `${type}-${date}-${hash}`;
}

function addNode(cwd, { type, title, content, tags = [], connectTo, relation, weight = 0.7 }) {
  const VALID_TYPES = ['decision', 'lesson', 'pattern', 'task', 'milestone', 'context', 'preference', 'entity'];
  if (!VALID_TYPES.includes(type)) throw new Error(`Invalid node type: ${type}. Must be one of: ${VALID_TYPES.join(', ')}`);

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

  // Recall tracking — increment count
  if (!entry.recall_count) entry.recall_count = 0;
  entry.recall_count++;
  index.nodes[id] = entry;
  writeIndex(index, cwd);

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
  // Recalculate stats from actual data (don't trust stored counts)
  const total_nodes = Object.keys(index.nodes).length;
  const total_edges = (index.edges || []).length;
  return { total_nodes, total_edges, last_updated: index.stats.last_updated, types, root_node: index.root_node };
}

function search(cwd, query) {
  const index = readIndex(cwd);
  const q = query.toLowerCase();
  const results = [];
  const MAX_FILE_READS = 50;
  let fileReads = 0;

  for (const [id, node] of Object.entries(index.nodes)) {
    let score = 0;
    if (node.title && node.title.toLowerCase().includes(q)) score += 10;
    if ((node.tags || []).some(t => t.toLowerCase().includes(q))) score += 5;
    if (node.type.toLowerCase().includes(q)) score += 3;

    // Only read file content if no match yet and under limit
    if (score === 0 && fileReads < MAX_FILE_READS) {
      const filePath = path.join(getLhDir(cwd), node.file);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.size < 100000) { // Skip files > 100KB
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.toLowerCase().includes(q)) score += 2;
        }
        fileReads++;
      }
    }

    if (score > 0) results.push({ id, ...node, score: score + (node.recall_count || 0) * 0.5 });
  }

  return results.sort((a, b) => b.score - a.score);
}

function repair(cwd) {
  const lhDir = getLhDir(cwd);
  const brainDir = path.join(lhDir, 'brain');

  const types = ['decisions', 'lessons', 'patterns', 'tasks', 'milestones', 'context', 'preferences', 'entitys'];
  const discoveredNodes = {};
  const discoveredEdges = [];
  let rootNode = null;

  for (const type of types) {
    const dir = path.join(brainDir, type);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;

      const fm = fmMatch[1];
      const id = (fm.match(/id:\s*"([^"]+)"/) || [])[1] || file.replace('.md', '');
      const nodeType = (fm.match(/type:\s*"([^"]+)"/) || [])[1] || type.replace(/s$/, '');
      const title = (fm.match(/title:\s*"([^"]+)"/) || content.match(/^#\s+(.+)/m) || [])[1] || file;
      const tagsMatch = fm.match(/tags:\s*\[([^\]]*)\]/);
      const tags = tagsMatch ? tagsMatch[1].replace(/"/g, '').split(',').map(t => t.trim()).filter(Boolean) : [];
      const weight = parseFloat((fm.match(/weight:\s*([\d.]+)/) || [])[1] || '0.7');

      const edgeMatches = [...fm.matchAll(/target:\s*"([^"]+)"\s*\n\s*relation:\s*"([^"]+)"/g)];
      const edgesOut = edgeMatches.map(m => m[1]);
      for (const m of edgeMatches) discoveredEdges.push({ source: id, target: m[1], relation: m[2] });

      discoveredNodes[id] = { type: nodeType, title, file: `brain/${type}/${file}`, edges_out: edgesOut, edges_in: [], tags, weight };
      if (tags.includes('root')) rootNode = id;
    }
  }

  for (const edge of discoveredEdges) {
    if (discoveredNodes[edge.target] && !discoveredNodes[edge.target].edges_in.includes(edge.source)) {
      discoveredNodes[edge.target].edges_in.push(edge.source);
    }
  }

  if (!rootNode) {
    const ctx = Object.entries(discoveredNodes).find(([, n]) => n.type === 'context');
    rootNode = ctx ? ctx[0] : null;
  }

  const index = {
    version: '2.0', root_node: rootNode, nodes: discoveredNodes, edges: discoveredEdges,
    stats: { total_nodes: Object.keys(discoveredNodes).length, total_edges: discoveredEdges.length, last_updated: new Date().toISOString() }
  };

  writeIndex(index, cwd);
  return index;
}

function readIndexSafe(cwd) {
  const index = readIndex(cwd);
  const brainDir = path.join(getLhDir(cwd), 'brain');
  const types = ['decisions', 'lessons', 'patterns', 'tasks', 'milestones', 'context', 'preferences', 'entitys'];
  let fileCount = 0;
  for (const type of types) {
    const dir = path.join(brainDir, type);
    if (fs.existsSync(dir)) fileCount += fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
  }
  if (fileCount > Object.keys(index.nodes).length + 1) return repair(cwd);
  return index;
}

function decay(cwd, { rate = 0.05, minWeight = 0.1 } = {}) {
  const index = readIndex(cwd);
  const now = Date.now();
  let decayed = 0;

  for (const [id, node] of Object.entries(index.nodes)) {
    if (node.weight <= minWeight) continue;
    // Find node file's last modified time
    const filePath = path.join(getLhDir(cwd), node.file);
    if (!fs.existsSync(filePath)) continue;
    const mtime = fs.statSync(filePath).mtimeMs;
    const daysSince = (now - mtime) / (1000 * 60 * 60 * 24);

    if (daysSince > 7) {
      const newWeight = Math.max(minWeight, node.weight - (rate * Math.floor(daysSince / 7)));
      if (newWeight < node.weight) {
        index.nodes[id].weight = Math.round(newWeight * 100) / 100;
        decayed++;
      }
    }
  }

  if (decayed > 0) {
    index.stats.last_updated = new Date().toISOString();
    writeIndex(index, cwd);
  }

  return decayed;
}

function detectConflicts(cwd, { type, title, content }) {
  const index = readIndex(cwd);
  const conflicts = [];
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  for (const [id, node] of Object.entries(index.nodes)) {
    if (node.type !== type) continue;

    // Check title similarity
    const nodeWords = node.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const overlap = titleWords.filter(w => nodeWords.includes(w));
    const similarity = titleWords.length > 0 ? overlap.length / titleWords.length : 0;

    if (similarity >= 0.5) {
      // Check for contradiction keywords
      const contradicts = hasContradiction(title, node.title);
      conflicts.push({
        id,
        title: node.title,
        similarity: Math.round(similarity * 100),
        contradicts
      });
    }
  }

  return conflicts;
}

function hasContradiction(newText, oldText) {
  const n = newText.toLowerCase();
  const o = oldText.toLowerCase();
  const negations = ['not', 'never', 'avoid', 'don\'t', 'instead', 'replace', 'remove', 'stop', 'no longer'];
  const opposites = [
    ['use', 'avoid'], ['add', 'remove'], ['enable', 'disable'],
    ['always', 'never'], ['keep', 'replace'], ['yes', 'no']
  ];

  // One has negation, other doesn't
  const nHasNeg = negations.some(neg => n.includes(neg));
  const oHasNeg = negations.some(neg => o.includes(neg));
  if (nHasNeg !== oHasNeg) return true;

  // Opposite words
  for (const [a, b] of opposites) {
    if ((n.includes(a) && o.includes(b)) || (n.includes(b) && o.includes(a))) return true;
  }

  return false;
}

module.exports = { getLhDir, readIndex, readIndexSafe, writeIndex, generateId, addNode, addEdge, getNode, traverse, query, stats, search, decay, detectConflicts, repair };
