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
<title>Long-Horizon — Live Brain</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0a0f; color: #e0e0e0; font-family: -apple-system, sans-serif; overflow: hidden; }
#header { position: fixed; top: 0; left: 0; right: 0; padding: 12px 20px; background: rgba(10,10,15,0.9); backdrop-filter: blur(10px); z-index: 10; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #1a1a2e; }
#header h1 { font-size: 16px; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
#stats { font-size: 13px; color: #888; }
#live { color: #43e97b; font-size: 12px; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
#tooltip { position: fixed; background: #1a1a2e; border: 1px solid #333; border-radius: 8px; padding: 12px; font-size: 13px; pointer-events: none; opacity: 0; transition: opacity 0.2s; max-width: 300px; z-index: 100; }
#tooltip h3 { color: #667eea; margin-bottom: 4px; }
#tooltip .type { color: #764ba2; font-size: 11px; text-transform: uppercase; }
#tooltip .edges { color: #888; margin-top: 4px; font-size: 12px; }
canvas { display: block; }
#legend { position: fixed; bottom: 16px; left: 16px; background: rgba(26,26,46,0.9); border-radius: 8px; padding: 12px; font-size: 12px; }
#legend div { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
#legend span { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
</style>
</head>
<body>
<div id="header">
  <h1>🧠 Long-Horizon Brain</h1>
  <span id="stats"></span>
  <span id="live">● LIVE</span>
</div>
<div id="tooltip"></div>
<div id="legend">
  <div><span style="background:#667eea"></span> context</div>
  <div><span style="background:#f093fb"></span> decision</div>
  <div><span style="background:#4facfe"></span> task</div>
  <div><span style="background:#43e97b"></span> lesson</div>
  <div><span style="background:#fa709a"></span> pattern</div>
  <div><span style="background:#fee140"></span> milestone</div>
</div>
<canvas id="canvas"></canvas>
<script>
const COLORS = { context:'#667eea', decision:'#f093fb', task:'#4facfe', lesson:'#43e97b', pattern:'#fa709a', milestone:'#fee140' };
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W, H, nodes = [], edges = [], dragging = null, hovered = null, lastNodeCount = 0;

function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

function loadGraph(data) {
  const entries = Object.entries(data.nodes);
  if (entries.length === lastNodeCount) return; // no change
  lastNodeCount = entries.length;
  
  // Preserve positions of existing nodes
  const oldPositions = {};
  nodes.forEach(n => { oldPositions[n.id] = { x: n.x, y: n.y }; });
  
  nodes = []; edges = [];
  const nodeMap = {};
  entries.forEach(([id, n], i) => {
    const old = oldPositions[id];
    const angle = (i / entries.length) * Math.PI * 2;
    const r = Math.min(W, H) * 0.25;
    const node = {
      id, ...n,
      x: old ? old.x : W/2 + Math.cos(angle)*r + (Math.random()-0.5)*80,
      y: old ? old.y : H/2 + Math.sin(angle)*r + (Math.random()-0.5)*80,
      vx: 0, vy: 0,
      radius: id === data.root_node ? 20 : 12
    };
    nodes.push(node);
    nodeMap[id] = node;
  });
  (data.edges || []).forEach(e => {
    if (nodeMap[e.source] && nodeMap[e.target]) edges.push({ source: nodeMap[e.source], target: nodeMap[e.target], relation: e.relation });
  });
  document.getElementById('stats').textContent = nodes.length + ' nodes · ' + edges.length + ' edges';
}

function simulate() {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i+1; j < nodes.length; j++) {
      let dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
      let d = Math.sqrt(dx*dx + dy*dy) || 1;
      let force = 1000 / (d * d);
      nodes[i].vx -= (dx/d)*force; nodes[i].vy -= (dy/d)*force;
      nodes[j].vx += (dx/d)*force; nodes[j].vy += (dy/d)*force;
    }
  }
  edges.forEach(e => {
    let dx = e.target.x - e.source.x, dy = e.target.y - e.source.y;
    let d = Math.sqrt(dx*dx + dy*dy) || 1;
    let force = (d - 140) * 0.004;
    e.source.vx += (dx/d)*force; e.source.vy += (dy/d)*force;
    e.target.vx -= (dx/d)*force; e.target.vy -= (dy/d)*force;
  });
  nodes.forEach(n => {
    n.vx += (W/2 - n.x) * 0.0003;
    n.vy += (H/2 - n.y) * 0.0003;
    n.vx *= 0.88; n.vy *= 0.88;
    if (n !== dragging) { n.x += n.vx; n.y += n.vy; }
  });
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  edges.forEach(e => {
    ctx.beginPath(); ctx.moveTo(e.source.x, e.source.y); ctx.lineTo(e.target.x, e.target.y);
    ctx.strokeStyle = 'rgba(102,126,234,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Edge label
    const mx = (e.source.x + e.target.x)/2, my = (e.source.y + e.target.y)/2;
    ctx.fillStyle = 'rgba(136,136,136,0.5)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(e.relation, mx, my - 4);
  });
  nodes.forEach(n => {
    ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI*2);
    ctx.fillStyle = COLORS[n.type] || '#888';
    if (n === hovered) { ctx.shadowColor = COLORS[n.type]; ctx.shadowBlur = 25; }
    ctx.fill(); ctx.shadowBlur = 0;
    // Label
    ctx.fillStyle = '#ccc'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(n.title.slice(0, 30), n.x, n.y + n.radius + 14);
  });
}

function animate() { simulate(); draw(); requestAnimationFrame(animate); }
animate();

// Poll for updates every 2 seconds
setInterval(() => {
  fetch('/graph.json').then(r => r.json()).then(loadGraph).catch(() => {});
}, 2000);

// Initial load
fetch('/graph.json').then(r => r.json()).then(loadGraph);

// Interaction
canvas.addEventListener('mousemove', e => {
  if (dragging) { dragging.x = e.clientX; dragging.y = e.clientY; return; }
  hovered = nodes.find(n => Math.hypot(n.x-e.clientX, n.y-e.clientY) < n.radius+4) || null;
  const tt = document.getElementById('tooltip');
  if (hovered) {
    tt.innerHTML = '<div class="type">'+hovered.type+'</div><h3>'+hovered.title+'</h3><div class="edges">↗ '+(hovered.edges_out||[]).length+' out · ↙ '+(hovered.edges_in||[]).length+' in</div>';
    tt.style.opacity = 1; tt.style.left = (e.clientX+16)+'px'; tt.style.top = (e.clientY+16)+'px';
  } else { tt.style.opacity = 0; }
});
canvas.addEventListener('mousedown', e => { dragging = nodes.find(n => Math.hypot(n.x-e.clientX, n.y-e.clientY) < n.radius+4) || null; });
canvas.addEventListener('mouseup', () => { dragging = null; });
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
      res.writeHead(500); res.end('{}');
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
  }
});

server.listen(port, () => {
  console.log(`\x1b[32m✓\x1b[0m Live brain viewer: http://localhost:${port}`);
  console.log(`\x1b[36m›\x1b[0m Watching: ${indexPath}`);
  console.log(`\x1b[36m›\x1b[0m Auto-refreshes every 2 seconds. Ctrl+C to stop.`);
});
