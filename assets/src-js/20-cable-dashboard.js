  }

  let activeDeckFilter = 'ALL';

  // renderAll() is defined in 60-auth-groupspace-final.js (final version with all panels)

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
      // Deck tree filter
      if (activeDeckFilter && activeDeckFilter !== 'ALL') {
        const deck = (cable.supplyDeck || cable.fromRoom || 'UNKNOWN').trim().toUpperCase();
        if (deck !== activeDeckFilter) return false;
      }
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
      row.innerHTML = GRID_COLUMNS.map((column) => renderGridCell(cable, column, index)).join('');
      row.addEventListener('click', () => selectCable(cable.id));
      row.addEventListener('dblclick', () => selectCable(cable.id, { focusEditor: true }));
      dom.cableGridInner.appendChild(row);
    }
  }

  function renderGridCell(cable, column, rowIndex) {
    let content = '';
    let title = '';
    const value = cable[column.key];

    if (column.special === 'rowNum') {
      content = String(rowIndex + 1);
      title = content;
    } else if (column.special === 'validation') {
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

    renderAlternativeRoutes(previewCable);
  }

  function renderAlternativeRoutes(cable) {
    if (!dom.alternativeRoutesPanel) {
      const panel = document.createElement('div');
      panel.id = 'alternativeRoutesPanel';
      panel.className = 'alt-routes-panel';
      const routePanel = dom.routePreviewMeta?.parentElement;
      if (routePanel) {
        routePanel.appendChild(panel);
      }
      dom.alternativeRoutesPanel = panel;
    }

    if (!cable || !trimText(cable.fromNode) || !trimText(cable.toNode)) {
      dom.alternativeRoutesPanel.innerHTML = '';
      return;
    }

    const alternatives = computeAlternativeRoutes(cable);
    if (alternatives.length <= 1) {
      dom.alternativeRoutesPanel.innerHTML = '<div class="alt-route-empty">대안 경로가 없습니다.</div>';
      return;
    }

    const currentPath = cable.calculatedPath || '';
    let html = '<div class="alt-routes-header">대안 경로 비교 (K-Shortest Paths)</div>';
    html += '<div class="alt-routes-grid">';

    for (const alt of alternatives) {
      const isCurrent = alt.path.join(' > ') === currentPath.replace(/\s*>\s*/g, ' > ');
      const colorClass = alt.rank === 1 ? 'alt-route-best' : alt.rank === 2 ? 'alt-route-second' : 'alt-route-third';

      html += `<div class="alt-route-card ${colorClass}${isCurrent ? ' alt-route-current' : ''}" data-alt-rank="${alt.rank}">`;
      html += `<div class="alt-route-rank">${alt.rank === 1 ? '최단' : alt.rank === 2 ? '2순위' : '3순위'}${isCurrent ? ' (현재)' : ''}</div>`;
      html += `<div class="alt-route-length">TOTAL ${formatNumber(alt.totalLength)} m</div>`;
      html += `<div class="alt-route-detail">GRAPH ${formatNumber(alt.graphLength)} | 노드 ${alt.nodeCount}개 | 구간 ${alt.segments.length}개</div>`;
      html += `<div class="alt-route-path">${alt.path.map((n) => `<span class="path-chip">${escapeHtml(n)}</span>`).join('')}</div>`;
      if (!isCurrent) {
        html += `<button class="alt-route-apply-btn" data-alt-rank="${alt.rank}" onclick="void(0)">이 경로 적용</button>`;
      }
      html += '</div>';
    }

    html += '</div>';

    const optimization = suggestRoutingOptimization(15);
    if (optimization.length) {
      html += '<div class="alt-routes-header" style="margin-top:12px">라우팅 최적화 제안</div>';
      html += '<div class="optimization-suggestions">';
      for (const sug of optimization.slice(0, 5)) {
        html += `<div class="optimization-item">`;
        html += `<span class="opt-node">${escapeHtml(sug.nodeName)}</span>`;
        html += ` 케이블 ${sug.cableCount}개 통과`;
        if (sug.redistributable > 0) {
          html += ` | 재분배 가능 ${sug.redistributable}개`;
          if (sug.potentialLengthDelta !== 0) {
            html += ` | 길이 변화 ${sug.potentialLengthDelta > 0 ? '+' : ''}${formatNumber(sug.potentialLengthDelta)} m`;
          }
        }
        html += '</div>';
      }
      html += '</div>';
    }

    dom.alternativeRoutesPanel.innerHTML = html;

    dom.alternativeRoutesPanel.querySelectorAll('.alt-route-apply-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rank = parseInt(btn.dataset.altRank, 10);
        const selected = alternatives.find((a) => a.rank === rank);
        if (selected && cable) {
          cable.calculatedPath = selected.path.join(' > ');
          cable.calculatedLength = selected.totalLength;
          const edgeSegments = selected.segments.map((seg) => ({
            from: seg.from,
            to: seg.to,
            length: seg.length
          }));
          cable.routeBreakdown = {
            pathNodes: selected.path,
            segmentLengths: edgeSegments.map((seg) => seg.length),
            edgeSegments: edgeSegments,
            waypointSegments: [{ from: cable.fromNode, to: cable.toNode, path: selected.path, length: selected.graphLength }],
            graphLength: selected.graphLength,
            fromRest: selected.fromRest,
            toRest: selected.toRest,
            totalLength: selected.totalLength
          };
          cable.validation = validateCable(cable);
          state.project.dirty = true;
          commitHistory('apply-alt-route');
          renderRoutingPanel();
          renderSelectedCable();
          renderGrid();
          pushToast(`${rank}순위 경로를 적용했습니다. (${formatNumber(selected.totalLength)} m)`, 'success');
        }
      });
    });
  }

  // ============================================================
  // Cable Type Tab
  // ============================================================
  const CT_COLUMNS = [
    { key: 'type', label: 'TYPE', width: '180px' },
    { key: 'od', label: 'O.D.', width: '70px' },
    { key: 'area', label: 'AREA', width: '80px' },
    { key: 'weight', label: 'WEIGHT', width: '80px' },
    { key: 'din', label: 'DIN', width: '140px' },
    { key: 'voltage', label: 'VOLTAGE', width: '200px' },
    { key: 'gland', label: 'GLAND SIZE', width: '90px' }
  ];
  const CT_TEMPLATE = CT_COLUMNS.map((c) => c.width).join(' ');

  function renderCableTypeTab() {
    const header = document.getElementById('cableTypeGridHeader');
    const viewport = document.getElementById('cableTypeGridViewport');
    const inner = document.getElementById('cableTypeGridInner');
    const searchEl = document.getElementById('cableTypeSearch');
    const countEl = document.getElementById('cableTypeCount');
    if (!header || !inner) return;

    const search = (searchEl ? trimText(searchEl.value) : '').toLowerCase();
    const allEntries = Object.values(CABLE_TYPE_DB);
    const filtered = search
      ? allEntries.filter((entry) => {
          const haystack = [entry.type, entry.din, entry.voltage, entry.gland, String(entry.od), String(entry.weight)].join(' ').toLowerCase();
          return haystack.includes(search);
        })
      : allEntries;

    if (countEl) countEl.textContent = `${filtered.length} / ${allEntries.length}`;

    header.style.gridTemplateColumns = CT_TEMPLATE;
    header.innerHTML = CT_COLUMNS.map((c) => `<div class="grid-header-cell">${escapeHtml(c.label)}</div>`).join('');

    inner.style.height = `${Math.max(filtered.length * ROW_HEIGHT, (viewport ? viewport.clientHeight : 420))}px`;
    inner.innerHTML = '';

    if (!filtered.length) {
      inner.style.height = '0px';
      inner.innerHTML = '<div class="empty-state">조건에 맞는 Cable Type이 없습니다.</div>';
      return;
    }

    const viewportHeight = viewport ? viewport.clientHeight : 560;
    const scrollTop = viewport ? viewport.scrollTop : 0;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 6);
    const end = Math.min(filtered.length - 1, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + 8);

    for (let i = start; i <= end; i += 1) {
      const entry = filtered[i];
      const row = document.createElement('div');
      row.className = 'grid-row';
      row.style.top = `${i * ROW_HEIGHT}px`;
      row.style.height = `${ROW_HEIGHT}px`;
      row.style.gridTemplateColumns = CT_TEMPLATE;
      row.innerHTML = CT_COLUMNS.map((col) => {
        const val = entry[col.key];
        const text = val == null || val === '' ? '-' : String(val);
        return `<div class="grid-cell" title="${escapeHtml(text)}">${escapeHtml(text)}</div>`;
      }).join('');
      inner.appendChild(row);
    }
  }

  (function initCableTypeTab() {
    const searchEl = document.getElementById('cableTypeSearch');
    const viewport = document.getElementById('cableTypeGridViewport');
    if (searchEl) {
      searchEl.addEventListener('input', () => renderCableTypeTab());
    }
    if (viewport) {
      viewport.addEventListener('scroll', () => renderCableTypeTab());
    }
  })();

  // ============================================================
  // Deck Tree (Cable Group by Deck)
  // ============================================================

  function buildDeckTree() {
    const listEl = document.getElementById('deckTreeList');
    if (!listEl) return;

    const deckMap = {};
    state.cables.forEach((cable) => {
      const deck = (cable.supplyDeck || cable.fromRoom || 'UNKNOWN').trim().toUpperCase();
      if (!deckMap[deck]) deckMap[deck] = 0;
      deckMap[deck] += 1;
    });

    const decks = Object.keys(deckMap).sort();
    let html = `<div class="deck-tree-item${activeDeckFilter === 'ALL' ? ' active' : ''}" data-deck="ALL">
      <span>ALL</span><span class="deck-count">${state.cables.length}</span></div>`;
    decks.forEach((deck) => {
      html += `<div class="deck-tree-item${activeDeckFilter === deck ? ' active' : ''}" data-deck="${escapeHtml(deck)}">
        <span>${escapeHtml(deck)}</span><span class="deck-count">${deckMap[deck]}</span></div>`;
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.deck-tree-item').forEach((item) => {
      item.addEventListener('click', () => {
        activeDeckFilter = item.dataset.deck;
        buildDeckTree();
        renderGrid();
      });
    });
  }

  // ============================================================
  // Sub-Tab Switching (Schedule / Cable List / Node List)
  // ============================================================

  let activeSubTab = 'schedule';
  let cableListGroupFilter = 'ALL';

  function initSubTabs() {
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subTabPanels = document.querySelectorAll('.sub-tab-panel');
    subTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.subtab;
        activeSubTab = target;
        subTabBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.subtab === target));
        subTabPanels.forEach((p) => p.classList.toggle('is-active', p.dataset.subpanel === target));
        if (target === 'cablelist') renderCableListTab();
        if (target === 'nodelist') renderNodeListTab();
      });
    });
  }

  // ============================================================
  // Cable List Tab (Excel-style full spreadsheet)
  // ============================================================

  const CABLE_LIST_COLUMNS = [
    { key: '_rowNum', label: 'No', width: 38, className: 'mono' },
    { key: 'system', label: 'SYSTEM', width: 90 },
    { key: 'wdPage', label: 'WD_PAGE', width: 56, className: 'mono' },
    { key: 'name', label: 'CABLE_NAME', width: 130 },
    { key: 'compName', label: 'COMP_NAME', width: 90 },
    { key: 'type', label: 'TYPE', width: 70 },
    { key: 'supplyDeck', label: 'DECK', width: 60 },
    { key: 'fromRoom', label: 'FROM_ROOM', width: 100 },
    { key: 'fromEquip', label: 'FROM_EQUIP', width: 120 },
    { key: 'fromNode', label: 'FROM_NODE', width: 80 },
    { key: 'fromRest', label: 'F_REST', width: 55, className: 'mono' },
    { key: 'toRoom', label: 'TO_ROOM', width: 100 },
    { key: 'toEquip', label: 'TO_EQUIP', width: 120 },
    { key: 'toNode', label: 'TO_NODE', width: 80 },
    { key: 'toRest', label: 'T_REST', width: 55, className: 'mono' },
    { key: 'length', label: 'LENGTH', width: 65, className: 'mono' },
    { key: 'outDia', label: 'OD', width: 50, className: 'mono' },
    { key: 'checkNode', label: 'CHECK_NODE', width: 100 },
    { key: 'path', label: 'PATH', width: 160, className: 'path-cell' },
    { key: 'calculatedPath', label: 'CALC_PATH', width: 160, className: 'path-cell' },
    { key: 'calculatedLength', label: 'CALC_LEN', width: 70, className: 'mono' },
    { key: 'porWeight', label: 'WEIGHT', width: 60, className: 'mono' },
    { key: 'cableWeight', label: 'C_WEIGHT', width: 65, className: 'mono' },
    { key: 'remark', label: 'REMARK', width: 120 },
    { key: 'revision', label: 'REV', width: 40, className: 'mono' }
  ];
  const CABLE_LIST_TEMPLATE = CABLE_LIST_COLUMNS.map((c) => c.width + 'px').join(' ');

  function getFilteredCableList() {
    const search = trimText(document.getElementById('cableListSearch')?.value || '').toLowerCase();
    const sysFilter = document.getElementById('cableListSystemFilter')?.value || 'ALL';
    const deckFilter = document.getElementById('cableListDeckFilter')?.value || 'ALL';

    return state.cables.filter((cable) => {
      if (cableListGroupFilter !== 'ALL') {
        const deck = (cable.supplyDeck || cable.fromRoom || 'UNKNOWN').trim().toUpperCase();
        if (deck !== cableListGroupFilter) return false;
      }
      if (sysFilter !== 'ALL' && cable.system !== sysFilter) return false;
      if (deckFilter !== 'ALL') {
        const deck = (cable.supplyDeck || cable.fromRoom || 'UNKNOWN').trim().toUpperCase();
        if (deck !== deckFilter) return false;
      }
      if (!search) return true;
      const hay = [cable.name, cable.type, cable.system, cable.fromNode, cable.toNode,
        cable.fromEquip, cable.toEquip, cable.fromRoom, cable.toRoom, cable.checkNode,
        cable.path, cable.remark].join(' ').toLowerCase();
      return hay.includes(search);
    });
  }

  function renderCableListHeader() {
    const header = document.getElementById('cableListHeader');
    if (!header) return;
    header.style.gridTemplateColumns = CABLE_LIST_TEMPLATE;
    header.className = 'grid-header';
    header.innerHTML = CABLE_LIST_COLUMNS.map((col) =>
      `<div class="grid-head-cell ${col.className || ''}" title="${col.label}">${col.label}</div>`
    ).join('');
  }

  function renderCableListTab() {
    const cables = getFilteredCableList();
    const countEl = document.getElementById('cableListCount');
    if (countEl) countEl.textContent = `${formatInt(cables.length)} / ${formatInt(state.cables.length)}`;

    renderCableListHeader();
    renderCableListSidebar();
    updateCableListFilters();

    const viewport = document.getElementById('cableListViewport');
    const inner = document.getElementById('cableListInner');
    if (!viewport || !inner) return;

    inner.style.height = `${Math.max(cables.length * ROW_HEIGHT, viewport.clientHeight || 400)}px`;
    inner.innerHTML = '';

    if (!cables.length) {
      inner.style.height = '0px';
      inner.innerHTML = '<div class="empty-state">조건에 맞는 케이블이 없습니다.</div>';
      return;
    }

    const vH = viewport.clientHeight || 500;
    const scrollTop = viewport.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 4);
    const end = Math.min(cables.length - 1, Math.ceil((scrollTop + vH) / ROW_HEIGHT) + 6);

    for (let i = start; i <= end; i++) {
      const cable = cables[i];
      const row = document.createElement('div');
      row.className = 'grid-row';
      row.style.top = `${i * ROW_HEIGHT}px`;
      row.style.height = `${ROW_HEIGHT}px`;
      row.style.gridTemplateColumns = CABLE_LIST_TEMPLATE;
      row.innerHTML = CABLE_LIST_COLUMNS.map((col) => {
        let text;
        if (col.key === '_rowNum') {
          text = String(i + 1);
        } else if (col.key === 'calculatedLength') {
          text = formatNumber(cable.calculatedLength || 0);
        } else if (['length', 'fromRest', 'toRest', 'outDia', 'porWeight', 'cableWeight'].includes(col.key)) {
          const v = cable[col.key];
          text = v != null && v !== '' ? formatNumber(v) : '-';
        } else {
          const v = cable[col.key];
          text = v == null || v === '' ? '-' : String(v);
        }
        const cls = ['grid-cell', col.className || ''].filter(Boolean).join(' ');
        return `<div class="${cls}" title="${escapeHtml(text)}">${escapeHtml(text)}</div>`;
      }).join('');
      row.addEventListener('click', () => {
        selectCable(cable.id);
        // Switch to schedule to show editor
        document.querySelector('.sub-tab-btn[data-subtab="schedule"]')?.click();
      });
      inner.appendChild(row);
    }
  }

  function renderCableListSidebar() {
    const listEl = document.getElementById('cableListGroupList');
    if (!listEl) return;

    const deckMap = {};
    state.cables.forEach((cable) => {
      const deck = (cable.supplyDeck || cable.fromRoom || 'UNKNOWN').trim().toUpperCase();
      if (!deckMap[deck]) deckMap[deck] = 0;
      deckMap[deck] += 1;
    });

    const decks = Object.keys(deckMap).sort();
    let html = `<div class="list-tab-sidebar-item${cableListGroupFilter === 'ALL' ? ' is-active' : ''}" data-group="ALL">
      <span>ALL</span><span class="list-tab-sidebar-count">${state.cables.length}</span></div>`;
    decks.forEach((dk) => {
      html += `<div class="list-tab-sidebar-item${cableListGroupFilter === dk ? ' is-active' : ''}" data-group="${escapeHtml(dk)}">
        <span>${escapeHtml(dk)}</span><span class="list-tab-sidebar-count">${deckMap[dk]}</span></div>`;
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.list-tab-sidebar-item').forEach((item) => {
      item.addEventListener('click', () => {
        cableListGroupFilter = item.dataset.group;
        renderCableListTab();
      });
    });
  }

  function updateCableListFilters() {
    const sysFilter = document.getElementById('cableListSystemFilter');
    const deckFilter = document.getElementById('cableListDeckFilter');

    if (sysFilter && sysFilter.options.length <= 1) {
      const systems = [...new Set(state.cables.map((c) => c.system).filter(Boolean))].sort();
      systems.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s; opt.textContent = s;
        sysFilter.appendChild(opt);
      });
    }

    if (deckFilter && deckFilter.options.length <= 1) {
      const decks = [...new Set(state.cables.map((c) =>
        (c.supplyDeck || c.fromRoom || 'UNKNOWN').trim().toUpperCase()
      ).filter(Boolean))].sort();
      decks.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        deckFilter.appendChild(opt);
      });
    }
  }

  // ============================================================
  // Node List Tab (Excel-style full spreadsheet)
  // ============================================================

  const NODE_LIST_TAB_COLUMNS = [
    { key: '_rowNum', label: 'No', width: 38, className: 'mono' },
    { key: 'name', label: 'NODE_RNAME', width: 110 },
    { key: 'structure', label: 'STRUCTURE', width: 100 },
    { key: 'component', label: 'COMPONENT', width: 90 },
    { key: 'type', label: 'NODE_TYPE', width: 75 },
    { key: 'deck', label: 'DECK', width: 55 },
    { key: 'cableCount', label: 'CABLES', width: 55, className: 'mono' },
    { key: 'relationNames', label: 'RELATION', width: 200 },
    { key: 'linkLength', label: 'LINK_LEN', width: 70, className: 'mono' },
    { key: 'nodeAreaSize', label: 'AREA', width: 65, className: 'mono' },
    { key: 'recommendedTrayWidth', label: 'TRAY_W', width: 65, className: 'mono' },
    { key: 'areaFillRatio', label: 'FILL_%', width: 55, className: 'mono' },
    { key: 'pointRaw', label: 'POINT', width: 220 }
  ];
  const NODE_LIST_TAB_TEMPLATE = NODE_LIST_TAB_COLUMNS.map((c) => c.width + 'px').join(' ');

  function getFilteredNodeList() {
    const search = trimText(document.getElementById('nodeListSearch')?.value || '').toLowerCase();
    const deckFilter = document.getElementById('nodeListDeckFilter')?.value || 'ALL';
    const typeFilter = document.getElementById('nodeListTypeFilter')?.value || 'ALL';

    return state.mergedNodes.filter((node) => {
      if (deckFilter !== 'ALL') {
        const deck = (node.name || '').substring(0, 2).toUpperCase();
        if (deck !== deckFilter) return false;
      }
      if (typeFilter !== 'ALL' && node.type !== typeFilter) return false;
      if (!search) return true;
      const hay = [node.name, node.structure, node.component, node.type,
        node.relationNames, node.pointRaw].join(' ').toLowerCase();
      return hay.includes(search);
    });
  }

  function renderNodeListTabHeader() {
    const header = document.getElementById('nodeListTabHeader');
    if (!header) return;
    header.style.gridTemplateColumns = NODE_LIST_TAB_TEMPLATE;
    header.className = 'grid-header';
    header.innerHTML = NODE_LIST_TAB_COLUMNS.map((col) =>
      `<div class="grid-head-cell ${col.className || ''}" title="${col.label}">${col.label}</div>`
    ).join('');
  }

  function renderNodeListTab() {
    const nodes = getFilteredNodeList();
    const countEl = document.getElementById('nodeListTabCount');
    if (countEl) countEl.textContent = `${formatInt(nodes.length)} / ${formatInt(state.mergedNodes.length)}`;

    renderNodeListTabHeader();
    updateNodeListFilters();

    const viewport = document.getElementById('nodeListTabViewport');
    const inner = document.getElementById('nodeListTabInner');
    if (!viewport || !inner) return;

    inner.style.height = `${Math.max(nodes.length * ROW_HEIGHT, viewport.clientHeight || 400)}px`;
    inner.innerHTML = '';

    if (!nodes.length) {
      inner.style.height = '0px';
      inner.innerHTML = '<div class="empty-state">조건에 맞는 노드가 없습니다.</div>';
      return;
    }

    const vH = viewport.clientHeight || 500;
    const scrollTop = viewport.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 4);
    const end = Math.min(nodes.length - 1, Math.ceil((scrollTop + vH) / ROW_HEIGHT) + 6);

    for (let i = start; i <= end; i++) {
      const node = nodes[i];
      const gNode = state.graph.nodeMap[node.name];
      const row = document.createElement('div');
      row.className = 'grid-row';
      row.style.top = `${i * ROW_HEIGHT}px`;
      row.style.height = `${ROW_HEIGHT}px`;
      row.style.gridTemplateColumns = NODE_LIST_TAB_TEMPLATE;

      row.innerHTML = NODE_LIST_TAB_COLUMNS.map((col) => {
        let text;
        if (col.key === '_rowNum') {
          text = String(i + 1);
        } else if (col.key === 'deck') {
          text = (node.name || '').substring(0, 2).toUpperCase() || '-';
        } else if (col.key === 'cableCount') {
          text = String(gNode?.cables?.length || 0);
        } else if (col.key === 'relationNames') {
          const rels = gNode?.relations || node.relations;
          text = Array.isArray(rels) ? rels.map((r) => typeof r === 'string' ? r : r.target).join(', ') : String(rels || '-');
        } else if (col.key === 'linkLength') {
          const rels = gNode?.relations || node.relations || [];
          if (Array.isArray(rels) && rels.length && typeof rels[0] === 'object') {
            text = rels.map((r) => r.length ?? '-').join(', ');
          } else {
            text = node.linkLength || '-';
          }
        } else if (col.key === 'nodeAreaSize') {
          text = gNode?.nodeAreaSize ? formatNumber(gNode.nodeAreaSize) : '-';
        } else if (col.key === 'recommendedTrayWidth') {
          text = gNode?.recommendedTrayWidth ? formatNumber(gNode.recommendedTrayWidth) : '-';
        } else if (col.key === 'areaFillRatio') {
          text = gNode?.areaFillRatio != null ? formatNumber(gNode.areaFillRatio) + '%' : '-';
        } else if (col.key === 'pointRaw') {
          text = node.point || (gNode?.hasCoords ? `${gNode.x},${gNode.y},${gNode.z || 0}` : '-');
        } else {
          const v = node[col.key];
          text = v == null || v === '' ? '-' : String(v);
        }
        const cls = ['grid-cell', col.className || ''].filter(Boolean).join(' ');
        return `<div class="${cls}" title="${escapeHtml(String(text))}">${escapeHtml(String(text))}</div>`;
      }).join('');

      row.addEventListener('click', () => {
        selectNode(node.name);
      });
      inner.appendChild(row);
    }
  }

  function updateNodeListFilters() {
    const deckFilter = document.getElementById('nodeListDeckFilter');
    const typeFilter = document.getElementById('nodeListTypeFilter');

    if (deckFilter && deckFilter.options.length <= 1) {
      const decks = [...new Set(state.mergedNodes.map((n) =>
        (n.name || '').substring(0, 2).toUpperCase()
      ).filter(Boolean))].sort();
      decks.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        deckFilter.appendChild(opt);
      });
    }

    if (typeFilter && typeFilter.options.length <= 1) {
      const types = [...new Set(state.mergedNodes.map((n) => n.type).filter(Boolean))].sort();
      types.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        typeFilter.appendChild(opt);
      });
    }
  }

  // Init sub-tabs and list-tab scroll listeners
  (function initListTabs() {
    initSubTabs();

    const clSearch = document.getElementById('cableListSearch');
    const clSysFilter = document.getElementById('cableListSystemFilter');
    const clDeckFilter = document.getElementById('cableListDeckFilter');
    const clViewport = document.getElementById('cableListViewport');

    if (clSearch) clSearch.addEventListener('input', () => renderCableListTab());
    if (clSysFilter) clSysFilter.addEventListener('change', () => renderCableListTab());
    if (clDeckFilter) clDeckFilter.addEventListener('change', () => renderCableListTab());
    if (clViewport) clViewport.addEventListener('scroll', () => renderCableListTab());

    const nlSearch = document.getElementById('nodeListSearch');
    const nlDeckFilter = document.getElementById('nodeListDeckFilter');
    const nlTypeFilter = document.getElementById('nodeListTypeFilter');
    const nlViewport = document.getElementById('nodeListTabViewport');

    if (nlSearch) nlSearch.addEventListener('input', () => renderNodeListTab());
    if (nlDeckFilter) nlDeckFilter.addEventListener('change', () => renderNodeListTab());
    if (nlTypeFilter) nlTypeFilter.addEventListener('change', () => renderNodeListTab());
    if (nlViewport) nlViewport.addEventListener('scroll', () => renderNodeListTab());
  })();


