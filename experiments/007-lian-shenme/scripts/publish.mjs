import { cp, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
// Only remove this experiment's generated bundle. Source and user files stay intact.
await rm(`${root}assets`, { recursive: true, force: true });
for (const entry of await readdir(root)) {
  if (/^workbox-[\w-]+\.js$/.test(entry)) await rm(`${root}${entry}`);
}
await cp(`${root}dist`, root, { recursive: true });
console.log('Static build copied to experiments/007-lian-shenme/ for branch-based GitHub Pages.');
