const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(
  rootDir,
  'packages',
  'docs',
  '.vitepress',
  'dist',
);
const outputDir = path.join(rootDir, 'dist');
const clientDir = path.join(outputDir, 'client');
const serverDir = path.join(outputDir, 'server');

if (!fs.existsSync(path.join(sourceDir, 'index.html'))) {
  throw new Error('VitePress output is missing. Run the docs build first.');
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.cpSync(sourceDir, clientDir, { recursive: true });
fs.mkdirSync(serverDir, { recursive: true });
fs.writeFileSync(
  path.join(serverDir, 'index.js'),
  `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
`,
  'utf8',
);

console.log('[OK] Staged static Jue site for Sites hosting.');
