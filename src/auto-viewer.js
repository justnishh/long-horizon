const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const cwd = process.argv[2] || process.cwd();
const port = 3333;

// Check if viewer is already running
const req = http.get(`http://localhost:${port}/graph.json`, (res) => {
  // Already running
  console.log(`\x1b[32m✓\x1b[0m Live viewer already running at http://localhost:${port}`);
  process.exit(0);
});

req.on('error', () => {
  // Not running — start it
  const viewerPath = path.join(__dirname, 'live-viewer.js');
  const child = spawn('node', [viewerPath, cwd], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  console.log(`\x1b[32m✓\x1b[0m Live viewer started at http://localhost:${port}`);

  // Open browser
  setTimeout(() => {
    try {
      if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', `http://localhost:${port}`], { detached: true, stdio: 'ignore' }).unref();
      else if (process.platform === 'darwin') spawn('open', [`http://localhost:${port}`], { detached: true, stdio: 'ignore' }).unref();
      else spawn('xdg-open', [`http://localhost:${port}`], { detached: true, stdio: 'ignore' }).unref();
    } catch {}
    process.exit(0);
  }, 800);
});

req.setTimeout(1000, () => { req.destroy(); });
