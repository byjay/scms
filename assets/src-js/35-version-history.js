// ============================================================
// ■ VERSION HISTORY — git-like per-ship upload versioning
// ============================================================
const SCMS_VERSIONS_STORE = 'ship_versions';
const SCMS_MAX_VERSIONS = 30;
// openScmsDBv2 is an alias for the unified openScmsDB() defined in 40-auth-project-foundation.js
// which opens DB version 2 and creates both ship_projects + ship_versions stores.
function openScmsDBv2() { return openScmsDB(); }

async function saveShipVersion(shipId, label, snapshot) {
  const db = await openScmsDBv2();
  const savedAt = new Date().toISOString();
  const cableCount = (snapshot.cables || []).length;
  const nodeCount = (snapshot.uploadedNodes || []).length;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(SCMS_VERSIONS_STORE, 'readwrite');
    tx.objectStore(SCMS_VERSIONS_STORE).add({ shipId, label, savedAt, cableCount, nodeCount, snapshot });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
  // Trim oldest if over limit
  const all = await loadShipVersionList(shipId, true);
  if (all.length > SCMS_MAX_VERSIONS) {
    const toDelete = all.slice(SCMS_MAX_VERSIONS).map(v => v.versionKey);
    const db2 = await openScmsDBv2();
    await new Promise((resolve, reject) => {
      const tx = db2.transaction(SCMS_VERSIONS_STORE, 'readwrite');
      toDelete.forEach(k => tx.objectStore(SCMS_VERSIONS_STORE).delete(k));
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }
}

async function loadShipVersionList(shipId, includeSnapshot = false) {
  const db = await openScmsDBv2();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCMS_VERSIONS_STORE, 'readonly');
    const req = tx.objectStore(SCMS_VERSIONS_STORE).index('by_ship').getAll(IDBKeyRange.only(shipId));
    req.onsuccess = () => {
      const sorted = (req.result || []).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
      resolve(includeSnapshot ? sorted : sorted.map(v => ({
        versionKey: v.versionKey, shipId: v.shipId, label: v.label,
        savedAt: v.savedAt, cableCount: v.cableCount, nodeCount: v.nodeCount
      })));
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

async function loadShipVersionFull(versionKey) {
  const db = await openScmsDBv2();
  return new Promise((resolve, reject) => {
    const req = db.transaction(SCMS_VERSIONS_STORE, 'readonly').objectStore(SCMS_VERSIONS_STORE).get(versionKey);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function deleteShipVersion(versionKey) {
  const db = await openScmsDBv2();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCMS_VERSIONS_STORE, 'readwrite');
    tx.objectStore(SCMS_VERSIONS_STORE).delete(versionKey);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

// ============================================================
// ■ DIFF ENGINE
// ============================================================
// BUG-018 fix: use actual normalized field names (name/type, not cableName/cableType)
const DIFF_TRACKED_FIELDS = ['name','type','system','fromRoom','fromNode','toRoom','toNode','length','checkNode','supplyDeck'];

// BUG-011 fix: avoid empty-string key collisions in Map
function getCableKey(c) {
  return c.id || c.name || c.cableName || c.CABLENAME || `_unk_${JSON.stringify(c).slice(0,20)}`;
}
function getNodeKey(n) {
  return n.id || n.nodeId || n.NODE_ID || n.nodeName || n.name || `_unk_${JSON.stringify(n).slice(0,20)}`;
}

function diffCables(oldCables, newCables) {
  const oldMap = new Map((oldCables || []).map(c => [getCableKey(c), c]));
  const newMap = new Map((newCables || []).map(c => [getCableKey(c), c]));
  const added = [], removed = [], changed = [];
  for (const [key, newC] of newMap) {
    if (!oldMap.has(key)) { added.push(newC); continue; }
    const oldC = oldMap.get(key);
    const fields = DIFF_TRACKED_FIELDS.filter(f => String(oldC[f] ?? '') !== String(newC[f] ?? ''));
    if (fields.length) changed.push({ key, fields: fields.map(f => ({ field: f, old: oldC[f] ?? '', new: newC[f] ?? '' })) });
  }
  for (const [key, oldC] of oldMap) if (!newMap.has(key)) removed.push(oldC);
  return { added, removed, changed };
}

function diffNodes(oldNodes, newNodes) {
  const oldMap = new Map((oldNodes || []).map(n => [getNodeKey(n), n]));
  const newMap = new Map((newNodes || []).map(n => [getNodeKey(n), n]));
  const added = [...newMap.values()].filter(n => !oldMap.has(getNodeKey(n)));
  const removed = [...oldMap.values()].filter(n => !newMap.has(getNodeKey(n)));
  return { added, removed, changed: [] };
}

// ============================================================
// ■ DIFF MODAL
// ============================================================
function showDiffModal(diff, fileName, kind) {
  return new Promise((resolve) => {
    const modal = document.getElementById('diffModal');
    if (!modal) { resolve('load'); return; }
    const { added, removed, changed } = diff;
    if (added.length + removed.length + changed.length === 0) { resolve('load'); return; }

    const el = (id) => document.getElementById(id);
    if (el('diffVersionLabel')) el('diffVersionLabel').textContent = fileName;
    if (el('diffSummary')) {
      el('diffSummary').innerHTML =
        `<span class="diff-badge diff-added">+${added.length} 추가</span>` +
        `<span class="diff-badge diff-removed">-${removed.length} 삭제</span>` +
        `<span class="diff-badge diff-changed">~${changed.length} 변경</span>` +
        `<span class="diff-type-label">${kind === 'cable' ? '케이블' : '노드'} 파일</span>`;
    }
    if (el('diffTableWrap')) {
      let html = '<table class="diff-table"><thead><tr><th>구분</th><th>ID/NAME</th><th>항목</th><th>이전값</th><th>신규값</th></tr></thead><tbody>';
      added.slice(0, 40).forEach(c => {
        html += `<tr class="dr-added"><td>추가</td><td>${escapeHtml(getCableKey(c) || getNodeKey(c))}</td><td colspan="3">신규</td></tr>`;
      });
      removed.slice(0, 40).forEach(c => {
        html += `<tr class="dr-removed"><td>삭제</td><td>${escapeHtml(getCableKey(c) || getNodeKey(c))}</td><td colspan="3">삭제됨</td></tr>`;
      });
      changed.slice(0, 80).forEach(({ key, fields }) => {
        fields.forEach(({ field, old: o, new: n }, i) => {
          html += `<tr class="dr-changed"><td>${i === 0 ? '변경' : ''}</td><td>${i === 0 ? escapeHtml(key) : ''}</td>` +
            `<td>${escapeHtml(field)}</td><td class="diff-old">${escapeHtml(String(o))}</td><td class="diff-new">${escapeHtml(String(n))}</td></tr>`;
        });
      });
      const more = added.length + removed.length + changed.length - 160;
      if (more > 0) html += `<tr><td colspan="5" style="text-align:center;padding:6px;opacity:0.5">... 표시 생략 (총 ${added.length + removed.length + changed.length}건 중 일부)</td></tr>`;
      html += '</tbody></table>';
      el('diffTableWrap').innerHTML = html;
    }
    modal.classList.remove('hidden');
    const close = () => modal.classList.add('hidden');
    el('diffSaveVersionBtn')?.addEventListener('click', () => { close(); resolve('save-and-load'); }, { once: true });
    el('diffSkipVersionBtn')?.addEventListener('click', () => { close(); resolve('load'); }, { once: true });
    el('diffCancelBtn')?.addEventListener('click', () => { close(); resolve('cancel'); }, { once: true });
  });
}

// ============================================================
// ■ VERSION HISTORY MODAL
// ============================================================
async function openVersionHistoryModal() {
  const modal = document.getElementById('versionHistoryModal');
  if (!modal) return;
  const vhList = document.getElementById('vhList');
  const vhDetail = document.getElementById('vhDetail');
  modal.classList.remove('hidden');
  if (vhList) vhList.innerHTML = '<div class="vh-empty">불러오는 중...</div>';
  if (vhDetail) vhDetail.style.display = 'none';

  const shipJson = localStorage.getItem('seastar_v0_current_ship');
  let ship = null;
  try { ship = shipJson ? JSON.parse(shipJson) : null; } catch { ship = null; } // BUG-016 fix
  const shipId = ship?.id;
  if (!shipId) {
    if (vhList) vhList.innerHTML = '<div class="vh-empty">호선을 먼저 선택해야 히스토리를 볼 수 있습니다.</div>';
    return;
  }

  try {
    const versions = await loadShipVersionList(shipId);
    if (!versions.length) {
      if (vhList) vhList.innerHTML = '<div class="vh-empty">저장된 버전이 없습니다.<br>파일 재업로드 시 자동으로 이전 버전이 저장됩니다.</div>';
      return;
    }
    const fmtDate = (iso) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    };
    let html = '';
    versions.forEach(v => {
      html += `<div class="vh-item">
        <div class="vh-item-info">
          <span class="vh-item-label">${escapeHtml(v.label || 'upload')}</span>
          <span class="vh-item-time">${fmtDate(v.savedAt)}</span>
          <span class="vh-item-counts">케이블 ${v.cableCount} / 노드 ${v.nodeCount}</span>
        </div>
        <div class="vh-item-btns">
          <button class="mb-action vh-restore-btn" data-vkey="${v.versionKey}">↩ 복원</button>
          <button class="mb-action vh-delete-btn" data-vkey="${v.versionKey}">✕</button>
        </div>
      </div>`;
    });
    if (vhList) vhList.innerHTML = html;

    vhList.querySelectorAll('.vh-restore-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const vkey = Number(btn.dataset.vkey);
        const ver = await loadShipVersionFull(vkey);
        if (!ver?.snapshot) { pushToast('버전 데이터를 불러올 수 없습니다.', 'error'); return; }
        const snap = ver.snapshot;
        if (Array.isArray(snap.cables)) state.cables = snap.cables;
        if (snap.uploadedNodes) state.uploadedNodes = snap.uploadedNodes;
        if (snap.project) Object.assign(state.project, snap.project);
        if (typeof refreshGraph === 'function') refreshGraph();
        if (typeof renderAll === 'function') renderAll();
        if (typeof commitHistory === 'function') commitHistory('version-restore');
        if (typeof scheduleAutoSave === 'function') scheduleAutoSave();
        modal.classList.add('hidden');
        pushToast(`✓ 복원 완료: ${ver.label} — 케이블 ${state.cables.length}건`, 'success');
      });
    });
    vhList.querySelectorAll('.vh-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('이 버전을 삭제할까요?')) return;
        await deleteShipVersion(Number(btn.dataset.vkey));
        btn.closest('.vh-item')?.remove();
        // BUG-010 fix: show empty state if no items remain
        if (vhList.querySelectorAll('.vh-item').length === 0) {
          vhList.innerHTML = '<div class="vh-empty">저장된 버전이 없습니다.</div>';
        }
      });
    });
  } catch (err) {
    if (vhList) vhList.innerHTML = `<div class="vh-empty">오류: ${escapeHtml(err.message)}</div>`;
  }
}

// ============================================================
// ■ UPLOAD PANEL STATUS UPDATE
// ============================================================
function updateUploadPanelStatus() {
  const hasCables = state.cables.length > 0;
  const hasNodes = state.uploadedNodes.length > 0;

  // 파일▾ 드롭다운 내 상태 표시
  const cableSt = document.getElementById('cableUploadStatus');
  const nodeSt = document.getElementById('nodeUploadStatus');
  const cableDot = document.getElementById('cableStatusDot');
  const nodeDot = document.getElementById('nodeStatusDot');

  if (cableSt) {
    cableSt.textContent = hasCables ? `케이블: ${state.cables.length}건` : '케이블: 없음';
  }
  if (nodeSt) {
    nodeSt.textContent = hasNodes ? `노드: ${state.uploadedNodes.length}건` : '노드: 없음';
  }
  if (cableDot) {
    cableDot.style.color = hasCables ? '#16a34a' : '#94a3b8';
  }
  if (nodeDot) {
    nodeDot.style.color = hasNodes ? '#16a34a' : '#94a3b8';
  }

  // 토바 상태 뱃지 업데이트
  const topbarStatus = document.getElementById('topbarDataStatus');
  if (topbarStatus) {
    if (hasCables && hasNodes) {
      topbarStatus.textContent = `⚡ ${state.cables.length} / ${state.uploadedNodes.length}`;
      topbarStatus.className = 'topbar-data-status ready';
      topbarStatus.title = `케이블 ${state.cables.length}건 · 노드 ${state.uploadedNodes.length}건 로드됨`;
    } else if (hasCables) {
      topbarStatus.textContent = `▤ ${state.cables.length}`;
      topbarStatus.className = 'topbar-data-status partial';
      topbarStatus.title = `케이블 ${state.cables.length}건 (노드 없음)`;
    } else if (hasNodes) {
      topbarStatus.textContent = `◫ ${state.uploadedNodes.length}`;
      topbarStatus.className = 'topbar-data-status partial';
      topbarStatus.title = `노드 ${state.uploadedNodes.length}건 (케이블 없음)`;
    } else {
      topbarStatus.textContent = '파일 없음';
      topbarStatus.className = 'topbar-data-status empty';
      topbarStatus.title = '케이블/노드 파일 없음 — 파일▾ 메뉴에서 가져오기';
    }
  }
}
