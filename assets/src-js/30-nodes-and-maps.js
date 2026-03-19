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

    dom.nodeListCount.textContent = `${formatInt(metrics.length)} / ${formatInt(state.nodeMetrics.length)}`;
    dom.nodeVisibleCount.textContent = formatInt(metrics.length);
    dom.nodeCoordReadyCount.textContent = formatInt(coordReadyCount);
    dom.nodeTrayDemand.textContent = formatNumber(totalTrayDemand);
    if (dom.nodeAreaDemand) {
      dom.nodeAreaDemand.textContent = formatNumber(totalAreaDemand);
    }
    dom.nodeFocusedName.textContent = focusMetric?.name || '-';
    dom.nodeAutoMeta.textContent = `Tray auto width uses routed cable area, tray height ${formatInt(state.nodeTray.maxHeightLimit)} mm, fill limit ${formatInt(state.nodeTray.fillRatioLimit)}%, and ${formatInt(state.nodeTray.tierCount)} tier(s). Routed cables ${formatInt(routedCableCount)} / ${formatInt(state.cables.length)} are reflected.`;

    if (!metrics.length) {
      dom.nodeList.innerHTML = '<div class="empty-state node-list-empty">?쒖떆???몃뱶媛 ?놁뒿?덈떎.</div>';
    } else {
      dom.nodeList.innerHTML = metrics.map((metric) => `
        <div class="node-list-row${metric.name === state.selectedNodeName ? ' is-selected' : ''}" data-node-name="${escapeHtml(metric.name)}" title="?붾툝?대┃?섎㈃ 3D 留듭뿉???ъ빱?ㅻ맗?덈떎.">
          <div class="node-list-main">
            <div class="node-list-title">${escapeHtml(metric.name)}</div>
            <div class="node-list-subtitle">${escapeHtml([metric.structure || '-', metric.component || '-', metric.primaryDeck, metric.overrideApplied ? 'OVERRIDE' : 'AUTO'].join(' | '))}</div>
          </div>
          <div class="node-list-metric">
            <span>TRAY</span>
            <strong>${formatInt(metric.recommendedTrayWidth)}</strong>
          </div>
          <div class="node-list-metric">
            <span>AREA</span>
            <strong>${formatNumber(metric.totalCrossSectionArea)}</strong>
          </div>
          <div class="node-list-metric">
            <span>FILL</span>
            <strong>${formatNumber(metric.areaFillRatio || metric.fillRatio)}%</strong>
          </div>
          <div class="node-list-metric">
            <span>CABLES</span>
            <strong>${formatInt(metric.cableCount)}</strong>
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
      renderNodeTrayEngineering(null);
      dom.nodeCableList.innerHTML = '<div class="empty-state">No matching cables were found.</div>';
      dom.nodeRelationList.innerHTML = '<div class="empty-state">No connected nodes were found.</div>';
      renderNodeMapCanvas(dom.nodeMapCanvas, null);
      disposeNodeThree();
      dom.nodeMapMeta.textContent = 'Select a node to display the 2D map.';
      dom.nodeThreeMeta.textContent = 'Select a node to display the 3D map.';
      return;
    }

    dom.nodeDetailTitle.textContent = focusMetric.name;
    dom.nodeDetailMeta.textContent = `${focusMetric.structure || 'NO STRUCTURE'} | ${focusMetric.component || 'NO COMPONENT'} | ${focusMetric.typesLabel} | ${focusMetric.overrideApplied ? 'OVERRIDE' : 'AUTO'}`;
    dom.nodeDetailTrayWidth.textContent = `${formatInt(focusMetric.recommendedTrayWidth)} mm / ${formatInt(focusMetric.effectiveTierCount)}T`;
    dom.nodeDetailCableCount.textContent = formatInt(focusMetric.cableCount);
    dom.nodeDetailRelationCount.textContent = formatInt(focusMetric.relationCount);
    dom.nodeDetailCoordStatus.textContent = focusMetric.hasCoords ? 'READY' : 'COORD MISS';

    dom.nodeSummaryList.innerHTML = [
      `SYSTEMS: ${focusMetric.systemsLabel}`,
      `DECKS: ${focusMetric.decksLabel}`,
      `SEGMENT TOUCHES: ${formatInt(focusMetric.segmentTouches)}`,
      `TOTAL ROUTED LENGTH: ${formatNumber(focusMetric.totalCalculatedLength)}`,
      `TOTAL AREA: ${formatNumber(focusMetric.totalCrossSectionArea)} mm2`,
      `POINT: ${focusMetric.pointRaw || buildPointText(focusMetric) || 'N/A'}`
    ].map((line) => renderIssueItem('info', line)).join('');

    dom.nodeTrayRule.textContent = 'Tray = area-based recommendation with optional override. Fill uses cable cross-sectional area against effective tray area.';
    dom.nodeTrayList.innerHTML = [
      `SUM OUT_DIA: ${formatNumber(focusMetric.totalOutDia)}`,
      `SUM AREA: ${formatNumber(focusMetric.totalCrossSectionArea)} mm2`,
      `NODE AREA_SIZE: ${formatNumber(focusMetric.nodeAreaSize)} mm2`,
      `NODE FILL: ${formatNumber(focusMetric.areaFillRatio)} %`,
      `TRAY: ${formatInt(focusMetric.recommendedTrayWidth)} mm x ${formatInt(focusMetric.maxHeightLimit)} mm x ${formatInt(focusMetric.effectiveTierCount)}T`,
      `TRAY FILL: ${formatNumber(focusMetric.fillRatio)} %`
    ].map((line) => renderIssueItem('info', line)).join('');

    renderNodeTrayEngineering(focusMetric);

    dom.nodeCableList.innerHTML = focusMetric.cables.length
      ? focusMetric.cables.slice(0, 80).map((cable) => `
          <div class="node-cable-row">
            <strong>${escapeHtml(cable.name)}</strong>
            <span>${escapeHtml(cable.system)}</span>
            <span>${escapeHtml(cable.deck)}</span>
            <span>${formatNumber(cable.outDia)} OD / ${formatNumber(cable.crossSectionArea)} A / ${formatNumber(cable.totalLength)} L</span>
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
    const width = Math.max(320, Math.round(rect.width || canvas.clientWidth || 720));
    const height = Math.max(220, Math.round(rect.height || canvas.clientHeight || 300));
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
    const padding = 20;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const tierPitch = usableHeight / tierCount;
    const scale = Math.min(usableWidth / trayWidth, (tierPitch - 24) / trayHeight);

    drawGridBackground(ctx, width, height);

    for (let tierIndex = 0; tierIndex < tierCount; tierIndex += 1) {
      const originX = padding + (usableWidth - trayWidth * scale) / 2;
      const originY = padding + tierPitch * (tierIndex + 1) - 10;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(originX, originY - trayHeight * scale, trayWidth * scale, trayHeight * scale);
      ctx.fillStyle = '#5f6f82';
      ctx.font = '11px "Noto Sans KR", sans-serif';
      ctx.fillText(`TIER ${tierIndex + 1}`, originX, originY - trayHeight * scale - 8);

      const tier = trayResult.tiers[tierIndex];
      (tier?.placed || []).forEach((cable) => {
        const x = originX + cable.x * scale;
        const y = originY - cable.y * scale;
        const r = Math.max(1.8, (cable.od / 2) * scale);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = trayCableColor(cable.system);
        ctx.fill();
        ctx.strokeStyle = '#122033';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  }

  function trayCableColor(system) {
    const source = trimText(system) || 'UNASSIGNED';
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = source.charCodeAt(index) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 60%, 58%)`;
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

  function solveTraySystem(cables, tierCount, maxHeightLimit, fillRatioLimit, fixedWidth = 0) {
    const safeTierCount = Math.max(1, Math.min(6, Math.round(toNumber(tierCount, 1))));
    const buckets = Array.from({ length: safeTierCount }, () => []);
    sortTrayCables(cables).forEach((cable, index) => {
      buckets[index % safeTierCount].push(cable);
    });

    let width = Math.max(0, toNumber(fixedWidth, 0));
    if (width <= 0) {
      const totalArea = round2(cables.reduce((sum, cable) => sum + calculateCableArea(cable.od), 0));
      const theoreticalWidth = totalArea > 0
        ? (totalArea * 100) / Math.max(1, maxHeightLimit * safeTierCount * fillRatioLimit)
        : 100;
      width = pickTrayStandardWidth(theoreticalWidth);
    }

    const tiers = buckets.map((bucket, index) => solveTrayTier(bucket, index, width, maxHeightLimit));
    const maxStackHeight = Math.max(0, ...tiers.map((tier) => tier.maxStackHeight));
    const totalArea = round2(cables.reduce((sum, cable) => sum + calculateCableArea(cable.od), 0));
    const trayArea = round2(width * maxHeightLimit * safeTierCount);
    return {
      width,
      tierCount: safeTierCount,
      maxHeightLimit,
      tiers,
      cables,
      placed: tiers.flatMap((tier) => tier.placed),
      maxStackHeight,
      fillRatio: trayArea > 0 ? round2((totalArea / trayArea) * 100) : 0,
      success: tiers.every((tier) => tier.success)
    };
  }

  function solveTrayTier(cables, tierIndex, width, maxHeightLimit) {
    const placed = [];
    let success = true;
    let maxStackHeight = 0;
    sortTrayCables(cables).forEach((cable) => {
      const position = findTrayCablePosition(cable, placed, width, maxHeightLimit);
      if (!position) {
        success = false;
        return;
      }
      const placedCable = { ...cable, x: position.x, y: position.y, layer: position.layer, tierIndex };
      placed.push(placedCable);
      maxStackHeight = Math.max(maxStackHeight, position.y + cable.od / 2);
    });
    return {
      tierIndex,
      success,
      placed,
      maxStackHeight
    };
  }

  function sortTrayCables(cables) {
    return cables.slice().sort((left, right) =>
      String(left.system || '').localeCompare(String(right.system || '')) ||
      right.od - left.od ||
      String(left.name || '').localeCompare(String(right.name || ''))
    );
  }

  function findTrayCablePosition(cable, placed, width, maxHeightLimit) {
    const radius = Math.max(1, cable.od / 2);
    const margin = 6;
    const xMin = margin + radius;
    const xMax = Math.max(xMin, width - margin - radius);
    const candidates = [{ x: xMin, y: radius }];
    placed.forEach((existing) => {
      candidates.push({ x: existing.x + existing.od / 2 + radius + 0.5, y: radius });
      for (let angle = 15; angle <= 165; angle += 15) {
        const rad = (angle * Math.PI) / 180;
        candidates.push({
          x: existing.x + Math.cos(rad) * (existing.od / 2 + radius),
          y: existing.y + Math.sin(rad) * (existing.od / 2 + radius)
        });
      }
    });

    const valid = candidates.filter((candidate) => {
      if (candidate.x < xMin || candidate.x > xMax) return false;
      if (candidate.y + radius > maxHeightLimit) return false;
      if (trayCollision(placed, candidate.x, candidate.y, radius)) return false;
      if (!traySupported(placed, candidate.x, candidate.y, radius)) return false;
      return true;
    }).sort((left, right) => left.y - right.y || left.x - right.x);

    if (!valid.length) return null;
    const best = valid[0];
    return {
      ...best,
      layer: determineTrayLayer(best.y, radius, placed, best.x)
    };
  }

  function trayCollision(placed, x, y, radius) {
    return placed.some((cable) => {
      const dx = x - cable.x;
      const dy = y - cable.y;
      const minDistance = (cable.od / 2) + radius - 0.05;
      return Math.sqrt((dx * dx) + (dy * dy)) < minDistance;
    });
  }

  function traySupported(placed, x, y, radius) {
    if (y <= radius + 1) return true;
    return placed.some((cable) => {
      if (cable.y >= y) return false;
      const dx = x - cable.x;
      const dy = y - cable.y;
      const distance = Math.sqrt((dx * dx) + (dy * dy));
      return distance <= ((cable.od / 2) + radius + 1) && Math.abs(dx) < ((cable.od / 2) + radius) * 0.9;
    });
  }

  function determineTrayLayer(y, radius, placed, x) {
    if (y <= radius + 2) return 1;
    const below = placed.filter((cable) => Math.abs(cable.x - x) < ((cable.od / 2) + radius) && cable.y < y);
    if (!below.length) return 1;
    return Math.max(...below.map((cable) => cable.layer || 1)) + 1;
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
