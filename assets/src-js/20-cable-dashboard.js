  }

  function renderAll() {
    renderSummary();
    renderGrid();
    renderSelectedCable();
    renderRoutingPanel();
    renderDiagnostics();
    applyAuthState();
  }

  function renderSummary() {
    const routed = state.cables.filter((cable) => cable.routeBreakdown).length;
    dom.metricCables.textContent = formatInt(state.cables.length);
    dom.metricUploadedNodes.textContent = formatInt(state.uploadedNodes.length);
    dom.metricMergedNodes.textContent = formatInt(state.mergedNodes.length);
    dom.metricRouted.textContent = formatInt(routed);
    dom.metricValidation.textContent = `${state.diagnostics.pass} / ${state.diagnostics.warn} / ${state.diagnostics.fail}`;
    dom.metricGraphIssues.textContent = formatInt(totalGraphIssues());
    dom.graphSummary.textContent = [
      `Merged Nodes ${state.mergedNodes.length}`,
      `Missing Targets ${state.graph.issues.missingRelationTargets.length}`,
      `Asymmetric ${state.graph.issues.asymmetricRelations.length}`,
      `Disconnected ${state.graph.issues.disconnectedComponents.length}`
    ].join('  |  ');
    renderGraphIssueList();
  }

  function renderGraphIssueList() {
    const items = [];
    state.graph.issues.missingRelationTargets.slice(0, 12).forEach((issue) => {
      items.push(renderIssueItem('fail', `Missing relation target: ${issue.from} -> ${issue.to}`));
    });
    state.graph.issues.asymmetricRelations.slice(0, 12).forEach((issue) => {
      items.push(renderIssueItem('warn', `Asymmetric relation: ${issue.a} <-> ${issue.b} (missing ${issue.missing})`));
    });
    if (!items.length) {
      dom.graphIssueList.innerHTML = renderIssueItem('success', '洹몃옒???댁뒋媛 ?놁뒿?덈떎.');
      return;
    }
    dom.graphIssueList.innerHTML = items.join('');
  }

  function getFilteredCables() {
    const search = trimText(dom.searchInput.value).toLowerCase();
    const validationFilter = dom.validationFilter.value;
    const systemFilter = dom.systemFilter.value;

    return state.cables.filter((cable) => {
      if (validationFilter !== 'ALL') {
        const status = cable.validation?.status || 'PENDING';
        if (status !== validationFilter) return false;
      }
      if (systemFilter !== 'ALL' && cable.system !== systemFilter) {
        return false;
      }
      if (!search) return true;
      const haystack = [
        cable.name,
        cable.type,
        cable.system,
        cable.wdPage,
        cable.fromNode,
        cable.fromRoom,
        cable.fromEquip,
        cable.toNode,
        cable.toRoom,
        cable.toEquip,
        cable.checkNode,
        cable.path,
        cable.supplyDeck,
        cable.interference,
        cable.remark,
        cable.remark1,
        cable.remark2,
        cable.remark3,
        cable.revision,
        cable.calculatedPath
      ].join(' ').toLowerCase();
      return haystack.includes(search);
    });
  }

  function renderGrid() {
    const cables = getFilteredCables();
    dom.listCount.textContent = `${formatInt(cables.length)} / ${formatInt(state.cables.length)}`;
    dom.cableGridInner.style.height = `${Math.max(cables.length * ROW_HEIGHT, dom.cableGridViewport.clientHeight || 420)}px`;
    dom.cableGridInner.innerHTML = '';

    if (!cables.length) {
      dom.cableGridInner.style.height = '0px';
      dom.cableGridInner.innerHTML = '<div class="empty-state">議곌굔??留욌뒗 耳?대툝???놁뒿?덈떎.</div>';
      return;
    }

    const viewportHeight = dom.cableGridViewport.clientHeight || 560;
    const scrollTop = dom.cableGridViewport.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 6);
    const end = Math.min(cables.length - 1, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + 8);

    for (let index = start; index <= end; index += 1) {
      const cable = cables[index];
      const row = document.createElement('div');
      row.className = `grid-row${cable.id === state.selectedCableId ? ' selected' : ''}`;
      row.style.top = `${index * ROW_HEIGHT}px`;
      row.style.height = `${ROW_HEIGHT}px`;
      row.style.gridTemplateColumns = GRID_TEMPLATE;
      row.innerHTML = GRID_COLUMNS.map((column) => renderGridCell(cable, column)).join('');
      row.addEventListener('click', () => selectCable(cable.id));
      row.addEventListener('dblclick', () => selectCable(cable.id, { focusEditor: true }));
      dom.cableGridInner.appendChild(row);
    }
  }

  function renderGridCell(cable, column) {
    let content = '';
    let title = '';
    const value = cable[column.key];

    if (column.special === 'validation') {
      const status = cable.validation?.status || 'PENDING';
      content = renderBadge(status);
      title = status;
    } else if (column.special === 'mapStatus') {
      const status = cable.validation?.mapStatus || 'UNCHECKED';
      content = renderBadge(status);
      title = status;
    } else if (column.key === 'graphLength') {
      content = escapeHtml(formatNumber(cable.routeBreakdown?.graphLength || 0));
      title = content;
    } else if (column.key === 'calculatedLength') {
      content = escapeHtml(formatNumber(cable.calculatedLength || 0));
      title = content;
    } else if (
      column.key === 'length' ||
      column.key === 'fromRest' ||
      column.key === 'toRest' ||
      column.key === 'outDia' ||
      column.key === 'porWeight' ||
      column.key === 'cableWeight'
    ) {
      const hasValue = !(value == null || value === '');
      content = escapeHtml(hasValue ? formatNumber(value) : '-');
      title = hasValue ? String(value) : '-';
    } else if (column.key === 'path') {
      const text = cable.path || '-';
      content = escapeHtml(truncate(text, 64));
      title = text;
    } else if (column.key === 'calculatedPath') {
      const text = cable.calculatedPath || '-';
      content = escapeHtml(truncate(text, 64));
      title = text;
    } else {
      const text = value == null || value === '' ? '-' : String(value);
      content = escapeHtml(text);
      title = text;
    }

    const className = ['grid-cell', column.className || ''].filter(Boolean).join(' ');
    return `<div class="${className}" title="${escapeHtml(title)}">${content}</div>`;
  }

  function selectCable(id, options = {}) {
    state.selectedCableId = id;
    populateEditor();
    syncRouteInputsFromSelected();
    renderGrid();
    renderSelectedCable();
    renderRoutingPanel();
    if (options.focusEditor) {
      dom.editorDock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function getSelectedCable() {
    return state.cables.find((cable) => cable.id === state.selectedCableId) || null;
  }

  function clearEditorFields() {
    [...EDITOR_TEXT_FIELDS, ...EDITOR_NUMBER_FIELDS].forEach((id) => {
      if (dom[id]) {
        dom[id].value = '';
      }
    });
  }

  function readOptionalNumberInput(element) {
    const text = trimText(element?.value);
    return text ? finiteOrNull(text) : null;
  }

  function populateEditor() {
    const cable = getSelectedCable();
    if (!cable) {
      dom.editorStatus.textContent = 'No cable selected.';
      clearEditorFields();
      return;
    }

    dom.editorStatus.textContent = `${cable.name || cable.id} | ${cable.validation?.status || 'PENDING'} | ${state.project.projectName || defaultProjectName(getProjectGroupCode(), state.project.fileName)}`;
    dom.editName.value = cable.name || '';
    dom.editType.value = cable.type || '';
    dom.editSystem.value = cable.system || '';
    dom.editWdPage.value = cable.wdPage || '';
    dom.editLength.value = cable.length || 0;
    dom.editOutDia.value = cable.outDia || 0;
    dom.editFromNode.value = cable.fromNode || '';
    dom.editFromRoom.value = cable.fromRoom || '';
    dom.editFromEquip.value = cable.fromEquip || '';
    dom.editFromRest.value = cable.fromRest || 0;
    dom.editToNode.value = cable.toNode || '';
    dom.editToRoom.value = cable.toRoom || '';
    dom.editToEquip.value = cable.toEquip || '';
    dom.editToRest.value = cable.toRest || 0;
    dom.editCheckNode.value = cable.checkNode || '';
    dom.editSupplyDeck.value = cable.supplyDeck || '';
    dom.editPorWeight.value = cable.porWeight ?? '';
    dom.editCableWeight.value = cable.cableWeight ?? '';
    dom.editPath.value = cable.path || '';
    dom.editInterference.value = cable.interference || '';
    dom.editRemark.value = cable.remark || '';
    dom.editRemark1.value = cable.remark1 || '';
    dom.editRemark2.value = cable.remark2 || '';
    dom.editRemark3.value = cable.remark3 || '';
    dom.editRevision.value = cable.revision || '';
  }

  async function saveSelectedCable(options) {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('Select a cable first.', 'warn');
      return;
    }

    const before = structuredCloneCompatible(cable);
    const normalizedCheckNode = parseNodeList(dom.editCheckNode.value, false).join(', ');
    const nextValues = {
      name: trimText(dom.editName.value),
      type: trimText(dom.editType.value),
      system: trimText(dom.editSystem.value),
      wdPage: trimText(dom.editWdPage.value),
      length: toNumber(dom.editLength.value, 0),
      outDia: toNumber(dom.editOutDia.value, 0),
      fromNode: trimText(dom.editFromNode.value),
      fromRoom: trimText(dom.editFromRoom.value),
      fromEquip: trimText(dom.editFromEquip.value),
      fromRest: toNumber(dom.editFromRest.value, 0),
      toNode: trimText(dom.editToNode.value),
      toRoom: trimText(dom.editToRoom.value),
      toEquip: trimText(dom.editToEquip.value),
      toRest: toNumber(dom.editToRest.value, 0),
      checkNode: normalizedCheckNode,
      path: trimText(dom.editPath.value),
      supplyDeck: trimText(dom.editSupplyDeck.value),
      porWeight: readOptionalNumberInput(dom.editPorWeight),
      interference: trimText(dom.editInterference.value),
      remark: trimText(dom.editRemark.value),
      remark1: trimText(dom.editRemark1.value),
      remark2: trimText(dom.editRemark2.value),
      remark3: trimText(dom.editRemark3.value),
      revision: trimText(dom.editRevision.value),
      cableWeight: readOptionalNumberInput(dom.editCableWeight)
    };

    const routeSensitiveKeys = ['fromNode', 'toNode', 'fromRest', 'toRest', 'checkNode'];
    const routeChanged = routeSensitiveKeys.some((key) => String(cable[key] ?? '') !== String(nextValues[key] ?? ''));
    const validationChanged = ['system', 'type', 'outDia', 'path', 'supplyDeck', 'interference']
      .some((key) => String(cable[key] ?? '') !== String(nextValues[key] ?? ''));
    if (options.forceRoute && !normalizedCheckNode) {
      pushToast('Force route requires at least one CHECK_NODE.', 'warn');
      return;
    }

    try {
      Object.assign(cable, nextValues);

      if (routeChanged || options.forceRoute) {
        clearCalculatedRoute(cable);
      }

      if (options.recalc || options.forceRoute) {
        applyRouteToCable(cable);
      }

      if ((options.recalc || options.forceRoute) && !cable.routeBreakdown) {
        Object.assign(cable, before);
        pushToast('Route calculation failed. Please verify FROM/TO/CHECK_NODE.', 'error');
        populateEditor();
        return;
      }

      if (options.forceRoute) {
        cable.path = cable.calculatedPath || [cable.fromNode, ...parseNodeList(cable.checkNode, false), cable.toNode].join(' -> ');
      }

      if (options.validate || options.recalc || options.forceRoute || validationChanged) {
        cable.validation = validateCable(cable);
        refreshDiagnosticsSummary();
      } else if (routeChanged) {
        cable.validation = {
          status: 'PENDING',
          issues: [{ severity: 'warn', message: 'Route changed. Recalculation is required.' }],
          mapStatus: 'UNCHECKED'
        };
        refreshDiagnosticsSummary();
      }

      state.project.dirty = true;
      updateSystemFilterOptions();
      populateEditor();
      syncRouteInputsFromSelected();
      renderAll();
      commitHistory(options.forceRoute ? 'force-route' : options.recalc ? 'save-recalc' : 'save');
      updateProjectStatus(options.forceRoute ? 'FORCED ROUTE UPDATED' : 'CABLE UPDATED');
      await persistProjectState({
        announce: false,
        reason: options.forceRoute ? 'force-route' : options.recalc ? 'save-recalc' : 'save'
      });
      pushToast(options.forceRoute
        ? 'Cable route was forced through CHECK_NODE and saved.'
        : options.recalc
          ? 'Cable updated, recalculated, and saved.'
          : 'Cable updated and saved.', 'success');
    } catch (error) {
      console.error(error);
      Object.assign(cable, before);
      populateEditor();
      renderAll();
      pushToast(error.message || 'Cable save failed.', 'error');
    }
  }

  function validateSelectedCable(announce) {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('寃利앺븷 耳?대툝???좏깮??二쇱꽭??', 'warn');
      return;
    }
    applyRouteToCable(cable);
    cable.validation = validateCable(cable);
    refreshDiagnosticsSummary();
    renderGrid();
    renderSelectedCable();
    renderRoutingPanel();
    renderNodesPanel();
    renderDiagnostics();
    renderSummary();
    if (announce) {
      pushToast(`${cable.name} 寃利앹쓣 ?꾨즺?덉뒿?덈떎.`, 'success');
    }
  }

  function refreshDiagnosticsSummary() {
    const summary = { pass: 0, warn: 0, fail: 0, pending: 0 };
    state.cables.forEach((cable) => {
      const status = cable.validation?.status || 'PENDING';
      if (status === 'PASS') summary.pass += 1;
      else if (status === 'WARN') summary.warn += 1;
      else if (status === 'FAIL') summary.fail += 1;
      else summary.pending += 1;
    });
    state.validationRunAt = new Date();
    state.diagnostics = {
      ...summary,
      graphIssues: totalGraphIssues()
    };
  }

  function clearCalculatedRoute(cable) {
    cable.routeBreakdown = null;
    cable.calculatedPath = '';
    cable.calculatedLength = 0;
  }

  function resetEditor() {
    populateEditor();
    pushToast('?몄쭛湲?媛믪쓣 ?먮옒 耳?대툝 媛믪쑝濡??섎룎?몄뒿?덈떎.', 'info');
  }

  function createNewCable() {
    const next = normalizeCableRecord({
      id: `CABLE-${Date.now()}`,
      name: `NEW_CABLE_${state.cables.length + 1}`,
      system: dom.systemFilter.value !== 'ALL' ? dom.systemFilter.value : '',
      type: 'POWER'
    }, state.cables.length);
    state.cables.unshift(next);
    state.selectedCableId = next.id;
    refreshDiagnosticsSummary();
    updateSystemFilterOptions();
    populateEditor();
    state.project.dirty = true;
    renderAll();
    commitHistory('new-cable');
    updateProjectStatus('NEW CABLE');
    persistProjectState({ announce: false, reason: 'new-cable' }).catch((error) => console.error(error));
    pushToast('??耳?대툝??異붽??덉뒿?덈떎.', 'success');
  }

  function duplicateSelectedCable() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('蹂듭젣??耳?대툝???좏깮??二쇱꽭??', 'warn');
      return;
    }
    const clone = normalizeCableRecord({
      ...structuredCloneCompatible(cable),
      id: `CABLE-${Date.now()}`,
      name: `${cable.name}_COPY`,
      calculatedPath: '',
      calculatedLength: 0
    }, state.cables.length);
    state.cables.unshift(clone);
    state.selectedCableId = clone.id;
    clearCalculatedRoute(clone);
    clone.validation = {
      status: 'PENDING',
      issues: [{ severity: 'warn', message: '蹂듭젣 ???ъ궛異쒖씠 ?꾩슂?⑸땲??' }],
      mapStatus: 'UNCHECKED'
    };
    refreshDiagnosticsSummary();
    updateSystemFilterOptions();
    populateEditor();
    state.project.dirty = true;
    renderAll();
    commitHistory('duplicate-cable');
    updateProjectStatus('DUPLICATED CABLE');
    persistProjectState({ announce: false, reason: 'duplicate-cable' }).catch((error) => console.error(error));
    pushToast('?좏깮 耳?대툝??蹂듭젣?덉뒿?덈떎.', 'success');
  }

  function deleteSelectedCable() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('??젣??耳?대툝???좏깮??二쇱꽭??', 'warn');
      return;
    }
    if (!window.confirm(`${cable.name} 耳?대툝????젣?좉퉴??`)) {
      return;
    }
    state.cables = state.cables.filter((item) => item.id !== cable.id);
    state.selectedCableId = state.cables[0]?.id || null;
    refreshDiagnosticsSummary();
    updateSystemFilterOptions();
    populateEditor();
    state.project.dirty = true;
    renderAll();
    commitHistory('delete-cable');
    updateProjectStatus('DELETED CABLE');
    persistProjectState({ announce: false, reason: 'delete-cable' }).catch((error) => console.error(error));
    pushToast('耳?대툝????젣?덉뒿?덈떎.', 'success');
  }

  function syncRouteInputsFromSelected() {
    const cable = getSelectedCable();
    if (!cable) return;
    dom.routeFrom.value = cable.fromNode || '';
    dom.routeTo.value = cable.toNode || '';
    dom.routeCheck.value = cable.checkNode || '';
    dom.routeFromRest.value = cable.fromRest || 0;
    dom.routeToRest.value = cable.toRest || 0;
  }

  function previewManualRoute() {
    const tempCable = normalizeCableRecord({
      name: 'PREVIEW',
      fromNode: dom.routeFrom.value,
      toNode: dom.routeTo.value,
      checkNode: dom.routeCheck.value,
      fromRest: dom.routeFromRest.value,
      toRest: dom.routeToRest.value
    }, 0);
    applyRouteToCable(tempCable);
    tempCable.validation = validateCable(tempCable);
    state.manualPreview = tempCable;
    renderRoutingPanel();
    pushToast('?섎룞 寃쎈줈 誘몃━蹂닿린瑜?媛깆떊?덉뒿?덈떎.', 'success');
  }

  function clearManualPreview() {
    state.manualPreview = null;
    renderRoutingPanel();
    pushToast('?섎룞 誘몃━蹂닿린瑜??댁젣?덉뒿?덈떎.', 'info');
  }

  function focusSelectedCableOnMap() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('癒쇱? 耳?대툝???좏깮??二쇱꽭??', 'warn');
      return;
    }
    state.manualPreview = null;
    setActiveTab('routing');
    renderRoutingPanel();
  }

  function renderSelectedCable() {
    const cable = getSelectedCable();
    if (!cable) {
      dom.detailEmpty.classList.remove('hidden');
      dom.detailContent.classList.add('hidden');
      return;
    }

    dom.detailEmpty.classList.add('hidden');
    dom.detailContent.classList.remove('hidden');

    const route = cable.routeBreakdown;
    dom.detailBaseLength.textContent = formatNumber(cable.length);
    dom.detailGraphLength.textContent = formatNumber(route?.graphLength || 0);
    dom.detailTotalLength.textContent = formatNumber(cable.calculatedLength || 0);
    dom.detailMapStatus.textContent = cable.validation?.mapStatus || 'UNCHECKED';

    dom.lengthBreakdown.innerHTML = buildLengthBreakdown(cable);
    dom.validationList.innerHTML = buildValidationList(cable.validation);
    dom.pathCompare.innerHTML = [
      `<div><strong>Original</strong><br>${escapeHtml(cable.path || '-')}</div>`,
      `<div><strong>Calculated</strong><br>${escapeHtml(cable.calculatedPath || '-')}</div>`
    ].join('');

    const mapStats = renderMapCanvas(dom.detailMapCanvas, route, { fitToPath: true });
    dom.detailMapMeta.textContent = route
      ? `?몃뱶 ${route.pathNodes.length}媛?| 2D drawable segment ${mapStats.drawnSegments}/${Math.max(route.pathNodes.length - 1, 0)}`
      : '怨꾩궛??寃쎈줈媛 ?놁뒿?덈떎.';
  }

  function buildLengthBreakdown(cable) {
    const route = cable.routeBreakdown;
    if (!route) {
      return renderIssueItem('warn', '寃쎈줈媛 ?꾩쭅 怨꾩궛?섏? ?딆븯?듬땲??');
    }

    const lines = [
      `BASE LENGTH: ${formatNumber(cable.length)}`,
      `GRAPH LENGTH: ${formatNumber(route.graphLength)}`,
      `FROM_REST: ${formatNumber(route.fromRest)}`,
      `TO_REST: ${formatNumber(route.toRest)}`,
      `TOTAL LENGTH: ${formatNumber(route.totalLength)}`
    ];

    route.edgeSegments.forEach((segment, index) => {
      lines.push(`SEG ${index + 1}: ${segment.from} -> ${segment.to} = ${formatNumber(segment.length)}`);
    });

    return lines.map((line) => renderIssueItem('info', line)).join('');
  }

  function buildValidationList(validation) {
    if (!validation) {
      return renderIssueItem('warn', '寃利앹씠 ?꾩쭅 ?ㅽ뻾?섏? ?딆븯?듬땲??');
    }
    const base = [
      renderIssueItem(validation.status === 'PASS' ? 'success' : validation.status === 'WARN' ? 'warn' : 'fail', `STATUS: ${validation.status}`),
      renderIssueItem(validation.lengthMatched ? 'success' : 'fail', `湲몄씠 寃利? ${validation.lengthMatched ? 'OK' : 'NG'}`),
      renderIssueItem(validation.mapSegmentsMatch ? 'success' : 'warn', `留?寃利? ${validation.mapSegmentsMatch ? 'OK' : 'NG'}`),
      renderIssueItem(validation.coordsReady ? 'success' : 'warn', `醫뚰몴 ?곹깭: ${validation.coordsReady ? 'READY' : 'COORD MISSING'}`)
    ];
    const issues = validation.issues.map((issue) => renderIssueItem(issue.severity, issue.message));
    return [...base, ...issues].join('');
  }

  function renderRoutingPanel() {
    const previewCable = state.manualPreview || getSelectedCable();
    const route = previewCable?.routeBreakdown || null;
    const validation = previewCable?.validation || null;

    if (!route) {
      dom.routePreviewMeta.textContent = '?좏깮??寃쎈줈媛 ?놁뒿?덈떎.';
      dom.routePreviewPath.innerHTML = '';
    } else {
      dom.routePreviewMeta.textContent = [
        `GRAPH ${formatNumber(route.graphLength)}`,
        `FROM_REST ${formatNumber(route.fromRest)}`,
        `TO_REST ${formatNumber(route.toRest)}`,
        `TOTAL ${formatNumber(route.totalLength)}`,
        validation ? `STATUS ${validation.status}` : ''
      ].filter(Boolean).join('  |  ');
      dom.routePreviewPath.innerHTML = route.pathNodes
        .map((node) => `<span class="path-chip">${escapeHtml(node)}</span>`)
        .join('');
    }

    const mapStats = renderMapCanvas(dom.routeMapCanvas, route, { fitToPath: true });
    dom.routeMapMeta.textContent = route
      ? `2D path nodes ${route.pathNodes.length} | drawable segment ${mapStats.drawnSegments}/${Math.max(route.pathNodes.length - 1, 0)}`
      : '寃쎈줈瑜??좏깮?섎㈃ 2D 寃利?留듭씠 ?쒖떆?⑸땲??';

    const threeStats = getActiveTab() === 'routing'
      ? renderThreeScene(route)
      : (disposeThree(), { drawnSegments: countDrawableSegments(route?.pathNodes || []) });
    dom.threeMeta.textContent = route
      ? `3D segment ${threeStats.drawnSegments}/${Math.max(route.pathNodes.length - 1, 0)}`
      : '寃쎈줈瑜??좏깮?섎㈃ 3D 蹂댁“ 酉곌? ?쒖떆?⑸땲??';
  }

