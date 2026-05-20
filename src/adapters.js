const fs = require('fs');
const path = require('path');

const SKILL_CONTENT = fs.readFileSync(path.join(__dirname, '..', 'SKILL.md'), 'utf8');

const adapters = {
  claude: {
    name: 'Claude Code / Kiro',
    files: ['.claude/skills/long-horizon/SKILL.md'],
    generate(cwd) {
      const dir = path.join(cwd, '.claude', 'skills', 'long-horizon');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'SKILL.md'), SKILL_CONTENT, 'utf8');
      return dir;
    }
  },
  cursor: {
    name: 'Cursor',
    files: ['.cursorrules'],
    generate(cwd) {
      const content = `# Long-Horizon v2 — Autonomous Loop + Graph Brain\n\n${SKILL_CONTENT}`;
      fs.writeFileSync(path.join(cwd, '.cursorrules'), content, 'utf8');
      return '.cursorrules';
    }
  },
  windsurf: {
    name: 'Windsurf',
    files: ['.windsurfrules'],
    generate(cwd) {
      fs.writeFileSync(path.join(cwd, '.windsurfrules'), SKILL_CONTENT, 'utf8');
      return '.windsurfrules';
    }
  },
  aider: {
    name: 'Aider',
    files: ['.aider.conf.yml', 'CONVENTIONS.md'],
    generate(cwd) {
      fs.writeFileSync(path.join(cwd, 'CONVENTIONS.md'), SKILL_CONTENT, 'utf8');
      const conf = `read: CONVENTIONS.md\n`;
      fs.writeFileSync(path.join(cwd, '.aider.conf.yml'), conf, 'utf8');
      return 'CONVENTIONS.md + .aider.conf.yml';
    }
  },
  codex: {
    name: 'OpenAI Codex / ChatGPT',
    files: ['AGENTS.md'],
    generate(cwd) {
      fs.writeFileSync(path.join(cwd, 'AGENTS.md'), SKILL_CONTENT, 'utf8');
      return 'AGENTS.md';
    }
  },
  generic: {
    name: 'Generic (CLAUDE.md)',
    files: ['CLAUDE.md'],
    generate(cwd) {
      fs.writeFileSync(path.join(cwd, 'CLAUDE.md'), SKILL_CONTENT, 'utf8');
      return 'CLAUDE.md';
    }
  }
};

function install(cwd, adapterName) {
  if (adapterName === 'all') {
    const results = [];
    for (const [name, adapter] of Object.entries(adapters)) {
      results.push({ name, file: adapter.generate(cwd) });
    }
    return results;
  }
  const adapter = adapters[adapterName];
  if (!adapter) throw new Error(`Unknown adapter: ${adapterName}. Available: ${Object.keys(adapters).join(', ')}`);
  return [{ name: adapterName, file: adapter.generate(cwd) }];
}

function detect(cwd) {
  for (const [name, adapter] of Object.entries(adapters)) {
    for (const f of adapter.files) {
      if (fs.existsSync(path.join(cwd, f))) return name;
    }
  }
  return null;
}

function list() {
  return Object.entries(adapters).map(([key, a]) => ({ key, name: a.name, files: a.files }));
}

module.exports = { install, detect, list, adapters };
