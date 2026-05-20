#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const cwd = process.cwd();

// Lazy-load to avoid errors if .long-horizon doesn't exist yet
function getGraph() { return require('./graph'); }
function getLoop() { return require('./loop'); }
function getInit() { return require('./init'); }

const TOOLS = [
  {
    name: 'lh_init',
    description: 'Initialize Long-Horizon graph brain in the current project',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'lh_add_node',
    description: 'Create a new knowledge node in the graph brain',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['decision', 'lesson', 'pattern', 'task', 'milestone', 'context'], description: 'Node type' },
        title: { type: 'string', description: 'Node title' },
        content: { type: 'string', description: 'Node content/body' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
        connect_to: { type: 'string', description: 'Node ID to connect to (optional)' },
        relation: { type: 'string', enum: ['caused_by', 'leads_to', 'related', 'supersedes', 'blocks', 'implements', 'learned_from'], description: 'Edge relation type' }
      },
      required: ['type', 'title']
    }
  },
  {
    name: 'lh_add_edge',
    description: 'Create an edge (connection) between two nodes',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source node ID' },
        target: { type: 'string', description: 'Target node ID' },
        relation: { type: 'string', enum: ['caused_by', 'leads_to', 'related', 'supersedes', 'blocks', 'implements', 'learned_from'], description: 'Relation type' }
      },
      required: ['source', 'target', 'relation']
    }
  },
  {
    name: 'lh_search',
    description: 'Search the knowledge graph by query string',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  {
    name: 'lh_get_node',
    description: 'Get a specific node by ID with its full content',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Node ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'lh_traverse',
    description: 'Traverse the graph from a starting node',
    inputSchema: {
      type: 'object',
      properties: {
        start_id: { type: 'string', description: 'Starting node ID (default: root)' },
        depth: { type: 'number', description: 'Traversal depth (default: 2)' }
      },
      required: []
    }
  },
  {
    name: 'lh_status',
    description: 'Get current loop status and graph statistics',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'lh_loop_start',
    description: 'Start an autonomous execution loop for a task',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Task description' },
        subtasks: { type: 'array', items: { type: 'string' }, description: 'List of subtask descriptions' },
        criteria: { type: 'array', items: { type: 'string' }, description: 'Completion criteria' }
      },
      required: ['description']
    }
  },
  {
    name: 'lh_loop_iterate',
    description: 'Record a loop iteration',
    inputSchema: {
      type: 'object',
      properties: {
        last_action: { type: 'string', description: 'What was done this iteration' }
      },
      required: []
    }
  },
  {
    name: 'lh_loop_complete_subtask',
    description: 'Mark a subtask as complete',
    inputSchema: {
      type: 'object',
      properties: {
        subtask_id: { type: 'number', description: 'Subtask ID to mark complete' }
      },
      required: ['subtask_id']
    }
  },
  {
    name: 'lh_loop_finalize',
    description: 'Finalize the loop — mark task as 100% complete',
    inputSchema: { type: 'object', properties: {}, required: [] }
  }
];

// MCP Protocol handlers
function handleInitialize(params) {
  return {
    protocolVersion: '2024-11-05',
    capabilities: { tools: {} },
    serverInfo: { name: 'long-horizon', version: '2.1.0' }
  };
}

function handleToolsList() {
  return { tools: TOOLS };
}

function handleToolCall(params) {
  const { name, arguments: args } = params;

  try {
    switch (name) {
      case 'lh_init': {
        const { init } = getInit();
        const result = init(cwd);
        return { content: [{ type: 'text', text: `Initialized. Root node: ${result.rootId}` }] };
      }
      case 'lh_add_node': {
        const graph = getGraph();
        const index = graph.readIndex(cwd);
        const id = graph.addNode(cwd, {
          type: args.type,
          title: args.title,
          content: args.content || '',
          tags: args.tags || [],
          connectTo: args.connect_to || index.root_node,
          relation: args.relation || 'related'
        });
        return { content: [{ type: 'text', text: `Node created: ${id} (${args.type}: ${args.title})` }] };
      }
      case 'lh_add_edge': {
        const graph = getGraph();
        graph.addEdge(cwd, { source: args.source, target: args.target, relation: args.relation });
        return { content: [{ type: 'text', text: `Edge: ${args.source} →[${args.relation}]→ ${args.target}` }] };
      }
      case 'lh_search': {
        const graph = getGraph();
        const results = graph.search(cwd, args.query);
        const text = results.length === 0
          ? `No results for "${args.query}"`
          : results.map(r => `[${r.type}] ${r.title} (${r.id})`).join('\n');
        return { content: [{ type: 'text', text }] };
      }
      case 'lh_get_node': {
        const graph = getGraph();
        const node = graph.getNode(cwd, args.id);
        if (!node) return { content: [{ type: 'text', text: `Node not found: ${args.id}` }] };
        return { content: [{ type: 'text', text: `[${node.type}] ${node.title}\nEdges out: ${(node.edges_out||[]).join(', ')}\nEdges in: ${(node.edges_in||[]).join(', ')}\n\n${node.content || ''}` }] };
      }
      case 'lh_traverse': {
        const graph = getGraph();
        const nodes = graph.traverse(cwd, args.start_id || null, args.depth || 2);
        const text = nodes.map(n => `${'  '.repeat(n.depth)}● [${n.type}] ${n.title} (${n.id})`).join('\n');
        return { content: [{ type: 'text', text }] };
      }
      case 'lh_status': {
        const graph = getGraph();
        const loop = getLoop();
        const gs = graph.stats(cwd);
        const ls = loop.status(cwd);
        return { content: [{ type: 'text', text: `Loop: ${ls.status} (${ls.completion_pct}% | iter ${ls.iteration})\nGraph: ${gs.total_nodes} nodes, ${gs.total_edges} edges\nTask: ${ls.task_description || 'none'}` }] };
      }
      case 'lh_loop_start': {
        const loop = getLoop();
        const taskId = loop.start(cwd, { description: args.description, subtasks: args.subtasks || [], criteria: args.criteria || [] });
        return { content: [{ type: 'text', text: `Loop started: ${taskId}\nSubtasks: ${(args.subtasks || []).length}` }] };
      }
      case 'lh_loop_iterate': {
        const loop = getLoop();
        const result = loop.iterate(cwd, args.last_action);
        return { content: [{ type: 'text', text: `Iteration ${result.iteration} | ${result.completion_pct}% complete` }] };
      }
      case 'lh_loop_complete_subtask': {
        const loop = getLoop();
        const result = loop.completeSubtask(cwd, args.subtask_id);
        return { content: [{ type: 'text', text: `Subtask ${args.subtask_id} done. Progress: ${result.done}/${result.total} (${result.completion_pct}%)` }] };
      }
      case 'lh_loop_finalize': {
        const loop = getLoop();
        loop.finalize(cwd);
        return { content: [{ type: 'text', text: 'Loop finalized. Task 100% complete.' }] };
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
  }
}

// JSON-RPC over stdio
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;

    const header = buffer.slice(0, headerEnd);
    const match = header.match(/Content-Length: (\d+)/);
    if (!match) { buffer = buffer.slice(headerEnd + 4); continue; }

    const len = parseInt(match[1]);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + len) break;

    const body = buffer.slice(bodyStart, bodyStart + len);
    buffer = buffer.slice(bodyStart + len);

    try {
      const msg = JSON.parse(body);
      handleMessage(msg);
    } catch {}
  }
});

function handleMessage(msg) {
  let result;

  switch (msg.method) {
    case 'initialize':
      result = handleInitialize(msg.params);
      break;
    case 'notifications/initialized':
      return; // no response needed
    case 'tools/list':
      result = handleToolsList();
      break;
    case 'tools/call':
      result = handleToolCall(msg.params);
      break;
    default:
      send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } });
      return;
  }

  if (msg.id !== undefined) {
    send({ jsonrpc: '2.0', id: msg.id, result });
  }
}

function send(msg) {
  const body = JSON.stringify(msg);
  const header = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`;
  process.stdout.write(header + body);
}

// Signal ready
process.stderr.write('Long-Horizon MCP server running\n');
