/* ═══════════════════════════════════════════
   App — Main Controller (Enhanced V2)
   Viewer + Editor unified
   ★ Fill data integration (tray cable cross-section)
   ★ Hexagon node + Diamond junction rendering
   ★ Enhanced postMessage bridge for NODE LIST / FILL sync
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── State ───
  let nodes = [], graph = null, startNode = '', endNode = '', currentPath = [], currentEdgeWeights = [], fireEnabled = false;
  let appMode = 'viewer'; // 'viewer' | 'editor'

  // ─── DOM ───
  const canvas = document.getElementById('main-canvas');
  const renderer = new Renderer3D(canvas);
  const editor = new NodeEditor(renderer);

  const fileInput = document.getElementById('file-input');
  const loadingOverlay = document.getElementById('loading');
  const emptyState = document.getElementById('empty-state');
  const tooltip = document.getElementById('tooltip');
  const inputStart = document.getElementById('input-start');
  const inputEnd = document.getElementById('input-end');
  const inputSearch = document.getElementById('input-search');
  const datalistNodes = document.getElementById('datalist-nodes');
  const searchResults = document.getElementById('search-results');
  const btnFindPath = document.getElementById('btn-find-path');
  const btnClearPath = document.getElementById('btn-clear-path');
  const btnLabels = document.getElementById('btn-labels');
  const btnResetView = document.getElementById('btn-reset-view');
  const btnFire = document.getElementById('btn-fire');
  const pathResult = document.getElementById('path-result');
  const pathInfo = document.getElementById('path-info');
  const pathList = document.getElementById('path-list');
  const statTotal = document.getElementById('stat-total');
  const statTrays = document.getElementById('stat-trays');
  const statHoles = document.getElementById('stat-holes');
  const statEdges = document.getElementById('stat-edges');
  const sidebarViewer = document.getElementById('sidebar-viewer');
  const sidebarEditor = document.getElementById('sidebar-editor');
  const editorHud = document.getElementById('editor-hud');
  const legend = document.getElementById('legend');

  // ─── Language ───
  document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => setLanguage(b.dataset.lang)));
  setLanguage('ko');

  // ─── Mode Switching ───
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      appMode = tab.dataset.mode;
      switchMode(appMode);
    });
  });

  function switchMode(mode) {
    if (mode === 'viewer') {
      sidebarViewer.style.display = 'flex';
      sidebarEditor.style.display = 'none';
      editorHud.style.display = 'none';
      legend.style.display = 'block';
      renderer.editorMode = false;
      emptyState.style.display = nodes.length === 0 ? 'block' : 'none';
      canvas.className = '';
      canvas.style.cursor = 'grab';
    } else {
      sidebarViewer.style.display = 'none';
      sidebarEditor.style.display = 'flex';
      editorHud.style.display = 'block';
      legend.style.display = 'none';
      renderer.editorMode = true;
      emptyState.style.display = 'none';
      editor.setTool(editor.tool);
      if (editor.nodes.length > 0) renderer.calculateBounds();
    }
    renderer.draw();
    if (!renderer.animFrame) renderer.startAnimation();
  }

  // ─── Viewer: File Upload ───
  fileInput.addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    await loadExcelFromBuffer(await f.arrayBuffer(), f.name);
  });
  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      showLoading(true);
      try { const r = await fetch(btn.dataset.url); if (!r.ok) throw new Error(`HTTP ${r.status}`); await loadExcelFromBuffer(await r.arrayBuffer(), btn.dataset.url.split('/').pop()); }
      catch (err) { alert('Failed: ' + err.message); showLoading(false); }
    });
  });

  async function loadExcelFromBuffer(ab, fn) {
    showLoading(true);
    try {
      await new Promise(r => setTimeout(r, 50));
      const result = ExcelParser.parseWorkbook(ab);
      nodes = result.nodes;
      statTotal.textContent = result.stats.total.toLocaleString();
      statTrays.textContent = result.stats.trays.toLocaleString();
      statHoles.textContent = result.stats.holes.toLocaleString();
      statEdges.textContent = result.stats.edges.toLocaleString();
      graph = new CableGraph(nodes);
      renderer.setNodes(nodes);
      populateDatalist(nodes);
      clearPath();
      emptyState.style.display = 'none';
      renderer.draw();
      renderer.startAnimation();
    } catch (err) { console.error(err); alert('오류: ' + err.message); }
    showLoading(false);
  }

  function populateDatalist(nl) {
    datalistNodes.innerHTML = '';
    const f = document.createDocumentFragment();
    nl.slice(0, 2000).forEach(n => { const o = document.createElement('option'); o.value = n.id; f.appendChild(o); });
    datalistNodes.appendChild(f);
  }
  function showLoading(s) { loadingOverlay.style.display = s ? 'flex' : 'none'; }

  // ─── Viewer: Path Finding ───
  function updateFindBtn() { btnFindPath.disabled = !startNode || !endNode; }
  inputStart.addEventListener('input', () => { startNode = inputStart.value.trim(); inputStart.className = startNode ? 'has-start' : ''; renderer.setStartEnd(startNode, endNode); renderer.draw(); updateFindBtn(); });
  inputEnd.addEventListener('input', () => { endNode = inputEnd.value.trim(); inputEnd.className = endNode ? 'has-end' : ''; renderer.setStartEnd(startNode, endNode); renderer.draw(); updateFindBtn(); });
  document.querySelectorAll('.clear-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = document.getElementById(btn.dataset.target);
      if (t === inputStart) { startNode = ''; inputStart.value = ''; inputStart.className = ''; } else { endNode = ''; inputEnd.value = ''; inputEnd.className = ''; }
      renderer.setStartEnd(startNode, endNode); renderer.draw(); updateFindBtn();
    });
  });
  btnFindPath.addEventListener('click', findPathAction);
  function findPathAction() {
    if (!graph || !startNode || !endNode) return;
    const result = graph.findPath(startNode, endNode);
    if (result.path.length === 0) { alert(t('msg-no-path') + '\n\n' + t('msg-no-path-detail')); return; }
    currentPath = result.path; currentEdgeWeights = result.edgeWeights;
    renderer.setPath(currentPath); renderer.setStartEnd(startNode, endNode);
    pathResult.style.display = 'block';
    pathInfo.innerHTML = `${t('msg-path-found')} — ${currentPath.length}${t('msg-nodes')} (${t('msg-length')}: ${result.totalLength.toFixed(1)}m)`;
    pathList.innerHTML = ''; let acc = 0;
    currentPath.forEach((node, idx) => {
      const isF = idx === 0, isL = idx === currentPath.length - 1;
      const div = document.createElement('div');
      div.className = 'path-item' + (isF ? ' start' : isL ? ' end' : '');
      div.style.animationDelay = `${idx * .08}s`; div.classList.add('fire-in');
      const ew = idx > 0 ? currentEdgeWeights[idx - 1] : 0; acc += ew;
      const nr = document.createElement('div'); nr.className = 'path-item-name';
      const ix = document.createElement('span'); ix.className = 'path-idx'; ix.textContent = idx + 1;
      const nm = document.createElement('span'); nm.className = 'path-node-id'; nm.textContent = node.id;
      const tp = document.createElement('span'); tp.className = 'path-node-type'; tp.textContent = node.type;
      nr.append(ix, nm, tp); div.appendChild(nr);
      if (idx > 0) {
        const lr = document.createElement('div'); lr.className = 'path-item-length';
        const sg = document.createElement('span'); sg.className = 'path-seg-len'; sg.innerHTML = `<i class="fas fa-arrow-right"></i> ${ew.toFixed(1)}m`;
        const ac = document.createElement('span'); ac.className = 'path-acc-len'; ac.innerHTML = `<i class="fas fa-road"></i> ${acc.toFixed(1)}m`;
        lr.append(sg, ac); div.appendChild(lr);
      } else { const b = document.createElement('div'); b.className = 'path-item-badge start-badge'; b.innerHTML = '<i class="fas fa-play"></i> START'; div.appendChild(b); }
      if (isL) { const b = document.createElement('div'); b.className = 'path-item-badge end-badge'; b.innerHTML = `<i class="fas fa-flag-checkered"></i> FINISH — ${result.totalLength.toFixed(1)}m`; div.appendChild(b); }
      div.addEventListener('click', () => { if (startNode !== node.id && endNode !== node.id) setStartNode(node.id); });
      pathList.appendChild(div);
      if (!isL) { const a = document.createElement('div'); a.className = 'path-arrow fire-in'; a.style.animationDelay = `${(idx + .5) * .08}s`; a.innerHTML = '<i class="fas fa-chevron-down"></i>'; pathList.appendChild(a); }
    });
    btnClearPath.style.display = 'block';
    if (fireEnabled) renderer.setFireEnabled(true);
    renderer.draw();
  }
  btnClearPath.addEventListener('click', clearPath);
  function clearPath() { currentPath = []; currentEdgeWeights = []; renderer.setPath([]); renderer.setFireEnabled(false); pathResult.style.display = 'none'; btnClearPath.style.display = 'none'; fireEnabled = false; btnFire.classList.remove('active'); renderer.draw(); }
  btnFire.addEventListener('click', () => { fireEnabled = !fireEnabled; btnFire.classList.toggle('active', fireEnabled); renderer.setFireEnabled(fireEnabled); if (!renderer.animFrame) renderer.startAnimation(); });
  btnLabels.addEventListener('click', () => { renderer.showLabels = !renderer.showLabels; btnLabels.classList.toggle('active', renderer.showLabels); renderer.draw(); });
  btnResetView.addEventListener('click', () => { renderer.resetView(); document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active')); document.querySelector('[data-view="iso"]')?.classList.add('active'); renderer.draw(); });
  document.querySelectorAll('.view-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderer.setView(btn.dataset.view); renderer.draw(); }); });
  inputSearch.addEventListener('input', () => {
    const q = inputSearch.value.trim().toLowerCase(); searchResults.innerHTML = '';
    if (!q || nodes.length === 0) return;
    nodes.filter(n => n.id.toLowerCase().includes(q)).slice(0, 80).forEach(n => {
      const d = document.createElement('div'); d.className = 'search-item' + (n.type === 'HOLE' ? ' type-hole' : ''); d.textContent = n.id;
      d.addEventListener('click', () => selectNode(n.id)); searchResults.appendChild(d);
    });
  });
  function selectNode(nid) { if (!startNode) setStartNode(nid); else if (!endNode && nid !== startNode) setEndNode(nid); else { setStartNode(nid); setEndNode(''); clearPath(); } }
  function setStartNode(id) { startNode = id; inputStart.value = id; inputStart.className = id ? 'has-start' : ''; renderer.setStartEnd(startNode, endNode); renderer.draw(); updateFindBtn(); }
  function setEndNode(id) { endNode = id; inputEnd.value = id; inputEnd.className = id ? 'has-end' : ''; renderer.setStartEnd(startNode, endNode); renderer.draw(); updateFindBtn(); }

  // ═══════════════════════════════════════════
  // EDITOR UI BINDINGS
  // ═══════════════════════════════════════════
  const edDeckCode = document.getElementById('ed-deck-code');
  const edStartNum = document.getElementById('ed-start-num');
  const edNumDigits = document.getElementById('ed-num-digits');
  const edComponent = document.getElementById('ed-component');
  const edGridSize = document.getElementById('ed-grid-size');
  const edElevation = document.getElementById('ed-elevation');

  edDeckCode?.addEventListener('input', () => { editor.deckCode = edDeckCode.value || 'EC'; editor._detectNextNum(); editor._updateNextUI(); });
  edStartNum?.addEventListener('input', () => { editor.startNum = parseInt(edStartNum.value) || 1; if (editor.nextNum < editor.startNum) editor.nextNum = editor.startNum; editor._updateNextUI(); });
  edNumDigits?.addEventListener('change', () => { editor.numDigits = parseInt(edNumDigits.value) || 3; editor._updateNextUI(); });
  edComponent?.addEventListener('input', () => { editor.component = edComponent.value; });
  document.querySelectorAll('.type-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); editor.nodeType = btn.dataset.type; }); });
  document.querySelectorAll('.tool-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); editor.setTool(btn.dataset.tool); }); });
  edGridSize?.addEventListener('input', () => { renderer.editorGridSize = parseInt(edGridSize.value) || 500; });
  document.getElementById('ed-snap-toggle')?.addEventListener('click', function () { renderer.editorSnap = !renderer.editorSnap; this.classList.toggle('active', renderer.editorSnap); });
  document.getElementById('ed-grid-toggle')?.addEventListener('click', function () { renderer.editorGrid = !renderer.editorGrid; this.classList.toggle('active', renderer.editorGrid); renderer.draw(); });
  edElevation?.addEventListener('input', () => {
    const v = parseFloat(edElevation.value) || 0;
    renderer.editorElevation = v;
    document.getElementById('hud-elev').textContent = v;
    document.querySelectorAll('.elev-btn').forEach(b => b.classList.toggle('active', parseFloat(b.dataset.elev) === v));
    renderer.draw();
  });
  document.querySelectorAll('.elev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = parseFloat(btn.dataset.elev);
      edElevation.value = v; renderer.editorElevation = v;
      document.getElementById('hud-elev').textContent = v;
      document.querySelectorAll('.elev-btn').forEach(b => b.classList.toggle('active', parseFloat(b.dataset.elev) === v));
      renderer.draw();
    });
  });

  // DXF Import
  document.getElementById('dxf-file-input')?.addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    let text;
    try { text = await f.text(); } catch (err) { alert('DXF 파일을 읽지 못했습니다: ' + err.message); return; }
    let lines;
    try { lines = DxfIO.parse(text); } catch (err) { alert('DXF 파싱 실패: ' + err.message); return; }
    if (!Array.isArray(lines) || lines.length === 0) {
      alert('DXF에서 유효한 엔티티를 찾지 못했습니다.'); return;
    }
    const defaultZ = renderer.editorElevation ?? 3000;
    const ans = window.prompt('DXF 도면을 어느 레벨(Z, mm)에 배치할까요?', String(defaultZ));
    if (ans === null) return;
    const z = parseFloat(ans);
    renderer.dxfLines = lines;
    if (Number.isFinite(z) && z !== 0) {
      renderer.dxfElevation = z;
      renderer.dxfFlattenToEditor = false;
    } else {
      renderer.dxfElevation = null;
      renderer.dxfFlattenToEditor = true;
    }
    const dxfCtrl = document.getElementById('dxf-controls');
    if (dxfCtrl) dxfCtrl.style.display = 'block';
    renderer.calculateBounds();
    renderer.resetView();
    renderer.draw();
    e.target.value = '';
  });
  document.getElementById('dxf-visible-toggle')?.addEventListener('click', function () { renderer.dxfVisible = !renderer.dxfVisible; this.classList.toggle('active', renderer.dxfVisible); renderer.draw(); });
  document.getElementById('dxf-opacity')?.addEventListener('input', function () { renderer.dxfOpacity = parseFloat(this.value); renderer.draw(); });

  // Export
  document.getElementById('btn-export-xlsx')?.addEventListener('click', () => {
    if (editor.nodes.length === 0) { alert('내보낼 노드가 없습니다.'); return; }
    const buf = DxfIO.exportExcel(editor.nodes, editor.edges);
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cable_tray_nodes.xlsx'; a.click();
  });
  document.getElementById('btn-export-dxf')?.addEventListener('click', () => {
    if (editor.nodes.length === 0) { alert('내보낼 노드가 없습니다.'); return; }
    const dxf = DxfIO.exportDxf(editor.nodes, editor.edges);
    const blob = new Blob([dxf], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cable_tray.dxf'; a.click();
  });
  document.getElementById('btn-send-viewer')?.addEventListener('click', () => {
    if (editor.nodes.length === 0) { alert('전송할 노드가 없습니다.'); return; }
    nodes = editor.nodes.map(n => ({ ...n, start: n.start ? { ...n.start } : null, end: n.end ? { ...n.end } : null, relations: [...n.relations] }));
    graph = new CableGraph(nodes);
    renderer.setNodes(nodes);
    populateDatalist(nodes);
    const stats = { total: nodes.length, trays: nodes.filter(n => n.type === 'TRAY').length, holes: nodes.filter(n => n.type === 'HOLE').length, edges: editor.edges.length * 2 };
    statTotal.textContent = stats.total; statTrays.textContent = stats.trays; statHoles.textContent = stats.holes; statEdges.textContent = stats.edges;
    document.querySelector('[data-mode="viewer"]').click();
    alert(`✅ ${nodes.length}개 노드가 Viewer로 전송되었습니다.`);
  });

  // Import to editor
  document.getElementById('ed-file-input')?.addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const ab = await f.arrayBuffer();
    const result = ExcelParser.parseWorkbook(ab);
    editor.importNodes(result.nodes);
    renderer.calculateBounds(); renderer.draw();
  });
  document.getElementById('btn-import-viewer')?.addEventListener('click', () => {
    if (nodes.length === 0) { alert('Viewer에 데이터가 없습니다.'); return; }
    editor.importNodes(nodes);
    renderer.calculateBounds(); renderer.draw();
  });
  document.getElementById('btn-clear-editor')?.addEventListener('click', () => {
    if (editor.nodes.length > 0 && !confirm('에디터의 모든 데이터를 삭제하시겠습니까?')) return;
    editor.clear(); renderer.calculateBounds(); renderer.draw();
  });

  // ═══════════════════════════════════════════
  // CANVAS INTERACTION
  // ═══════════════════════════════════════════
  let isDragging = false, dragStart = { x: 0, y: 0 }, dragMode = '';
  let isPanning = false;

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left, cssY = e.clientY - rect.top;

    if (e.button === 1) { e.preventDefault(); isPanning = true; dragStart = { x: e.clientX, y: e.clientY }; canvas.classList.add('grabbing'); return; }

    if (appMode === 'editor' && e.button === 0) {
      const worldPos = renderer.snapToGrid(renderer.unproject(cssX, cssY, renderer.editorElevation));
      if (editor.tool === 'create') {
        const result = editor.createNodeAt(worldPos);
        if (result) { editor.selectedNodeId = result; renderer.selectedNodeId = result; }
        renderer.calculateBounds(); renderer.draw(); return;
      }
      if (editor.tool === 'connect') { const hit = renderer.findEditorNodeAt(cssX, cssY); if (hit) { editor.connectClick(hit.node.id); renderer.draw(); } return; }
      if (editor.tool === 'move') {
        const hit = renderer.findEditorNodeAt(cssX, cssY);
        if (hit) { editor.startMove(hit.node.id, hit.isEnd, worldPos); editor.selectedNodeId = hit.node.id; renderer.selectedNodeId = hit.node.id; return; }
      }
      if (editor.tool === 'delete') { const hit = renderer.findEditorNodeAt(cssX, cssY); if (hit) { editor.deleteNode(hit.node.id); renderer.calculateBounds(); renderer.draw(); } return; }
    }

    // Viewer: click node
    if (appMode === 'viewer' && e.button === 0) {
      const clicked = renderer.findNodeAt(cssX, cssY);
      if (clicked) {
        selectNode(clicked.id);
        
        // Show cross-section on click
        const fillInfo = renderer.fillData.get(clicked.id);
        if (fillInfo && fillInfo.cables && fillInfo.cables.length > 0) {
          renderer.showCrossSection = true;
          renderer.crossSectionNodeId = clicked.id;
          renderer.crossSectionData = fillInfo;
          renderer.draw();
        } else {
          renderer.showCrossSection = false;
          renderer.crossSectionNodeId = null;
          renderer.crossSectionData = null;
        }

        // Notify parent
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'cable-tray-3d:node-clicked', nodeName: clicked.id, ts: Date.now() }, '*');
          }
        } catch (_) {}
        if (e.shiftKey) {
          try { window.parent.postMessage({ type: 'cable-tray-3d:jump-to-fill', nodeName: clicked.id }, '*'); } catch (_) {}
        }
        return;
      } else {
        // Click on empty space → hide cross-section
        renderer.showCrossSection = false;
        renderer.crossSectionNodeId = null;
        renderer.crossSectionData = null;
        renderer.draw();
      }
    }

    if (e.button === 0) { isDragging = true; dragMode = e.shiftKey ? 'pan' : 'rotate'; dragStart = { x: e.clientX, y: e.clientY }; canvas.classList.add('grabbing'); }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left, cssY = e.clientY - rect.top;

    if (isPanning) { renderer.pan.x += e.clientX - dragStart.x; renderer.pan.y += e.clientY - dragStart.y; dragStart = { x: e.clientX, y: e.clientY }; if (!renderer.animFrame) renderer.draw(); return; }

    if (appMode === 'editor') {
      const worldPos = renderer.snapToGrid(renderer.unproject(cssX, cssY, renderer.editorElevation));
      renderer.cursorWorld = worldPos;
      const hud = document.getElementById('hud-pos');
      if (hud) hud.textContent = `${Math.round(worldPos.x)}, ${Math.round(worldPos.z)}`;
      if (editor.tool === 'create' && editor.creatingTray && editor.trayStartPoint) {
        renderer.ghostLine = { from: editor.trayStartPoint, to: worldPos };
        const dr = document.getElementById('hud-drag-row'); const dl = document.getElementById('hud-drag-len');
        if (dr) dr.style.display = 'flex';
        const dx = worldPos.x - editor.trayStartPoint.x, dz = worldPos.z - editor.trayStartPoint.z, dy = worldPos.y - editor.trayStartPoint.y;
        if (dl) dl.textContent = `${(Math.sqrt(dx*dx+dy*dy+dz*dz)/1000).toFixed(2)}m`;
      } else { renderer.ghostLine = null; const dr = document.getElementById('hud-drag-row'); if (dr) dr.style.display = 'none'; }
      if (editor.isDragging) { editor.updateMove(worldPos); }
      if (editor.tool === 'connect' && editor.connectFromId) {
        const fromNode = editor.nodes.find(n => n.id === editor.connectFromId);
        if (fromNode) { const fp = fromNode.end || fromNode.start; renderer.ghostLine = { from: fp, to: worldPos }; }
      }
      if (!renderer.animFrame) renderer.draw(); return;
    }

    // Viewer hover
    if (appMode === 'viewer') {
      const hovered = renderer.findNodeAt(cssX, cssY);
      renderer.hoveredNode = hovered;
      if (hovered) {
        canvas.classList.add('pointer'); canvas.classList.remove('grabbing');
        tooltip.style.display = 'block';
        const fi = renderer.fillData.get(hovered.id);
        const fillStr = fi ? ` · Fill ${Math.round((fi.fillRatio||0)*100)}% (${fi.cableCount||0}C)` : '';
        tooltip.innerHTML = `<span class="tt-id">${hovered.id}</span><span class="tt-type">${hovered.type}${hovered.component ? ' · ' + hovered.component : ''}${fillStr}</span>`;
        tooltip.style.left = (cssX + 14) + 'px'; tooltip.style.top = (cssY - 10) + 'px';
      } else { canvas.classList.remove('pointer'); tooltip.style.display = 'none'; }
    }

    if (!isDragging) { if (!renderer.animFrame) renderer.draw(); return; }
    const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
    dragStart = { x: e.clientX, y: e.clientY };
    if (dragMode === 'pan' || e.shiftKey) { renderer.pan.x += dx; renderer.pan.y += dy; }
    else { renderer.rotation.y += dx * 0.4; renderer.rotation.x += dy * 0.4; }
    if (!renderer.animFrame) renderer.draw();
  });

  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 1) { isPanning = false; canvas.classList.remove('grabbing'); return; }
    isDragging = false; canvas.classList.remove('grabbing');
    if (appMode === 'editor') { if (editor.isDragging) { editor.endMove(); renderer.calculateBounds(); renderer.draw(); } }
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false; isPanning = false; canvas.classList.remove('grabbing');
    tooltip.style.display = 'none'; renderer.hoveredNode = null; renderer.cursorWorld = null;
    if (!renderer.animFrame) renderer.draw();
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); const d = e.deltaY > 0 ? 0.92 : 1.08; renderer.zoom = Math.max(0.02, Math.min(50, renderer.zoom * d)); if (!renderer.animFrame) renderer.draw(); }, { passive: false });

  // Touch
  let lastTouchDist = 0, lastTouchCenter = null;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) { dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; isDragging = true; dragMode = 'rotate'; }
    else if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY; lastTouchDist = Math.hypot(dx, dy); lastTouchCenter = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 }; isDragging = false; }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) { const t = e.touches[0]; const dx = t.clientX - dragStart.x, dy = t.clientY - dragStart.y; dragStart = { x: t.clientX, y: t.clientY }; renderer.rotation.y += dx * 0.4; renderer.rotation.x += dy * 0.4; }
    else if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY; const d = Math.hypot(dx, dy); if (lastTouchDist) renderer.zoom = Math.max(0.02, Math.min(50, renderer.zoom * (d / lastTouchDist))); lastTouchDist = d; const c = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 }; if (lastTouchCenter) { renderer.pan.x += c.x - lastTouchCenter.x; renderer.pan.y += c.y - lastTouchCenter.y; } lastTouchCenter = c; }
    if (!renderer.animFrame) renderer.draw(); e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => { isDragging = false; lastTouchDist = 0; lastTouchCenter = null; });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (appMode === 'editor') {
      switch (e.key.toLowerCase()) {
        case 'n': document.querySelector('[data-tool="create"]')?.click(); break;
        case 'c': document.querySelector('[data-tool="connect"]')?.click(); break;
        case 'm': document.querySelector('[data-tool="move"]')?.click(); break;
        case 'd': document.querySelector('[data-tool="delete"]')?.click(); break;
        case 'escape': editor.creatingTray = false; editor.trayStartPoint = null; editor.connectFromId = null; renderer.ghostLine = null; editor.selectedNodeId = null; renderer.selectedNodeId = null; renderer.draw(); break;
        case 'z': if (e.ctrlKey && editor.nodes.length > 0) { editor.nodes.pop(); editor._syncRenderer(); renderer.calculateBounds(); renderer.draw(); } break;
      }
    } else {
      switch (e.key.toLowerCase()) {
        case 'f': btnFire.click(); break;
        case 'l': btnLabels.click(); break;
        case 'r': btnResetView.click(); break;
        case 'enter': if (startNode && endNode) findPathAction(); break;
        case 'escape': clearPath(); setStartNode(''); setEndNode(''); renderer.showCrossSection = false; renderer.draw(); break;
      }
    }
  });

  window.addEventListener('resize', () => renderer.draw());

  // ═══════════════════════════════════════════
  // SEcMS Bridge — postMessage integration
  // ═══════════════════════════════════════════
  function loadSEcMSNodes(payload) {
    if (!payload || !Array.isArray(payload.nodes)) return;
    const rawNodes = payload.nodes.map((n) => {
      const id = String(n.id || n.name || '').trim();
      if (!id) return null;
      const tr = String(n.type || '').toUpperCase();
      const type = tr.includes('TRAY') ? 'TRAY' : tr.includes('HOLE') ? 'HOLE' : 'OTHER';
      const start = n.start || (n.x != null ? { x: +n.x, y: +n.y || 0, z: +n.z || 0 } : null);
      const end = n.end || null;
      const relations = Array.isArray(n.relations) ? n.relations.filter(Boolean) : String(n.relation || '').split(',').map(s => s.trim()).filter(Boolean);
      return { id, type, start, end, relations, length: +n.length || +n.linkLength || 0, area: +n.area || +n.areaSize || 0, component: String(n.component || ''), maxCable: +n.maxCable || 100 };
    }).filter(Boolean);

    if (rawNodes.length === 0) return;

    // Auto-layout for coordinate-less nodes
    const haveCoord = rawNodes.filter(n => n.start);
    const noCoord = rawNodes.filter(n => !n.start);
    if (noCoord.length > 0) {
      const idMap = new Map(rawNodes.map(n => [n.id, n]));
      const placed = new Map();
      const queue = [];
      haveCoord.forEach(n => placed.set(n.id, n.start));
      const STEP = 600;
      if (noCoord.length > 0) {
        const sn = noCoord[0];
        placed.set(sn.id, { x: 0, y: 0, z: 0 });
        queue.push({ id: sn.id, depth: 0 });
      }
      const visited = new Set(queue.map(q => q.id));
      while (queue.length > 0) {
        const { id: cur, depth } = queue.shift();
        const curPos = placed.get(cur);
        const node = idMap.get(cur);
        if (!node) continue;
        let angleStep = (Math.PI * 2) / Math.max(1, node.relations.length);
        node.relations.forEach((rel, i) => {
          if (visited.has(rel)) return;
          if (!idMap.has(rel)) return;
          visited.add(rel);
          if (placed.has(rel)) { queue.push({ id: rel, depth: depth + 1 }); return; }
          const angle = i * angleStep;
          placed.set(rel, { x: curPos.x + Math.cos(angle) * STEP * (depth + 1), y: curPos.y + Math.sin(angle) * STEP * (depth + 1), z: depth * 200 });
          queue.push({ id: rel, depth: depth + 1 });
        });
      }
      let unplacedIdx = 0;
      noCoord.forEach(n => {
        if (!placed.has(n.id)) {
          placed.set(n.id, { x: -10000 + (unplacedIdx % 20) * STEP, y: -10000 + Math.floor(unplacedIdx / 20) * STEP, z: 0 });
          unplacedIdx++;
        }
      });
      rawNodes.forEach(n => { if (!n.start) n.start = placed.get(n.id) || { x: 0, y: 0, z: 0 }; });
    }

    nodes = rawNodes;
    graph = new CableGraph(nodes);
    renderer.setNodes(nodes);
    populateDatalist(nodes);
    statTotal.textContent = nodes.length.toLocaleString();
    statTrays.textContent = nodes.filter(n => n.type === 'TRAY').length.toLocaleString();
    statHoles.textContent = nodes.filter(n => n.type === 'HOLE').length.toLocaleString();
    let edgeCount = 0;
    const ns = new Set(nodes.map(n => n.id));
    nodes.forEach(n => n.relations.forEach(r => { if (ns.has(r)) edgeCount++; }));
    statEdges.textContent = edgeCount.toLocaleString();
    clearPath();
    emptyState.style.display = 'none';

    // Hide upload UI, show project badge
    try {
      const uploadPanel = document.querySelector('#sidebar-viewer .sidebar-content > .panel');
      if (uploadPanel) uploadPanel.style.display = 'none';
      const badge = document.getElementById('scms-project-badge');
      if (badge) badge.style.display = '';
    } catch (err) {}

    renderer.draw();
    if (!renderer.animFrame) renderer.startAnimation();
    console.log('[Bridge] Loaded', nodes.length, 'nodes from SEcMS parent');
  }

  // Fill data handler
  function handleFillData(data) {
    renderer.setFillData(data);
    renderer.draw();
    console.log('[Bridge] Fill data updated for', Object.keys(data).length, 'nodes');
  }

  // API
  window.__cableTray3D = {
    loadSEcMSNodes,
    loadScmsNodes: loadSEcMSNodes,
    handleFillData,
    getNodes: () => nodes,
    getRenderer: () => renderer,
    getEditor: () => editor,
    findPath: (s, e) => (graph ? graph.findPath(s, e) : null),
  };

  // postMessage listener
  window.addEventListener('message', (e) => {
    if (!e || !e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'cable-tray-3d:set-nodes') {
      loadSEcMSNodes(e.data.payload);
    } else if (e.data.type === 'cable-tray-3d:set-fill-data') {
      handleFillData(e.data.payload);
    } else if (e.data.type === 'cable-tray-3d:request-export') {
      try {
        const exportNodes = (editor.nodes || []).map(n => ({
          id: n.id, type: n.type, component: n.component || '',
          relations: [...(n.relations || [])],
          start: n.start ? { ...n.start } : null,
          end: n.end ? { ...n.end } : null,
          length: n.length || 0,
        }));
        window.parent?.postMessage({ type: 'cable-tray-3d:export', nodes: exportNodes, sentAt: Date.now() }, '*');
      } catch (err) { console.warn('[Bridge] export failed', err); }
    }
  });

  try { window.parent?.postMessage({ type: 'cable-tray-3d:ready', sentAt: Date.now() }, '*'); } catch (e) {}

  // ─── Init ───
  renderer.resize();
  renderer.draw();
  renderer.startAnimation();
  editor._updateNextUI();
  console.log('[App] Cable Tray 3D V2 — Hexagon Node + Diamond Junction initialized');
})();
