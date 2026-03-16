  function getActiveTab() {
    return dom.tabButtons.find((button) => button.classList.contains('is-active'))?.dataset.tab || 'dashboard';
  }

  function syncSelectedNode() {
    const names = state.mergedNodes.map((node) => node.name).filter(Boolean);
    if (!names.length) {
      state.selectedNodeName = '';
      return;
    }
    if (!names.includes(state.selectedNodeName)) {
      state.selectedNodeName = names.find((name) => state.graph.nodeMap[name]?.hasCoords) || names[0];
    }
  }

  function handleNodeListClick(event) {
    const row = event.target.closest('[data-node-name]');
    if (!row) return;
    selectNode(row.dataset.nodeName);
  }

  function handleNodeListDoubleClick(event) {
    const row = event.target.closest('[data-node-name]');
    if (!row) return;
    selectNode(row.dataset.nodeName, { activateTab: true, scrollMap: true });
  }

  function selectNode(name, options = {}) {
    if (!trimText(name)) return;
    state.selectedNodeName = trimText(name);
    if (options.activateTab) {
      setActiveTab('nodes');
    } else {
      renderNodesPanel();
    }
    if (options.scrollMap && dom.nodeThreeContainer) {
      dom.nodeThreeContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function refreshNodeAnalytics() {
    syncSelectedNode();
    const metricMap = Object.create(null);

    state.mergedNodes.forEach((node) => {
      metricMap[node.name] = {
        name: node.name,
        structure: node.structure || '',
        component: node.component || '',
        type: node.type || '',
        hasCoords: Boolean(node.hasCoords),
        x: node.x,
        y: node.y,
        z: node.z,
        pointRaw: node.pointRaw || '',
        relationNames: unique((node.relations || []).filter(Boolean)),
        relationCount: (node.relations || []).filter(Boolean).length,
        systems: new Set(),
        types: new Set(),
        decks: new Set(),
        cables: [],
        cableCount: 0,
        totalOutDia: 0,
        totalCalculatedLength: 0,
        segmentTouches: 0
      };
    });

    state.cables.forEach((cable) => {
      const route = cable.routeBreakdown;
      if (!route?.pathNodes?.length) return;

      const uniqueNodes = unique(route.pathNodes.filter(Boolean));
      const deck = trimText(resolveCableDeck(cable)) || 'UNASSIGNED';
      const outDia = Math.max(0, toNumber(cable.outDia, 0));
      const totalLength = round2(cable.calculatedLength || route.totalLength || 0);

      uniqueNodes.forEach((name) => {
        const metric = metricMap[name];
        if (!metric) return;
        metric.cableCount += 1;
        metric.totalOutDia = round2(metric.totalOutDia + outDia);
        metric.totalCalculatedLength = round2(metric.totalCalculatedLength + totalLength);
        if (trimText(cable.system)) metric.systems.add(trimText(cable.system));
        if (trimText(cable.type)) metric.types.add(trimText(cable.type));
        if (deck) metric.decks.add(deck);
        metric.cables.push({
          name: cable.name,
          system: trimText(cable.system) || 'UNASSIGNED',
          type: trimText(cable.type) || 'UNASSIGNED',
          deck,
          outDia,
          totalLength,
          status: cable.validation?.status || 'PENDING'
        });
      });

      route.pathNodes.forEach((name, index) => {
        const metric = metricMap[name];
        if (!metric) return;
        if (index > 0) metric.segmentTouches += 1;
        if (index < route.pathNodes.length - 1) metric.segmentTouches += 1;
      });
    });

    const metrics = Object.values(metricMap).map((metric) => {
      const tray = calculateNodeTrayWidth(metric.totalOutDia);
      const systems = Array.from(metric.systems).sort();
      const types = Array.from(metric.types).sort();
      const decks = Array.from(metric.decks).sort();
      const cables = metric.cables
        .sort((left, right) => right.outDia - left.outDia || right.totalLength - left.totalLength || left.name.localeCompare(right.name));
      return {
        ...metric,
        systems,
        types,
        decks,
        systemsLabel: systems.length ? systems.join(', ') : 'UNASSIGNED',
        typesLabel: types.length ? types.join(', ') : 'UNASSIGNED',
        decksLabel: decks.length ? decks.join(', ') : 'UNASSIGNED',
        primaryDeck: decks[0] || 'UNASSIGNED',
        cables,
        ...tray
      };
    });

    state.nodeMetrics = metrics;
    state.nodeMetricMap = Object.fromEntries(metrics.map((metric) => [metric.name, metric]));

    if (!state.nodeMetricMap[state.selectedNodeName]) {
      state.selectedNodeName = metrics[0]?.name || '';
    }
  }

  function calculateNodeTrayWidth(totalOutDia) {
    const occupiedWidth = round2(Math.max(0, totalOutDia));
    const designWidth = round2(occupiedWidth * 1.15);
    const recommendedTrayWidth = pickTrayStandardWidth(designWidth);
    const fillRatio = recommendedTrayWidth > 0 ? round2((designWidth / recommendedTrayWidth) * 100) : 0;
    return {
      occupiedWidth,
      designWidth,
      recommendedTrayWidth,
      fillRatio
    };
  }

  function pickTrayStandardWidth(width) {
    if (width <= 0) return 0;
    const standards = [50, 100, 150, 200, 300, 450, 600, 750, 900, 1050, 1200];
    const standard = standards.find((value) => value >= width);
    return standard || Math.ceil(width / 50) * 50;
  }

  function getFilteredNodeMetrics() {
    const search = trimText(dom.nodeSearch?.value).toLowerCase();
    const sort = dom.nodeSort?.value || 'trayDesc';
    const filtered = state.nodeMetrics.filter((metric) => {
      if (!search) return true;
      return [
        metric.name,
        metric.structure,
        metric.component,
        metric.type,
        metric.systemsLabel,
        metric.decksLabel,
        metric.typesLabel
      ].join(' ').toLowerCase().includes(search);
    });

    const sorted = filtered.slice().sort((left, right) => {
      if (sort === 'cableDesc') {
        return right.cableCount - left.cableCount || right.recommendedTrayWidth - left.recommendedTrayWidth || left.name.localeCompare(right.name);
      }
      if (sort === 'nameAsc') {
        return left.name.localeCompare(right.name);
      }
      if (sort === 'relationDesc') {
        return right.relationCount - left.relationCount || right.cableCount - left.cableCount || left.name.localeCompare(right.name);
      }
      return right.recommendedTrayWidth - left.recommendedTrayWidth || right.cableCount - left.cableCount || left.name.localeCompare(right.name);
    });

    return sorted;
  }

  function renderNodesPanel() {
    if (!dom.nodeList) return;

    refreshNodeAnalytics();
    const metrics = getFilteredNodeMetrics();
    const visibleNames = new Set(metrics.map((metric) => metric.name));
    if (metrics.length && !visibleNames.has(state.selectedNodeName)) {
      state.selectedNodeName = metrics[0].name;
    }
    const focusMetric = state.nodeMetricMap[state.selectedNodeName] || metrics[0] || null;

    const coordReadyCount = metrics.filter((metric) => metric.hasCoords).length;
    const totalTrayDemand = metrics.reduce((sum, metric) => sum + metric.recommendedTrayWidth, 0);
    const routedCableCount = state.cables.filter((cable) => cable.routeBreakdown?.pathNodes?.length).length;

    dom.nodeListCount.textContent = `${formatInt(metrics.length)} / ${formatInt(state.nodeMetrics.length)}`;
    dom.nodeVisibleCount.textContent = formatInt(metrics.length);
    dom.nodeCoordReadyCount.textContent = formatInt(coordReadyCount);
    dom.nodeTrayDemand.textContent = formatNumber(totalTrayDemand);
    dom.nodeFocusedName.textContent = focusMetric?.name || '-';
    dom.nodeAutoMeta.textContent = `Tray width = next standard >= sum(CABLE_OUTDIA) x 1.15. Routed cables ${formatInt(routedCableCount)} / ${formatInt(state.cables.length)} are reflected.`;

    if (!metrics.length) {
      dom.nodeList.innerHTML = '<div class="empty-state node-list-empty">?쒖떆???몃뱶媛 ?놁뒿?덈떎.</div>';
    } else {
      dom.nodeList.innerHTML = metrics.map((metric) => `
        <div class="node-list-row${metric.name === state.selectedNodeName ? ' is-selected' : ''}" data-node-name="${escapeHtml(metric.name)}" title="?붾툝?대┃?섎㈃ 3D 留듭뿉???ъ빱?ㅻ맗?덈떎.">
          <div class="node-list-main">
            <div class="node-list-title">${escapeHtml(metric.name)}</div>
            <div class="node-list-subtitle">${escapeHtml([metric.structure || '-', metric.component || '-', metric.primaryDeck].join(' | '))}</div>
          </div>
          <div class="node-list-metric">
            <span>TRAY</span>
            <strong>${formatInt(metric.recommendedTrayWidth)}</strong>
          </div>
          <div class="node-list-metric">
            <span>CABLES</span>
            <strong>${formatInt(metric.cableCount)}</strong>
          </div>
          <div class="node-list-metric">
            <span>REL</span>
            <strong>${formatInt(metric.relationCount)}</strong>
          </div>
          <div class="node-list-metric">
            <span>MAP</span>
            <strong>${metric.hasCoords ? 'READY' : 'MISS'}</strong>
          </div>
        </div>
      `).join('');
    }

    if (!focusMetric) {
      dom.nodeDetailTitle.textContent = 'Select a node.';
      dom.nodeDetailMeta.textContent = 'Double-click a node in the list to focus it in the 3D map.';
      dom.nodeDetailTrayWidth.textContent = '0';
      dom.nodeDetailCableCount.textContent = '0';
      dom.nodeDetailRelationCount.textContent = '0';
      dom.nodeDetailCoordStatus.textContent = 'LOCKED';
      dom.nodeSummaryList.innerHTML = renderIssueItem('warn', 'No node summary is available.');
      dom.nodeTrayRule.textContent = 'Tray width rule is unavailable.';
      dom.nodeTrayList.innerHTML = '';
      dom.nodeCableList.innerHTML = '<div class="empty-state">No matching cables were found.</div>';
      dom.nodeRelationList.innerHTML = '<div class="empty-state">No connected nodes were found.</div>';
      renderNodeMapCanvas(dom.nodeMapCanvas, null);
      disposeNodeThree();
      dom.nodeMapMeta.textContent = 'Select a node to display the 2D map.';
      dom.nodeThreeMeta.textContent = 'Select a node to display the 3D map.';
      return;
    }

    dom.nodeDetailTitle.textContent = focusMetric.name;
    dom.nodeDetailMeta.textContent = `${focusMetric.structure || 'NO STRUCTURE'} | ${focusMetric.component || 'NO COMPONENT'} | ${focusMetric.typesLabel}`;
    dom.nodeDetailTrayWidth.textContent = `${formatInt(focusMetric.recommendedTrayWidth)} mm`;
    dom.nodeDetailCableCount.textContent = formatInt(focusMetric.cableCount);
    dom.nodeDetailRelationCount.textContent = formatInt(focusMetric.relationCount);
    dom.nodeDetailCoordStatus.textContent = focusMetric.hasCoords ? 'READY' : 'COORD MISS';

    dom.nodeSummaryList.innerHTML = [
      `SYSTEMS: ${focusMetric.systemsLabel}`,
      `DECKS: ${focusMetric.decksLabel}`,
      `SEGMENT TOUCHES: ${formatInt(focusMetric.segmentTouches)}`,
      `TOTAL ROUTED LENGTH: ${formatNumber(focusMetric.totalCalculatedLength)}`,
      `POINT: ${focusMetric.pointRaw || buildPointText(focusMetric) || 'N/A'}`
    ].map((line) => renderIssueItem('info', line)).join('');

    dom.nodeTrayRule.textContent = 'Tray width = next standard width >= sum(CABLE_OUTDIA) x 1.15';
    dom.nodeTrayList.innerHTML = [
      `SUM OUT_DIA: ${formatNumber(focusMetric.totalOutDia)}`,
      `DESIGN WIDTH: ${formatNumber(focusMetric.designWidth)}`,
      `RECOMMENDED TRAY: ${formatInt(focusMetric.recommendedTrayWidth)} mm`,
      `FILL RATIO: ${formatNumber(focusMetric.fillRatio)} %`
    ].map((line) => renderIssueItem('info', line)).join('');

    dom.nodeCableList.innerHTML = focusMetric.cables.length
      ? focusMetric.cables.slice(0, 80).map((cable) => `
          <div class="node-cable-row">
            <strong>${escapeHtml(cable.name)}</strong>
            <span>${escapeHtml(cable.system)}</span>
            <span>${escapeHtml(cable.deck)}</span>
            <span>${formatNumber(cable.outDia)} / ${formatNumber(cable.totalLength)}</span>
          </div>
        `).join('')
      : '<div class="empty-state">???몃뱶瑜?吏?섎뒗 耳?대툝???놁뒿?덈떎.</div>';

    dom.nodeRelationList.innerHTML = focusMetric.relationNames.length
      ? focusMetric.relationNames.map((name) => {
          const related = state.graph.nodeMap[name];
          const edge = getEdgeInfo(focusMetric.name, name);
          return `
            <div class="node-relation-row">
              <strong>${escapeHtml(name)}</strong>
              <span>${related?.hasCoords ? 'READY' : 'MISS'}</span>
              <span>${edge ? formatNumber(edge.weight) : '-'}</span>
            </div>
          `;
        }).join('')
      : '<div class="empty-state">?곌껐 relation ?몃뱶媛 ?놁뒿?덈떎.</div>';

    const nodeMapStats = renderNodeMapCanvas(dom.nodeMapCanvas, focusMetric);
    dom.nodeMapMeta.textContent = `2D focus ${focusMetric.name} | relation ${nodeMapStats.drawnRelations}/${focusMetric.relationCount} | routed cables ${focusMetric.cableCount}`;

    const nodeThreeStats = getActiveTab() === 'nodes'
      ? renderNodeThreeScene(focusMetric)
      : (disposeNodeThree(), { drawnRelations: focusMetric.relationCount, drawnNodes: state.mergedNodes.filter((node) => node.hasCoords).length });
    dom.nodeThreeMeta.textContent = `3D nodes ${formatInt(nodeThreeStats.drawnNodes)} | focus links ${formatInt(nodeThreeStats.drawnRelations)}`;
  }

  function renderNodeMapCanvas(canvas, focusMetric) {
    if (!canvas) return { drawnRelations: 0 };

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || canvas.clientWidth || 640));
    const height = Math.max(240, Math.round(rect.height || canvas.clientHeight || 360));
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const allDrawableNodes = state.mergedNodes.filter((node) => node.hasCoords);
    if (!allDrawableNodes.length) {
      drawCanvasMessage(ctx, width, height, '醫뚰몴媛 ?덈뒗 ?몃뱶媛 ?놁뒿?덈떎.');
      return { drawnRelations: 0 };
    }

    const projection = createProjection(allDrawableNodes, width, height);
    drawGridBackground(ctx, width, height);

    state.graph.pairMap.forEach((edge) => {
      const from = state.graph.nodeMap[edge.a];
      const to = state.graph.nodeMap[edge.b];
      if (!from?.hasCoords || !to?.hasCoords) return;
      const p1 = projectNode(projection, from);
      const p2 = projectNode(projection, to);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    allDrawableNodes.forEach((node) => {
      const point = projectNode(projection, node);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(157, 174, 191, 0.54)';
      ctx.arc(point.x, point.y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!focusMetric) {
      return { drawnRelations: 0 };
    }

    const focusNode = state.graph.nodeMap[focusMetric.name];
    if (!focusNode?.hasCoords) {
      drawCanvasMessage(ctx, width, height, '?좏깮 ?몃뱶??醫뚰몴媛 ?놁뼱 2D ?ъ빱?ㅻ? ?쒖떆?????놁뒿?덈떎.');
      return { drawnRelations: 0 };
    }

    let drawnRelations = 0;
    focusMetric.relationNames.forEach((name) => {
      const related = state.graph.nodeMap[name];
      if (!related?.hasCoords) return;
      drawnRelations += 1;
      const start = projectNode(projection, focusNode);
      const end = projectNode(projection, related);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 200, 109, 0.92)';
      ctx.lineWidth = 2.6;
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = '#59c9ff';
      ctx.arc(end.x, end.y, 4.6, 0, Math.PI * 2);
      ctx.fill();
    });

    const focusPoint = projectNode(projection, focusNode);
    ctx.beginPath();
    ctx.fillStyle = '#ff7c7c';
    ctx.arc(focusPoint.x, focusPoint.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5f8fb';
    ctx.font = '12px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(focusMetric.name, focusPoint.x + 10, focusPoint.y - 8);

    return { drawnRelations };
  }

  function renderNodeThreeScene(focusMetric) {
    const container = dom.nodeThreeContainer;
    const placeholder = (message) => {
      disposeNodeThree();
      container.innerHTML = `<div class="three-placeholder">${escapeHtml(message)}</div>`;
      return { drawnRelations: 0, drawnNodes: 0 };
    };

    if (!window.THREE) {
      return placeholder('Three.js媛 ?놁뼱 ?몃뱶 3D 留듭쓣 ?ъ슜?????놁뒿?덈떎.');
    }

    const allDrawableNodes = state.mergedNodes.filter((node) => node.hasCoords);
    if (!allDrawableNodes.length) {
      return placeholder('醫뚰몴媛 ?덈뒗 ?몃뱶媛 ?놁뼱 3D 留듭쓣 洹몃┫ ???놁뒿?덈떎.');
    }

    if (!focusMetric) {
      return placeholder('?몃뱶瑜??좏깮?섎㈃ 3D 留듭씠 ?쒖떆?⑸땲??');
    }

    const focusNode = state.graph.nodeMap[focusMetric.name];
    if (!focusNode?.hasCoords) {
      return placeholder('?좏깮 ?몃뱶??醫뚰몴媛 ?놁뼱 3D ?ъ빱?ㅻ? ?쒖떆?????놁뒿?덈떎.');
    }

    disposeNodeThree();
    container.innerHTML = '';

    try {
      const width = Math.max(320, container.clientWidth || 640);
      const height = Math.max(220, container.clientHeight || 320);
      const renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      const scene = new window.THREE.Scene();
      scene.background = new window.THREE.Color(0x06111b);

      const camera = new window.THREE.PerspectiveCamera(42, width / height, 0.1, 2000);
      camera.position.set(0, 90, 210);

      const ambient = new window.THREE.AmbientLight(0xffffff, 0.62);
      const directional = new window.THREE.DirectionalLight(0x88e2ff, 1.08);
      directional.position.set(40, 80, 120);
      scene.add(ambient, directional);

      const group = new window.THREE.Group();
      scene.add(group);
      group.add(new window.THREE.GridHelper(220, 14, 0x28445d, 0x123149));

      const center = {
        x: average(allDrawableNodes.map((node) => node.x)),
        y: average(allDrawableNodes.map((node) => node.y)),
        z: average(allDrawableNodes.map((node) => node.z ?? 0))
      };
      const maxDelta = Math.max(...allDrawableNodes.flatMap((node) => [
        Math.abs((node.x ?? 0) - center.x),
        Math.abs((node.y ?? 0) - center.y),
        Math.abs((node.z ?? 0) - center.z)
      ]), 1);
      const scale = 88 / maxDelta;
      const toVector = (node) => new window.THREE.Vector3(
        ((node.x ?? 0) - center.x) * scale,
        ((node.z ?? 0) - center.z) * scale,
        ((node.y ?? 0) - center.y) * scale
      );

      const cloudPoints = allDrawableNodes.map((node) => toVector(node));
      group.add(new window.THREE.Points(
        new window.THREE.BufferGeometry().setFromPoints(cloudPoints),
        new window.THREE.PointsMaterial({ color: 0x7f95a9, size: 2.2, transparent: true, opacity: 0.36 })
      ));

      const focusVector = toVector(focusNode);
      const relatedNodes = focusMetric.relationNames
        .map((name) => state.graph.nodeMap[name])
        .filter((node) => node?.hasCoords);

      let drawnRelations = 0;
      relatedNodes.forEach((node) => {
        drawnRelations += 1;
        const points = [focusVector, toVector(node)];
        group.add(new window.THREE.Line(
          new window.THREE.BufferGeometry().setFromPoints(points),
          new window.THREE.LineBasicMaterial({ color: 0xffc86d })
        ));
        const sphere = new window.THREE.Mesh(
          new window.THREE.SphereGeometry(1.9, 16, 16),
          new window.THREE.MeshStandardMaterial({ color: 0x59c9ff, emissive: 0x143446 })
        );
        sphere.position.copy(points[1]);
        group.add(sphere);
      });

      const focusSphere = new window.THREE.Mesh(
        new window.THREE.SphereGeometry(3.2, 20, 20),
        new window.THREE.MeshStandardMaterial({ color: 0xff7c7c, emissive: 0x3a1919 })
      );
      focusSphere.position.copy(focusVector);
      group.add(focusSphere);

      const animate = () => {
        group.rotation.y += 0.0022;
        renderer.render(scene, camera);
        state.nodeThree.frameId = window.requestAnimationFrame(animate);
      };

      state.nodeThree.renderer = renderer;
      state.nodeThree.frameId = window.requestAnimationFrame(animate);
      return { drawnRelations, drawnNodes: allDrawableNodes.length };
    } catch (error) {
      console.error(error);
      return placeholder('?몃뱶 3D ?뚮뜑??珥덇린??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
    }
  }

  function disposeNodeThree() {
    if (state.nodeThree.frameId) {
      window.cancelAnimationFrame(state.nodeThree.frameId);
      state.nodeThree.frameId = 0;
    }
    if (state.nodeThree.renderer) {
      state.nodeThree.renderer.dispose();
      state.nodeThree.renderer = null;
    }
  }

  function renderMapCanvas(canvas, route, options = {}) {
    if (!canvas) return { drawnSegments: 0 };

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || canvas.clientWidth || 640));
    const height = Math.max(240, Math.round(rect.height || canvas.clientHeight || 360));
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const allDrawableNodes = state.mergedNodes.filter((node) => node.hasCoords);
    if (!allDrawableNodes.length) {
      drawCanvasMessage(ctx, width, height, '醫뚰몴媛 ?덈뒗 ?몃뱶媛 ?놁뒿?덈떎.');
      return { drawnSegments: 0 };
    }

    const focusNodes = route?.pathNodes
      .map((name) => state.graph.nodeMap[name])
      .filter((node) => node?.hasCoords) || [];
    const projectionNodes = options.fitToPath && focusNodes.length > 1 ? focusNodes : allDrawableNodes;
    const projection = createProjection(projectionNodes, width, height);

    drawGridBackground(ctx, width, height);

    state.graph.pairMap.forEach((edge) => {
      const from = state.graph.nodeMap[edge.a];
      const to = state.graph.nodeMap[edge.b];
      if (!from?.hasCoords || !to?.hasCoords) return;
      const p1 = projectNode(projection, from);
      const p2 = projectNode(projection, to);
      ctx.beginPath();
      ctx.strokeStyle = edge.symmetric ? 'rgba(255,255,255,0.07)' : 'rgba(255,200,109,0.15)';
      ctx.lineWidth = 1;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    allDrawableNodes.forEach((node) => {
      const point = projectNode(projection, node);
      const inPath = route?.pathNodes.includes(node.name);
      ctx.beginPath();
      ctx.fillStyle = inPath ? '#59c9ff' : 'rgba(186, 201, 219, 0.66)';
      ctx.arc(point.x, point.y, inPath ? 3.8 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    let drawnSegments = 0;
    if (route?.pathNodes?.length) {
      for (let index = 0; index < route.pathNodes.length - 1; index += 1) {
        const a = state.graph.nodeMap[route.pathNodes[index]];
        const b = state.graph.nodeMap[route.pathNodes[index + 1]];
        if (!a?.hasCoords || !b?.hasCoords) continue;
        drawnSegments += 1;
        const p1 = projectNode(projection, a);
        const p2 = projectNode(projection, b);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,124,124,0.92)';
        ctx.lineWidth = 3.2;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      const first = state.graph.nodeMap[route.pathNodes[0]];
      const last = state.graph.nodeMap[route.pathNodes[route.pathNodes.length - 1]];
      [first, last].forEach((node, index) => {
        if (!node?.hasCoords) return;
        const point = projectNode(projection, node);
        ctx.beginPath();
        ctx.fillStyle = index === 0 ? '#57d7a0' : '#ffc86d';
        ctx.arc(point.x, point.y, 6.6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    return { drawnSegments };
  }

  function drawCanvasMessage(ctx, width, height, message) {
    ctx.fillStyle = '#8da7bb';
    ctx.font = '14px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, width / 2, height / 2);
  }

  function createProjection(nodes, width, height) {
    const padding = 28;
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
    return { minX, minY, maxY, scale, padding, height };
  }

  function projectNode(projection, node) {
    const x = projection.padding + (node.x - projection.minX) * projection.scale;
    const y = projection.height - projection.padding - (node.y - projection.minY) * projection.scale;
    return { x, y };
  }

  function drawGridBackground(ctx, width, height) {
    ctx.fillStyle = '#05101a';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function renderThreeScene(route) {
    const container = dom.threeContainer;
    const placeholder = (message) => {
      disposeThree();
      container.innerHTML = `<div class="three-placeholder">${escapeHtml(message)}</div>`;
      return { drawnSegments: 0 };
    };

    if (!window.THREE) {
      return placeholder('Three.js媛 ?놁뼱 3D 酉곕? ?ъ슜?????놁뒿?덈떎.');
    }

    if (!route?.pathNodes?.length) {
      return placeholder('寃쎈줈瑜??좏깮?섎㈃ 3D 酉곌? ?쒖떆?⑸땲??');
    }

    const nodes = route.pathNodes
      .map((name) => state.graph.nodeMap[name])
      .filter((node) => node?.hasCoords);

    if (nodes.length < 2) {
      return placeholder('醫뚰몴媛 異⑸텇?섏? ?딆븘 3D 寃쎈줈瑜?洹몃┫ ???놁뒿?덈떎.');
    }

    disposeThree();
    container.innerHTML = '';

    try {
      const width = Math.max(320, container.clientWidth || 640);
      const height = Math.max(220, container.clientHeight || 320);
      const renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      const scene = new window.THREE.Scene();
      scene.background = new window.THREE.Color(0x06111b);

      const camera = new window.THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
      camera.position.set(0, 80, 180);

      const ambient = new window.THREE.AmbientLight(0xffffff, 0.6);
      const directional = new window.THREE.DirectionalLight(0x88e2ff, 1.1);
      directional.position.set(40, 80, 120);
      scene.add(ambient, directional);

      const group = new window.THREE.Group();
      scene.add(group);
      group.add(new window.THREE.GridHelper(180, 12, 0x28445d, 0x123149));

      const center = {
        x: average(nodes.map((node) => node.x)),
        y: average(nodes.map((node) => node.y)),
        z: average(nodes.map((node) => node.z ?? 0))
      };
      const maxDelta = Math.max(...nodes.flatMap((node) => [
        Math.abs((node.x ?? 0) - center.x),
        Math.abs((node.y ?? 0) - center.y),
        Math.abs((node.z ?? 0) - center.z)
      ]), 1);
      const scale = 70 / maxDelta;
      const points = nodes.map((node) => new window.THREE.Vector3(
        ((node.x ?? 0) - center.x) * scale,
        ((node.z ?? 0) - center.z) * scale,
        ((node.y ?? 0) - center.y) * scale
      ));

      const geometry = new window.THREE.BufferGeometry().setFromPoints(points);
      const material = new window.THREE.LineBasicMaterial({ color: 0xff7c7c, linewidth: 2 });
      group.add(new window.THREE.Line(geometry, material));

      points.forEach((point, index) => {
        const sphere = new window.THREE.Mesh(
          new window.THREE.SphereGeometry(index === 0 || index === points.length - 1 ? 2.8 : 1.8, 18, 18),
          new window.THREE.MeshStandardMaterial({
            color: index === 0 ? 0x57d7a0 : index === points.length - 1 ? 0xffc86d : 0x59c9ff,
            emissive: index === 0 || index === points.length - 1 ? 0x214935 : 0x163042
          })
        );
        sphere.position.copy(point);
        group.add(sphere);
      });

      const animate = () => {
        group.rotation.y += 0.003;
        renderer.render(scene, camera);
        state.three.frameId = window.requestAnimationFrame(animate);
      };

      state.three.renderer = renderer;
      state.three.frameId = window.requestAnimationFrame(animate);
      return { drawnSegments: Math.max(points.length - 1, 0) };
    } catch (error) {
      console.error(error);
      return placeholder('3D ?뚮뜑??珥덇린??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
    }
  }

  function disposeThree() {
    if (state.three.frameId) {
      window.cancelAnimationFrame(state.three.frameId);
      state.three.frameId = 0;
    }
    if (state.three.renderer) {
      state.three.renderer.dispose();
      state.three.renderer = null;
    }
  }

  function renderDiagnostics() {
    dom.diagnosticRunAt.textContent = state.validationRunAt
      ? `${state.validationRunAt.toLocaleDateString()} ${state.validationRunAt.toLocaleTimeString()}`
      : '-';
    dom.diagPass.textContent = formatInt(state.diagnostics.pass);
    dom.diagWarn.textContent = formatInt(state.diagnostics.warn);
    dom.diagFail.textContent = formatInt(state.diagnostics.fail);
    dom.diagGraphIssues.textContent = formatInt(totalGraphIssues());

    const graphRows = [];
    graphRows.push(renderDiagnosticRow('graph', 'Missing Relation Targets', String(state.graph.issues.missingRelationTargets.length), state.graph.issues.missingRelationTargets.slice(0, 20).map((issue) => escapeHtml(`${issue.from} -> ${issue.to}`)).join('<br>') || '-'));
    graphRows.push(renderDiagnosticRow('graph', 'Asymmetric Relations', String(state.graph.issues.asymmetricRelations.length), state.graph.issues.asymmetricRelations.slice(0, 20).map((issue) => escapeHtml(`${issue.a} <-> ${issue.b} (missing ${issue.missing})`)).join('<br>') || '-'));
    graphRows.push(renderDiagnosticRow('graph', 'Disconnected Components', String(state.graph.issues.disconnectedComponents.length), state.graph.issues.disconnectedComponents.slice(0, 8).map((component, index) => escapeHtml(`Component ${index + 1}: ${component.slice(0, 12).join(', ')}`)).join('<br>') || '-'));
    dom.diagnosticGraphTable.innerHTML = graphRows.join('');

    const failingCables = state.cables
      .filter((cable) => (cable.validation?.status || 'PENDING') !== 'PASS')
      .slice(0, 250)
      .map((cable) => renderDiagnosticRow(
        'cable',
        cable.name,
        renderBadge(cable.validation?.status || 'PENDING'),
        (cable.validation?.issues || []).map((issue) => escapeHtml(issue.message)).join('<br>') || '?ъ궛異??꾩슂'
      ));

    dom.diagnosticCableTable.innerHTML = failingCables.length
      ? failingCables.join('')
      : '<div class="empty-state">?꾩옱 FAIL/WARN 耳?대툝???놁뒿?덈떎.</div>';
  }

  function renderDiagnosticRow(kind, key, middle, value) {
    return `
      <div class="diag-row ${kind}">
        <div class="diag-key">${escapeHtml(key)}</div>
        <div class="diag-value">${middle}</div>
        <div class="diag-value">${value}</div>
      </div>
    `;
  }

  function updateSystemFilterOptions() {
