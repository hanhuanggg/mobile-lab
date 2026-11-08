import { cp, readdir, rm } from 'node:fs/promises';
await rm('assets', { recursive: true, force: true });
for (const file of await readdir('dist')) await cp(`dist/${file}`, file, { recursive: true });
console.log('Static game published to experiments/008-borderline/ (relative asset paths).');
