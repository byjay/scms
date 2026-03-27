const XLSX = require('./node_modules/xlsx');

// ============================================================
// Utility helpers
// ============================================================
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, dec = 1) { return +(Math.random() * (max - min) + min).toFixed(dec); }
function pad3(n) { return String(n).padStart(3, '0'); }

// ============================================================
// 1. BUILD NODE DATA  (60 nodes, 4 decks, connected graph)
// ============================================================
const COMPONENTS = ['C-4', 'RLB-5-D', 'FB3B-100', 'HB-4', 'TB-3'];
const deckPrefixes = ['E1', 'E2', 'E3', 'E4'];
const deckZ = { E1: 3000, E2: 6000, E3: 9000, E4: 12000 };

// Create node IDs per deck (15 each)
const deckNodes = {};
const allNodeIds = [];
deckPrefixes.forEach(d => {
  deckNodes[d] = [];
  for (let i = 1; i <= 15; i++) {
    const id = d + pad3(i);
    deckNodes[d].push(id);
    allNodeIds.push(id);
  }
});

// Adjacency map
const adj = {};
allNodeIds.forEach(id => { adj[id] = new Set(); });

function link(a, b) {
  adj[a].add(b);
  adj[b].add(a);
}

// Build intra-deck topology: backbone + branches
deckPrefixes.forEach(d => {
  const nodes = deckNodes[d];
  // Backbone: 001 -> 002 -> ... -> 010
  for (let i = 0; i < 9; i++) link(nodes[i], nodes[i + 1]);
  // Branches off backbone
  link(nodes[2], nodes[10]);   // 003 -> 011
  link(nodes[10], nodes[11]);  // 011 -> 012
  link(nodes[5], nodes[12]);   // 006 -> 013
  link(nodes[7], nodes[13]);   // 008 -> 014
  link(nodes[13], nodes[14]);  // 014 -> 015
});

// Inter-deck holes
link('E1010', 'E2001');
link('E2010', 'E3001');
link('E3010', 'E4001');

// Assign coordinates
const nodeCoords = {};
deckPrefixes.forEach(d => {
  const z = deckZ[d];
  const nodes = deckNodes[d];
  let x = randInt(1000, 3000), y = randInt(500, 2000);
  nodes.forEach((id, idx) => {
    const x1 = x + idx * randInt(800, 2500);
    const y1 = y + randInt(-500, 500);
    const x2 = x1 + randInt(500, 1500);
    const y2 = y1 + randInt(-200, 200);
    nodeCoords[id] = { x1, y1, z, x2, y2 };
  });
});

// Determine hole nodes
const holeNodes = new Set(['E1010', 'E2001', 'E2010', 'E3001', 'E3010', 'E4001']);

// Build rows
const nodeRows = allNodeIds.map(id => {
  const c = nodeCoords[id];
  const isHole = holeNodes.has(id);
  return {
    NODE_RNAME: id,
    STRUCTURE_NAME: '',
    COMPONENT: pick(COMPONENTS),
    NODE_TYPE: isHole ? 'Hole' : (Math.random() < 0.1 ? 'Hole' : 'Tray'),
    RELATION: [...adj[id]].join(','),
    LINK_LENGTH: randInt(1, 15),
    AREA_SIZE: randInt(5000, 80000),
    MAX_CABLE: Math.random() < 0.5 ? 70 : 100,
    POINT: `S : ${c.x1},${c.y1},${c.z} E : ${c.x2},${c.y2},${c.z}`
  };
});

// Write TEST_NODE.xlsx
const wsNode = XLSX.utils.json_to_sheet(nodeRows);
const wbNode = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbNode, wsNode, 'NODES');
XLSX.writeFile(wbNode, 'assets/TEST_NODE.xlsx');
console.log('Created assets/TEST_NODE.xlsx with', nodeRows.length, 'nodes');

// ============================================================
// 2. BFS helper for CHECK_NODE generation
// ============================================================
function bfs(start, end) {
  if (start === end) return [start];
  const visited = new Set([start]);
  const queue = [[start, [start]]];
  while (queue.length) {
    const [cur, path] = queue.shift();
    for (const nb of adj[cur]) {
      if (visited.has(nb)) continue;
      visited.add(nb);
      const np = [...path, nb];
      if (nb === end) return np;
      queue.push([nb, np]);
    }
  }
  return null;
}

// ============================================================
// 3. BUILD CABLE DATA  (100 cables)
// ============================================================
const SYSTEMS = ['POWER', 'LTG', 'CONT', 'FIRE', 'COMM'];
const SYS_ABBR = { POWER: 'PW', LTG: 'LT', CONT: 'CT', FIRE: 'FR', COMM: 'CM' };
const CABLE_TYPES = ['MY4', 'DY4', 'MYS7', 'TY50', 'SY4', 'DPYC2.5', 'HF-CV3C'];
const ROOMS = [
  'ENGINE RM(P)', 'CARGO CTRL RM', 'BRIDGE', 'PUMP RM(S)',
  'STEERING GEAR RM', 'GALLEY', 'BOSUN STORE', 'FIRE STATION', 'AC PLANT RM'
];
const EQUIPS = [
  'MAIN SWBD MSB-1', 'DIST PANEL DP-E1', 'FIRE ALARM PANEL', 'NAV CONSOLE',
  'CARGO PUMP P-1', 'AHU-3', 'EMERGENCY GEN', 'STEERING MOTOR SM-1', 'BILGE PUMP BP-2'
];
const OUTDIAS = [10.5, 13.2, 15.9, 19.0, 22.4, 28.1];

function deckOf(nodeId) { return nodeId.slice(0, 2); }

const cableRows = [];
for (let i = 1; i <= 100; i++) {
  const sys = pick(SYSTEMS);
  const cableName = `T-${SYS_ABBR[sys]}-${pad3(i)}`;

  // Pick FROM and TO nodes
  let fromNode, toNode;
  if (i <= 20) {
    // Cross-deck cables
    const d1 = pick(deckPrefixes);
    let d2 = pick(deckPrefixes);
    while (d2 === d1) d2 = pick(deckPrefixes);
    fromNode = pick(deckNodes[d1]);
    toNode = pick(deckNodes[d2]);
  } else {
    fromNode = pick(allNodeIds);
    toNode = pick(allNodeIds);
    while (toNode === fromNode) toNode = pick(allNodeIds);
  }

  // CHECK_NODE (~20% of cables)
  let checkNode = '';
  if (Math.random() < 0.2) {
    const path = bfs(fromNode, toNode);
    if (path && path.length > 3) {
      // pick 1-2 intermediate nodes
      const interior = path.slice(1, -1);
      const cnt = Math.min(interior.length, randInt(1, 2));
      const picks = [];
      const used = new Set();
      for (let c = 0; c < cnt; c++) {
        const idx = randInt(0, interior.length - 1);
        if (!used.has(idx)) { picks.push(interior[idx]); used.add(idx); }
      }
      checkNode = picks.join(',');
    }
  }

  cableRows.push({
    CABLE_SYSTEM: sys,
    WD_PAGE: i,
    CABLE_NAME: cableName,
    CABLE_TYPE: pick(CABLE_TYPES),
    FROM_ROOM: pick(ROOMS),
    FROM_EQUIP: pick(EQUIPS),
    FROM_NODE: fromNode,
    FROM_REST: randInt(1, 30),
    TO_ROOM: pick(ROOMS),
    TO_EQUIP: pick(EQUIPS),
    TO_NODE: toNode,
    TO_REST: randInt(1, 20),
    POR_LENGTH: '',
    CABLE_PATH: '',
    CABLE_OUTDIA: pick(OUTDIAS),
    CHECK_NODE: checkNode,
    SUPPLY_DECK: deckOf(fromNode),
    POR_WEIGHT: randInt(500, 50000),
    INTERFERENCE: '',
    REMARK: ''
  });
}

// Write TEST_CABLE.xlsx
const wsCable = XLSX.utils.json_to_sheet(cableRows);
const wbCable = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbCable, wsCable, 'CABLES');
XLSX.writeFile(wbCable, 'assets/TEST_CABLE.xlsx');
console.log('Created assets/TEST_CABLE.xlsx with', cableRows.length, 'cables');

// ============================================================
// 4. VERIFY by reading back
// ============================================================
console.log('\n--- Verification ---');

const vNode = XLSX.readFile('assets/TEST_NODE.xlsx');
const nData = XLSX.utils.sheet_to_json(vNode.Sheets[vNode.SheetNames[0]]);
console.log('TEST_NODE.xlsx: ' + nData.length + ' rows, columns: ' + Object.keys(nData[0]).join(', '));
console.log('Sample node:', JSON.stringify(nData[0]));
console.log('Sample node (last):', JSON.stringify(nData[nData.length - 1]));

// Verify graph connectivity
const readAdj = {};
nData.forEach(r => {
  readAdj[r.NODE_RNAME] = r.RELATION ? String(r.RELATION).split(',') : [];
});
// Check symmetry
let symErrors = 0;
Object.entries(readAdj).forEach(([node, neighbors]) => {
  neighbors.forEach(nb => {
    if (!readAdj[nb] || !readAdj[nb].includes(node)) {
      symErrors++;
      console.error(`SYMMETRY ERROR: ${node} -> ${nb} but ${nb} does not list ${node}`);
    }
  });
});
console.log('Graph symmetry errors:', symErrors);

// Check connectivity via BFS
const visited = new Set();
const q = [nData[0].NODE_RNAME];
visited.add(q[0]);
while (q.length) {
  const cur = q.shift();
  for (const nb of readAdj[cur]) {
    if (!visited.has(nb)) { visited.add(nb); q.push(nb); }
  }
}
console.log('Reachable nodes from ' + nData[0].NODE_RNAME + ':', visited.size, '/ ' + nData.length);
console.log('Graph is ' + (visited.size === nData.length ? 'CONNECTED' : 'DISCONNECTED'));

const vCable = XLSX.readFile('assets/TEST_CABLE.xlsx');
const cData = XLSX.utils.sheet_to_json(vCable.Sheets[vCable.SheetNames[0]]);
console.log('\nTEST_CABLE.xlsx: ' + cData.length + ' rows, columns: ' + Object.keys(cData[0]).join(', '));
console.log('Sample cable:', JSON.stringify(cData[0]));

// Verify all FROM_NODE and TO_NODE exist in node set
const nodeSet = new Set(nData.map(r => r.NODE_RNAME));
let refErrors = 0;
cData.forEach(c => {
  if (!nodeSet.has(c.FROM_NODE)) { refErrors++; console.error('Missing FROM_NODE:', c.FROM_NODE); }
  if (!nodeSet.has(c.TO_NODE)) { refErrors++; console.error('Missing TO_NODE:', c.TO_NODE); }
});
console.log('Cable node-reference errors:', refErrors);
console.log('\nDone!');
