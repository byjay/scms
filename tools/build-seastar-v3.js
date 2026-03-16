const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'assets', 'src-js');
const bundlePath = path.join(rootDir, 'assets', 'seastar-v3.js');

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Source directory not found: ${sourceDir}`);
}

const fragments = fs
  .readdirSync(sourceDir)
  .filter((name) => name.endsWith('.js'))
  .sort();

if (!fragments.length) {
  throw new Error(`No source fragments found in ${sourceDir}`);
}

const lines = ['// Built from assets/src-js. Edit the split sources, not this bundle.', ''];

for (const fragment of fragments) {
  const fragmentPath = path.join(sourceDir, fragment);
  lines.push(`// --- BEGIN ${fragment} ---`);
  lines.push(fs.readFileSync(fragmentPath, 'utf8'));
  lines.push(`// --- END ${fragment} ---`);
  lines.push('');
}

fs.writeFileSync(bundlePath, `${lines.join('\n').trimEnd()}\n`, 'utf8');

console.log(`Built bundle: ${bundlePath}`);
for (const fragment of fragments) {
  console.log(` - ${fragment}`);
}
