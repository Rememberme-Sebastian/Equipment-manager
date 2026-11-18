// Builds index.html from the files in src/. Run: npm install, then npm run build
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const result = await build({
  entryPoints: ['src/app.jsx'],
  bundle: true,
  format: 'iife',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  target: 'es2019',
  minifySyntax: true,
  write: false,
  logLevel: 'warning'
});
const js = result.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const shell = readFileSync('src/shell.html', 'utf8');
writeFileSync('index.html', shell.replace('/*APP*/', () => js));
console.log('Built index.html');
