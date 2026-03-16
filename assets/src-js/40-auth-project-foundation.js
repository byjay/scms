    const selected = dom.systemFilter.value || 'ALL';
    const systems = unique(state.cables.map((cable) => cable.system).filter(Boolean)).sort();
    dom.systemFilter.innerHTML = ['<option value="ALL">?꾩껜</option>']
      .concat(systems.map((system) => `<option value="${escapeHtml(system)}">${escapeHtml(system)}</option>`))
      .join('');
    dom.systemFilter.value = systems.includes(selected) ? selected : 'ALL';
  }

  async function handleLocalLogin() {
    const id = trimText(dom.loginId.value);
    const password = dom.loginPw.value;

    if (!id || !password) {
      updateAuthStatus('warn', 'ID? 鍮꾨?踰덊샇瑜?紐⑤몢 ?낅젰??二쇱꽭??');
      return;
    }

    if (state.auth.backendAvailable) {
      try {
        const payload = await apiRequest('/local/login', {
          method: 'POST',
          body: JSON.stringify({ username: id, password })
        });
        state.auth.user = payload.user;
        removeFallbackSession();
        updateAuthStatus('success', String(payload.user.name || 'User') + ' login success');
        applyAuthState();
        return;
      } catch (error) {
        updateAuthStatus('error', error.message || '濡쒖뺄 濡쒓렇?몄뿉 ?ㅽ뙣?덉뒿?덈떎.');
      }
    }

    if (DEMO_AUTH_ENABLED && id === FALLBACK_LOCAL_CREDENTIALS.id && password === FALLBACK_LOCAL_CREDENTIALS.password) {
      state.auth.user = { ...FALLBACK_LOCAL_USER };
      persistFallbackSession();
      updateAuthStatus('success', '濡쒖뺄 ?곕え 濡쒓렇?몄뿉 ?깃났?덉뒿?덈떎.');
      applyAuthState();
      return;
    }

    updateAuthStatus('error', '濡쒖뺄 濡쒓렇???뺣낫媛 留욎? ?딆뒿?덈떎.');
  }

  async function startNaverLogin() {
    if (!state.auth.backendAvailable) {
      updateAuthStatus('warn', 'Naver 濡쒓렇?몄쓣 ?ъ슜?섎젮硫?auth worker媛 ?꾩슂?⑸땲??');
      return;
    }
    window.location.href = `${state.apiBase}/naver/start`;
  }

  function applyAuthState() {
    const user = state.auth.user;
    if (!user) {
      dom.loginOverlay.classList.remove('hidden');
      dom.userPanel.classList.add('hidden');
      dom.authBackendHint.textContent = state.auth.backendAvailable
        ? '諛깆뿏?쒓? ?곌껐?섏뿀?듬땲?? Google / Naver / 愿由ъ옄 濡쒓렇??以??섎굹瑜??좏깮?섏꽭??'
        : '?몄쬆 ?뚯빱媛 ?놁뼱???뚯뀥 濡쒓렇??踰꾪듉? 鍮꾪솢?깊솕?⑸땲?? 濡쒖뺄 ?곕え 濡쒓렇?몃쭔 ?ъ슜?????덉뒿?덈떎.';
      dom.naverLoginBtn.disabled = !state.auth.backendAvailable;
      return;
    }

    dom.loginOverlay.classList.add('hidden');
    dom.userPanel.classList.remove('hidden');
    dom.userName.textContent = user.name || user.email || user.id || 'User';
    dom.userRole.textContent = String(user.role || 'user').toUpperCase();
    dom.userProvider.textContent = user.provider || 'local';
  }

  function renderGoogleButtonWithRetry(attempt = 0) {
    updateDependencyPills();
    const googleConfig = state.auth.providers.google || { enabled: false, clientId: '' };
    if (!state.auth.backendAvailable || !googleConfig.enabled || !googleConfig.clientId) {
      dom.googleButtonHost.innerHTML = '';
      const message = state.auth.backendAvailable
        ? 'Google Client ID媛 ?ㅼ젙?섏? ?딆븯?듬땲??'
        : '諛깆뿏???곌껐 ??Google 濡쒓렇?몄쓣 ?ъ슜?????덉뒿?덈떎.';
      dom.googleButtonHost.innerHTML = `<div class="login-note">${escapeHtml(message)}</div>`;
      return;
    }

    if (!window.google?.accounts?.id) {
      if (attempt < 10) {
        window.setTimeout(() => renderGoogleButtonWithRetry(attempt + 1), 400);
      } else {
        dom.googleButtonHost.innerHTML = '<div class="login-note">Google GIS ?ㅽ겕由쏀듃瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??</div>';
      }
      return;
    }

    if (state.auth.googleRendered) return;
    dom.googleButtonHost.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: googleConfig.clientId,
      callback: handleGoogleCredential
    });
    window.google.accounts.id.renderButton(dom.googleButtonHost, {
      theme: 'filled_black',
      shape: 'pill',
      size: 'large',
      width: 280,
      text: 'signin_with'
    });
    state.auth.googleRendered = true;
    setDependencyStatus(dom.depGoogle, 'ok', 'GIS');
  }

  async function handleGoogleCredential(response) {
    if (!response?.credential) {
      updateAuthStatus('error', 'Google ?몄쬆 ?좏겙??鍮꾩뼱 ?덉뒿?덈떎.');
      return;
    }
    if (!state.auth.backendAvailable) {
      updateAuthStatus('warn', '諛깆뿏?쒓? ?놁뼱 Google ?몄쬆??寃利앺븷 ???놁뒿?덈떎.');
      return;
    }
    try {
      const payload = await apiRequest('/google/verify', {
        method: 'POST',
        body: JSON.stringify({ credential: response.credential })
      });
      state.auth.user = payload.user;
      updateAuthStatus('success', String(payload.user.name || 'User') + ' login success');
      applyAuthState();
    } catch (error) {
      updateAuthStatus('error', error.message || 'Google ?몄쬆 寃利앹뿉 ?ㅽ뙣?덉뒿?덈떎.');
    }
  }

  async function logout() {
    try {
      if (state.auth.backendAvailable) {
        await apiRequest('/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error(error);
    }
    removeFallbackSession();
    state.auth.user = null;
    state.auth.googleRendered = false;
    updateAuthStatus('info', '濡쒓렇?꾩썐?섏뿀?듬땲??');
    applyAuthState();
    renderGoogleButtonWithRetry();
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${state.apiBase}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || `HTTP ${response.status}`);
    }
    return payload;
  }

  function normalizeProjectId(value) {
    const normalized = trimText(value)
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return normalized || 'current';
  }

  function fileStem(value) {
    return trimText(value).replace(/\.[^.]+$/, '');
  }

  function defaultProjectName(groupCode = '', fallback = '') {
    if (trimText(fallback)) return trimText(fallback);
    if (trimText(groupCode)) return `${trimText(groupCode)} Project`;
    return 'Current Project';
  }

  function getProjectGroupCode(preferred = '') {
    return trimText(preferred || state.project.groupCode || getCurrentGroupCode() || state.auth.user?.groupCode || 'LOCAL');
  }

  function getProjectStorageKey(groupCode, projectId) {
    return `${normalizeKey(groupCode || 'LOCAL') || 'local'}::${normalizeKey(projectId || 'current') || 'current'}`;
  }

  function loadFallbackProjectStore() {
    try {
      const raw = window.localStorage.getItem(FALLBACK_PROJECTS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  function saveFallbackProjectStore(store) {
    window.localStorage.setItem(FALLBACK_PROJECTS_KEY, JSON.stringify(store || {}));
  }

  function buildProjectMeta(source = {}, fallbackName = '') {
    const meta = source?.projectMeta && typeof source.projectMeta === 'object' ? source.projectMeta : source || {};
    const fallbackStem = fileStem(fallbackName);
    const groupCode = getProjectGroupCode(meta.groupCode || meta.GROUP_CODE);
    const projectId = normalizeProjectId(meta.projectId || meta.PROJECT_ID || fallbackStem || state.project.projectId || 'current');
    const projectName = trimText(meta.projectName || meta.PROJECT_NAME || fallbackStem || state.project.projectName || defaultProjectName(groupCode, fallbackStem));
    return {
      projectId,
      projectName: projectName || defaultProjectName(groupCode, fallbackStem),
      groupCode
    };
  }

  function buildProjectPayload() {
    const meta = buildProjectMeta(state.project, state.project.fileName);
    return {
      version: 'seastar-cms-v3',
      exportedAt: new Date().toISOString(),
      projectMeta: {
        projectId: meta.projectId,
        projectName: meta.projectName,
        groupCode: meta.groupCode,
        source: state.project.source || 'memory',
        loadedAt: state.project.loadedAt || '',
        lastSavedAt: state.project.lastSavedAt || ''
      },
      bom: {
        marginPct: state.bom.marginPct,
        posMap: structuredCloneCompatible(state.bom.posMap)
      },
      reports: {
        drumLength: state.reports.drumLength
      },
      cables: structuredCloneCompatible(state.cables),
      nodes: structuredCloneCompatible(state.uploadedNodes)
    };
  }

  function updateProjectStatus(message = '') {
    if (!dom.projectStatus) return;
    const groupCode = getProjectGroupCode();
    const projectName = trimText(state.project.projectName || defaultProjectName(groupCode, state.project.fileName));
    const parts = [
      projectName,
      `GROUP ${groupCode || 'LOCAL'}`,
      `ID ${normalizeProjectId(state.project.projectId || 'current')}`,
      String(state.project.source || 'memory').toUpperCase()
    ];
    if (state.project.lastSavedAt) {
      parts.push(`SAVED ${formatDateTime(state.project.lastSavedAt)}`);
    }
    if (state.project.dirty) {
      parts.push('DIRTY');
    }
    if (message) {
      parts.push(message);
    }
    dom.projectStatus.textContent = parts.join(' | ');
  }

  function loadFallbackProjectSnapshot(options = {}) {
    const groupCode = getProjectGroupCode(options.groupCode);
    const projectId = normalizeProjectId(options.projectId || state.project.projectId || 'current');
    const store = loadFallbackProjectStore();
    return store[getProjectStorageKey(groupCode, projectId)] || null;
  }

  function saveFallbackProjectSnapshot(payload, options = {}) {
    const meta = buildProjectMeta({
      projectId: options.projectId || payload?.projectMeta?.projectId || state.project.projectId,
      projectName: options.projectName || payload?.projectMeta?.projectName || state.project.projectName,
      groupCode: options.groupCode || payload?.projectMeta?.groupCode || state.project.groupCode
    }, options.fileName || state.project.fileName);
    const store = loadFallbackProjectStore();
    const now = new Date().toISOString();
    const record = {
      projectId: meta.projectId,
      projectName: meta.projectName,
      groupCode: meta.groupCode,
      updatedAt: now,
      payload: structuredCloneCompatible(payload)
    };
    store[getProjectStorageKey(meta.groupCode, meta.projectId)] = record;
    saveFallbackProjectStore(store);
    return record;
  }

  async function applyProjectPayload(payload, options = {}) {
    const cables = extractCablesFromPayload(payload);
    const nodes = extractNodesFromPayload(payload);
    if (!cables.length && !nodes.length) {
      throw new Error('Project payload does not contain cables or nodes.');
    }

    const meta = buildProjectMeta(payload?.projectMeta || payload, options.fileName || '');
    state.cables = cables;
    state.uploadedNodes = nodes;
    state.bom.marginPct = Math.max(0, toNumber(payload?.bom?.marginPct, state.bom.marginPct || 10));
    state.bom.posMap = payload?.bom?.posMap && typeof payload.bom.posMap === 'object'
      ? structuredCloneCompatible(payload.bom.posMap)
      : {};
    state.reports.drumLength = Math.max(10, toNumber(payload?.reports?.drumLength, state.reports.drumLength || 500));
    if (dom.reportDrumLength) {
      dom.reportDrumLength.value = String(state.reports.drumLength);
    }
    state.project = {
      ...state.project,
      projectId: meta.projectId,
      projectName: meta.projectName,
      groupCode: meta.groupCode,
      source: options.source || state.project.source || 'file',
      dirty: false,
      loadedAt: new Date().toISOString(),
      lastSavedAt: options.lastSavedAt || payload?.projectMeta?.lastSavedAt || state.project.lastSavedAt || '',
      fileName: options.fileName || state.project.fileName || ''
    };

    refreshGraph();
    await recalculateAllCables({ quiet: true, skipWhenNoCables: true });
    state.project.dirty = false;
    state.selectedCableId = state.cables[0]?.id || null;
    syncRouteInputsFromSelected();
    renderAll();
    updateProjectStatus(options.statusMessage || 'PROJECT LOADED');
    if (!options.skipHistory) {
      commitHistory(options.historyReason || 'project-load');
    }
    if (options.announce !== false) {
      pushToast(`Project loaded: ${state.project.projectName}`, 'success');
    }
    return meta;
  }

  async function persistProjectState(options = {}) {
    const projectMeta = buildProjectMeta({
      projectId: options.projectId || state.project.projectId,
      projectName: options.projectName || state.project.projectName,
      groupCode: options.groupCode || state.project.groupCode || getCurrentGroupCode()
    }, options.fileName || state.project.fileName);
    state.project = {
      ...state.project,
      ...projectMeta
    };
    const payload = buildProjectPayload();

    try {
      if (state.auth.backendAvailable && isWorkspaceAllowed()) {
        const response = await apiRequest('/projects/current', {
          method: 'POST',
          body: JSON.stringify({
            projectId: projectMeta.projectId,
            projectName: projectMeta.projectName,
            groupCode: projectMeta.groupCode,
            payload
          })
        });
        const project = response.project || {};
        saveFallbackProjectSnapshot(payload, projectMeta);
        state.project = {
          ...state.project,
          projectId: normalizeProjectId(project.projectId || projectMeta.projectId),
          projectName: trimText(project.projectName || projectMeta.projectName),
          groupCode: getProjectGroupCode(project.groupCode || projectMeta.groupCode),
          source: 'server',
          dirty: false,
          lastSavedAt: project.updatedAt || new Date().toISOString()
        };
        updateProjectStatus(options.reason ? `SERVER ${options.reason.toUpperCase()}` : 'SERVER SAVED');
        if (options.announce) {
          pushToast(`Project saved to server: ${state.project.projectName}`, 'success');
        }
        return response;
      }
    } catch (error) {
      console.error(error);
      const localRecord = saveFallbackProjectSnapshot(payload, projectMeta);
      state.project = {
        ...state.project,
        source: 'local',
        dirty: false,
        lastSavedAt: localRecord.updatedAt
      };
      updateProjectStatus('SERVER SAVE FAILED, LOCAL SNAPSHOT SAVED');
      if (options.strict) throw error;
      if (options.announce !== false) {
        pushToast(`Server save failed, local snapshot saved: ${error.message}`, 'warn');
      }
      return { success: true, project: localRecord, fallback: true };
    }

    const localRecord = saveFallbackProjectSnapshot(payload, projectMeta);
    state.project = {
      ...state.project,
      source: 'local',
      dirty: false,
      lastSavedAt: localRecord.updatedAt
    };
    updateProjectStatus(options.reason ? `LOCAL ${options.reason.toUpperCase()}` : 'LOCAL SNAPSHOT SAVED');
    if (options.announce) {
      pushToast(`Local project snapshot saved: ${state.project.projectName}`, 'success');
    }
    return { success: true, project: localRecord, fallback: true };
  }

  async function loadProjectFromServer(options = {}) {
    const projectId = normalizeProjectId(options.projectId || state.project.projectId || 'current');
    const groupCode = getProjectGroupCode(options.groupCode);

    if (state.auth.backendAvailable && isWorkspaceAllowed()) {
      try {
        const params = new URLSearchParams({
          projectId,
          groupCode
        });
        const response = await apiRequest(`/projects/current?${params.toString()}`, { method: 'GET' });
        if (response.project?.payload) {
          await applyProjectPayload(response.project.payload, {
            source: 'server',
            announce: options.announce !== false,
            lastSavedAt: response.project.updatedAt || '',
            fileName: response.project.projectName || '',
            statusMessage: 'SERVER PROJECT LOADED'
          });
          return response.project;
        }
      } catch (error) {
        console.error(error);
        if (options.strict) throw error;
        if (options.force) {
          pushToast(`Server project load failed: ${error.message}`, 'error');
        }
      }
    }

    const localRecord = loadFallbackProjectSnapshot({ groupCode, projectId });
    if (localRecord?.payload) {
      await applyProjectPayload(localRecord.payload, {
        source: 'local',
        announce: options.announce !== false,
        lastSavedAt: localRecord.updatedAt || '',
        fileName: localRecord.projectName || '',
        statusMessage: 'LOCAL PROJECT LOADED'
      });
      return localRecord;
    }

    updateProjectStatus('NO SAVED PROJECT');
    if (options.force) {
      pushToast('No saved project snapshot was found for the current group.', 'warn');
    }
    return null;
  }

  function updateAuthStatus(type, message) {
    dom.authStatus.className = `auth-status ${type}`;
    dom.authStatus.textContent = message;
  }

  function restoreFallbackSession() {
    if (!DEMO_AUTH_ENABLED) return;
    try {
      const raw = window.localStorage.getItem(FALLBACK_SESSION_KEY);
      if (!raw) return;
      state.auth.user = JSON.parse(raw);
    } catch (error) {
      console.error(error);
      removeFallbackSession();
    }
  }

  function persistFallbackSession() {
    if (!DEMO_AUTH_ENABLED) return;
    window.localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(state.auth.user));
  }

  function removeFallbackSession() {
    if (!DEMO_AUTH_ENABLED) return;
    window.localStorage.removeItem(FALLBACK_SESSION_KEY);
  }

  function exportProjectJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      cables: state.cables,
      nodes: state.uploadedNodes
    };
    downloadFile('seastar-cms-v3-project.json', JSON.stringify(payload, null, 2), 'application/json');
    pushToast('?꾨줈?앺듃 JSON????ν뻽?듬땲??', 'success');
  }

  function exportProjectWorkbook() {
    if (!window.XLSX) {
      pushToast('XLSX ?쇱씠釉뚮윭由ш? ?놁뼱 ?묒? ??μ쓣 ?????놁뒿?덈떎.', 'warn');
      return;
    }

    const cableRows = state.cables.map((cable) => ({
      CABLE_NAME: cable.name,
      TYPE: cable.type,
      SYSTEM: cable.system,
      FROM_NODE: cable.fromNode,
      FROM_ROOM: cable.fromRoom,
      FROM_EQUIP: cable.fromEquip,
      FROM_REST: cable.fromRest,
      TO_NODE: cable.toNode,
      TO_ROOM: cable.toRoom,
      TO_EQUIP: cable.toEquip,
      TO_REST: cable.toRest,
      BASE_LENGTH: cable.length,
      GRAPH_LENGTH: cable.routeBreakdown?.graphLength || 0,
      TOTAL_LENGTH: cable.calculatedLength || 0,
      OUT_DIA: cable.outDia,
      CHECK_NODE: cable.checkNode,
      CALCULATED_PATH: cable.calculatedPath,
      VALIDATION: cable.validation?.status || 'PENDING',
      MAP_STATUS: cable.validation?.mapStatus || 'UNCHECKED'
    }));

    const nodeRows = state.mergedNodes.map((node) => ({
      NODE_NAME: node.name,
      STRUCTURE: node.structure,
      COMPONENT: node.component,
      TYPE: node.type,
      RELATIONS: node.relations.join(', '),
      LINK_LENGTH: node.linkLength,
      AREA_SIZE: node.areaSize,
      X: node.x,
      Y: node.y,
      Z: node.z,
      SOURCE: node.source
    }));

    const workbook = window.XLSX.utils.book_new();
    const cableSheet = window.XLSX.utils.json_to_sheet(cableRows);
    const nodeSheet = window.XLSX.utils.json_to_sheet(nodeRows);
    window.XLSX.utils.book_append_sheet(workbook, cableSheet, 'Cables');
    window.XLSX.utils.book_append_sheet(workbook, nodeSheet, 'Nodes');
    window.XLSX.writeFile(workbook, 'seastar-cms-v3.xlsx');
    pushToast('?묒? ?뚯씪????ν뻽?듬땲??', 'success');
  }

  function setActiveTab(tab) {
    dom.tabButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.tab === tab);
    });
    dom.tabPanels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.panel === tab);
    });
    if (tab === 'routing') {
      renderRoutingPanel();
    }
  }

  function showBusy(message) {
    dom.busyText.textContent = message;
    dom.busyOverlay.classList.remove('hidden');
  }

  function hideBusy() {
    dom.busyOverlay.classList.add('hidden');
  }

  function pushToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    dom.toastStack.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3400);
  }

  function addIssue(list, severity, message) {
    list.push({ severity, message });
  }

  function renderIssueItem(type, message) {
    const badge = renderBadge(type === 'success' ? 'PASS' : type === 'warn' ? 'WARN' : type === 'fail' ? 'FAIL' : 'INFO');
    return `<div class="issue-item"><div>${badge}</div><p>${escapeHtml(message)}</p></div>`;
  }

  function renderBadge(label) {
    const upper = String(label || '').toUpperCase();
    const cls = upper === 'PASS' || upper === 'READY' || upper === 'INFO'
      ? 'badge-success'
      : upper === 'WARN' || upper === 'COORD MISSING' || upper === 'UNCHECKED'
        ? 'badge-warn'
        : upper === 'FAIL' || upper === 'NO PATH'
          ? 'badge-fail'
          : 'badge-neutral';
    return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
  }

  function setActiveTab(tab) {
    dom.tabButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.tab === tab);
    });
    dom.tabPanels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.panel === tab);
    });
    if (tab !== 'routing') {
      disposeThree();
    }
    if (tab !== 'nodes') {
      disposeNodeThree();
    }
    if (tab === 'routing') {
      renderRoutingPanel();
    }
    if (tab === 'nodes') {
      renderNodesPanel();
    }
    if (tab === 'bom') {
      renderBomTab();
    }
    if (tab === 'diagnostics') {
      renderVersionComparison();
    }
  }

  function renderAll() {
