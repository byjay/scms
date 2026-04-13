/* ═══════════════════════════════════════════
   Node Editor — Create/Connect/Move/Delete
   Game-like 3D node editing on grid
   ═══════════════════════════════════════════ */
class NodeEditor {
  constructor(renderer) {
    this.renderer = renderer;
    this.nodes = []; // {id, type, start, end, relations, length, area, component, maxCable}
    this.edges = []; // {fromId, toId}
    this.tool = 'create'; // create, connect, move, delete
    this.deckCode = 'EC';
    this.startNum = 1;
    this.numDigits = 3;
    this.nextNum = 1;
    this.nodeType = 'Tray';
    this.component = '';
    this.selectedNodeId = null;
    this.connectFromId = null;
    this.isDragging = false;
    this.dragNodeId = null;
    this.dragIsEnd = false;
    this.dragStartWorld = null;
    // For tray creation: first click = start, drag to end
    this.creatingTray = false;
    this.trayStartPoint = null;
  }

  getNextId() {
    const num = String(this.nextNum).padStart(this.numDigits, '0');
    return `${this.deckCode}${num}`;
  }

  advanceNum() {
    this.nextNum++;
    this._updateNextUI();
  }

  _updateNextUI() {
    const el = document.getElementById('ed-next-id');
    const hud = document.getElementById('hud-next');
    const nid = this.getNextId();
    if (el) el.textContent = nid;
    if (hud) hud.textContent = nid;
  }

  setTool(tool) {
    this.tool = tool;
    this.connectFromId = null;
    this.creatingTray = false;
    this.trayStartPoint = null;
    this.renderer.ghostLine = null;
    const hud = document.getElementById('hud-tool');
    if (hud) hud.textContent = tool.toUpperCase();
    // Cursor
    const canvas = this.renderer.canvas;
    canvas.className = '';
    if (tool === 'create') canvas.classList.add('crosshair');
    else if (tool === 'move') canvas.classList.add('move-cursor');
    else if (tool === 'delete') canvas.classList.add('pointer');
    else if (tool === 'connect') canvas.classList.add('pointer');
  }

  // ─── CREATE NODE ───
  createNodeAt(worldPos) {
    const id = this.getNextId();
    // Check duplicate
    if (this.nodes.find(n => n.id === id)) {
      this.nextNum++;
      return this.createNodeAt(worldPos);
    }

    if (this.nodeType === 'Hole') {
      // Hole = single point
      this.nodes.push({
        id, type: 'HOLE',
        start: { ...worldPos }, end: null,
        relations: [], length: 0, area: 1288.2,
        component: this.component || 'CP-80', maxCable: 100
      });
      this.advanceNum();
      this._syncRenderer();
      return id;
    }

    // Tray: two-step (start → drag → release for end)
    if (!this.creatingTray) {
      this.creatingTray = true;
      this.trayStartPoint = { ...worldPos };
      return null; // not yet complete
    } else {
      const sp = this.trayStartPoint;
      const ep = { ...worldPos };
      const dx = ep.x - sp.x, dy = ep.y - sp.y, dz = ep.z - sp.z;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) / 1000;

      this.nodes.push({
        id, type: 'TRAY',
        start: sp, end: ep,
        relations: [], length: parseFloat(len.toFixed(2)), area: 14000,
        component: this.component || '', maxCable: 100
      });

      // Auto-connect to nearest node endpoint if close
      this._autoConnect(id);

      this.creatingTray = false;
      this.trayStartPoint = null;
      this.renderer.ghostLine = null;
      this.advanceNum();
      this._syncRenderer();
      return id;
    }
  }

  _autoConnect(newId) {
    const newNode = this.nodes.find(n => n.id === newId);
    if (!newNode) return;
    const pts = [newNode.start, newNode.end].filter(Boolean);
    const threshold = this.renderer.editorGridSize * 1.5;

    this.nodes.forEach(n => {
      if (n.id === newId) return;
      const nPts = [n.start, n.end].filter(Boolean);
      for (const pa of pts) {
        for (const pb of nPts) {
          const d = Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2 + (pa.z - pb.z) ** 2);
          if (d < threshold) {
            // Snap point to match
            pa.x = pb.x; pa.y = pb.y; pa.z = pb.z;
            this.addEdge(newId, n.id);
            return;
          }
        }
      }
    });
  }

  // ─── CONNECT ───
  connectClick(nodeId) {
    if (!this.connectFromId) {
      this.connectFromId = nodeId;
      this.selectedNodeId = nodeId;
    } else {
      if (nodeId !== this.connectFromId) {
        this.addEdge(this.connectFromId, nodeId);
      }
      this.connectFromId = null;
      this.selectedNodeId = null;
    }
    this._syncRenderer();
  }

  addEdge(fromId, toId) {
    // Check duplicate
    const exists = this.edges.find(e =>
      (e.fromId === fromId && e.toId === toId) ||
      (e.fromId === toId && e.toId === fromId)
    );
    if (exists) return;
    this.edges.push({ fromId, toId });
    // Also update relations
    const nA = this.nodes.find(n => n.id === fromId);
    const nB = this.nodes.find(n => n.id === toId);
    if (nA && !nA.relations.includes(toId)) nA.relations.push(toId);
    if (nB && !nB.relations.includes(fromId)) nB.relations.push(fromId);
  }

  // ─── DELETE ───
  deleteNode(nodeId) {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.edges = this.edges.filter(e => e.fromId !== nodeId && e.toId !== nodeId);
    // Clean relations
    this.nodes.forEach(n => { n.relations = n.relations.filter(r => r !== nodeId) });
    if (this.selectedNodeId === nodeId) this.selectedNodeId = null;
    this._syncRenderer();
  }

  // ─── MOVE ───
  startMove(nodeId, isEnd, worldPos) {
    this.isDragging = true;
    this.dragNodeId = nodeId;
    this.dragIsEnd = isEnd;
    this.dragStartWorld = { ...worldPos };
  }

  updateMove(worldPos) {
    if (!this.isDragging || !this.dragNodeId) return;
    const node = this.nodes.find(n => n.id === this.dragNodeId);
    if (!node) return;
    const snapped = this.renderer.snapToGrid(worldPos);
    if (this.dragIsEnd && node.end) {
      node.end = { ...snapped };
    } else if (node.start) {
      // Move whole node if dragging start
      if (node.end) {
        const dx = snapped.x - node.start.x;
        const dy = snapped.y - node.start.y;
        const dz = snapped.z - node.start.z;
        node.end.x += dx; node.end.y += dy; node.end.z += dz;
      }
      node.start = { ...snapped };
    }
    // Recalc length
    if (node.start && node.end) {
      const d = Math.sqrt((node.end.x - node.start.x) ** 2 + (node.end.y - node.start.y) ** 2 + (node.end.z - node.start.z) ** 2);
      node.length = parseFloat((d / 1000).toFixed(2));
    }
    this._syncRenderer();
  }

  endMove() {
    this.isDragging = false;
    this.dragNodeId = null;
  }

  // ─── IMPORT from parsed nodes ───
  importNodes(parsedNodes) {
    this.nodes = parsedNodes.map(n => ({
      id: n.id, type: n.type,
      start: n.start ? { ...n.start } : null,
      end: n.end ? { ...n.end } : null,
      relations: [...(n.relations || [])],
      length: n.length || 0, area: n.area || 0,
      component: n.component || '', maxCable: n.maxCable || 100
    }));
    // Build edges from relations
    this.edges = [];
    const edgeSet = new Set();
    this.nodes.forEach(n => {
      n.relations.forEach(r => {
        const key = [n.id, r].sort().join('|');
        if (!edgeSet.has(key) && this.nodes.find(nd => nd.id === r)) {
          edgeSet.add(key);
          this.edges.push({ fromId: n.id, toId: r });
        }
      });
    });
    // Detect next number from existing IDs
    this._detectNextNum();
    this._syncRenderer();
  }

  _detectNextNum() {
    let maxNum = 0;
    const prefix = this.deckCode;
    this.nodes.forEach(n => {
      if (n.id.startsWith(prefix)) {
        const numPart = n.id.substring(prefix.length);
        const num = parseInt(numPart);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    this.nextNum = maxNum + 1;
    this._updateNextUI();
  }

  clear() {
    this.nodes = [];
    this.edges = [];
    this.selectedNodeId = null;
    this.connectFromId = null;
    this.creatingTray = false;
    this.trayStartPoint = null;
    this.nextNum = parseInt(document.getElementById('ed-start-num')?.value) || 1;
    this.renderer.ghostLine = null;
    this._syncRenderer();
  }

  _syncRenderer() {
    this.renderer.editorNodes = this.nodes;
    this.renderer.editorEdges = this.edges;
    this.renderer.selectedNodeId = this.selectedNodeId;
    this._updateStats();
  }

  _updateStats() {
    const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v };
    el('ed-stat-nodes', this.nodes.length);
    el('ed-stat-edges', this.edges.length);
    el('ed-stat-holes', this.nodes.filter(n => n.type === 'HOLE').length);
    const totalLen = this.nodes.reduce((s, n) => s + (n.length || 0), 0);
    el('ed-stat-length', totalLen.toFixed(0));
  }

  recalcBounds() {
    this.renderer.calculateBounds();
  }
}
