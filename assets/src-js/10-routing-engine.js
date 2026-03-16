  async function handleDataFile(event, kind) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    try {
      showBusy(`${kind === 'cable' ? '耳?대툝' : '?몃뱶'} ?뚯씪???쎈뒗 以묒엯?덈떎...`);
      const payload = await loadFilePayload(file);
      if (kind === 'cable') {
        state.cables = extractCablesFromPayload(payload);
        if (!state.cables.length) {
          pushToast('耳?대툝 ?뚯씪?먯꽌 ?좏슚???곗씠?곕? 李얠? 紐삵뻽?듬땲??', 'warn');
        } else {
          state.selectedCableId = state.cables[0]?.id || null;
          syncRouteInputsFromSelected();
          pushToast(`耳?대툝 ${state.cables.length}嫄댁쓣 遺덈윭?붿뒿?덈떎.`, 'success');
        }
      } else {
        state.uploadedNodes = extractNodesFromPayload(payload);
        pushToast(`?낅줈???몃뱶 ${state.uploadedNodes.length}嫄댁쓣 遺덈윭?붿뒿?덈떎.`, 'success');
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
      pushToast(`?뚯씪 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎: ${error.message}`, 'error');
    } finally {
      hideBusy();
      input.value = '';
    }
  }

  async function legacyHandleProjectImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      showBusy('?꾨줈?앺듃 JSON???쎈뒗 以묒엯?덈떎...');
      const payload = await loadFilePayload(file);
      if (!payload || typeof payload !== 'object' || !Array.isArray(payload.cables)) {
        throw new Error('?꾨줈?앺듃 JSON ?뺤떇???щ컮瑜댁? ?딆뒿?덈떎.');
      }

      state.cables = payload.cables.map((cable, index) => normalizeCableRecord(cable, index));
      state.uploadedNodes = Array.isArray(payload.nodes) ? payload.nodes.map((node, index) => normalizeNodeRecord(node, 'uploaded', index)) : [];
      refreshGraph();
      await recalculateAllCables({ quiet: true, skipWhenNoCables: true });
      state.selectedCableId = state.cables[0]?.id || null;
      syncRouteInputsFromSelected();
      renderAll();
      pushToast('?꾨줈?앺듃 JSON??遺덈윭?붿뒿?덈떎.', 'success');
    } catch (error) {
      console.error(error);
      pushToast(`JSON 媛?몄삤湲??ㅽ뙣: ${error.message}`, 'error');
    } finally {
      hideBusy();
      event.target.value = '';
    }
  }

  async function legacyLoadFilePayload(file) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') {
      const text = await file.text();
      return JSON.parse(text);
    }

    if (!window.XLSX) {
      throw new Error('XLSX ?쇱씠釉뚮윭由ш? 濡쒕뱶?섏? ?딆븯?듬땲??');
    }

    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return window.XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
  }

  function legacyExtractCablesFromPayload(payload) {
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.cables)
        ? payload.cables
        : [];

    return rows
      .map((row, index) => normalizeCableRecord(row, index))
      .filter((cable) => cable.name);
  }

  function legacyExtractNodesFromPayload(payload) {
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.nodes)
        ? payload.nodes
        : [];

    return rows
      .map((row, index) => normalizeNodeRecord(row, 'uploaded', index))
      .filter((node) => node.name);
  }

  function refreshGraph() {
    const merged = mergeNodes(state.embeddedNodes, state.uploadedNodes);
    state.mergedNodes = merged;
    state.graph = buildGraph(merged);
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
        pushToast('癒쇱? 耳?대툝 ?뚯씪??遺덈윭? 二쇱꽭??', 'warn');
      }
      return;
    }

    showBusy(`?꾩껜 寃쎈줈瑜??곗텧?섎뒗 以묒엯?덈떎... 0 / ${state.cables.length}`);
    for (let index = 0; index < state.cables.length; index += 1) {
      const cable = state.cables[index];
      applyRouteToCable(cable);
      cable.validation = validateCable(cable);
      if (index % 120 === 0) {
        dom.busyText.textContent = `?꾩껜 寃쎈줈瑜??곗텧?섎뒗 以묒엯?덈떎... ${index + 1} / ${state.cables.length}`;
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
      pushToast(`?꾩껜 耳?대툝 ${state.cables.length}嫄댁쓽 寃쎈줈 ?곗텧???꾨즺?덉뒿?덈떎.`, 'success');
    }
  }

  function applyRouteToCable(cable) {
    const route = computeRouteBreakdown(cable);
    cable.routeBreakdown = route;
    cable.calculatedPath = route ? route.pathNodes.join(' -> ') : '';
    cable.calculatedLength = route ? route.totalLength : 0;
    return cable;
  }

  function computeRouteBreakdown(sourceCable) {
    const cable = sourceCable || {};
    const from = trimText(cable.fromNode);
    const to = trimText(cable.toNode);
    const checkNodes = parseNodeList(cable.checkNode);
    const fromRest = toNumber(cable.fromRest, 0);
    const toRest = toNumber(cable.toRest, 0);

    if (!from || !to || !state.graph.nodeMap[from] || !state.graph.nodeMap[to]) {
      return null;
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
        return null;
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
        return null;
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
    const checkNodes = parseNodeList(cable.checkNode);
    const route = cable.routeBreakdown || computeRouteBreakdown(cable);

    if (!trimText(cable.system)) addIssue(issues, 'warn', 'CABLE SYSTEM??鍮꾩뼱 ?덉뒿?덈떎.');
    if (!trimText(cable.type)) addIssue(issues, 'warn', 'CABLE TYPE??鍮꾩뼱 ?덉뒿?덈떎.');
    if (toNumber(cable.fromRest, 0) < 0 || toNumber(cable.toRest, 0) < 0) {
      addIssue(issues, 'fail', 'FROM_REST ?먮뒗 TO_REST 媛믪씠 ?뚯닔?낅땲??');
    }
    if (cable.outDia && toNumber(cable.outDia, 0) <= 0) {
      addIssue(issues, 'warn', 'CABLE_OUTDIA 媛믪씠 0 ?댄븯?낅땲??');
    }
    if (!from) addIssue(issues, 'fail', 'FROM NODE媛 鍮꾩뼱 ?덉뒿?덈떎.');
    if (!to) addIssue(issues, 'fail', 'TO NODE媛 鍮꾩뼱 ?덉뒿?덈떎.');
    if (from && !state.graph.nodeMap[from]) addIssue(issues, 'fail', `FROM NODE "${from}"媛 洹몃옒?꾩뿉 ?놁뒿?덈떎.`);
    if (to && !state.graph.nodeMap[to]) addIssue(issues, 'fail', `TO NODE "${to}"媛 洹몃옒?꾩뿉 ?놁뒿?덈떎.`);
    const missingChecks = checkNodes.filter((name) => !state.graph.nodeMap[name]);
    if (missingChecks.length) addIssue(issues, 'fail', `CHECK NODE ?꾨씫: ${missingChecks.join(', ')}`);

    let isContinuous = false;
    let allEdgesExist = false;
    let coordsReady = false;
    let declaredPathMatch = null;
    let lengthMatched = false;
    let mapSegmentsMatch = false;
    let waypointOrderMatched = checkNodes.length === 0;
    let mapStatus = 'NO PATH';

    if (!route) {
      addIssue(issues, 'fail', '寃쎈줈 ?곗텧???ㅽ뙣?덉뒿?덈떎.');
    } else {
      const pairs = route.pathNodes.slice(1).map((node, index) => [route.pathNodes[index], node]);
      allEdgesExist = pairs.every(([a, b]) => Boolean(getEdgeInfo(a, b)));
      isContinuous = route.pathNodes[0] === from && route.pathNodes[route.pathNodes.length - 1] === to && allEdgesExist;
      if (!allEdgesExist) {
        addIssue(issues, 'fail', '怨꾩궛??path ?덉뿉 ?ㅼ젣 relation edge媛 ?녿뒗 援ш컙???덉뒿?덈떎.');
      }
      const recalculatedGraph = round2(route.segmentLengths.reduce((sum, value) => sum + value, 0));
      if (!approx(recalculatedGraph, route.graphLength)) {
        addIssue(issues, 'fail', 'segment 湲몄씠 ?⑷낵 graphLength媛 ?쒕줈 ?ㅻ쫭?덈떎.');
      }
      waypointOrderMatched = pathContainsNodesInOrder(route.pathNodes, checkNodes);
      if (!waypointOrderMatched) {
        addIssue(issues, 'fail', 'CHECK_NODE ?쒖꽌媛 怨꾩궛 寃쎈줈??諛섏쁺?섏? ?딆븯?듬땲??');
      }
      const expectedTotal = round2(route.graphLength + toNumber(cable.fromRest, 0) + toNumber(cable.toRest, 0));
      lengthMatched = approx(expectedTotal, cable.calculatedLength || route.totalLength);
      if (!lengthMatched) {
        addIssue(issues, 'fail', 'TOTAL LENGTH??FROM_REST / TO_REST 諛섏쁺??留욎? ?딆뒿?덈떎.');
      }
      if (cable.length > 0 && !approx(cable.length, expectedTotal)) {
        addIssue(issues, 'warn', 'POR_LENGTH? 怨꾩궛??TOTAL LENGTH媛 ?ㅻ쫭?덈떎.');
      }

      const coordsMissing = route.pathNodes.filter((name) => !state.graph.nodeMap[name]?.hasCoords);
      coordsReady = coordsMissing.length === 0;
      if (!coordsReady) {
        addIssue(issues, 'warn', `醫뚰몴 ?녿뒗 ?몃뱶: ${coordsMissing.join(', ')}`);
      }

      const expectedSegments = Math.max(0, route.pathNodes.length - 1);
      const drawableSegments = countDrawableSegments(route.pathNodes);
      mapSegmentsMatch = drawableSegments === expectedSegments;
      mapStatus = !route.pathNodes.length ? 'NO PATH' : coordsReady ? 'READY' : 'COORD MISSING';
      if (!mapSegmentsMatch) {
        addIssue(issues, coordsReady ? 'fail' : 'warn', `留??뚮뜑 媛??援ш컙 ${drawableSegments}/${expectedSegments}`);
      }

      if (cable.path) {
        declaredPathMatch = arraysEqual(parsePathString(cable.path), route.pathNodes);
        if (!declaredPathMatch) {
          addIssue(issues, 'warn', '?먮낯 PATH? 怨꾩궛 PATH媛 ?ㅻ쫭?덈떎.');
        }
      }

      const asymmetricHits = pairs.filter(([a, b]) => {
        const edge = getEdgeInfo(a, b);
        return edge && !edge.symmetric;
      });
      if (asymmetricHits.length) {
        addIssue(issues, 'warn', `鍮꾨?移?relation 援ш컙 ?ы븿: ${asymmetricHits.map((pair) => pair.join(' <-> ')).join(', ')}`);
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
      pushToast('Graph / Route / Map 3以?寃利앹쓣 ?꾨즺?덉뒿?덈떎.', 'success');
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
