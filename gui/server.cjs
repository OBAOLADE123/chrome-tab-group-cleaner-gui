// Tab Group Cleaner GUI: a local page that drives ../dist/cli.js. No dependencies.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { spawn } = require('child_process');

const PORT = Number(process.env.PORT) || 4777;
const TOKEN = crypto.randomBytes(16).toString('hex');
const CLI = path.join(__dirname, '..', 'dist', 'cli.js');
const BROWSERS = ['chrome', 'brave', 'edge', 'chromium'];
const GUID = /^[0-9A-Za-z][0-9A-Za-z-]{0,63}$/;
const DIR = /^[\w .-]{1,64}$/;

function buildArgs(b) {
  const args = [b.action];
  if (BROWSERS.includes(b.browser)) args.push('--browser', b.browser);
  if (b.action === 'list') { args.push('--json', '--all-profiles'); return args; }
  if (b.action === 'restore') {
    if (typeof b.backup !== 'string' || !b.backup.trim() || b.backup.startsWith('-')) throw new Error('Enter the backup folder path.');
    if (typeof b.profile !== 'string' || !DIR.test(b.profile)) throw new Error('Enter the profile folder name, e.g. Default.');
    return [...args, '--backup', b.backup.trim(), '--profile', b.profile];
  }
  if (b.action !== 'delete') throw new Error('Unknown action.');
  if (b.mode === 'all') args.push('--all');
  else if (b.mode === 'guids') {
    if (!Array.isArray(b.guids) || !b.guids.length || b.guids.length > 3000 || !b.guids.every(g => GUID.test(g))) throw new Error('Nothing selected.');
    const joined = b.guids.join(',');
    if (joined.length > 28000) throw new Error('Too many groups for one command - use "Select all" instead.');
    args.push('--guids', joined);
  } else throw new Error('Unknown mode.');
  if (typeof b.profile === 'string' && DIR.test(b.profile)) args.push('--profile', b.profile); else args.push('--all-profiles');
  if (b.dryRun) args.push('--dry-run');
  if (b.orphans) args.push('--orphans');
  if (b.restart) args.push('--restart');
  if (b.tombstone) args.push('--sync-tombstone');
  return args;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8').replace('__TOKEN__', TOKEN);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(html);
  }
  if (req.method === 'POST' && req.url === '/run') {
    let raw = '';
    req.on('data', d => { raw += d; if (raw.length > 100000) req.destroy(); });
    req.on('end', () => {
      const reply = obj => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
      try {
        const b = JSON.parse(raw);
        if (b.token !== TOKEN) return reply({ error: 'Session expired. Reload this page.' });
        if (!fs.existsSync(CLI)) return reply({ error: 'dist\\cli.js is missing. Run setup.bat first.' });
        const args = buildArgs(b);
        const p = spawn(process.execPath, [CLI, ...args], { windowsHide: true });
        let out = '', err = '';
        p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d);
        p.on('error', e => reply({ error: String(e) }));
        p.on('close', code => reply({ code, out, err, cmd: 'cli ' + args.map(a => a.length > 80 ? a.slice(0, 77) + '...' : a).join(' ') }));
      } catch (e) { reply({ error: e.message }); }
    });
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.log('Tab Group Cleaner is running at ' + url + '\nKeep this window open. Close it to stop.');
  if (!process.env.NO_OPEN) {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { windowsHide: true });
    else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url]).on('error', () => {});
  }
});
server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} is busy - it may already be open at http://127.0.0.1:${PORT}/` : e); process.exit(1); });
