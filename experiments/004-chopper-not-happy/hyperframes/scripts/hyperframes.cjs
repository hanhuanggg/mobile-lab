const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const env = { ...process.env };
env.XDG_STATE_HOME ||= path.join(root, 'render-temp/state');
env.XDG_CACHE_HOME ||= path.join(root, 'render-temp/cache');
if (!env.HYPERFRAMES_BROWSER_PATH && fs.existsSync('/usr/bin/chromium')) {
  env.HYPERFRAMES_BROWSER_PATH = '/usr/bin/chromium';
}
const cli = path.join(root, 'node_modules/hyperframes/bin/hyperframes.mjs');
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: root, env, stdio: 'inherit'
});
process.exit(result.status ?? 1);
