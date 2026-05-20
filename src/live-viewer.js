const http = require('http');
const fs = require('fs');
const path = require('path');

const cwd = process.argv[2] || process.cwd();
const indexPath = path.join(cwd, '.long-horizon', 'brain', 'graph-index.json');
const port = 3333;

if (!fs.existsSync(indexPath)) {
  console.error('No .long-horizon/brain/graph-index.json found.');
  process.exit(1);
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Long-Horizon — Neural Interface</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #000008;
  color: #e0e8ff;
  font-family: 'Rajdhani', sans-serif;
  overflow: hidden;
  cursor: crosshair;
}

/* Animated grid background */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridMove 20s linear infinite;
  z-index: 0;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(60px, 60px); }
}

/* Radial glow center */
body::after {
  content: '';
  position: fixed;
  top: 50%; left: 50%;
  width: 800px; height: 800px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(0,240,255,0.05) 0%, transparent 70%);
  z-index: 0;
  pointer-events: none;
}

canvas { display: block; position: relative; z-index: 1; }

/* HUD Header */
#hud {
  position: fixed;
  top: 0; left: 0; right: 0;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 100;
  background: linear-gradient(180deg, rgba(0,0,8,0.95) 0%, rgba(0,0,8,0.7) 80%, transparent 100%);
  border-bottom: 1px solid rgba(0,240,255,0.1);
}

#hud::after {
  content: '';
  position: absolute;
  bottom: 0; left: 10%; right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,240,255,0.5), transparent);
}

.hud-logo {
  font-family: 'Orbitron', monospace;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 3px;
  background: linear-gradient(135deg, #00f0ff, #7b2fff, #ff00e5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(0,240,255,0.3);
}

.hud-stats {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: rgba(0,240,255,0.7);
  letter-spacing: 1px;
}

.hud-live {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  color: #00ff88;
}

.hud-live::before {
  content: '';
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #00ff88;
  box-shadow: 0 0 12px #00ff88, 0 0 24px #00ff88;
  animation: livePulse 1.5s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

.hud-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: rgba(255,255,255,0.3);
}

/* Side Panel */
#panel {
  position: fixed;
  top: 60px; right: 0; bottom: 0;
  width: 280px;
  background: linear-gradient(180deg, rgba(0,0,20,0.95), rgba(0,0,10,0.98));
  border-left: 1px solid rgba(0,240,255,0.1);
  z-index: 50;
  padding: 20px 16px;
  overflow-y: auto;
  font-size: 13px;
}

#panel::-webkit-scrollbar { width: 3px; }
#panel::-webkit-scrollbar-thumb { background: rgba(0,240,255,0.3); border-radius: 3px; }

.panel-title {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 3px;
  color: rgba(0,240,255,0.5);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,240,255,0.1);
}

.node-list { list-style: none; }

.node-item {
  padding: 8px 10px;
  margin: 4px 0;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.02);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-item:hover {
  background: rgba(0,240,255,0.05);
  border-color: rgba(0,240,255,0.2);
  transform: translateX(-2px);
}

.node-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.node-label {
  font-size: 12px;
  color: rgba(255,255,255,0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-type {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: rgba(255,255,255,0.3);
  margin-left: auto;
}

/* Stats boxes */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}

.stat-box {
  background: rgba(0,240,255,0.03);
  border: 1px solid rgba(0,240,255,0.1);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.stat-value {
  font-family: 'Orbitron', monospace;
  font-size: 20px;
  font-weight: 700;
  color: #00f0ff;
  text-shadow: 0 0 10px rgba(0,240,255,0.5);
}

.stat-label {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  letter-spacing: 1px;
  margin-top: 2px;
}

/* Tooltip */
#tooltip {
  position: fixed;
  background: rgba(0,0,20,0.95);
  border: 1px solid rgba(0,240,255,0.3);
  border-radius: 10px;
  padding: 14px 18px;
  font-size: 13px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  max-width: 280px;
  z-index: 200;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0,240,255,0.1), inset 0 0 30px rgba(0,240,255,0.02);
}

#tooltip::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, #00f0ff, #7b2fff, #ff00e5);
  border-radius: 10px 10px 0 0;
}

#tooltip .tt-type {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: #7b2fff;
  margin-bottom: 4px;
}

#tooltip .tt-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
}

#tooltip .tt-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: rgba(0,240,255,0.6);
}

/* Legend */
#legend {
  position: fixed;
  bottom: 16px; left: 16px;
  background: rgba(0,0,20,0.9);
  border: 1px solid rgba(0,240,255,0.1);
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 11px;
  z-index: 50;
}

#legend .legend-title {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: rgba(0,240,255,0.4);
  margin-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 5px 0;
  color: rgba(255,255,255,0.6);
}

.legend-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
}
</style>
</head>
<body>

<div id="hud">
  <div class="hud-logo">LONG-HORIZON</div>
  <div class="hud-stats" id="hudStats">LOADING...</div>
  <div class="hud-time" id="hudTime"></div>
  <div class="hud-live">NEURAL LINK ACTIVE</div>
  <button id="soundToggle" onclick="soundEnabled=!soundEnabled;this.textContent=soundEnabled?'🔊':'🔇'" style="background:none;border:1px solid rgba(0,240,255,0.2);color:#00f0ff;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:14px">🔊</button>
</div>

<div id="tooltip"></div>

<div id="panel">
  <div class="stats-grid" id="statsGrid"></div>
  <div class="panel-title">NEURAL NODES</div>
  <ul class="node-list" id="nodeList"></ul>
</div>

<div id="legend">
  <div class="legend-title">NODE TYPES</div>
  <div class="legend-item"><span class="legend-dot" style="color:#00f0ff"></span> context</div>
  <div class="legend-item"><span class="legend-dot" style="color:#c840ff"></span> decision</div>
  <div class="legend-item"><span class="legend-dot" style="color:#4facfe"></span> task</div>
  <div class="legend-item"><span class="legend-dot" style="color:#00ff88"></span> lesson</div>
  <div class="legend-item"><span class="legend-dot" style="color:#ff2d75"></span> pattern</div>
  <div class="legend-item"><span class="legend-dot" style="color:#ffe600"></span> milestone</div>
</div>

<canvas id="canvas"></canvas>

<script>
const COLORS = {
  context: '#00f0ff',
  decision: '#c840ff',
  task: '#4facfe',
  lesson: '#00ff88',
  pattern: '#ff2d75',
  milestone: '#ffe600'
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W, H, nodes = [], edges = [], dragging = null, hovered = null, lastJson = '', particles = [];

// Sound system
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true;
const PITCHES = { context: 440, decision: 523, task: 392, lesson: 587, pattern: 659, milestone: 784 };

function playPing(type) {
  if (!soundEnabled) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.value = PITCHES[type] || 440;
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.6);
}

function resize() {
  W = canvas.width = window.innerWidth - 280;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Particles along edges
class Particle {
  constructor(edge) {
    this.edge = edge;
    this.t = Math.random();
    this.speed = 0.002 + Math.random() * 0.003;
    this.size = 1 + Math.random() * 2;
    this.alpha = 0.3 + Math.random() * 0.5;
  }
  update() {
    this.t += this.speed;
    if (this.t > 1) this.t = 0;
  }
  draw() {
    const x = this.edge.source.x + (this.edge.target.x - this.edge.source.x) * this.t;
    const y = this.edge.source.y + (this.edge.target.y - this.edge.source.y) * this.t;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 240, 255, ' + this.alpha + ')';
    ctx.fill();
  }
}

function loadGraph(data) {
  const json = JSON.stringify(data);
  if (json === lastJson) return;

  // Detect new nodes for sound
  const oldIds = new Set(nodes.map(n => n.id));
  const entries = Object.entries(data.nodes);
  entries.forEach(([id, n]) => {
    if (!oldIds.has(id) && oldIds.size > 0) playPing(n.type);
  });

  lastJson = json;

  const oldPositions = {};
  nodes.forEach(n => { oldPositions[n.id] = { x: n.x, y: n.y }; });

  nodes = []; edges = []; particles = [];
  const nodeMap = {};

  entries.forEach(([id, n], i) => {
    const old = oldPositions[id];
    const angle = (i / entries.length) * Math.PI * 2;
    const r = Math.min(W, H) * 0.28;
    const node = {
      id, ...n,
      x: old ? old.x : W/2 + Math.cos(angle) * r + (Math.random() - 0.5) * 100,
      y: old ? old.y : H/2 + Math.sin(angle) * r + (Math.random() - 0.5) * 100,
      vx: 0, vy: 0,
      radius: id === data.root_node ? 22 : 11 + (n.edges_out || []).length * 2,
      pulsePhase: Math.random() * Math.PI * 2
    };
    nodes.push(node);
    nodeMap[id] = node;
  });

  (data.edges || []).forEach(e => {
    if (nodeMap[e.source] && nodeMap[e.target]) {
      const edge = { source: nodeMap[e.source], target: nodeMap[e.target], relation: e.relation };
      edges.push(edge);
      // Add particles to each edge
      for (let i = 0; i < 3; i++) particles.push(new Particle(edge));
    }
  });

  // Update HUD
  document.getElementById('hudStats').textContent =
    'NODES: ' + nodes.length + ' | EDGES: ' + edges.length + ' | TYPES: ' + [...new Set(nodes.map(n => n.type))].length;

  // Update stats panel
  const types = {};
  nodes.forEach(n => { types[n.type] = (types[n.type] || 0) + 1; });
  document.getElementById('statsGrid').innerHTML =
    '<div class="stat-box"><div class="stat-value">' + nodes.length + '</div><div class="stat-label">NODES</div></div>' +
    '<div class="stat-box"><div class="stat-value">' + edges.length + '</div><div class="stat-label">EDGES</div></div>' +
    Object.entries(types).map(([t, c]) =>
      '<div class="stat-box"><div class="stat-value" style="color:' + (COLORS[t]||'#fff') + '">' + c + '</div><div class="stat-label">' + t.toUpperCase() + '</div></div>'
    ).join('');

  // Update node list
  document.getElementById('nodeList').innerHTML = nodes.map(n =>
    '<li class="node-item" data-id="' + n.id + '">' +
    '<span class="node-dot" style="background:' + (COLORS[n.type]||'#888') + ';box-shadow:0 0 6px ' + (COLORS[n.type]||'#888') + '"></span>' +
    '<span class="node-label">' + n.title + '</span>' +
    '<span class="node-type">' + n.type.slice(0,3) + '</span>' +
    '</li>'
  ).join('');
}

function simulate() {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
      let d = Math.sqrt(dx * dx + dy * dy) || 1;
      let force = 1200 / (d * d);
      nodes[i].vx -= (dx / d) * force;
      nodes[i].vy -= (dy / d) * force;
      nodes[j].vx += (dx / d) * force;
      nodes[j].vy += (dy / d) * force;
    }
  }
  edges.forEach(e => {
    let dx = e.target.x - e.source.x, dy = e.target.y - e.source.y;
    let d = Math.sqrt(dx * dx + dy * dy) || 1;
    let force = (d - 160) * 0.004;
    e.source.vx += (dx / d) * force;
    e.source.vy += (dy / d) * force;
    e.target.vx -= (dx / d) * force;
    e.target.vy -= (dy / d) * force;
  });
  nodes.forEach(n => {
    n.vx += (W / 2 - n.x) * 0.0003;
    n.vy += (H / 2 - n.y) * 0.0003;
    n.vx *= 0.87;
    n.vy *= 0.87;
    if (n !== dragging) { n.x += n.vx; n.y += n.vy; }
    n.pulsePhase += 0.03;
  });
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Draw edges with glow
  edges.forEach(e => {
    const gradient = ctx.createLinearGradient(e.source.x, e.source.y, e.target.x, e.target.y);
    const srcColor = COLORS[e.source.type] || '#00f0ff';
    const tgtColor = COLORS[e.target.type] || '#00f0ff';
    gradient.addColorStop(0, srcColor + '40');
    gradient.addColorStop(1, tgtColor + '40');

    ctx.beginPath();
    ctx.moveTo(e.source.x, e.source.y);
    ctx.lineTo(e.target.x, e.target.y);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Edge label
    const mx = (e.source.x + e.target.x) / 2;
    const my = (e.source.y + e.target.y) / 2;
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(0,240,255,0.35)';
    ctx.textAlign = 'center';
    ctx.fillText(e.relation, mx, my - 6);
  });

  // Draw particles
  particles.forEach(p => { p.update(); p.draw(); });

  // Draw nodes
  nodes.forEach(n => {
    const color = COLORS[n.type] || '#00f0ff';
    const pulse = 1 + Math.sin(n.pulsePhase) * 0.15;
    const r = n.radius * pulse;

    // Outer glow
    const glow = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, r * 3);
    glow.addColorStop(0, color + '30');
    glow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = n === hovered ? 40 : 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner ring
    ctx.beginPath();
    ctx.arc(n.x, n.y, r * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#000008';
    ctx.fill();

    // Center dot
    ctx.beginPath();
    ctx.arc(n.x, n.y, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Label
    ctx.font = '11px "Rajdhani", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(n.title.length > 25 ? n.title.slice(0, 25) + '...' : n.title, n.x, n.y + r + 16);
  });
}

function animate() {
  simulate();
  draw();
  requestAnimationFrame(animate);
}
animate();

// Update time
setInterval(() => {
  const now = new Date();
  document.getElementById('hudTime').textContent = now.toLocaleTimeString('en-US', { hour12: false });
}, 1000);

// Poll for graph updates
setInterval(() => {
  fetch('/graph.json').then(r => r.json()).then(loadGraph).catch(() => {});
}, 2000);
fetch('/graph.json').then(r => r.json()).then(loadGraph);

// Mouse interaction
canvas.addEventListener('mousemove', e => {
  if (dragging) { dragging.x = e.clientX; dragging.y = e.clientY; return; }
  hovered = nodes.find(n => Math.hypot(n.x - e.clientX, n.y - e.clientY) < n.radius + 6) || null;
  const tt = document.getElementById('tooltip');
  if (hovered) {
    tt.innerHTML =
      '<div class="tt-type">' + hovered.type.toUpperCase() + '</div>' +
      '<div class="tt-title">' + hovered.title + '</div>' +
      '<div class="tt-meta">↗ ' + (hovered.edges_out || []).length + ' out &nbsp;·&nbsp; ↙ ' + (hovered.edges_in || []).length + ' in</div>';
    tt.style.opacity = 1;
    tt.style.left = (e.clientX + 20) + 'px';
    tt.style.top = (e.clientY + 20) + 'px';
  } else {
    tt.style.opacity = 0;
  }
  canvas.style.cursor = hovered ? 'grab' : 'crosshair';
});

canvas.addEventListener('mousedown', e => {
  dragging = nodes.find(n => Math.hypot(n.x - e.clientX, n.y - e.clientY) < n.radius + 6) || null;
  if (dragging) canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mouseup', () => {
  dragging = null;
  canvas.style.cursor = hovered ? 'grab' : 'crosshair';
});
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/graph.json') {
    try {
      const data = fs.readFileSync(indexPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    } catch {
      res.writeHead(500);
      res.end('{}');
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
  }
});

server.listen(port, () => {
  console.log('\x1b[35m\x1b[1m\u27E1 LONG-HORIZON NEURAL INTERFACE\x1b[0m');
  console.log('\x1b[36m\u203A\x1b[0m Live at: \x1b[4mhttp://localhost:' + port + '\x1b[0m');
  console.log('\x1b[36m\u203A\x1b[0m Watching: ' + indexPath);
  console.log('\x1b[36m\u203A\x1b[0m Auto-refresh: 2s | Ctrl+C to stop');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('\x1b[33m!\x1b[0m Port ' + port + ' in use. Viewer already running at http://localhost:' + port);
    process.exit(0);
  }
  throw e;
});
