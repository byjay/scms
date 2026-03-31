// ============================================================
// ■ INDEXED-DB AUTO-SAVE / AUTO-RESTORE (per ship)
// ============================================================
const SCMS_DB_NAME = 'seastar-cms-v3';
const SCMS_DB_VERSION = 1;
const SCMS_STORE_NAME = 'ship_projects';

function openScmsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SCMS_DB_NAME, SCMS_DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SCMS_STORE_NAME)) {
        db.createObjectStore(SCMS_STORE_NAME, { keyPath: 'shipId' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveShipData(shipId, data) {
  const db = await openScmsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCMS_STORE_NAME, 'readwrite');
    tx.objectStore(SCMS_STORE_NAME).put({ shipId, ...data, savedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function loadShipData(shipId) {
  const db = await openScmsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCMS_STORE_NAME, 'readonly');
    const req = tx.objectStore(SCMS_STORE_NAME).get(shipId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function autoSaveCurrentShip() {
  try {
    const shipJson = localStorage.getItem('seastar_v3_current_ship');
    if (!shipJson) return;
    const ship = JSON.parse(shipJson);
    if (!ship || !ship.id) return;
    if (!state.cables.length && !state.uploadedNodes.length) return;

    const payload = {
      cables: state.cables,
      uploadedNodes: state.uploadedNodes,
      mergedNodes: state.mergedNodes,
      project: state.project,
      bom: state.bom,
      nodeTray: state.nodeTray
    };
    await saveShipData(ship.id, payload);
    console.log('[SCMS] Auto-saved ship:', ship.name, '- cables:', state.cables.length);
  } catch (err) {
    console.warn('[SCMS] Auto-save failed:', err);
  }
}

async function autoRestoreCurrentShip() {
  try {
    const shipJson = localStorage.getItem('seastar_v3_current_ship');
    if (!shipJson) return false;
    const ship = JSON.parse(shipJson);
    if (!ship || !ship.id) return false;

    const data = await loadShipData(ship.id);
    if (!data || !data.cables || !data.cables.length) return false;

    state.cables = data.cables;
    state.uploadedNodes = data.uploadedNodes || [];
    if (data.project) Object.assign(state.project, data.project);
    if (data.bom) Object.assign(state.bom, data.bom);
    if (data.nodeTray) Object.assign(state.nodeTray, data.nodeTray);

    if (typeof refreshGraph === 'function') refreshGraph();
    if (typeof renderAll === 'function') renderAll();

    if (typeof pushToast === 'function') {
      pushToast('Ship "' + ship.name + '" restored \u2014 ' + state.cables.length + ' cables, ' + state.uploadedNodes.length + ' nodes', 'success');
    }
    console.log('[SCMS] Auto-restored ship:', ship.name);
    return true;
  } catch (err) {
    console.warn('[SCMS] Auto-restore failed:', err);
    return false;
  }
}

let _autoSaveTimer = null;
function scheduleAutoSave() {
  if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => autoSaveCurrentShip(), 2000);
}

// ============================================================
// ■ AUTH & PROJECT FOUNDATION
// ============================================================
// NOTE: handleLocalLogin(), applyAuthState(), setActiveTab(), renderAll()
// are defined in 60-auth-groupspace-final.js (the final/valid versions).
// NOTE: exportProjectJson() and exportProjectWorkbook() are defined in
// 50-import-export-bom-reports-utils.js (the final/valid versions).

// startNaverLogin() → 60-auth-groupspace-final.js (최종본)
// renderGoogleButtonWithRetry() → 60-auth-groupspace-final.js (최종본)

// handleGoogleCredential() and logout() are defined in 60-auth-groupspace-final.js (final versions)

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
    nodeTray: {
      maxHeightLimit: state.nodeTray.maxHeightLimit,
      fillRatioLimit: state.nodeTray.fillRatioLimit,
      tierCount: state.nodeTray.tierCount,
      overrides: structuredCloneCompatible(state.nodeTray.overrides)
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
    `그룹 ${groupCode || 'LOCAL'}`,
    `ID ${normalizeProjectId(state.project.projectId || 'current')}`,
    `저장소 ${(state.project.source || 'memory').toUpperCase()}`
  ];
  if (state.project.lastSavedAt) {
    parts.push(`저장 ${formatDateTime(state.project.lastSavedAt)}`);
  }
  if (state.project.dirty) {
    parts.push('수정됨');
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
  state.nodeTray.maxHeightLimit = Math.max(50, toNumber(payload?.nodeTray?.maxHeightLimit, state.nodeTray.maxHeightLimit || 150));
  state.nodeTray.fillRatioLimit = Math.max(10, Math.min(90, toNumber(payload?.nodeTray?.fillRatioLimit, state.nodeTray.fillRatioLimit || 40)));
  state.nodeTray.tierCount = Math.max(1, Math.min(6, Math.round(toNumber(payload?.nodeTray?.tierCount, state.nodeTray.tierCount || 1))));
  state.nodeTray.draftNodeName = '';
  state.nodeTray.manualWidthDraft = '';
  state.nodeTray.overrides = payload?.nodeTray?.overrides && typeof payload.nodeTray.overrides === 'object'
    ? structuredCloneCompatible(payload.nodeTray.overrides)
    : {};
  state.reports.drumLength = Math.max(10, toNumber(payload?.reports?.drumLength, state.reports.drumLength || 500));
  if (dom.reportDrumLength) {
    dom.reportDrumLength.value = String(state.reports.drumLength);
  }
  if (dom.nodeTrayMaxHeight) {
    dom.nodeTrayMaxHeight.value = String(state.nodeTray.maxHeightLimit);
  }
  if (dom.nodeTrayFillLimit) {
    dom.nodeTrayFillLimit.value = String(state.nodeTray.fillRatioLimit);
  }
  if (dom.nodeTrayTierCount) {
    dom.nodeTrayTierCount.value = String(state.nodeTray.tierCount);
  }
  if (dom.nodeTrayManualWidth) {
    dom.nodeTrayManualWidth.value = '';
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

// ============================================================
// ■ SERVER SHIP-DATA SYNC (KV-backed)
// ============================================================

async function saveDataToServer(groupCode, shipId) {
  if (!state.auth.backendAvailable) {
    throw new Error('Backend is not available.');
  }
  const gc = getProjectGroupCode(groupCode);
  const sid = String(shipId || '').trim();
  if (!sid) throw new Error('shipId is required.');

  const payload = {
    groupCode: gc,
    shipId: sid,
    cables: structuredCloneCompatible(state.cables),
    nodes: structuredCloneCompatible(state.uploadedNodes),
    graph: {
      mergedNodes: structuredCloneCompatible(state.mergedNodes || [])
    },
    meta: {
      project: structuredCloneCompatible(state.project),
      bom: structuredCloneCompatible(state.bom),
      nodeTray: structuredCloneCompatible(state.nodeTray),
      savedAt: new Date().toISOString()
    }
  };

  const result = await apiRequest('/data/save', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return result;
}

async function loadDataFromServer(groupCode, shipId) {
  if (!state.auth.backendAvailable) {
    throw new Error('Backend is not available.');
  }
  const gc = getProjectGroupCode(groupCode);
  const sid = String(shipId || '').trim();
  if (!sid) throw new Error('shipId is required.');

  const params = new URLSearchParams({ group: gc, ship: sid });
  const result = await apiRequest(`/data/load?${params.toString()}`, { method: 'GET' });
  if (!result.data) return null;

  const data = result.data;
  state.cables = data.cables || [];
  state.uploadedNodes = data.nodes || [];
  if (data.graph && data.graph.mergedNodes) {
    state.mergedNodes = data.graph.mergedNodes;
  }
  if (data.meta) {
    if (data.meta.project) Object.assign(state.project, data.meta.project);
    if (data.meta.bom) Object.assign(state.bom, data.meta.bom);
    if (data.meta.nodeTray) Object.assign(state.nodeTray, data.meta.nodeTray);
  }

  if (typeof refreshGraph === 'function') refreshGraph();
  if (typeof renderAll === 'function') renderAll();
  return data;
}

async function listServerData(groupCode) {
  if (!state.auth.backendAvailable) {
    throw new Error('Backend is not available.');
  }
  const gc = getProjectGroupCode(groupCode);
  const params = new URLSearchParams({ group: gc });
  const result = await apiRequest(`/data/list?${params.toString()}`, { method: 'GET' });
  return result.keys || [];
}

async function deleteServerData(groupCode, shipId) {
  if (!state.auth.backendAvailable) {
    throw new Error('Backend is not available.');
  }
  const gc = getProjectGroupCode(groupCode);
  const sid = String(shipId || '').trim();
  if (!sid) throw new Error('shipId is required.');

  const params = new URLSearchParams({ group: gc, ship: sid });
  const result = await apiRequest(`/data/delete?${params.toString()}`, { method: 'DELETE' });
  return result;
}

async function syncLocalToServer() {
  try {
    const shipJson = localStorage.getItem('seastar_v3_current_ship');
    if (!shipJson) {
      pushToast('No current ship selected for sync.', 'warn');
      return;
    }
    const ship = JSON.parse(shipJson);
    if (!ship || !ship.id) {
      pushToast('Invalid ship data for sync.', 'warn');
      return;
    }

    const gc = getProjectGroupCode();
    pushToast('Syncing to server...', 'info');
    await saveDataToServer(gc, ship.id);
    pushToast('Ship "' + (ship.name || ship.id) + '" synced to server.', 'success');
  } catch (err) {
    console.error('[SCMS] syncLocalToServer failed:', err);
    pushToast('Server sync failed: ' + (err.message || 'Unknown error'), 'error');
  }
}
