/* ═══════════════════════════════════════════
   3D Renderer — Canvas-based (Enhanced V2)
   Viewer + Editor unified rendering
   
   ★ HEXAGON nodes: DECK CODE (top) + NODE NUMBER (bottom)
   ★ DIAMOND markers at node-to-node junction points
   ★ Fill rate heatmap on trays (linked to tray fill data)
   ★ Cable cross-section visualization on click
   ★ Enhanced DXF overlay + export fidelity
   ═══════════════════════════════════════════ */
class Renderer3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.rotation = { x: -30, y: 45 };
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.viewMode = 'iso';
    this.nodes = [];
    this.pathNodes = [];
    this.pathIdSet = new Set();
    this.startId = '';
    this.endId = '';
    this.hoveredNode = null;
    this.showLabels = true;
    this.bounds = { centerX: 0, centerY: 0, centerZ: 0, scale: 1 };
    this.fireEnabled = false;
    this.fireParticles = [];
    this.fireProgress = 0;
    this.fireSpeed = 0.003;
    this.animFrame = null;
    this.lastTime = 0;
    this.width = 0;
    this.height = 0;
    this._labelRects = [];
    // Editor data
    this.editorMode = false;
    this.editorNodes = [];
    this.editorEdges = [];
    this.selectedNodeId = null;
    this.ghostLine = null;
    this.editorGrid = true;
    this.editorGridSize = 500;
    this.editorSnap = true;
    this.editorElevation = 3000;
    this.cursorWorld = null;
    this.dxfLines = [];
    this.dxfVisible = true;
    this.dxfOpacity = 0.55;
    this.dxfElevation = null;
    this.dxfFlattenToEditor = true;
    // Fill integration
    this.fillData = new Map(); // nodeId → { fillRatio, cableCount, cables[], width, tier }
    this.showFillHeatmap = true;
    this.showCrossSection = false;
    this.crossSectionNodeId = null;
    this.crossSectionData = null; // { cables, width, height, tier, fillRatio }
    // Junction points (diamond markers)
    this.junctionPoints = []; // [{x,y,z}] — auto-calculated at node-to-node meeting points
    this._animate = this._animate.bind(this);
  }

  setNodes(n) { this.nodes = n; this.calculateBounds(); this.resetView(); this._calculateJunctions(); }
  setPath(p) { this.pathNodes = p; this.pathIdSet = new Set(p.map(n => n.id)); this.fireProgress = 0; this.fireParticles = []; this.pathSegments = this._buildPathSegs(p); }
  setStartEnd(s, e) { this.startId = s; this.endId = e; }
  setFireEnabled(e) { this.fireEnabled = e; if (e && this.pathNodes.length > 0) { this.fireProgress = 0; this.fireParticles = []; if (!this.animFrame) this.startAnimation(); } }
  resetView() { this.rotation = { x: -30, y: 45 }; this.zoom = 1; this.pan = { x: 0, y: 0 }; this.viewMode = 'iso'; }
  setView(m) { this.viewMode = m; const p = { iso: { x: -30, y: 45 }, plan: { x: -90, y: 0 }, front: { x: 0, y: 0 }, side: { x: 0, y: 90 } }; if (p[m]) this.rotation = { ...p[m] }; }

  // Set fill data from SEcMS parent
  setFillData(data) {
    this.fillData = new Map();
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([nodeId, info]) => {
        this.fillData.set(nodeId, info);
      });
    }
  }

  // ─── Calculate junction points (diamond markers) ───
  // Junctions are where 3+ nodes share the same endpoint coordinate
  _calculateJunctions() {
    const all = this.editorMode ? this.editorNodes : this.nodes;
    const pointMap = new Map(); // "x,y,z" → count
    const pointCoords = new Map(); // "x,y,z" → {x,y,z}

    all.forEach(n => {
      for (const pt of [n.start, n.end]) {
        if (!pt) continue;
        const key = `${Math.round(pt.x)},${Math.round(pt.y)},${Math.round(pt.z)}`;
        pointMap.set(key, (pointMap.get(key) || 0) + 1);
        pointCoords.set(key, pt);
      }
    });

    this.junctionPoints = [];
    pointMap.forEach((count, key) => {
      if (count >= 2) { // 2+ endpoints meeting = junction
        const pt = pointCoords.get(key);
        if (pt) this.junctionPoints.push({ ...pt, count });
      }
    });
  }

  calculateBounds() {
    const all = this.editorMode ? this.editorNodes : this.nodes;
    if (all.length === 0 && this.dxfLines.length === 0) { this.bounds = { centerX: 0, centerY: 0, centerZ: 0, scale: 1 }; return; }
    let mnX = Infinity, mnY = Infinity, mnZ = Infinity, mxX = -Infinity, mxY = -Infinity, mxZ = -Infinity;
    all.forEach(n => { for (const p of [n.start, n.end]) { if (!p) continue; if (p.x < mnX) mnX = p.x; if (p.y < mnY) mnY = p.y; if (p.z < mnZ) mnZ = p.z; if (p.x > mxX) mxX = p.x; if (p.y > mxY) mxY = p.y; if (p.z > mxZ) mxZ = p.z; } });
    const useY = this.editorMode && this.dxfFlattenToEditor ? this.editorElevation : null;
    this.dxfLines.forEach(l => { for (const raw of [l.start, l.end]) { const p = useY != null ? { x: raw.x, y: useY, z: raw.z } : raw; if (p.x < mnX) mnX = p.x; if (p.y < mnY) mnY = p.y; if (p.z < mnZ) mnZ = p.z; if (p.x > mxX) mxX = p.x; if (p.y > mxY) mxY = p.y; if (p.z > mxZ) mxZ = p.z; } });
    if (mnX === Infinity) { this.bounds = { centerX: 0, centerY: 0, centerZ: 0, scale: 1 }; return; }
    const mr = Math.max(mxX - mnX || 1, mxY - mnY || 1, mxZ - mnZ || 1);
    this.bounds = { centerX: (mnX + mxX) / 2, centerY: (mnY + mxY) / 2, centerZ: (mnZ + mxZ) / 2, scale: 400 / mr };
  }

  project(point) {
    const cx = point.x - this.bounds.centerX, cy = point.y - this.bounds.centerY, cz = point.z - this.bounds.centerZ;
    const rx = this.rotation.x * Math.PI / 180, ry = this.rotation.y * Math.PI / 180;
    const cosRy = Math.cos(ry), sinRy = Math.sin(ry), cosRx = Math.cos(rx), sinRx = Math.sin(rx);
    const x1 = cx * cosRy - cz * sinRy, z1 = cx * sinRy + cz * cosRy;
    const y2 = cy * cosRx - z1 * sinRx, z2 = cy * sinRx + z1 * cosRx;
    const s = this.bounds.scale * this.zoom;
    return { x: x1 * s + this.width / 2 + this.pan.x, y: -y2 * s + this.height / 2 + this.pan.y, z: z2 };
  }

  unproject(screenX, screenY, fixedY) {
    const s = this.bounds.scale * this.zoom;
    const rx = this.rotation.x * Math.PI / 180, ry = this.rotation.y * Math.PI / 180;
    const cosRy = Math.cos(ry), sinRy = Math.sin(ry), cosRx = Math.cos(rx), sinRx = Math.sin(rx);
    const sx = (screenX - this.width / 2 - this.pan.x) / s;
    const sy = -(screenY - this.height / 2 - this.pan.y) / s;
    const cy = fixedY - this.bounds.centerY;
    let z1, cz, cx2;
    if (Math.abs(sinRx) > 0.001) { z1 = (cy * cosRx - sy) / sinRx; }
    else { z1 = 0; }
    cx2 = sx * cosRy + z1 * sinRy;
    cz = z1 * cosRy - sx * sinRy;
    return { x: cx2 + this.bounds.centerX, y: fixedY, z: cz + this.bounds.centerZ };
  }

  snapToGrid(world) {
    if (!this.editorSnap) return world;
    const g = this.editorGridSize;
    return { x: Math.round(world.x / g) * g, y: world.y, z: Math.round(world.z / g) * g };
  }

  findNodeAt(cssX, cssY) {
    const thr = 18; // enlarged hitbox for hexagon shapes
    const all = this.editorMode ? this.editorNodes : this.nodes;
    for (let i = all.length - 1; i >= 0; i--) {
      const node = all[i];
      for (const pt of [node.start, node.end]) {
        if (!pt) continue;
        const p = this.project(pt);
        if (Math.hypot(cssX - p.x, cssY - p.y) < thr) return node;
      }
    }
    return null;
  }

  findEditorNodeAt(cssX, cssY) {
    const thr = 18;
    for (let i = this.editorNodes.length - 1; i >= 0; i--) {
      const node = this.editorNodes[i];
      for (const pt of [node.start, node.end]) {
        if (!pt) continue;
        const p = this.project(pt);
        if (Math.hypot(cssX - p.x, cssY - p.y) < thr) return { node, isEnd: pt === node.end };
      }
    }
    return null;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.width = r.width; this.height = r.height;
    this.canvas.width = r.width * this.dpr; this.canvas.height = r.height * this.dpr;
  }

  // ═══ HEXAGON DRAWING ═══
  // Draws a hexagonal node marker like CAD: top line = DECK CODE, bottom line = NODE NUMBER
  _drawHexagonNode(ctx, px, py, nodeId, nodeType, isStart, isEnd, isPath, isHovered, isSelected, fillInfo) {
    const hexR = 16; // radius of hexagon
    const parts = this._splitNodeId(nodeId);

    // Determine fill-based color
    let fillColor = 'rgba(42,39,34,.85)';
    let strokeColor = '#6f6a5d';
    let textColor = '#f4f1eb';
    let glowColor = null;

    if (isStart) { strokeColor = '#22c55e'; glowColor = 'rgba(34,197,94,.4)'; }
    else if (isEnd) { strokeColor = '#ef4444'; glowColor = 'rgba(239,68,68,.4)'; }
    else if (isPath) { strokeColor = '#e8c08a'; glowColor = 'rgba(232,192,138,.3)'; }
    else if (isSelected) { strokeColor = '#d4a574'; glowColor = 'rgba(212,165,116,.35)'; }
    else if (isHovered) { strokeColor = '#84b8b3'; }

    // Fill heatmap coloring
    if (fillInfo && this.showFillHeatmap) {
      const ratio = fillInfo.fillRatio || 0;
      if (ratio > 0.8) { fillColor = 'rgba(200,40,40,.75)'; strokeColor = '#ef4444'; }
      else if (ratio > 0.6) { fillColor = 'rgba(180,120,30,.65)'; strokeColor = '#f59e0b'; }
      else if (ratio > 0.3) { fillColor = 'rgba(34,130,80,.55)'; strokeColor = '#22c55e'; }
      else if (ratio > 0) { fillColor = 'rgba(30,80,140,.55)'; strokeColor = '#3b82f6'; }
    }

    // HOLE nodes: draw as smaller diamond
    if (nodeType === 'HOLE') {
      this._drawDiamond(ctx, px, py, 10, strokeColor, fillColor, glowColor);
      // Label
      ctx.save();
      ctx.font = '700 8px "JetBrains Mono",monospace';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText(nodeId, px, py + 22);
      ctx.restore();
      return;
    }

    ctx.save();

    // Glow effect
    if (glowColor) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 14;
    }

    // Draw hexagon path
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 6 + (Math.PI / 3) * i; // pointy-top hexagon
      const hx = px + hexR * Math.cos(angle);
      const hy = py + hexR * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();

    // Fill
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Stroke
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isSelected || isHovered ? 2.2 : 1.5;
    ctx.stroke();

    // Divider line (horizontal middle)
    const midY = py;
    const leftX = px - hexR * Math.cos(Math.PI / 6);
    const rightX = px + hexR * Math.cos(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(leftX + 2, midY);
    ctx.lineTo(rightX - 2, midY);
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Top text: DECK CODE
    ctx.font = '800 7.5px "JetBrains Mono",monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = strokeColor;
    ctx.fillText(parts.deckCode, px, py - 5.5);

    // Bottom text: NODE NUMBER
    ctx.font = '700 7px "JetBrains Mono",monospace';
    ctx.fillStyle = textColor;
    ctx.fillText(parts.nodeNum, px, py + 5.5);

    // Fill info badge (small text below hexagon)
    if (fillInfo && fillInfo.cableCount > 0) {
      const badgeY = py + hexR + 10;
      const ratio = Math.round((fillInfo.fillRatio || 0) * 100);
      const badgeText = `${fillInfo.cableCount}C ${ratio}%`;
      ctx.font = '600 7px "JetBrains Mono",monospace';
      const tw = ctx.measureText(badgeText).width;
      ctx.fillStyle = 'rgba(30,30,25,.8)';
      ctx.fillRect(px - tw / 2 - 3, badgeY - 5, tw + 6, 10);
      ctx.strokeStyle = ratio > 80 ? '#ef4444' : ratio > 60 ? '#f59e0b' : '#22c55e';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px - tw / 2 - 3, badgeY - 5, tw + 6, 10);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, px, badgeY);
    }

    ctx.restore();
  }

  // ═══ DIAMOND DRAWING (for junction / intersection points) ═══
  _drawDiamond(ctx, px, py, size, strokeColor, fillColor, glowColor) {
    ctx.save();
    if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 10; }

    ctx.beginPath();
    ctx.moveTo(px, py - size);       // top
    ctx.lineTo(px + size, py);       // right
    ctx.lineTo(px, py + size);       // bottom
    ctx.lineTo(px - size, py);       // left
    ctx.closePath();

    ctx.fillStyle = fillColor || 'rgba(42,39,34,.85)';
    ctx.fill();
    ctx.strokeStyle = strokeColor || '#d4a574';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Split nodeId like "UP22" → { deckCode: "UP", nodeNum: "22" }
  // or "ER01A" → { deckCode: "ER", nodeNum: "01A" }
  // or "NV01B" → { deckCode: "NV", nodeNum: "01B" }
  _splitNodeId(nodeId) {
    if (!nodeId) return { deckCode: '?', nodeNum: '?' };
    // Match leading letters as deck code, rest as node number
    const match = nodeId.match(/^([A-Za-z]+)(.*)$/);
    if (match) {
      return { deckCode: match[1], nodeNum: match[2] || '?' };
    }
    return { deckCode: nodeId.substring(0, 2), nodeNum: nodeId.substring(2) || '?' };
  }

  _buildPathSegs(pn) {
    const s = [];
    for (let i = 0; i < pn.length; i++) {
      const n = pn[i]; if (n.start && n.end) s.push({ start: n.start, end: n.end });
      if (i < pn.length - 1) { const nx = pn[i + 1]; const fp = n.end || n.start, tp = nx.start; if (fp && tp) { const d = Math.sqrt((fp.x - tp.x) ** 2 + (fp.y - tp.y) ** 2 + (fp.z - tp.z) ** 2); if (d > 0.1) s.push({ start: fp, end: tp }); } }
    } return s;
  }

  _getPointAlongPath(t) { if (!this.pathSegments || !this.pathSegments.length) return null; const ts = this.pathSegments.length, si = Math.min(Math.floor(t * ts), ts - 1), st = t * ts - si, sg = this.pathSegments[si]; if (!sg) return null; return { x: sg.start.x + (sg.end.x - sg.start.x) * st, y: sg.start.y + (sg.end.y - sg.start.y) * st, z: sg.start.z + (sg.end.z - sg.start.z) * st }; }

  startAnimation() { if (this.animFrame) return; this.lastTime = performance.now(); this.animFrame = requestAnimationFrame(this._animate); }
  stopAnimation() { if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; } }

  _animate(ts) {
    const dt = (ts - this.lastTime) / 1000; this.lastTime = ts;
    if (this.fireEnabled && this.pathNodes.length > 0) {
      this.fireProgress += this.fireSpeed * (dt * 60); if (this.fireProgress > 1.2) this.fireProgress = 0;
      const ft = Math.min(this.fireProgress, 1), fp = this._getPointAlongPath(ft);
      if (fp && this.fireParticles.length < 300) {
        for (let i = 0; i < 4; i++) this.fireParticles.push({ x: fp.x + (Math.random() - .5) * 100, y: fp.y + (Math.random() - .5) * 100, z: fp.z + (Math.random() - .5) * 100, vx: (Math.random() - .5) * 40, vy: (Math.random() - .5) * 40 - 60, vz: (Math.random() - .5) * 40, life: 1, decay: .5 + Math.random(), size: 2 + Math.random() * 6, type: 'fire' });
        for (let i = 0; i < 2; i++) this.fireParticles.push({ x: fp.x + (Math.random() - .5) * 50, y: fp.y + (Math.random() - .5) * 50, z: fp.z + (Math.random() - .5) * 50, vx: (Math.random() - .5) * 120, vy: (Math.random() - .5) * 120 - 80, vz: (Math.random() - .5) * 120, life: 1, decay: 2 + Math.random() * 3, size: 1 + Math.random() * 2, type: 'spark' });
      }
      this.fireParticles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= p.decay * dt; p.size *= .99; });
      this.fireParticles = this.fireParticles.filter(p => p.life > 0);
    }
    this.draw();
    this.animFrame = requestAnimationFrame(this._animate);
  }

  _ro(r1, r2) { return !(r1.x + r1.w < r2.x || r2.x + r2.w < r1.x || r1.y + r1.h < r2.y || r2.y + r2.h < r1.y); }
  _canPlace(r) { for (const p of this._labelRects) if (this._ro(r, p)) return false; return true; }

  // ─── Fill heatmap color for tray line ───
  _getTrayColor(nodeId) {
    if (!this.showFillHeatmap) return '#4a463e';
    const info = this.fillData.get(nodeId);
    if (!info) return '#4a463e';
    const ratio = info.fillRatio || 0;
    if (ratio > 0.8) return '#ef4444';
    if (ratio > 0.6) return '#f59e0b';
    if (ratio > 0.3) return '#22c55e';
    if (ratio > 0) return '#3b82f6';
    return '#4a463e';
  }

  // ─── MAIN DRAW ──────────────────────────
  draw() {
    this.resize(); const ctx = this.ctx; ctx.save(); ctx.scale(this.dpr, this.dpr);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#211e18');
    bgGrad.addColorStop(1, '#181612');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, this.width, this.height);
    this._labelRects = [];

    if (this.editorMode) { this._drawEditor(ctx); }
    else { this._drawViewer(ctx); }

    // Cross-section overlay
    if (this.showCrossSection && this.crossSectionData) {
      this._drawCrossSectionOverlay(ctx);
    }

    ctx.restore();
  }

  // ═══ VIEWER DRAW ═══
  _drawViewer(ctx) {
    if (this.nodes.length === 0) return;
    this._drawGrid3D(ctx);
    // DXF background
    if (this.dxfVisible && this.dxfLines.length > 0) this._drawDxf(ctx);

    // Non-path tray lines (with fill heatmap)
    this.nodes.forEach(n => {
      if (n.type !== 'TRAY' || !n.end || this.pathIdSet.has(n.id)) return;
      const p1 = this.project(n.start), p2 = this.project(n.end);
      const trayColor = this._getTrayColor(n.id);
      ctx.strokeStyle = trayColor;
      ctx.lineWidth = trayColor !== '#4a463e' ? 2 : 1.2;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    });

    // Inter-node connection lines (dashed)
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    const drawnEdges = new Set();
    this.nodes.forEach(node => {
      if (!node.relations) return;
      node.relations.forEach(rid => {
        const edgeKey = [node.id, rid].sort().join('|');
        if (drawnEdges.has(edgeKey)) return;
        drawnEdges.add(edgeKey);
        const other = nodeMap.get(rid);
        if (!other) return;
        // Find closest endpoints
        const ptsA = [node.start, node.end].filter(Boolean);
        const ptsB = [other.start, other.end].filter(Boolean);
        let minD = Infinity, bestA, bestB;
        ptsA.forEach(a => ptsB.forEach(b => {
          const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
          if (d < minD) { minD = d; bestA = a; bestB = b; }
        }));
        if (bestA && bestB && minD > 5) {
          const p1 = this.project(bestA), p2 = this.project(bestB);
          ctx.save();
          ctx.strokeStyle = 'rgba(100,95,85,.35)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      });
    });

    // Junction diamond markers
    this.junctionPoints.forEach(jp => {
      const p = this.project(jp);
      if (p.x < -30 || p.x > this.width + 30 || p.y < -30 || p.y > this.height + 30) return;
      this._drawDiamond(ctx, p.x, p.y, 5, '#d4a574', 'rgba(42,39,34,.7)', null);
    });

    // Non-path hexagon nodes
    const step = Math.max(1, Math.floor(this.nodes.length / 200));
    this.nodes.forEach((n, i) => {
      if (this.pathIdSet.has(n.id) || !n.start) return;
      const p = this.project(n.start);
      if (p.x < -30 || p.x > this.width + 30 || p.y < -30 || p.y > this.height + 30) return;
      const isS = n.id === this.startId, isE = n.id === this.endId;
      const isH = n.id === this.hoveredNode?.id;
      const fillInfo = this.fillData.get(n.id);

      if (this.showLabels || isS || isE || isH || i % step === 0) {
        this._drawHexagonNode(ctx, p.x, p.y, n.id, n.type, isS, isE, false, isH, false, fillInfo);
      } else {
        // Small dot for unlabeled nodes
        ctx.fillStyle = n.type === 'HOLE' ? '#c85a5a' : '#7a7264';
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
      }

      // Also draw end point
      if (n.end && n.type === 'TRAY') {
        const pe = this.project(n.end);
        ctx.fillStyle = '#6f6a5d';
        ctx.beginPath(); ctx.arc(pe.x, pe.y, 2, 0, Math.PI * 2); ctx.fill();
      }
    });

    // Path
    if (this.pathNodes.length > 0) this._drawPath(ctx);

    // Hover tooltip
    if (this.hoveredNode && !this.showLabels) {
      const hp = this.project(this.hoveredNode.start);
      this._drawHexagonNode(ctx, hp.x, hp.y, this.hoveredNode.id, this.hoveredNode.type,
        this.hoveredNode.id === this.startId, this.hoveredNode.id === this.endId,
        this.pathIdSet.has(this.hoveredNode.id), true, false, this.fillData.get(this.hoveredNode.id));
    }
  }

  _drawPath(ctx) {
    const ft = this.fireEnabled ? Math.min(this.fireProgress, 1) : 1;
    // Path tray lines
    this.pathNodes.forEach((n, i) => {
      if (!n.end) return;
      const p1 = this.project(n.start), p2 = this.project(n.end);
      const sf = i / this.pathNodes.length, lit = sf <= ft;
      if (lit) {
        ctx.save(); ctx.shadowColor = this.fireEnabled ? '#ff8800' : '#00ff88'; ctx.shadowBlur = 10;
        ctx.strokeStyle = this.fireEnabled ? '#ff8800' : '#00ff88'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.restore();
      } else {
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
    });

    // Inter-path connections
    for (let i = 0; i < this.pathNodes.length - 1; i++) {
      const c = this.pathNodes[i], nx = this.pathNodes[i + 1];
      const fp = c.end || c.start, tp = nx.start;
      if (!fp || !tp) continue;
      const p1 = this.project(fp), p2 = this.project(tp);
      if (Math.hypot(p1.x - p2.x, p1.y - p2.y) > 1) {
        const lit = i / this.pathNodes.length <= ft;
        if (lit) {
          ctx.save(); ctx.shadowColor = this.fireEnabled ? '#ff6600' : '#00ff88'; ctx.shadowBlur = 6;
          ctx.strokeStyle = this.fireEnabled ? '#ff8800' : '#00dd66'; ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          ctx.setLineDash([]); ctx.restore();
        }
      }
    }

    // Path hexagon nodes
    this.pathNodes.forEach((n, i) => {
      const isS = n.id === this.startId, isE = n.id === this.endId;
      const p = this.project(n.start);
      if (p.x > -40 && p.x < this.width + 40) {
        this._drawHexagonNode(ctx, p.x, p.y, n.id, n.type, isS, isE, true, false, false, this.fillData.get(n.id));
      }
    });

    // Fire particles
    if (this.fireEnabled && this.fireParticles.length > 0) {
      this.fireParticles.forEach(pa => {
        const pp = this.project(pa), a = Math.max(0, pa.life), sz = Math.max(1, Math.min(pa.size * this.bounds.scale * this.zoom * .05, 12));
        if (pa.type === 'spark') {
          ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = a > .5 ? '#fff' : '#ffcc00';
          ctx.beginPath(); ctx.arc(pp.x, pp.y, sz * .5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else {
          ctx.save(); ctx.globalAlpha = a * .3; ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 16;
          ctx.fillStyle = '#ff6600'; ctx.beginPath(); ctx.arc(pp.x, pp.y, sz * 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          ctx.save(); ctx.globalAlpha = a;
          const g = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, sz);
          g.addColorStop(0, '#fff'); g.addColorStop(.3, '#ffee44'); g.addColorStop(.6, '#ff8800'); g.addColorStop(1, 'rgba(255,34,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pp.x, pp.y, sz, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      });
      const ffp = this._getPointAlongPath(Math.min(this.fireProgress, 1));
      if (ffp) {
        const fp = this.project(ffp);
        ctx.save(); ctx.globalAlpha = .7;
        const fg = ctx.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, 22);
        fg.addColorStop(0, '#fff'); fg.addColorStop(.2, '#ffee00'); fg.addColorStop(.5, '#ff8800'); fg.addColorStop(1, 'rgba(255,68,0,0)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fp.x, fp.y, 22, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
  }

  // ═══ EDITOR DRAW ═══
  _drawEditor(ctx) {
    if (this.editorGrid) this._drawEditorGrid(ctx);
    if (this.dxfVisible && this.dxfLines.length > 0) this._drawDxf(ctx);

    // Tray lines
    this.editorNodes.forEach(n => {
      if (n.start && n.end) {
        const p1 = this.project(n.start), p2 = this.project(n.end);
        ctx.strokeStyle = n.type === 'TRAY' ? '#3a5070' : '#553a3a';
        ctx.lineWidth = n.id === this.selectedNodeId ? 2.5 : 1.5;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
    });

    // Connection edges (dashed)
    this.editorEdges.forEach(e => {
      const nA = this.editorNodes.find(n => n.id === e.fromId);
      const nB = this.editorNodes.find(n => n.id === e.toId);
      if (!nA || !nB) return;
      const ptsA = [nA.start, nA.end].filter(Boolean), ptsB = [nB.start, nB.end].filter(Boolean);
      let minD = Infinity, bestA, bestB;
      ptsA.forEach(pa => ptsB.forEach(pb => { const d = Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2 + (pa.z - pb.z) ** 2); if (d < minD) { minD = d; bestA = pa; bestB = pb; } }));
      if (bestA && bestB) {
        const p1 = this.project(bestA), p2 = this.project(bestB);
        ctx.save(); ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
        // Draw diamond at meeting point
        const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        this._drawDiamond(ctx, mx, my, 5, '#06b6d4', 'rgba(6,182,212,.2)', null);
      }
    });

    // Ghost line
    if (this.ghostLine) {
      const p1 = this.project(this.ghostLine.from), p2 = this.project(this.ghostLine.to);
      ctx.save(); ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 8;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.setLineDash([]);
      const dx = this.ghostLine.to.x - this.ghostLine.from.x, dy = this.ghostLine.to.y - this.ghostLine.from.y, dz = this.ghostLine.to.z - this.ghostLine.from.z;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) / 1000;
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      ctx.font = '700 11px "JetBrains Mono",monospace'; ctx.fillStyle = '#00ff88'; ctx.textAlign = 'center';
      ctx.fillText(`${len.toFixed(2)}m`, mx, my - 8);
      ctx.restore();
    }

    // Cursor crosshair
    if (this.cursorWorld) {
      const cp = this.project(this.cursorWorld);
      ctx.save(); ctx.strokeStyle = 'rgba(0,255,136,.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cp.x - 12, cp.y); ctx.lineTo(cp.x + 12, cp.y); ctx.moveTo(cp.x, cp.y - 12); ctx.lineTo(cp.x, cp.y + 12); ctx.stroke();
      ctx.fillStyle = 'rgba(0,255,136,.15)'; ctx.beginPath(); ctx.arc(cp.x, cp.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Hexagon nodes
    this.editorNodes.forEach(n => {
      const isSel = n.id === this.selectedNodeId;
      if (!n.start) return;
      const lp = this.project(n.start);
      if (lp.x < -40 || lp.x > this.width + 40 || lp.y < -40 || lp.y > this.height + 40) return;
      this._drawHexagonNode(ctx, lp.x, lp.y, n.id, n.type, false, false, false, false, isSel, null);

      // End point for TRAY
      if (n.type === 'TRAY' && n.end) {
        const ep = this.project(n.end);
        ctx.fillStyle = isSel ? '#e8c08a' : '#6f6a5d';
        ctx.beginPath(); ctx.arc(ep.x, ep.y, isSel ? 5 : 3, 0, Math.PI * 2); ctx.fill();
        if (isSel) { ctx.strokeStyle = '#f4f1eb'; ctx.lineWidth = 2; ctx.stroke(); }
      }
    });

    // Junction diamonds for editor
    this._calculateJunctions();
    this.junctionPoints.forEach(jp => {
      const p = this.project(jp);
      if (p.x < -30 || p.x > this.width + 30 || p.y < -30 || p.y > this.height + 30) return;
      this._drawDiamond(ctx, p.x, p.y, 5, '#d4a574', 'rgba(42,39,34,.7)', null);
    });
  }

  // ═══ CROSS-SECTION OVERLAY ═══
  // Draws cable cross-section visualization when a tray node is clicked
  _drawCrossSectionOverlay(ctx) {
    const data = this.crossSectionData;
    if (!data || !data.cables || data.cables.length === 0) return;

    const panelW = 260, panelH = 220;
    const px = this.width - panelW - 20, py = 20;

    ctx.save();
    // Panel background
    ctx.fillStyle = 'rgba(30,28,22,.92)';
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) ctx.roundRect(px, py, panelW, panelH, 6);
    else ctx.rect(px, py, panelW, panelH);
    ctx.fill(); ctx.stroke();

    // Title
    ctx.font = '800 11px "JetBrains Mono",monospace';
    ctx.fillStyle = '#d4a574';
    ctx.textAlign = 'left';
    ctx.fillText(`TRAY SECTION: ${this.crossSectionNodeId || ''}`, px + 12, py + 20);

    // Tray outline
    const trayW = panelW - 40;
    const trayH = 120;
    const trayX = px + 20, trayY = py + 35;
    ctx.strokeStyle = '#6f6a5d';
    ctx.lineWidth = 2;
    ctx.strokeRect(trayX, trayY, trayW, trayH);

    // Draw cables as circles
    const cables = data.cables.slice(0, 60); // max 60 visible
    const maxR = 8, minR = 2;
    let cx = trayX + 5, cy = trayY + trayH - 5, rowH = 0;

    cables.forEach((cable, i) => {
      const r = Math.max(minR, Math.min(maxR, (cable.od || 10) / 5));
      if (cx + r * 2 > trayX + trayW - 3) {
        cx = trayX + 5;
        cy -= rowH + 2;
        rowH = 0;
      }
      if (cy - r * 2 < trayY + 5) return; // overflow

      const cColor = cable.type?.includes('POWER') ? '#ef4444' :
        cable.type?.includes('SIGNAL') ? '#3b82f6' :
        cable.type?.includes('DATA') ? '#22c55e' : '#8a8478';

      ctx.beginPath();
      ctx.arc(cx + r, cy - r, r, 0, Math.PI * 2);
      ctx.fillStyle = cColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      cx += r * 2 + 1.5;
      rowH = Math.max(rowH, r * 2);
    });

    // Fill info
    const fillRatio = Math.round((data.fillRatio || 0) * 100);
    ctx.font = '700 10px "JetBrains Mono",monospace';
    ctx.fillStyle = fillRatio > 80 ? '#ef4444' : fillRatio > 60 ? '#f59e0b' : '#22c55e';
    ctx.textAlign = 'left';
    ctx.fillText(`Fill: ${fillRatio}%  |  ${cables.length} cables  |  W${data.width || '?'}  L${data.tier || '?'}`, px + 12, py + panelH - 12);

    ctx.restore();
  }

  _drawEditorGrid(ctx) {
    ctx.save();
    const g = this.editorGridSize, range = g * 30, y = this.editorElevation;
    ctx.strokeStyle = 'rgba(212,165,116,.18)'; ctx.lineWidth = .5;
    for (let x = -range; x <= range; x += g) {
      const p1 = this.project({ x: this.bounds.centerX + x, y, z: this.bounds.centerZ - range });
      const p2 = this.project({ x: this.bounds.centerX + x, y, z: this.bounds.centerZ + range });
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    for (let z = -range; z <= range; z += g) {
      const p1 = this.project({ x: this.bounds.centerX - range, y, z: this.bounds.centerZ + z });
      const p2 = this.project({ x: this.bounds.centerX + range, y, z: this.bounds.centerZ + z });
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    const o = this.project({ x: this.bounds.centerX, y, z: this.bounds.centerZ });
    const xEnd = this.project({ x: this.bounds.centerX + range * .7, y, z: this.bounds.centerZ });
    const zEnd = this.project({ x: this.bounds.centerX, y, z: this.bounds.centerZ + range * .7 });
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(xEnd.x, xEnd.y); ctx.stroke();
    ctx.strokeStyle = '#3b82f6'; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(zEnd.x, zEnd.y); ctx.stroke();
    ctx.font = '600 10px JetBrains Mono'; ctx.fillStyle = '#ef4444'; ctx.fillText('X', xEnd.x + 5, xEnd.y); ctx.fillStyle = '#3b82f6'; ctx.fillText('Z', zEnd.x + 5, zEnd.y);
    ctx.restore();
  }

  _drawGrid3D(ctx) {
    ctx.save(); ctx.strokeStyle = 'rgba(212,165,116,.12)'; ctx.lineWidth = .5;
    const gs = 5000, st = 1000, y = this.bounds.centerY;
    for (let x = -gs; x <= gs; x += st) { const p1 = this.project({ x: this.bounds.centerX + x, y, z: this.bounds.centerZ - gs }), p2 = this.project({ x: this.bounds.centerX + x, y, z: this.bounds.centerZ + gs }); ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); }
    for (let z = -gs; z <= gs; z += st) { const p1 = this.project({ x: this.bounds.centerX - gs, y, z: this.bounds.centerZ + z }), p2 = this.project({ x: this.bounds.centerX + gs, y, z: this.bounds.centerZ + z }); ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); }
    ctx.restore();
  }

  _drawDxf(ctx) {
    ctx.save(); ctx.globalAlpha = this.dxfOpacity;
    const flatY = this.dxfElevation != null ? this.dxfElevation : (this.editorMode && this.dxfFlattenToEditor ? this.editorElevation : null);
    this.dxfLines.forEach(l => {
      const a = flatY != null ? { x: l.start.x, y: flatY, z: l.start.z } : l.start;
      const b = flatY != null ? { x: l.end.x, y: flatY, z: l.end.z } : l.end;
      const p1 = this.project(a), p2 = this.project(b);
      ctx.strokeStyle = l.color || '#d4a574'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    });
    ctx.restore();
  }
}
