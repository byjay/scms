  async function handleDataFile(event, kind) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    try {
      showBusy(`${kind === 'cable' ? '케이블' : '노드'} 파일을 읽는 중입니다...`);
      const payload = await loadFilePayload(file);
      if (kind === 'cable') {
        state.cables = extractCablesFromPayload(payload);
        if (!state.cables.length) {
          pushToast('케이블 파일에서 유효한 데이터를 찾지 못했습니다.', 'warn');
        } else {
          state.selectedCableId = state.cables[0]?.id || null;
          syncRouteInputsFromSelected();
          pushToast(`케이블 ${state.cables.length}건을 불러왔습니다.`, 'success');
        }
      } else {
        state.uploadedNodes = extractNodesFromPayload(payload);
        pushToast(`노드 ${state.uploadedNodes.length}건을 불러왔습니다.`, 'success');
      }

      const stem = fileStem(file.name);
      state.project = {
        ...state.project,
        projectId: normalizeProjectId(state.project.projectId || stem || 'current'),
        projectName: state.project.projectName || defaultProjectName(getProjectGroupCode(), stem),
        groupCode: getProjectGroupCode(),
        fileName: file.name,
        source: 'file',
        dirty: true
      };
      refreshGraph();
      await recalculateAllCables({ quiet: true, skipWhenNoCables: true });
      renderAll();
      commitHistory(kind === 'cable' ? 'cable-file-load' : 'node-file-load');
      updateProjectStatus(`${String(kind || 'file').toUpperCase()} LOADED`);
    } catch (error) {
      console.error(error);
      pushToast(`파일 처리 중 오류가 발생했습니다: ${error.message}`, 'error');
    } finally {
      hideBusy();
      input.value = '';
    }
  }


  const _routeCache = new Map();

  function clearRouteCache() {
    _routeCache.clear();
  }

  function refreshGraph() {
    const merged = mergeNodes(state.embeddedNodes, state.uploadedNodes);
    state.mergedNodes = merged;
    state.graph = buildGraph(merged);
    clearRouteCache();
    syncSelectedNode();
    updateSystemFilterOptions();
  }

  function mergeNodes(embeddedNodes, uploadedNodes) {
    const map = new Map();

    embeddedNodes.forEach((node) => {
      map.set(node.name, { ...node, source: 'embedded' });
    });

    uploadedNodes.forEach((node) => {
      const existing = map.get(node.name);
      if (!existing) {
        map.set(node.name, { ...node, source: 'uploaded' });
        return;
      }

      map.set(node.name, {
        ...existing,
        structure: node.structure || existing.structure,
        component: node.component || existing.component,
        type: node.type || existing.type,
        relations: node.relations.length ? unique(node.relations) : existing.relations,
        linkLength: Number.isFinite(node.linkLength) ? node.linkLength : existing.linkLength,
        areaSize: Number.isFinite(node.areaSize) ? node.areaSize : existing.areaSize,
        x: Number.isFinite(node.x) ? node.x : existing.x,
        y: Number.isFinite(node.y) ? node.y : existing.y,
        z: Number.isFinite(node.z) ? node.z : existing.z,
        pointRaw: node.pointRaw || existing.pointRaw || '',
        hasCoords: Number.isFinite(node.x) && Number.isFinite(node.y) ? true : existing.hasCoords,
        source: 'merged'
      });
    });

    return Array.from(map.values())
      .map((node) => ({
        ...node,
        relations: unique(node.relations),
        hasCoords: Number.isFinite(node.x) && Number.isFinite(node.y)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function buildGraph(nodes) {
    const nodeMap = Object.create(null);
    const adjacency = Object.create(null);
    const pairMap = new Map();
    const issues = {
      missingRelationTargets: [],
      asymmetricRelations: [],
      coordMissingNodes: [],
      disconnectedComponents: []
    };

    nodes.forEach((node) => {
      nodeMap[node.name] = node;
      adjacency[node.name] = [];
      if (!node.hasCoords) {
        issues.coordMissingNodes.push(node.name);
      }
    });

    nodes.forEach((node) => {
      node.relations.forEach((target) => {
        if (!target) return;
        if (!nodeMap[target]) {
          issues.missingRelationTargets.push({ from: node.name, to: target });
          return;
        }
        const key = edgeKey(node.name, target);
        if (!pairMap.has(key)) {
          const [a, b] = sortPair(node.name, target);
          pairMap.set(key, {
            a,
            b,
            refs: new Set(),
            weights: []
          });
        }
        const entry = pairMap.get(key);
        entry.refs.add(`${node.name}>${target}`);
        entry.weights.push(positiveNumber(node.linkLength, 1));
      });
    });

    pairMap.forEach((entry) => {
      const { a, b, refs, weights } = entry;
      const weight = round2(weights.reduce((sum, value) => sum + value, 0) / Math.max(weights.length, 1));
      const aToB = refs.has(`${a}>${b}`);
      const bToA = refs.has(`${b}>${a}`);
      adjacency[a].push({ to: b, weight });
      adjacency[b].push({ to: a, weight });
      entry.weight = weight;
      entry.symmetric = aToB && bToA;
      if (!entry.symmetric) {
        issues.asymmetricRelations.push({
          a,
          b,
          missing: aToB ? `${b}>${a}` : `${a}>${b}`
        });
      }
    });

    const components = detectComponents(nodeMap, adjacency);
    if (components.length > 1) {
      issues.disconnectedComponents = components;
    }

    return { nodeMap, adjacency, pairMap, issues };
  }

  function detectComponents(nodeMap, adjacency) {
    const components = [];
    const visited = new Set();
    Object.keys(nodeMap).forEach((start) => {
      if (visited.has(start)) return;
      const queue = [start];
      const component = [];
      visited.add(start);
      while (queue.length) {
        const current = queue.shift();
        component.push(current);
        (adjacency[current] || []).forEach((edge) => {
          if (!visited.has(edge.to)) {
            visited.add(edge.to);
            queue.push(edge.to);
          }
        });
      }
      components.push(component);
    });
    return components;
  }

  async function recalculateAllCables(options = {}) {
    const quiet = Boolean(options.quiet);
    const skipWhenNoCables = Boolean(options.skipWhenNoCables);

    if (!state.cables.length) {
      if (!skipWhenNoCables && !quiet) {
        pushToast('먼저 케이블 파일을 불러와 주세요.', 'warn');
      }
      return;
    }

    showBusy(`전체 경로를 계산하는 중입니다... 0 / ${state.cables.length}`);
    for (let index = 0; index < state.cables.length; index += 1) {
      const cable = state.cables[index];
      applyRouteToCable(cable);
      cable.validation = validateCable(cable);
      if (index % 120 === 0) {
        dom.busyText.textContent = `전체 경로를 계산하는 중입니다... ${index + 1} / ${state.cables.length}`;
        await pause();
      }
    }
    hideBusy();

    runTripleValidation({ quiet: true });
    state.project.dirty = true;
    renderAll();
    commitHistory('route-all');
    updateProjectStatus('ROUTES RECALCULATED');
    if (!quiet) {
      pushToast(`전체 케이블 ${state.cables.length}건의 경로 계산이 완료됐습니다.`, 'success');
    }
  }

  function applyRouteToCable(cable) {
    const route = computeRouteBreakdown(cable);
    const hasError = route && route.error;
    cable.routeBreakdown = hasError ? null : route;
    cable.routeError = hasError ? route : null;
    cable.calculatedPath = (!hasError && route) ? route.pathNodes.join(' -> ') : '';
    cable.calculatedLength = (!hasError && route) ? route.totalLength : 0;
    return cable;
  }

  function computeRouteBreakdown(sourceCable) {
    const cable = sourceCable || {};
    const from = trimText(cable.fromNode);
    const to = trimText(cable.toNode);
    const checkNodes = parseNodeList(cable.checkNode, false);
    const fromRest = toNumber(cable.fromRest, 0);
    const toRest = toNumber(cable.toRest, 0);

    if (!from || !to) {
      return { error: 'MISSING_ENDPOINTS', from, to, pathNodes: [], totalLength: 0 };
    }
    if (!state.graph.nodeMap[from]) {
      return { error: 'NODE_NOT_FOUND', node: from, pathNodes: [], totalLength: 0 };
    }
    if (!state.graph.nodeMap[to]) {
      return { error: 'NODE_NOT_FOUND', node: to, pathNodes: [], totalLength: 0 };
    }

    if (from === to && checkNodes.length === 0) {
      const node = state.graph.nodeMap[from];
      const graphLength = round2(positiveNumber(node?.linkLength, 0));
      return {
        pathNodes: [from],
        segmentLengths: [graphLength],
        edgeSegments: [{ from, to, length: graphLength }],
        waypointSegments: [],
        graphLength,
        fromRest,
        toRest,
        totalLength: round2(graphLength + fromRest + toRest)
      };
    }

    const targets = [...checkNodes, to];
    const fullPath = [from];
    const waypointSegments = [];

    let current = from;
    for (const target of targets) {
      const segment = dijkstra(current, target);
      if (!segment) {
        return { error: 'DISCONNECTED', from: current, to: target, pathNodes: [], totalLength: 0 };
      }
      waypointSegments.push({
        from: current,
        to: target,
        pathNodes: segment.path,
        length: segment.length
      });
      fullPath.push(...segment.path.slice(1));
      current = target;
    }

    const edgeSegments = [];
    for (let index = 0; index < fullPath.length - 1; index += 1) {
      const edge = getEdgeInfo(fullPath[index], fullPath[index + 1]);
      if (!edge) {
        return { error: 'EDGE_MISSING', from: fullPath[index], to: fullPath[index + 1], pathNodes: [], totalLength: 0 };
      }
      edgeSegments.push({
        from: fullPath[index],
        to: fullPath[index + 1],
        length: round2(edge.weight)
      });
    }

    const graphLength = round2(edgeSegments.reduce((sum, segment) => sum + segment.length, 0));
    return {
      pathNodes: fullPath,
      segmentLengths: edgeSegments.map((segment) => segment.length),
      edgeSegments,
      waypointSegments,
      graphLength,
      fromRest,
      toRest,
      totalLength: round2(graphLength + fromRest + toRest)
    };
  }

  function dijkstra(from, to) {
    if (from === to) {
      return { path: [from], length: 0 };
    }
    if (!state.graph.nodeMap[from] || !state.graph.nodeMap[to]) {
      return null;
    }

    const cacheKey = `${from}::${to}`;
    if (_routeCache.has(cacheKey)) {
      return _routeCache.get(cacheKey);
    }

    const result = _dijkstraCore(from, to);
    if (result) {
      _routeCache.set(cacheKey, result);
    }
    return result;
  }

  function _dijkstraCore(from, to) {
    const heap = new MinHeap();
    const distances = Object.create(null);
    const previous = Object.create(null);
    const settled = new Set();

    Object.keys(state.graph.nodeMap).forEach((name) => {
      distances[name] = Infinity;
      previous[name] = null;
    });
    distances[from] = 0;
    heap.push(0, from);

    while (heap.size) {
      const popped = heap.pop();
      if (!popped) break;
      const [distance, node] = popped;
      if (settled.has(node)) continue;
      settled.add(node);
      if (node === to) break;
      if (distance > distances[node]) continue;
      (state.graph.adjacency[node] || []).forEach((edge) => {
        if (settled.has(edge.to)) return;
        const next = distance + edge.weight;
        if (next < distances[edge.to]) {
          distances[edge.to] = next;
          previous[edge.to] = node;
          heap.push(next, edge.to);
        }
      });
    }

    if (!Number.isFinite(distances[to])) {
      return null;
    }

    const path = [];
    let current = to;
    const guard = new Set();
    while (current) {
      if (guard.has(current)) {
        return null;
      }
      guard.add(current);
      path.unshift(current);
      current = previous[current];
    }

    return path[0] === from ? { path, length: round2(distances[to]) } : null;
  }

  function pathContainsNodesInOrder(pathNodes, checkNodes) {
    if (!checkNodes.length) return true;
    let cursor = -1;
    for (const checkNode of checkNodes) {
      cursor = pathNodes.indexOf(checkNode, cursor + 1);
      if (cursor === -1) {
        return false;
      }
    }
    return true;
  }

  function validateCable(cable) {
    const issues = [];
    const from = trimText(cable.fromNode);
    const to = trimText(cable.toNode);
    const checkNodes = parseNodeList(cable.checkNode, false);
    const route = cable.routeBreakdown || computeRouteBreakdown(cable);

    if (!trimText(cable.system)) addIssue(issues, 'warn', 'CABLE SYSTEM이 비어 있습니다.');
    if (!trimText(cable.type)) addIssue(issues, 'warn', 'CABLE TYPE이 비어 있습니다.');
    if (toNumber(cable.fromRest, 0) < 0 || toNumber(cable.toRest, 0) < 0) {
      addIssue(issues, 'fail', 'FROM_REST 또는 TO_REST 값이 음수입니다.');
    }
    if (cable.outDia && toNumber(cable.outDia, 0) <= 0) {
      addIssue(issues, 'warn', 'CABLE_OUTDIA 값이 0 이하입니다.');
    }
    if (!from) addIssue(issues, 'fail', 'FROM NODE가 비어 있습니다.');
    if (!to) addIssue(issues, 'fail', 'TO NODE가 비어 있습니다.');
    if (from && !state.graph.nodeMap[from]) addIssue(issues, 'fail', `FROM NODE "${from}"가 그래프에 없습니다.`);
    if (to && !state.graph.nodeMap[to]) addIssue(issues, 'fail', `TO NODE "${to}"가 그래프에 없습니다.`);
    const missingChecks = checkNodes.filter((name) => !state.graph.nodeMap[name]);
    if (missingChecks.length) addIssue(issues, 'fail', `CHECK NODE 누락: ${missingChecks.join(', ')}`);

    let isContinuous = false;
    let allEdgesExist = false;
    let coordsReady = false;
    let declaredPathMatch = null;
    let lengthMatched = false;
    let mapSegmentsMatch = false;
    let waypointOrderMatched = checkNodes.length === 0;
    let mapStatus = 'NO PATH';

    if (!route) {
      const errMsg = cable.routeError
        ? `경로 탐색 실패: ${cable.routeError.error} (${cable.routeError.from || ''} → ${cable.routeError.to || ''})`
        : '경로 탐색에 실패했습니다.';
      addIssue(issues, 'fail', errMsg);
    } else {
      const pairs = route.pathNodes.slice(1).map((node, index) => [route.pathNodes[index], node]);
      allEdgesExist = pairs.every(([a, b]) => Boolean(getEdgeInfo(a, b)));
      isContinuous = route.pathNodes[0] === from && route.pathNodes[route.pathNodes.length - 1] === to && allEdgesExist;
      if (!allEdgesExist) {
        addIssue(issues, 'fail', '계산된 path 안에 실제 relation edge가 없는 구간이 있습니다.');
      }
      const recalculatedGraph = round2(route.segmentLengths.reduce((sum, value) => sum + value, 0));
      if (!approx(recalculatedGraph, route.graphLength)) {
        addIssue(issues, 'fail', 'segment 길이 합과 graphLength가 서로 다릅니다.');
      }
      waypointOrderMatched = pathContainsNodesInOrder(route.pathNodes, checkNodes);
      if (!waypointOrderMatched) {
        addIssue(issues, 'fail', 'CHECK_NODE 순서가 계산 경로에 반영되지 않았습니다.');
      }
      const expectedTotal = round2(route.graphLength + toNumber(cable.fromRest, 0) + toNumber(cable.toRest, 0));
      lengthMatched = approx(expectedTotal, cable.calculatedLength || route.totalLength);
      if (!lengthMatched) {
        addIssue(issues, 'fail', 'TOTAL LENGTH에 FROM_REST / TO_REST 반영이 맞지 않습니다.');
      }
      if (cable.length > 0 && !approx(cable.length, expectedTotal)) {
        addIssue(issues, 'warn', 'POR_LENGTH와 계산된 TOTAL LENGTH가 다릅니다.');
      }

      const coordsMissing = route.pathNodes.filter((name) => !state.graph.nodeMap[name]?.hasCoords);
      coordsReady = coordsMissing.length === 0;
      if (!coordsReady) {
        addIssue(issues, 'warn', `좌표 없는 노드: ${coordsMissing.join(', ')}`);
      }

      const expectedSegments = Math.max(0, route.pathNodes.length - 1);
      const drawableSegments = countDrawableSegments(route.pathNodes);
      mapSegmentsMatch = drawableSegments === expectedSegments;
      mapStatus = !route.pathNodes.length ? 'NO PATH' : coordsReady ? 'READY' : 'COORD MISSING';
      if (!mapSegmentsMatch) {
        addIssue(issues, coordsReady ? 'fail' : 'warn', `맵 렌더 가능 구간 ${drawableSegments}/${expectedSegments}`);
      }

      if (cable.path) {
        declaredPathMatch = arraysEqual(parsePathString(cable.path), route.pathNodes);
        if (!declaredPathMatch) {
          addIssue(issues, 'warn', '원본 PATH와 계산 PATH가 다릅니다.');
        }
      }

      const asymmetricHits = pairs.filter(([a, b]) => {
        const edge = getEdgeInfo(a, b);
        return edge && !edge.symmetric;
      });
      if (asymmetricHits.length) {
        addIssue(issues, 'warn', `비대칭 relation 구간 포함: ${asymmetricHits.map((pair) => pair.join(' <-> ')).join(', ')}`);
      }
    }

    const status = issues.some((issue) => issue.severity === 'fail')
      ? 'FAIL'
      : issues.length
        ? 'WARN'
        : 'PASS';

    return {
      status,
      issues,
      isContinuous,
      allEdgesExist,
      coordsReady,
      declaredPathMatch,
      lengthMatched,
      mapSegmentsMatch,
      waypointOrderMatched,
      mapStatus
    };
  }

  function runTripleValidation(options = {}) {
    if (!state.cables.length) {
      state.validationRunAt = new Date();
      state.diagnostics = {
        pass: 0,
        warn: 0,
        fail: 0,
        pending: 0,
        graphIssues: totalGraphIssues()
      };
      return;
    }

    state.cables.forEach((cable) => {
      if (!cable.routeBreakdown) {
        applyRouteToCable(cable);
      }
      cable.validation = validateCable(cable);
    });

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

    if (!options.quiet) {
      pushToast('Graph / Route / Map 3중 검증을 완료했습니다.', 'success');
    }
  }

  function totalGraphIssues() {
    const issues = state.graph.issues;
    return issues.missingRelationTargets.length +
      issues.asymmetricRelations.length +
      issues.disconnectedComponents.length;
  }

  function getEdgeInfo(a, b) {
    return state.graph.pairMap.get(edgeKey(a, b)) || null;
  }

  function edgeKey(a, b) {
    const [left, right] = sortPair(a, b);
    return `${left}__${right}`;
  }

  function sortPair(a, b) {
    return a <= b ? [a, b] : [b, a];
  }

  class MinHeap {
    constructor() {
      this.items = [];
    }

    push(distance, value) {
      this.items.push([distance, value]);
      this.#bubbleUp(this.items.length - 1);
    }

    pop() {
      if (!this.items.length) return null;
      const top = this.items[0];
      const last = this.items.pop();
      if (this.items.length && last) {
        this.items[0] = last;
        this.#bubbleDown(0);
      }
      return top;
    }

    get size() {
      return this.items.length;
    }

    #bubbleUp(index) {
      while (index > 0) {
        const parent = Math.floor((index - 1) / 2);
        if (this.items[parent][0] <= this.items[index][0]) break;
        [this.items[parent], this.items[index]] = [this.items[index], this.items[parent]];
        index = parent;
      }
    }

    #bubbleDown(index) {
      const length = this.items.length;
      while (true) {
        let target = index;
        const left = index * 2 + 1;
        const right = left + 1;
        if (left < length && this.items[left][0] < this.items[target][0]) target = left;
        if (right < length && this.items[right][0] < this.items[target][0]) target = right;
        if (target === index) break;
        [this.items[target], this.items[index]] = [this.items[index], this.items[target]];
        index = target;
      }
    }
