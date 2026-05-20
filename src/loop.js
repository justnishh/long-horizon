const fs = require('fs');
const path = require('path');
const { getLhDir, generateId } = require('./graph');

function getLoopPath(cwd = process.cwd()) {
  return path.join(getLhDir(cwd), 'loop-state.json');
}

function readLoop(cwd) {
  const p = getLoopPath(cwd);
  if (!fs.existsSync(p)) throw new Error('No loop-state.json found. Run `lh init` first.');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeLoop(state, cwd) {
  fs.writeFileSync(getLoopPath(cwd), JSON.stringify(state, null, 2), 'utf8');
}

function start(cwd, { description, subtasks = [], criteria = [] }) {
  const state = readLoop(cwd);
  const taskId = generateId('task');
  const now = new Date().toISOString();

  state.loop = {
    status: 'running',
    task_id: taskId,
    task_description: description,
    started_at: now,
    iteration: 0,
    max_iterations: 100,
    subtasks: subtasks.map((s, i) => ({ id: i + 1, description: s, status: 'pending' })),
    completed_subtasks: [],
    blocked_subtasks: [],
    completion_criteria: criteria,
    completion_pct: 0,
    last_action: null,
    last_action_at: null,
    errors: [],
    should_continue: true
  };
  state.memory_queue = { pending_nodes: [], pending_edges: [] };

  writeLoop(state, cwd);
  return taskId;
}

function iterate(cwd, lastAction) {
  const state = readLoop(cwd);
  state.loop.iteration++;
  state.loop.last_action = lastAction || null;
  state.loop.last_action_at = new Date().toISOString();

  const total = state.loop.subtasks.length;
  const done = state.loop.completed_subtasks.length;
  state.loop.completion_pct = total > 0 ? Math.round((done / total) * 100) : 0;

  writeLoop(state, cwd);
  return { iteration: state.loop.iteration, completion_pct: state.loop.completion_pct };
}

function completeSubtask(cwd, subtaskId) {
  const state = readLoop(cwd);
  const st = state.loop.subtasks.find(s => s.id === subtaskId);
  if (st) st.status = 'done';
  if (!state.loop.completed_subtasks.includes(subtaskId)) {
    state.loop.completed_subtasks.push(subtaskId);
  }

  const total = state.loop.subtasks.length;
  const done = state.loop.completed_subtasks.length;
  state.loop.completion_pct = total > 0 ? Math.round((done / total) * 100) : 0;

  if (done >= total) {
    state.loop.status = 'complete';
    state.loop.should_continue = false;
  }

  writeLoop(state, cwd);
  return { done, total, completion_pct: state.loop.completion_pct };
}

function block(cwd, subtaskId, error) {
  const state = readLoop(cwd);
  const st = state.loop.subtasks.find(s => s.id === subtaskId);
  if (st) st.status = 'blocked';
  if (!state.loop.blocked_subtasks.includes(subtaskId)) {
    state.loop.blocked_subtasks.push(subtaskId);
  }
  if (error) state.loop.errors.push({ subtask: subtaskId, error, at: new Date().toISOString() });

  const pending = state.loop.subtasks.filter(s => s.status === 'pending');
  if (pending.length === 0) {
    state.loop.status = 'blocked';
    state.loop.should_continue = false;
  }

  writeLoop(state, cwd);
}

function finalize(cwd) {
  const state = readLoop(cwd);
  state.loop.status = 'complete';
  state.loop.should_continue = false;
  state.loop.completion_pct = 100;
  writeLoop(state, cwd);
}

function status(cwd) {
  const state = readLoop(cwd);
  return state.loop;
}

function queueNode(cwd, node) {
  const state = readLoop(cwd);
  state.memory_queue.pending_nodes.push(node);
  writeLoop(state, cwd);
}

function queueEdge(cwd, edge) {
  const state = readLoop(cwd);
  state.memory_queue.pending_edges.push(edge);
  writeLoop(state, cwd);
}

function flushQueue(cwd) {
  const state = readLoop(cwd);
  const queue = { ...state.memory_queue };
  state.memory_queue = { pending_nodes: [], pending_edges: [] };
  writeLoop(state, cwd);
  return queue;
}

module.exports = { readLoop, writeLoop, start, iterate, completeSubtask, block, finalize, status, queueNode, queueEdge, flushQueue };
