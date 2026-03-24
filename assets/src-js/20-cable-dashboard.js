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
      dom.graphIssueList.innerHTML = renderIssueItem('success', '그래프 이슈가 없습니다.');
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
      dom.cableGridInner.innerHTML = '<div class="empty-state">조건에 맞는 케이블이 없습니다.</div>';
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
      dom.editorStatus.textContent = '선택된 케이블 없음';
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
          issues: [{ severity: 'warn', message: '경로가 변경되었습니다. 재계산이 필요합니다.' }],
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
        ? '체크노드를 강제 적용한 경로로 저장했습니다.'
        : options.recalc
          ? '케이블을 수정하고 재산출 후 저장했습니다.'
          : '케이블을 수정하고 저장했습니다.', 'success');
    } catch (error) {
      console.error(error);
      Object.assign(cable, before);
      populateEditor();
      renderAll();
      pushToast(error.message || '케이블 저장에 실패했습니다.', 'error');
    }
  }

  function validateSelectedCable(announce) {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('검증할 케이블을 선택해 주세요.', 'warn');
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
      pushToast(`${cable.name} 검증을 완료했습니다.`, 'success');
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
    pushToast('입력기 값을 아래 케이블 값으로 되돌립니다.', 'info');
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
    pushToast('새 케이블을 추가했습니다.', 'success');
  }

  function duplicateSelectedCable() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('복제할 케이블을 선택해 주세요.', 'warn');
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
       issues: [{ severity: 'warn', message: '복제 후 재산출이 필요합니다.' }],
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
    pushToast('선택 케이블을 복제했습니다.', 'success');
  }

  function deleteSelectedCable() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('삭제할 케이블을 선택해 주세요.', 'warn');
      return;
    }
    if (!window.confirm(`${cable.name} 케이블을 삭제할까요?`)) {
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
    pushToast('케이블을 삭제했습니다.', 'success');
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
    pushToast('수동 경로 미리보기를 갱신했습니다.', 'success');
  }

  function clearManualPreview() {
    state.manualPreview = null;
    renderRoutingPanel();
     pushToast('수동 미리보기를 해제했습니다.', 'info');
  }

  function focusSelectedCableOnMap() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('먼저 케이블을 선택해 주세요.', 'warn');
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
      renderDashPathTable(null);
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

    if (dom.detailMapCanvas && dom.detailMapCanvas.offsetParent) {
      const mapStats = renderMapCanvas(dom.detailMapCanvas, route, { fitToPath: true });
      dom.detailMapMeta.textContent = route
        ? `노드 ${route.pathNodes.length}개 | 2D drawable segment ${mapStats.drawnSegments}/${Math.max(route.pathNodes.length - 1, 0)}`
        : '계산된 경로가 없습니다.';
    }

    renderDashPathTable(cable);
  }

  function renderDashPathTable(cable) {
    if (!dom.dashPathTable) return;
    if (!cable || !cable.routeBreakdown) {
      dom.dashPathTable.innerHTML = '<div style="padding:6px;color:#64748b;font-size:10px;">더블클릭으로 케이블 선택</div>';
      return;
    }
    const route = cable.routeBreakdown;
    const rows = route.pathNodes.map((nodeName, idx) => {
      const node = state.graph.nodeMap[nodeName];
      const deck = node?.structure || '-';
      const seg = route.edgeSegments[idx] || null;
      const segLen = seg ? formatNumber(seg.length) : '-';
      return `<div class="dash-path-row">
        <div class="dash-path-cell" style="min-width:24px">${idx + 1}</div>
        <div class="dash-path-cell" style="min-width:42px" title="${escapeHtml(deck)}">${escapeHtml(truncate(deck, 8))}</div>
        <div class="dash-path-cell grow" title="${escapeHtml(nodeName)}">${escapeHtml(nodeName)}</div>
        <div class="dash-path-cell" style="min-width:50px;text-align:right">${segLen}</div>
      </div>`;
    });
    dom.dashPathTable.innerHTML = rows.join('');
  }

  function buildLengthBreakdown(cable) {
    const route = cable.routeBreakdown;
    if (!route) {
      return renderIssueItem('warn', '경로가 아직 계산되지 않았습니다.');
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
      return renderIssueItem('warn', '검증이 아직 실행되지 않았습니다.');
    }
    const base = [
      renderIssueItem(validation.status === 'PASS' ? 'success' : validation.status === 'WARN' ? 'warn' : 'fail', `상태: ${validation.status}`),
      renderIssueItem(validation.lengthMatched ? 'success' : 'fail', `길이 검증: ${validation.lengthMatched ? 'OK' : 'NG'}`),
      renderIssueItem(validation.mapSegmentsMatch ? 'success' : 'warn', `맵 검증: ${validation.mapSegmentsMatch ? 'OK' : 'NG'}`),
      renderIssueItem(validation.coordsReady ? 'success' : 'warn', `좌표 상태: ${validation.coordsReady ? 'READY' : 'COORD MISSING'}`)
    ];
    const issues = validation.issues.map((issue) => renderIssueItem(issue.severity, issue.message));
    return [...base, ...issues].join('');
  }

  function renderRoutingPanel() {
    const previewCable = state.manualPreview || getSelectedCable();
    const route = previewCable?.routeBreakdown || null;
    const validation = previewCable?.validation || null;

    if (!route) {
      dom.routePreviewMeta.textContent = '선택된 경로가 없습니다.';
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
      : '경로를 선택하면 2D 검증 맵이 표시됩니다.';

    const threeStats = getActiveTab() === 'routing'
      ? renderThreeScene(route)
      : (disposeThree(), { drawnSegments: countDrawableSegments(route?.pathNodes || []) });
    dom.threeMeta.textContent = route
      ? `3D segment ${threeStats.drawnSegments}/${Math.max(route.pathNodes.length - 1, 0)}`
      : '경로를 선택하면 3D 뷰어 화면이 표시됩니다.';
  }

