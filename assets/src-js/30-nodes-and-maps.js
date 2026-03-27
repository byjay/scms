  const NODE_GRID_COLUMNS = [
    { key: '_rowNum', label: 'No', width: 42, className: 'mono' },
    { key: 'name', label: 'NODE_RNAME', width: 120 },
    { key: 'structure', label: 'STRUCTURE', width: 110 },
    { key: 'component', label: 'COMPONENT', width: 100 },
    { key: 'type', label: 'NODE_TYPE', width: 80 },
    { key: 'cableCount', label: 'CABLES', width: 65, className: 'mono' },
    { key: 'relationNames', label: 'RELATION', width: 180 },
    { key: 'linkLength', label: 'LINK_LENGTH', width: 90, className: 'mono' },
    { key: 'nodeAreaSize', label: 'AREA_SIZE', width: 90, className: 'mono' },
    { key: 'recommendedTrayWidth', label: 'TRAY_W', width: 75, className: 'mono' },
    { key: 'areaFillRatio', label: 'FILL_%', width: 65, className: 'mono' },
    { key: 'pointRaw', label: 'POINT', width: 260 }
  ];
  const NODE_GRID_TEMPLATE = NODE_GRID_COLUMNS.map((c) => c.width + 'px').join(' ');

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

  function handleNodeTrayControlInput() {
    state.nodeTray.maxHeightLimit = Math.max(50, toNumber(dom.nodeTrayMaxHeight?.value, state.nodeTray.maxHeightLimit || 150));
    state.nodeTray.fillRatioLimit = Math.max(10, Math.min(90, toNumber(dom.nodeTrayFillLimit?.value, state.nodeTray.fillRatioLimit || 40)));
    state.nodeTray.tierCount = Math.max(1, Math.min(6, Math.round(toNumber(dom.nodeTrayTierCount?.value, state.nodeTray.tierCount || 1))));
    state.nodeTray.manualWidthDraft = trimText(dom.nodeTrayManualWidth?.value);
    state.nodeTray.draftNodeName = state.selectedNodeName || state.nodeTray.draftNodeName;
    renderNodesPanel();
  }

  function applyRecommendedNodeTray() {
    const metric = state.nodeMetricMap[state.selectedNodeName];
    if (!metric) {
      pushToast('Select a node first.', 'warn');
      return;
    }
    const model = buildNodeTrayModel(metric);
    state.nodeTray.manualWidthDraft = model.recommended.width ? String(model.recommended.width) : '';
    if (dom.nodeTrayManualWidth) {
      dom.nodeTrayManualWidth.value = state.nodeTray.manualWidthDraft;
    }
    state.nodeTray.tierCount = Math.max(1, model.recommended.tierCount || state.nodeTray.tierCount || 1);
    if (dom.nodeTrayTierCount) {
      dom.nodeTrayTierCount.value = String(state.nodeTray.tierCount);
    }
    state.nodeTray.draftNodeName = metric.name;
    renderNodesPanel();
    pushToast(`Recommended tray loaded for ${metric.name}.`, 'success');
  }

  function saveNodeTrayOverride() {
    const metric = state.nodeMetricMap[state.selectedNodeName];
    if (!metric) {
      pushToast('Select a node first.', 'warn');
      return;
    }
    const width = Math.max(0, toNumber(dom.nodeTrayManualWidth?.value, 0));
    const tierCount = Math.max(1, Math.min(6, Math.round(toNumber(dom.nodeTrayTierCount?.value, state.nodeTray.tierCount || 1))));
    if (width <= 0) {
      pushToast('Enter a tray width or load the recommended value first.', 'warn');
      return;
    }
    state.nodeTray.overrides[metric.name] = {
      width,
      tierCount,
      maxHeightLimit: Math.max(50, toNumber(dom.nodeTrayMaxHeight?.value, state.nodeTray.maxHeightLimit || 150)),
      fillRatioLimit: Math.max(10, Math.min(90, toNumber(dom.nodeTrayFillLimit?.value, state.nodeTray.fillRatioLimit || 40))),
      updatedAt: new Date().toISOString()
    };
    state.nodeTray.manualWidthDraft = String(width);
    state.nodeTray.draftNodeName = metric.name;
    state.project.dirty = true;
    refreshNodeAnalytics();
    renderNodesPanel();
    updateProjectStatus('NODE TRAY OVERRIDE SAVED');
    commitHistory('node-tray-override-save');
    pushToast(`Tray override saved for ${metric.name}.`, 'success');
  }

  function clearNodeTrayOverride() {
    const name = trimText(state.selectedNodeName);
    if (!name) {
      pushToast('Select a node first.', 'warn');
      return;
    }
    delete state.nodeTray.overrides[name];
    state.nodeTray.manualWidthDraft = '';
    state.nodeTray.draftNodeName = name;
    if (dom.nodeTrayManualWidth) {
      dom.nodeTrayManualWidth.value = '';
    }
    state.project.dirty = true;
    refreshNodeAnalytics();
    renderNodesPanel();
    updateProjectStatus('NODE TRAY OVERRIDE CLEARED');
    commitHistory('node-tray-override-clear');
    pushToast(`Tray override cleared for ${name}.`, 'success');
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
        totalCrossSectionArea: 0,
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
      const crossSectionArea = calculateCableArea(outDia);
      const totalLength = round2(cable.calculatedLength || route.totalLength || 0);

      uniqueNodes.forEach((name) => {
        const metric = metricMap[name];
        if (!metric) return;
        metric.cableCount += 1;
        metric.totalOutDia = round2(metric.totalOutDia + outDia);
        metric.totalCrossSectionArea = round2(metric.totalCrossSectionArea + crossSectionArea);
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
          crossSectionArea,
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
      const tray = buildNodeTraySummary(metric, state.graph.nodeMap[metric.name]);
      const systems = Array.from(metric.systems).sort();
      const types = Array.from(metric.types).sort();
      const decks = Array.from(metric.decks).sort();
      const cables = metric.cables
        .sort((left, right) => right.crossSectionArea - left.crossSectionArea || right.outDia - left.outDia || right.totalLength - left.totalLength || left.name.localeCompare(right.name));
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

  function calculateCableArea(outDia) {
    const diameter = Math.max(0, toNumber(outDia, 0));
    const radius = diameter / 2;
    return round2(Math.PI * radius * radius);
  }

  function getNodeTrayOverride(name) {
    const override = state.nodeTray.overrides?.[name];
    return override && typeof override === 'object' ? override : null;
  }

  function buildNodeTraySummary(metric, node) {
    const override = getNodeTrayOverride(metric.name);
    const maxHeightLimit = Math.max(50, toNumber(override?.maxHeightLimit, state.nodeTray.maxHeightLimit || 150));
    const fillRatioLimit = Math.max(10, Math.min(90, toNumber(override?.fillRatioLimit, state.nodeTray.fillRatioLimit || 40)));
    const autoRecommendedTierCount = Math.max(1, Math.min(6, Math.round(toNumber(state.nodeTray.tierCount, 1))));
    const totalCrossSectionArea = round2(metric.totalCrossSectionArea || 0);
    const nodeAreaSize = Math.max(0, toNumber(node?.areaSize, 0));
    const areaFillRatio = nodeAreaSize > 0 ? round2((totalCrossSectionArea / nodeAreaSize) * 100) : 0;
    const theoreticalWidth = totalCrossSectionArea > 0
      ? round2((totalCrossSectionArea * 100) / Math.max(1, maxHeightLimit * autoRecommendedTierCount * fillRatioLimit))
      : 0;
    const autoRecommendedWidth = pickTrayStandardWidth(theoreticalWidth);
    const effectiveWidth = Math.max(0, toNumber(override?.width, autoRecommendedWidth));
    const effectiveTierCount = Math.max(1, Math.min(6, Math.round(toNumber(override?.tierCount, autoRecommendedTierCount))));
    const trayCapacityArea = round2(effectiveWidth * maxHeightLimit * effectiveTierCount);
    const fillRatio = trayCapacityArea > 0 ? round2((totalCrossSectionArea / trayCapacityArea) * 100) : 0;
    const widthDemand = calculateNodeTrayWidth(metric.totalOutDia);
    return {
      occupiedWidth: widthDemand.occupiedWidth,
      designWidth: widthDemand.designWidth,
      widthDemandRatio: widthDemand.fillRatio,
      totalCrossSectionArea,
      nodeAreaSize,
      areaFillRatio,
      autoRecommendedWidth,
      autoRecommendedTierCount,
      recommendedTrayWidth: effectiveWidth,
      effectiveTrayWidth: effectiveWidth,
      effectiveTierCount,
      trayCapacityArea,
      fillRatio,
      overrideApplied: Boolean(override?.width),
      overrideWidth: Math.max(0, toNumber(override?.width, 0)),
      overrideTierCount: Math.max(0, Math.round(toNumber(override?.tierCount, 0))),
      maxHeightLimit,
      fillRatioLimit
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
      if (sort === 'fillDesc') {
        return right.areaFillRatio - left.areaFillRatio || right.fillRatio - left.fillRatio || right.totalCrossSectionArea - left.totalCrossSectionArea || left.name.localeCompare(right.name);
      }
      if (sort === 'areaDesc') {
        return right.totalCrossSectionArea - left.totalCrossSectionArea || right.areaFillRatio - left.areaFillRatio || left.name.localeCompare(right.name);
      }
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
    const totalAreaDemand = metrics.reduce((sum, metric) => sum + metric.totalCrossSectionArea, 0);
    const routedCableCount = state.cables.filter((cable) => cable.routeBreakdown?.pathNodes?.length).length;

    if (dom.nodeListCount) dom.nodeListCount.textContent = `${formatInt(metrics.length)} / ${formatInt(state.nodeMetrics.length)}`;
    if (dom.nodeVisibleCount) dom.nodeVisibleCount.textContent = formatInt(metrics.length);
    if (dom.nodeCoordReadyCount) dom.nodeCoordReadyCount.textContent = formatInt(coordReadyCount);
    if (dom.nodeTrayDemand) dom.nodeTrayDemand.textContent = formatNumber(totalTrayDemand);
    if (dom.nodeAreaDemand) {
      dom.nodeAreaDemand.textContent = formatNumber(totalAreaDemand);
    }
    if (dom.nodeFocusedName) dom.nodeFocusedName.textContent = focusMetric?.name || '-';
    if (dom.nodeAutoMeta) dom.nodeAutoMeta.textContent = `Tray auto width uses routed cable area, tray height ${formatInt(state.nodeTray.maxHeightLimit)} mm, fill limit ${formatInt(state.nodeTray.fillRatioLimit)}%, and ${formatInt(state.nodeTray.tierCount)} tier(s). Routed cables ${formatInt(routedCableCount)} / ${formatInt(state.cables.length)} are reflected.`;

    if (!metrics.length) {
      dom.nodeList.innerHTML = '<div class="empty-state node-list-empty">표시할 노드가 없습니다.</div>';
    } else {
      const headerHtml = '<div class="grid-header" style="grid-template-columns:' + NODE_GRID_TEMPLATE + '">' +
        NODE_GRID_COLUMNS.map((col) => '<div class="grid-header-cell">' + escapeHtml(col.label) + '</div>').join('') + '</div>';
      const rowsHtml = metrics.map((metric, idx) => {
        const isSelected = metric.name === state.selectedNodeName;
        const node = state.mergedNodes.find((n) => n.name === metric.name);
        const cells = NODE_GRID_COLUMNS.map((col) => {
          let val = '';
          if (col.key === '_rowNum') val = String(idx + 1);
          else if (col.key === 'relationNames') val = (metric.relationNames || []).join(',');
          else if (col.key === 'linkLength') val = formatNumber(node ? node.linkLength : 0);
          else if (col.key === 'nodeAreaSize') val = formatNumber(node ? node.areaSize : 0);
          else if (col.key === 'pointRaw') val = node ? (node.pointRaw || node.point || '') : '';
          else if (col.key === 'recommendedTrayWidth') val = formatInt(metric.recommendedTrayWidth);
          else if (col.key === 'areaFillRatio') val = formatNumber(metric.areaFillRatio || metric.fillRatio || 0);
          else if (col.key === 'cableCount') val = formatInt(metric[col.key] || 0);
          else { const v = metric[col.key]; val = v == null || v === '' ? '-' : String(v); }
          const cls = ['grid-cell', col.className || ''].filter(Boolean).join(' ');
          return '<div class="' + cls + '" title="' + escapeHtml(val) + '">' + escapeHtml(val) + '</div>';
        }).join('');
        return '<div class="grid-row' + (isSelected ? ' selected' : '') + '" data-node-name="' + escapeHtml(metric.name) + '" style="grid-template-columns:' + NODE_GRID_TEMPLATE + '">' + cells + '</div>';
      }).join('');
      dom.nodeList.innerHTML = headerHtml + '<div class="node-grid-body">' + rowsHtml + '</div>';
    }

    if (!focusMetric) {
      if (dom.nodeDetailTitle) dom.nodeDetailTitle.textContent = 'Select a node.';
      if (dom.nodeDetailMeta) dom.nodeDetailMeta.textContent = 'Double-click a node in the list to focus it in the 3D map.';
      if (dom.nodeDetailTrayWidth) dom.nodeDetailTrayWidth.textContent = '0';
      if (dom.nodeDetailCableCount) dom.nodeDetailCableCount.textContent = '0';
      if (dom.nodeDetailRelationCount) dom.nodeDetailRelationCount.textContent = '0';
      if (dom.nodeDetailCoordStatus) dom.nodeDetailCoordStatus.textContent = 'LOCKED';
      if (dom.nodeSummaryList) dom.nodeSummaryList.innerHTML = renderIssueItem('warn', 'No node summary is available.');
      if (dom.nodeTrayRule) dom.nodeTrayRule.textContent = 'Tray width rule is unavailable.';
      if (dom.nodeTrayList) dom.nodeTrayList.innerHTML = '';
      renderNodeTrayEngineering(null);
      if (dom.nodeCableList) dom.nodeCableList.innerHTML = '<div class="empty-state">No matching cables were found.</div>';
      if (dom.nodeRelationList) dom.nodeRelationList.innerHTML = '<div class="empty-state">No connected nodes were found.</div>';
      renderNodeMapCanvas(dom.nodeMapCanvas, null);
      if (dom.nodeMapMeta) dom.nodeMapMeta.textContent = 'Select a node to display the 2D map.';
      if (dom.nodeThreeNetworkToggle) {
        dom.nodeThreeNetworkToggle.textContent = state.nodeThreeNetworkMode ? 'Focus View' : 'Network View';
      }
      if (dom.nodeThreeEyebrow) {
        dom.nodeThreeEyebrow.textContent = state.nodeThreeNetworkMode ? '3D Network View' : '3D Node Focus';
      }
      if (state.nodeThreeNetworkMode && state.mergedNodes.length) {
        const networkStats = getActiveTab() === 'nodes'
          ? render3DNetworkView()
          : (disposeNodeThree(), { drawnNodes: state.mergedNodes.length, drawnCables: 0 });
        if (dom.nodeThreeMeta) dom.nodeThreeMeta.textContent = `3D network | nodes ${formatInt(networkStats.drawnNodes)} | cables ${formatInt(networkStats.drawnCables)}`;
      } else {
        disposeNodeThree();
        if (dom.nodeThreeMeta) dom.nodeThreeMeta.textContent = 'Select a node to display the 3D map.';
      }
      return;
    }

    if (dom.nodeDetailTitle) dom.nodeDetailTitle.textContent = focusMetric.name;
    if (dom.nodeDetailMeta) dom.nodeDetailMeta.textContent = `${focusMetric.structure || 'NO STRUCTURE'} | ${focusMetric.component || 'NO COMPONENT'} | ${focusMetric.typesLabel} | ${focusMetric.overrideApplied ? 'OVERRIDE' : 'AUTO'}`;
    if (dom.nodeDetailTrayWidth) dom.nodeDetailTrayWidth.textContent = `${formatInt(focusMetric.recommendedTrayWidth)} mm / ${formatInt(focusMetric.effectiveTierCount)}T`;
    if (dom.nodeDetailCableCount) dom.nodeDetailCableCount.textContent = formatInt(focusMetric.cableCount);
    if (dom.nodeDetailRelationCount) dom.nodeDetailRelationCount.textContent = formatInt(focusMetric.relationCount);
    if (dom.nodeDetailCoordStatus) dom.nodeDetailCoordStatus.textContent = focusMetric.hasCoords ? 'READY' : 'COORD MISS';

    if (dom.nodeSummaryList) dom.nodeSummaryList.innerHTML = [
      `SYSTEMS: ${focusMetric.systemsLabel}`,
      `DECKS: ${focusMetric.decksLabel}`,
      `SEGMENT TOUCHES: ${formatInt(focusMetric.segmentTouches)}`,
      `TOTAL ROUTED LENGTH: ${formatNumber(focusMetric.totalCalculatedLength)}`,
      `TOTAL AREA: ${formatNumber(focusMetric.totalCrossSectionArea)} mm2`,
      `POINT: ${focusMetric.pointRaw || buildPointText(focusMetric) || 'N/A'}`
    ].map((line) => renderIssueItem('info', line)).join('');

    if (dom.nodeTrayRule) dom.nodeTrayRule.textContent = 'Tray = area-based recommendation with optional override. Fill uses cable cross-sectional area against effective tray area.';
    if (dom.nodeTrayList) dom.nodeTrayList.innerHTML = [
      `SUM OUT_DIA: ${formatNumber(focusMetric.totalOutDia)}`,
      `SUM AREA: ${formatNumber(focusMetric.totalCrossSectionArea)} mm2`,
      `NODE AREA_SIZE: ${formatNumber(focusMetric.nodeAreaSize)} mm2`,
      `NODE FILL: ${formatNumber(focusMetric.areaFillRatio)} %`,
      `TRAY: ${formatInt(focusMetric.recommendedTrayWidth)} mm x ${formatInt(focusMetric.maxHeightLimit)} mm x ${formatInt(focusMetric.effectiveTierCount)}T`,
      `TRAY FILL: ${formatNumber(focusMetric.fillRatio)} %`
    ].map((line) => renderIssueItem('info', line)).join('');

    renderNodeTrayEngineering(focusMetric);

    if (dom.nodeCableList) dom.nodeCableList.innerHTML = focusMetric.cables.length
      ? focusMetric.cables.slice(0, 80).map((cable) => `
          <div class="node-cable-row">
            <strong>${escapeHtml(cable.name)}</strong>
            <span>${escapeHtml(cable.system)}</span>
            <span>${escapeHtml(cable.deck)}</span>
            <span>${formatNumber(cable.outDia)} OD / ${formatNumber(cable.crossSectionArea)} A / ${formatNumber(cable.totalLength)} L</span>
          </div>
        `).join('')
      : '<div class="empty-state">이 노드를 지나는 케이블이 없습니다.</div>';

    if (dom.nodeRelationList) dom.nodeRelationList.innerHTML = focusMetric.relationNames.length
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
      : '<div class="empty-state">연결 relation 노드가 없습니다.</div>';

    const nodeMapStats = renderNodeMapCanvas(dom.nodeMapCanvas, focusMetric);
    if (dom.nodeMapMeta) dom.nodeMapMeta.textContent = `2D focus ${focusMetric.name} | relation ${nodeMapStats.drawnRelations}/${focusMetric.relationCount} | routed cables ${focusMetric.cableCount}`;

    if (dom.nodeThreeNetworkToggle) {
      dom.nodeThreeNetworkToggle.textContent = state.nodeThreeNetworkMode ? 'Focus View' : 'Network View';
    }
    if (dom.nodeThreeEyebrow) {
      dom.nodeThreeEyebrow.textContent = state.nodeThreeNetworkMode ? '3D Network View' : '3D Node Focus';
    }
    if (dom.nodeThreeTitle) {
      dom.nodeThreeTitle.textContent = state.nodeThreeNetworkMode
        ? '전체 노드와 케이블 경로를 3D로 표시'
        : '전체 노드 환경에서 선택 노드를 강조';
    }

    if (state.nodeThreeNetworkMode) {
      const networkStats = getActiveTab() === 'nodes'
        ? render3DNetworkView()
        : (disposeNodeThree(), { drawnNodes: state.mergedNodes.length, drawnCables: 0 });
      if (dom.nodeThreeMeta) dom.nodeThreeMeta.textContent = `3D network | nodes ${formatInt(networkStats.drawnNodes)} | cables ${formatInt(networkStats.drawnCables)}`;
    } else {
      const nodeThreeStats = getActiveTab() === 'nodes'
        ? renderNodeThreeScene(focusMetric)
        : (disposeNodeThree(), { drawnRelations: focusMetric.relationCount, drawnNodes: state.mergedNodes.filter((node) => node.hasCoords).length });
      if (dom.nodeThreeMeta) dom.nodeThreeMeta.textContent = `3D nodes ${formatInt(nodeThreeStats.drawnNodes)} | focus links ${formatInt(nodeThreeStats.drawnRelations)}`;
    }
  }

  function handleNodeTrayMatrixClick(event) {
    const button = event.target.closest('[data-tray-width][data-tray-tiers]');
    if (!button) return;
    const width = Math.max(0, toNumber(button.dataset.trayWidth, 0));
    const tierCount = Math.max(1, Math.min(6, Math.round(toNumber(button.dataset.trayTiers, 1))));
    state.nodeTray.manualWidthDraft = width ? String(width) : '';
    state.nodeTray.tierCount = tierCount;
    state.nodeTray.draftNodeName = state.selectedNodeName || state.nodeTray.draftNodeName;
    if (dom.nodeTrayManualWidth) dom.nodeTrayManualWidth.value = state.nodeTray.manualWidthDraft;
    if (dom.nodeTrayTierCount) dom.nodeTrayTierCount.value = String(tierCount);
    renderNodesPanel();
  }

  function renderNodeTrayEngineering(focusMetric) {
    if (!dom.nodeTrayCanvas || !dom.nodeTraySummary || !dom.nodeTrayMatrix) return;
    if (!focusMetric) {
      dom.nodeTrayStatus.textContent = 'NO NODE';
      dom.nodeTraySummary.innerHTML = renderIssueItem('warn', 'Select a node to calculate tray fill and cable layout.');
      dom.nodeTrayMatrix.innerHTML = '<div class="empty-state">No tray candidates are available.</div>';
      renderTrayCanvas(dom.nodeTrayCanvas, null);
      dom.nodeTrayCanvasMeta.textContent = 'Select a node to preview tray layout.';
      return;
    }

    syncNodeTrayInputsForMetric(focusMetric);
    const model = buildNodeTrayModel(focusMetric);
    const statusType = model.current.success ? (model.current.fillRatio > model.fillRatioLimit ? 'warn' : 'success') : 'fail';
    const statusText = model.overrideApplied
      ? `OVERRIDE ${formatInt(model.current.width)}W / ${formatInt(model.current.tierCount)}T`
      : `AUTO ${formatInt(model.recommended.width)}W / ${formatInt(model.recommended.tierCount)}T`;

    dom.nodeTrayStatus.textContent = statusText;
    dom.nodeTraySummary.innerHTML = [
      `NODE AREA_SIZE: ${formatNumber(model.nodeAreaSize)} mm2`,
      `CABLE AREA SUM: ${formatNumber(model.totalArea)} mm2`,
      `NODE FILL: ${formatNumber(model.areaFillRatio)} %`,
      `CURRENT TRAY: ${formatInt(model.current.width)} mm x ${formatInt(model.maxHeightLimit)} mm x ${formatInt(model.current.tierCount)}T`,
      `CURRENT FILL: ${formatNumber(model.current.fillRatio)} %`,
      `MAX STACK HEIGHT: ${formatNumber(model.current.maxStackHeight)} mm`,
      `RECOMMENDED: ${formatInt(model.recommended.width)} mm x ${formatInt(model.recommended.tierCount)}T`
    ].map((line) => renderIssueItem(statusType, line)).join('');

    dom.nodeTrayMatrix.innerHTML = renderNodeTrayMatrix(model);
    renderTrayCanvas(dom.nodeTrayCanvas, model.current);
    dom.nodeTrayCanvasMeta.textContent = `Tray layout ${model.current.success ? 'READY' : 'LIMIT EXCEEDED'} | cables ${formatInt(model.current.cables.length)} | placed ${formatInt(model.current.placed.length)} | fill ${formatNumber(model.current.fillRatio)} %`;
    renderTrayCableIndexList(dom.nodeTrayIndexList, dom.nodeTrayCanvas);
  }

  function syncNodeTrayInputsForMetric(metric) {
    const override = getNodeTrayOverride(metric.name);
    if (state.nodeTray.draftNodeName !== metric.name) {
      state.nodeTray.draftNodeName = metric.name;
      state.nodeTray.manualWidthDraft = override?.width ? String(override.width) : '';
    }
    const viewMaxHeight = override?.maxHeightLimit ? Math.max(50, toNumber(override.maxHeightLimit, state.nodeTray.maxHeightLimit || 150)) : state.nodeTray.maxHeightLimit;
    const viewFillRatio = override?.fillRatioLimit ? Math.max(10, Math.min(90, toNumber(override.fillRatioLimit, state.nodeTray.fillRatioLimit || 40))) : state.nodeTray.fillRatioLimit;
    const viewTierCount = override?.tierCount ? Math.max(1, Math.min(6, Math.round(toNumber(override.tierCount, state.nodeTray.tierCount || 1)))) : state.nodeTray.tierCount;
    if (dom.nodeTrayMaxHeight && document.activeElement !== dom.nodeTrayMaxHeight) {
      dom.nodeTrayMaxHeight.value = String(viewMaxHeight);
    }
    if (dom.nodeTrayFillLimit && document.activeElement !== dom.nodeTrayFillLimit) {
      dom.nodeTrayFillLimit.value = String(viewFillRatio);
    }
    if (dom.nodeTrayTierCount && document.activeElement !== dom.nodeTrayTierCount) {
      dom.nodeTrayTierCount.value = String(viewTierCount);
    }
    if (dom.nodeTrayManualWidth && document.activeElement !== dom.nodeTrayManualWidth) {
      dom.nodeTrayManualWidth.value = state.nodeTray.manualWidthDraft || '';
    }
  }

  function buildNodeTrayModel(metric) {
    const cables = metric.cables
      .map((cable, index) => ({
        id: `${metric.name}-${index}-${cable.name}`,
        name: cable.name,
        od: Math.max(1, toNumber(cable.outDia, 0)),
        system: cable.system,
        fromNode: metric.name
      }))
      .filter((cable) => cable.od > 0);
    const maxHeightLimit = Math.max(50, toNumber(dom.nodeTrayMaxHeight?.value, state.nodeTray.maxHeightLimit || 150));
    const fillRatioLimit = Math.max(10, Math.min(90, toNumber(dom.nodeTrayFillLimit?.value, state.nodeTray.fillRatioLimit || 40)));
    const tierCount = Math.max(1, Math.min(6, Math.round(toNumber(dom.nodeTrayTierCount?.value, state.nodeTray.tierCount || 1))));
    const manualWidth = Math.max(0, toNumber(dom.nodeTrayManualWidth?.value, state.nodeTray.manualWidthDraft || 0));
    const matrix = calculateTrayOptimizationMatrix(cables, maxHeightLimit, fillRatioLimit);
    const recommended = pickRecommendedTrayCandidate(matrix, cables, maxHeightLimit, fillRatioLimit, tierCount);
    const current = solveTraySystem(cables, manualWidth > 0 ? tierCount : recommended.tierCount, maxHeightLimit, fillRatioLimit, manualWidth > 0 ? manualWidth : recommended.width);
    const nodeAreaSize = Math.max(0, toNumber(state.graph.nodeMap[metric.name]?.areaSize, 0));
    const totalArea = round2(metric.totalCrossSectionArea || 0);
    const areaFillRatio = nodeAreaSize > 0 ? round2((totalArea / nodeAreaSize) * 100) : 0;
    return {
      metric,
      cables,
      matrix,
      recommended,
      current,
      overrideApplied: manualWidth > 0 || Boolean(getNodeTrayOverride(metric.name)?.width),
      maxHeightLimit,
      fillRatioLimit,
      nodeAreaSize,
      totalArea,
      areaFillRatio
    };
  }

  function renderNodeTrayMatrix(model) {
    if (!model.matrix.length) {
      return '<div class="empty-state">No tray candidates are available.</div>';
    }
    const headers = ['TIERS', '100', '150', '200', '300', '450', '600', '750', '900', '1050', '1200'];
    const rows = [
      `<div class="tray-matrix-row is-header">${headers.map((label) => `<div class="tray-matrix-cell">${escapeHtml(label)}</div>`).join('')}</div>`
    ];
    model.matrix.forEach((row) => {
      const cells = [
        `<div class="tray-matrix-cell is-label">${formatInt(row.tierCount)}T</div>`
      ];
      row.cells.forEach((cell) => {
        const classes = ['tray-matrix-button'];
        if (cell.width === model.current.width && row.tierCount === model.current.tierCount) classes.push('is-current');
        if (cell.isRecommended) classes.push('is-recommended');
        if (!cell.success) classes.push('is-fail');
        else if (cell.fillRatio > model.fillRatioLimit) classes.push('is-warn');
        else classes.push('is-pass');
        cells.push(`
          <button
            type="button"
            class="${classes.join(' ')}"
            data-tray-width="${cell.width}"
            data-tray-tiers="${row.tierCount}"
            title="Fill ${formatNumber(cell.fillRatio)}% | Height ${formatNumber(cell.maxStackHeight)} mm"
          >
            <strong>${formatNumber(cell.fillRatio)}%</strong>
            <span>${cell.success ? formatNumber(cell.maxStackHeight) : 'FAIL'}</span>
          </button>
        `);
      });
      rows.push(`<div class="tray-matrix-row">${cells.join('')}</div>`);
    });
    return rows.join('');
  }

  function renderTrayCanvas(canvas, trayResult) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(400, Math.round(rect.width || canvas.clientWidth || 720));
    const height = Math.max(260, Math.round(rect.height || canvas.clientHeight || 340));
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!trayResult) {
      drawCanvasMessage(ctx, width, height, 'Select a node to preview tray layout.');
      return;
    }

    const trayWidth = Math.max(100, toNumber(trayResult.width, 100));
    const trayHeight = Math.max(50, toNumber(trayResult.maxHeightLimit, 150));
    const tierCount = Math.max(1, toNumber(trayResult.tierCount, 1));
    const postWidth = 12; // support post width (scaled)
    const dimSpace = 32; // dimension annotation space
    const padding = { top: 16, right: 16, bottom: dimSpace + 8, left: 16 };
    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;
    const tierGap = 6;
    const tierPitch = (usableHeight - tierGap * (tierCount - 1)) / tierCount;
    const innerTrayScale = Math.min((usableWidth - postWidth * 2 - 8) / trayWidth, (tierPitch - 20) / trayHeight);
    const scale = innerTrayScale;
    const trayDrawWidth = trayWidth * scale;
    const trayDrawHeight = trayHeight * scale;

    drawGridBackground(ctx, width, height);

    // Global cable numbering across all tiers
    let globalCableIndex = 0;
    const allPlacedIndexed = [];

    for (let tierIndex = 0; tierIndex < tierCount; tierIndex += 1) {
      const centerX = padding.left + usableWidth / 2;
      const fullTrayWidth = trayDrawWidth + postWidth * 2;
      const trayLeft = centerX - fullTrayWidth / 2;
      const floorY = padding.top + tierPitch * (tierIndex + 1) + tierGap * tierIndex - 4;
      const ceilY = floorY - trayDrawHeight;

      // --- PASS 1: Structure (posts + beam + height limit) ---

      // Left support post
      ctx.fillStyle = '#475569';
      ctx.fillRect(trayLeft, ceilY - 4, postWidth, trayDrawHeight + 8);
      // Right support post
      ctx.fillRect(trayLeft + fullTrayWidth - postWidth, ceilY - 4, postWidth, trayDrawHeight + 8);

      // Floor beam
      const beamHeight = 4;
      ctx.fillStyle = '#334155';
      ctx.fillRect(trayLeft, floorY, fullTrayWidth, beamHeight);

      // Tray interior background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(trayLeft + postWidth, ceilY, trayDrawWidth, trayDrawHeight);

      // Height limit dashed line
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(trayLeft + postWidth, ceilY);
      ctx.lineTo(trayLeft + fullTrayWidth - postWidth, ceilY);
      ctx.stroke();
      ctx.restore();

      // Tier label
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`L${tierIndex + 1}`, trayLeft + 2, ceilY - 6);

      // Tier stats on right
      const tier = trayResult.tiers[tierIndex];
      const tierPlaced = tier?.placed || [];
      const tierArea = round2(tierPlaced.reduce((sum, c) => sum + calculateCableArea(c.od), 0));
      const tierODSum = round2(tierPlaced.reduce((sum, c) => sum + c.od, 0));
      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`\u03A3OD ${formatNumber(tierODSum)} | \u03A3A ${formatNumber(tierArea)} mm\u00B2 | ${tierPlaced.length} cables`, trayLeft + fullTrayWidth, ceilY - 6);

      // --- PASS 2: Cables with numbers ---
      const cableOriginX = trayLeft + postWidth;

      tierPlaced.forEach((cable) => {
        globalCableIndex += 1;
        const cx = cableOriginX + cable.x * scale;
        const cy = floorY - cable.y * scale;
        const r = Math.max(2, (cable.od / 2) * scale);

        // Cable circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = trayCableColor(cable.system);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cable number inside circle
        const fontSize = Math.max(6, Math.min(11, r * 1.1));
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(globalCableIndex), cx, cy);

        allPlacedIndexed.push({ ...cable, displayIndex: globalCableIndex, tierIndex });
      });

      // Actual max stack height line
      if (tier && tier.maxStackHeight > 0) {
        const actualHeightY = floorY - tier.maxStackHeight * scale;
        ctx.save();
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(trayLeft + postWidth, actualHeightY);
        ctx.lineTo(trayLeft + fullTrayWidth - postWidth, actualHeightY);
        ctx.stroke();
        ctx.restore();
        // Height annotation
        ctx.fillStyle = '#fbbf24';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${formatNumber(tier.maxStackHeight)}mm`, trayLeft + fullTrayWidth - postWidth + 4, actualHeightY + 3);
      }
    }

    // --- Dimension annotation at bottom ---
    ctx.textBaseline = 'alphabetic';
    const dimY = height - 10;
    const dimLeft = padding.left + usableWidth / 2 - trayDrawWidth / 2 - postWidth;
    const dimRight = dimLeft + trayDrawWidth + postWidth * 2;

    // Arrow line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dimLeft, dimY);
    ctx.lineTo(dimRight, dimY);
    ctx.stroke();

    // Left arrow
    ctx.beginPath();
    ctx.moveTo(dimLeft, dimY);
    ctx.lineTo(dimLeft + 6, dimY - 3);
    ctx.lineTo(dimLeft + 6, dimY + 3);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    // Right arrow
    ctx.beginPath();
    ctx.moveTo(dimRight, dimY);
    ctx.lineTo(dimRight - 6, dimY - 3);
    ctx.lineTo(dimRight - 6, dimY + 3);
    ctx.closePath();
    ctx.fill();

    // Width label
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`W ${formatInt(trayWidth)} mm`, (dimLeft + dimRight) / 2, dimY - 5);

    // Store indexed cables for cable index list
    canvas._placedIndexed = allPlacedIndexed;
  }

  function trayCableColor(system) {
    const source = trimText(system) || 'UNASSIGNED';
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = source.charCodeAt(index) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 60%, 58%)`;
  }

  function renderTrayCableIndexList(container, canvas) {
    if (!container) return;
    const indexed = canvas?._placedIndexed || [];
    if (!indexed.length) {
      container.innerHTML = '<div class="empty-state">No cables placed.</div>';
      return;
    }
    const rows = indexed.map((cable) => {
      const color = trayCableColor(cable.system);
      const area = round2(calculateCableArea(cable.od));
      return `<div class="tray-index-row" data-cable-index="${cable.displayIndex}">
        <span class="tray-index-badge" style="background:${escapeHtml(color)}">${cable.displayIndex}</span>
        <span class="tray-index-name">${escapeHtml(cable.name || cable.id)}</span>
        <span class="tray-index-detail">OD ${formatNumber(cable.od)} | A ${formatNumber(area)} mm\u00B2</span>
        <span class="tray-index-sys">${escapeHtml(cable.system || '-')}</span>
        <span class="tray-index-tier">L${(cable.tierIndex || 0) + 1}</span>
      </div>`;
    });
    container.innerHTML = `<div class="tray-index-header">CABLE INDEX (${indexed.length})</div>${rows.join('')}`;
  }

  function calculateTrayOptimizationMatrix(cables, maxHeightLimit, fillRatioLimit) {
    if (!cables.length) return [];
    const widths = [100, 150, 200, 300, 450, 600, 750, 900, 1050, 1200];
    const tierCounts = [1, 2, 3, 4];
    return tierCounts.map((tierCount) => ({
      tierCount,
      cells: widths.map((width) => {
        const result = solveTraySystem(cables, tierCount, maxHeightLimit, fillRatioLimit, width);
        return {
          width,
          fillRatio: result.fillRatio,
          success: result.success,
          maxStackHeight: result.maxStackHeight,
          trayArea: width * maxHeightLimit * tierCount,
          isRecommended: false
        };
      })
    }));
  }

  function pickRecommendedTrayCandidate(matrix, cables, maxHeightLimit, fillRatioLimit, fallbackTierCount) {
    let best = null;
    matrix.forEach((row) => {
      row.cells.forEach((cell) => {
        const isOptimal = cell.success && cell.fillRatio <= fillRatioLimit;
        const area = cell.trayArea;
        if (!best && isOptimal) {
          best = { width: cell.width, tierCount: row.tierCount, area, fillRatio: cell.fillRatio };
          return;
        }
        if (isOptimal && best && area < best.area) {
          best = { width: cell.width, tierCount: row.tierCount, area, fillRatio: cell.fillRatio };
        }
      });
    });
    if (!best) {
      const fallback = solveTraySystem(cables, fallbackTierCount, maxHeightLimit, fillRatioLimit, 0);
      best = {
        width: fallback.width,
        tierCount: fallback.tierCount,
        area: fallback.width * maxHeightLimit * fallback.tierCount,
        fillRatio: fallback.fillRatio
      };
    }
    matrix.forEach((row) => {
      row.cells.forEach((cell) => {
        cell.isRecommended = cell.width === best.width && row.tierCount === best.tierCount;
      });
    });
    return best;
  }

  // ===================================================================
  // Gravity-Based Cable Tray Packing Solver
  // Ported from tray-fill/services/solver.ts
  // Physics-based circle packing with gravity simulation
  // ===================================================================

  var TRAY_MARGIN_X = 10;               // mm margin from tray edge (each side)
  var TRAY_COLLISION_EPSILON = 0.05;     // mm overlap tolerance for collision detection
  var TRAY_MAX_PILE_WIDTH = 200;         // mm max width for a single continuous pile
  var TRAY_PILE_GAP = 10;               // mm gap between piles
  var TRAY_PHYSICAL_SIM_HEIGHT = 500;   // mm soft limit for physics simulation stacking
  var TRAY_MIN_WIDTH = 100;             // mm minimum tray width for auto-optimization
  var TRAY_MAX_WIDTH = 1000;            // mm maximum tray width for auto-optimization
  var TRAY_WIDTH_STEP = 100;            // mm step for width search iteration

  /**
   * Euclidean distance between two points.
   */
  function trayDist(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if a circle at (x, y) with given radius collides with any placed cable.
   * Returns true if collision detected.
   */
  function checkCollision(placed, x, y, radius) {
    for (var i = 0; i < placed.length; i++) {
      var c = placed[i];
      var d = trayDist(x, y, c.x, c.y);
      var minDist = (c.od / 2) + radius - TRAY_COLLISION_EPSILON;
      if (d < minDist) return true;
    }
    return false;
  }

  /**
   * Check if a circle at (x, y) with given radius is physically supported.
   * A cable is supported if it rests on the floor or on top of another cable.
   */
  function isSupported(placed, x, y, radius) {
    // Floor support: cable center within 1mm of its radius from floor (y=0)
    if (y <= radius + 1.0) return true;
    // Check support from cables below
    for (var i = 0; i < placed.length; i++) {
      var c = placed[i];
      if (c.y >= y) continue;
      var d = trayDist(x, y, c.x, c.y);
      var contactDist = (c.od / 2) + radius + 1.0;
      if (d <= contactDist) {
        // Ensure cable is roughly above the supporting cable (not hanging off side)
        if (Math.abs(c.x - x) < ((c.od / 2) + radius) * 0.9) return true;
      }
    }
    return false;
  }

  /**
   * Determine the stacking layer number for a cable at position (x, y).
   * Layer 1 = floor level, layer N = stacked on N-1 cables below.
   */
  function determineTrayLayer(y, radius, placed, x) {
    if (y <= radius + 2.0) return 1;
    var below = placed.filter(function (c) {
      return Math.abs(c.x - x) < ((c.od / 2) + radius) && c.y < y;
    });
    if (!below.length) return 1;
    var maxLayer = 1;
    for (var i = 0; i < below.length; i++) {
      var layer = below[i].layer || 1;
      if (layer > maxLayer) maxLayer = layer;
    }
    return maxLayer + 1;
  }

  /**
   * Find the best gravity-settled position for a new cable among already-placed cables.
   * Generates candidate positions (floor, adjacent, stacked) and picks the lowest valid one.
   *
   * @param {object} cable        - Cable with .od property (outer diameter in mm)
   * @param {Array}  placed       - Array of already-placed cables with {x, y, od, layer}
   * @param {number} xMin         - Left boundary (TRAY_MARGIN_X)
   * @param {number} xMax         - Right boundary (trayWidth - TRAY_MARGIN_X)
   * @returns {{ x: number, y: number, layer: number } | null}
   */
  function findGravityPosition(cable, placed, xMin, xMax) {
    var r = Math.max(0.5, cable.od / 2);
    var candidates = [];

    // Candidate 1: leftmost floor position
    candidates.push({ x: xMin + r, y: r });

    // Generate candidates from each placed cable
    for (var i = 0; i < placed.length; i++) {
      var c = placed[i];
      // Floor position immediately to the right of this cable
      candidates.push({ x: c.x + c.od / 2 + r + 0.1, y: r });
      // Arc positions: try placing on/around this cable at 15-degree increments
      for (var angle = 15; angle <= 165; angle += 15) {
        var rad = (angle * Math.PI) / 180;
        candidates.push({
          x: c.x + Math.cos(rad) * (c.od / 2 + r),
          y: c.y + Math.sin(rad) * (c.od / 2 + r)
        });
      }
    }

    // Filter to valid positions
    var valid = [];
    for (var j = 0; j < candidates.length; j++) {
      var p = candidates[j];
      // Boundary check with 0.5mm tolerance
      if (p.x - r < xMin - 0.5) continue;
      if (p.x + r > xMax + 0.5) continue;
      // Physical height limit (hard cap at simulation height)
      if (p.y + r > TRAY_PHYSICAL_SIM_HEIGHT) continue;
      // No overlap with existing cables
      if (checkCollision(placed, p.x, p.y, r)) continue;
      // Must be physically supported (floor or other cable)
      if (!isSupported(placed, p.x, p.y, r)) continue;
      valid.push(p);
    }

    if (!valid.length) return null;

    // Sort: lowest y first (gravity), then leftmost x (compact packing)
    // Use 1.0mm tolerance band for y to prefer left packing at similar heights
    valid.sort(function (a, b) {
      var yDiff = a.y - b.y;
      if (Math.abs(yDiff) > 1.0) return yDiff;
      return a.x - b.x;
    });

    var best = valid[0];
    return {
      x: best.x,
      y: best.y,
      layer: determineTrayLayer(best.y, r, placed, best.x)
    };
  }

  /**
   * Sort cables for optimal packing: system (asc) -> OD desc (large first) -> name (asc).
   * Placing larger cables first generally yields better packing density.
   */
  function sortTrayCables(cables) {
    return cables.slice().sort(function (a, b) {
      var sysA = String(a.system || '');
      var sysB = String(b.system || '');
      if (sysA !== sysB) return sysA.localeCompare(sysB);
      if (b.od !== a.od) return b.od - a.od;
      var nameA = String(a.fromNode || a.name || '');
      var nameB = String(b.fromNode || b.name || '');
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * Attempt to fit all cables into a tray of given width using gravity packing.
   * Returns placement result with success flag and actual max stack height.
   *
   * @param {Array}  cables       - Array of cable objects with .od
   * @param {number} width        - Tray internal width in mm
   * @returns {{ success: boolean, placed: Array, maxStackHeight: number }}
   */
  function attemptTrayFit(cables, width) {
    var sorted = sortTrayCables(cables);
    var placed = [];
    var maxStackHeight = 0;
    var xMin = TRAY_MARGIN_X;
    var xMax = width - TRAY_MARGIN_X;

    for (var i = 0; i < sorted.length; i++) {
      var cable = sorted[i];
      var pos = findGravityPosition(cable, placed, xMin, xMax);
      if (pos) {
        placed.push({
          id: cable.id,
          name: cable.name,
          od: cable.od,
          system: cable.system,
          fromNode: cable.fromNode,
          x: pos.x,
          y: pos.y,
          layer: pos.layer
        });
        maxStackHeight = Math.max(maxStackHeight, pos.y + cable.od / 2);
      } else {
        return { success: false, placed: placed, maxStackHeight: maxStackHeight };
      }
    }
    return { success: true, placed: placed, maxStackHeight: maxStackHeight };
  }

  /**
   * Solve a single tray tier: place all cables using gravity packing at the given width.
   *
   * @param {Array}  cables        - Cables assigned to this tier
   * @param {number} tierIndex     - Zero-based tier index
   * @param {number} width         - Tray width in mm
   * @param {number} maxHeightLimit - User-specified height limit for fill ratio calculation
   * @returns {{ tierIndex, success, placed, maxStackHeight }}
   */
  function solveTrayTier(cables, tierIndex, width, maxHeightLimit) {
    var result = attemptTrayFit(cables, width);
    // Tag each placed cable with its tier index
    for (var i = 0; i < result.placed.length; i++) {
      result.placed[i].tierIndex = tierIndex;
    }
    return {
      tierIndex: tierIndex,
      success: result.success,
      placed: result.placed,
      maxStackHeight: result.maxStackHeight
    };
  }

  /**
   * Solve the full tray system: distribute cables across tiers, find optimal width.
   * Uses tray-fill's iterative width search (100mm steps from theoretical minimum to 1000mm).
   *
   * @param {Array}  cables         - All cables for this node
   * @param {number} tierCount      - Number of tray tiers
   * @param {number} maxHeightLimit - Height limit per tier in mm
   * @param {number} fillRatioLimit - Target fill ratio percentage (e.g., 40)
   * @param {number} [fixedWidth=0] - If > 0, use this width instead of auto-optimizing
   * @returns {{ width, tierCount, maxHeightLimit, tiers, cables, placed, maxStackHeight, fillRatio, success }}
   */
  function solveTraySystem(cables, tierCount, maxHeightLimit, fillRatioLimit, fixedWidth) {
    if (fixedWidth === undefined) fixedWidth = 0;
    var safeTierCount = Math.max(1, Math.min(6, Math.round(toNumber(tierCount, 1))));
    var buckets = Array.from({ length: safeTierCount }, function () { return []; });
    // Round-robin distribution of sorted cables across tiers
    sortTrayCables(cables).forEach(function (cable, index) {
      buckets[index % safeTierCount].push(cable);
    });

    var width = Math.max(0, toNumber(fixedWidth, 0));

    if (width <= 0) {
      // Auto-optimize: start from theoretical minimum, step up until all tiers fit
      var totalArea = cables.reduce(function (sum, cable) {
        return sum + calculateCableArea(cable.od);
      }, 0);
      var minTheoreticalWidth = totalArea > 0
        ? (totalArea * 100) / Math.max(1, maxHeightLimit * safeTierCount * fillRatioLimit)
        : TRAY_MIN_WIDTH;

      // First try standard widths (for common tray sizes)
      var standardWidths = [50, 100, 150, 200, 300, 450, 600, 750, 900, 1050, 1200];
      var startStd = pickTrayStandardWidth(minTheoreticalWidth);
      var startIdx = standardWidths.findIndex(function (w) { return w >= startStd; });
      var foundWidth = 0;

      for (var i = Math.max(0, startIdx); i < standardWidths.length; i++) {
        var cw = standardWidths[i];
        var allFit = true;
        for (var t = 0; t < buckets.length; t++) {
          var testResult = attemptTrayFit(buckets[t], cw);
          if (!testResult.success) { allFit = false; break; }
        }
        if (allFit) { foundWidth = cw; break; }
      }

      // If standard widths failed, try 100mm step search up to max
      if (!foundWidth) {
        var stepStart = Math.max(TRAY_MIN_WIDTH, Math.ceil(minTheoreticalWidth / TRAY_WIDTH_STEP) * TRAY_WIDTH_STEP);
        for (var w = stepStart; w <= TRAY_MAX_WIDTH; w += TRAY_WIDTH_STEP) {
          var allFit2 = true;
          for (var t2 = 0; t2 < buckets.length; t2++) {
            var testResult2 = attemptTrayFit(buckets[t2], w);
            if (!testResult2.success) { allFit2 = false; break; }
          }
          if (allFit2) { foundWidth = w; break; }
        }
      }

      width = foundWidth || standardWidths[standardWidths.length - 1];
    }

    var tiers = buckets.map(function (bucket, index) {
      return solveTrayTier(bucket, index, width, maxHeightLimit);
    });
    var maxStackHeight = Math.max(0, Math.max.apply(null, tiers.map(function (tier) { return tier.maxStackHeight; })));
    var totalArea2 = round2(cables.reduce(function (sum, cable) { return sum + calculateCableArea(cable.od); }, 0));
    var trayArea = round2(width * maxHeightLimit * safeTierCount);
    return {
      width: width,
      tierCount: safeTierCount,
      maxHeightLimit: maxHeightLimit,
      tiers: tiers,
      cables: cables,
      placed: tiers.reduce(function (all, tier) { return all.concat(tier.placed); }, []),
      maxStackHeight: maxStackHeight,
      fillRatio: trayArea > 0 ? round2((totalArea2 / trayArea) * 100) : 0,
      success: tiers.every(function (tier) { return tier.success; })
    };
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
      drawCanvasMessage(ctx, width, height, '좌표가 있는 노드가 없습니다.');
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
      drawCanvasMessage(ctx, width, height, '선택 노드의 좌표가 없어 2D 다이어그램을 표시할 수 없습니다.');
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
      return placeholder('Three.js가 없어 노드 3D 맵을 사용할 수 없습니다.');
    }

    const allDrawableNodes = state.mergedNodes.filter((node) => node.hasCoords);
    if (!allDrawableNodes.length) {
      return placeholder('좌표가 있는 노드가 없어 3D 맵을 그릴 수 없습니다.');
    }

    if (!focusMetric) {
       return placeholder('노드를 선택하면 3D 맵이 표시됩니다.');
    }

    const focusNode = state.graph.nodeMap[focusMetric.name];
    if (!focusNode?.hasCoords) {
      return placeholder('선택 노드의 좌표가 없어 3D 다이어그램을 표시할 수 없습니다.');
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
      return placeholder('노드 3D 렌더링 초기화 중 오류가 발생했습니다.');
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

  function render3DNetworkView() {
    const container = dom.nodeThreeContainer;
    const placeholder = (message) => {
      disposeNodeThree();
      container.innerHTML = `<div class="three-placeholder">${escapeHtml(message)}</div>`;
      return { drawnNodes: 0, drawnCables: 0 };
    };

    if (!window.THREE) {
      return placeholder('Three.js가 없어 네트워크 3D 뷰를 사용할 수 없습니다.');
    }

    const allNodes = state.mergedNodes;
    if (!allNodes.length) {
      return placeholder('표시할 노드가 없습니다.');
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

      const camera = new window.THREE.PerspectiveCamera(42, width / height, 0.1, 3000);
      camera.position.set(0, 120, 300);

      const ambient = new window.THREE.AmbientLight(0xffffff, 0.62);
      const directional = new window.THREE.DirectionalLight(0x88e2ff, 1.08);
      directional.position.set(40, 80, 120);
      scene.add(ambient, directional);

      const group = new window.THREE.Group();
      scene.add(group);
      group.add(new window.THREE.GridHelper(280, 18, 0x28445d, 0x123149));

      const nodeConnectionCount = Object.create(null);
      state.cables.forEach((cable) => {
        const route = cable.routeBreakdown;
        if (!route?.pathNodes?.length) return;
        const uniquePathNodes = unique(route.pathNodes.filter(Boolean));
        uniquePathNodes.forEach((name) => {
          nodeConnectionCount[name] = (nodeConnectionCount[name] || 0) + 1;
        });
      });

      const drawableWithCoords = allNodes.filter((node) => node.hasCoords);
      const drawableWithoutCoords = allNodes.filter((node) => !node.hasCoords);

      let center = { x: 0, y: 0, z: 0 };
      let scale = 1;
      if (drawableWithCoords.length) {
        center = {
          x: average(drawableWithCoords.map((node) => node.x)),
          y: average(drawableWithCoords.map((node) => node.y)),
          z: average(drawableWithCoords.map((node) => node.z ?? 0))
        };
        const maxDelta = Math.max(...drawableWithCoords.flatMap((node) => [
          Math.abs((node.x ?? 0) - center.x),
          Math.abs((node.y ?? 0) - center.y),
          Math.abs((node.z ?? 0) - center.z)
        ]), 1);
        scale = 110 / maxDelta;
      }

      const nodePositionMap = Object.create(null);

      drawableWithCoords.forEach((node) => {
        nodePositionMap[node.name] = new window.THREE.Vector3(
          ((node.x ?? 0) - center.x) * scale,
          ((node.z ?? 0) - center.z) * scale,
          ((node.y ?? 0) - center.y) * scale
        );
      });

      const circleRadius = drawableWithCoords.length ? 130 : 80;
      drawableWithoutCoords.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / Math.max(drawableWithoutCoords.length, 1);
        nodePositionMap[node.name] = new window.THREE.Vector3(
          Math.cos(angle) * circleRadius,
          -10,
          Math.sin(angle) * circleRadius
        );
      });

      const selectedName = state.selectedNodeName;
      allNodes.forEach((node) => {
        const position = nodePositionMap[node.name];
        if (!position) return;
        const connectedCables = nodeConnectionCount[node.name] || 0;
        const radius = Math.max(0.5, Math.min(2, connectedCables * 0.2));
        const isSelected = node.name === selectedName;
        const sphere = new window.THREE.Mesh(
          new window.THREE.SphereGeometry(isSelected ? radius * 1.8 : radius, 16, 16),
          new window.THREE.MeshStandardMaterial({
            color: isSelected ? 0xef4444 : 0x3b82f6,
            emissive: isSelected ? 0x3a1919 : 0x0f2744
          })
        );
        sphere.position.copy(position);
        group.add(sphere);
      });

      let drawnCables = 0;
      state.cables.forEach((cable) => {
        const route = cable.routeBreakdown;
        if (!route?.pathNodes?.length || route.pathNodes.length < 2) return;

        const linePoints = [];
        for (let i = 0; i < route.pathNodes.length; i += 1) {
          const nodeName = route.pathNodes[i];
          const pos = nodePositionMap[nodeName];
          if (!pos) continue;

          if (linePoints.length > 0 && i < route.pathNodes.length) {
            const prev = linePoints[linePoints.length - 1];
            const midY = (prev.y + pos.y) / 2;
            linePoints.push(new window.THREE.Vector3(prev.x, midY, prev.z));
            linePoints.push(new window.THREE.Vector3(pos.x, midY, pos.z));
          }
          linePoints.push(pos.clone());
        }

        if (linePoints.length >= 2) {
          drawnCables += 1;
          group.add(new window.THREE.Line(
            new window.THREE.BufferGeometry().setFromPoints(linePoints),
            new window.THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.55 })
          ));
        }
      });

      const animate = () => {
        group.rotation.y += 0.0018;
        renderer.render(scene, camera);
        state.nodeThree.frameId = window.requestAnimationFrame(animate);
      };

      state.nodeThree.renderer = renderer;
      state.nodeThree.frameId = window.requestAnimationFrame(animate);
      return { drawnNodes: allNodes.length, drawnCables };
    } catch (error) {
      console.error(error);
      return placeholder('네트워크 3D 렌더링 초기화 중 오류가 발생했습니다.');
    }
  }

  function toggle3DNetworkView() {
    state.nodeThreeNetworkMode = !state.nodeThreeNetworkMode;
    renderNodesPanel();
  }
  window.__toggle3DNetworkView = toggle3DNetworkView;

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
      drawCanvasMessage(ctx, width, height, '좌표가 있는 노드가 없습니다.');
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
      return placeholder('Three.js가 없어 3D 뷰어를 사용할 수 없습니다.');
    }

    if (!route?.pathNodes?.length) {
      return placeholder('경로를 선택하면 3D 뷰어가 표시됩니다.');
    }

    const nodes = route.pathNodes
      .map((name) => state.graph.nodeMap[name])
      .filter((node) => node?.hasCoords);

    if (nodes.length < 2) {
      return placeholder('좌표가 충분하지 않아 3D 경로를 그릴 수 없습니다.');
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
      return placeholder('3D 렌더링 초기화 중 오류가 발생했습니다.');
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
         (cable.validation?.issues || []).map((issue) => escapeHtml(issue.message)).join('<br>') || '상세 내용'
      ));

    dom.diagnosticCableTable.innerHTML = failingCables.length
      ? failingCables.join('')
      : '<div class="empty-state">현재 FAIL/WARN 케이블이 없습니다.</div>';
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
    const selected = dom.systemFilter.value || 'ALL';
    const systems = unique(state.cables.map((cable) => cable.system).filter(Boolean)).sort();
    dom.systemFilter.innerHTML = ['<option value="ALL">전체</option>']
      .concat(systems.map((system) => `<option value="${escapeHtml(system)}">${escapeHtml(system)}</option>`))
      .join('');
    dom.systemFilter.value = systems.includes(selected) ? selected : 'ALL';
  }
