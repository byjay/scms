const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const bundlePath = path.join(rootDir, 'assets', 'seastar-v3.js');
const workerPath = path.join(rootDir, 'backend', 'auth-worker.js');
const htmlPath = path.join(rootDir, 'seastar-cms-v3.html');

const bundleSource = fs.readFileSync(bundlePath, 'utf8');
new vm.Script(bundleSource, { filename: 'assets/seastar-v3.js' });

const workerSource = fs.readFileSync(workerPath, 'utf8').replace(
  /^export default\s*\{/m,
  'const __workerDefaultExport = {'
);
new vm.Script(workerSource, { filename: 'backend/auth-worker.js' });

const htmlSource = fs.readFileSync(htmlPath, 'utf8');
if (!htmlSource.includes('./assets/seastar-v3.js') && !htmlSource.includes('assets/seastar-v3.js')) {
  throw new Error('seastar-cms-v3.html does not reference assets/seastar-v3.js');
}

console.log('seastar bundle parse ok');
console.log('auth worker parse ok');
console.log('html bundle reference ok');
