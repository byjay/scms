// ============================================================
// ■ AUTH HELPERS & GROUP SPACE
// ============================================================

  function applyAuthPayload(payload) {
    state.auth.providers = payload?.providers || state.auth.providers;
    state.auth.user = payload?.user || null;
    state.auth.groups = Array.isArray(payload?.groups) ? payload.groups : [];
    state.auth.groupSpaces = Array.isArray(payload?.groupSpaces) ? payload.groupSpaces : [];
    state.auth.pendingRequests = Array.isArray(payload?.pendingRequests) ? payload.pendingRequests : [];
    state.auth.activeGroupCode = trimText(payload?.activeGroupCode || payload?.user?.groupCode || '');
    const validCodes = state.auth.groups.map((group) => group.code);
    if (!validCodes.includes(state.auth.selectedGroupCode)) {
      state.auth.selectedGroupCode = state.auth.activeGroupCode || validCodes[0] || '';
    }
  }

  function isAdminUser(user = state.auth.user) {
    return Boolean(user && user.role === 'admin');
  }

  function isVipUser(user = state.auth.user) {
    return Boolean(user && user.role === 'vip');
  }

  function isWorkspaceAllowed(user = state.auth.user) {
    return Boolean(user && (user.role === 'admin' || user.role === 'vip' || user.status === 'active'));
  }

  function getCurrentGroupCode() {
    return trimText(state.auth.selectedGroupCode || state.auth.activeGroupCode || state.auth.user?.groupCode || state.auth.groups[0]?.code || '');
  }

  function getCurrentGroupSpace() {
    const code = getCurrentGroupCode();
    return state.auth.groupSpaces.find((space) => space.groupCode === code) || null;
  }

  function loadFallbackGroupSpaces() {
    try {
      const raw = window.localStorage.getItem(FALLBACK_GROUP_SPACE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  function saveFallbackGroupSpaces(spaces) {
    window.localStorage.setItem(FALLBACK_GROUP_SPACE_KEY, JSON.stringify(spaces || {}));
  }

  function ensureFallbackAdminContext() {
    const spaces = loadFallbackGroupSpaces();
    const now = new Date().toISOString();
    if (!spaces.ADMIN) {
      spaces.ADMIN = {
        groupCode: 'ADMIN',
        groupName: 'ADMIN',
         announcement: '로컬 데모 관리자 공간입니다.',
         notes: '배포 후에는 Google/Naver 사인 요청과 그룹 공간이 auth worker에서 처리됩니다.',
        updatedAt: now,
         updatedBy: '관리자',
        memberCount: 1,
         memberNames: ['관리자']
      };
      saveFallbackGroupSpaces(spaces);
    }
    state.auth.groups = [{
      code: 'ADMIN',
      name: 'ADMIN',
       description: '관리자 그룹',
      memberCount: 1,
       memberNames: ['관리자'],
      updatedAt: spaces.ADMIN.updatedAt
    }];
    state.auth.groupSpaces = [spaces.ADMIN];
    state.auth.pendingRequests = [];
    state.auth.activeGroupCode = 'ADMIN';
    state.auth.selectedGroupCode = 'ADMIN';
  }

  async function refreshAuthContext() {
    if (!state.auth.backendAvailable) {
      if (state.auth.user) {
        ensureFallbackAdminContext();
        renderAll();
        await loadProjectFromServer({ announce: false });
      }
      return;
    }
    const payload = await apiRequest('/session', { method: 'GET' });
    applyAuthPayload(payload);
    await loadProjectFromServer({ announce: false });
    renderAll();
  }

  function consumeAuthQueryParams() {
    const url = new URL(window.location.href);
    const auth = url.searchParams.get('auth');
    const authError = url.searchParams.get('authError');
    if (!auth && !authError) return null;

    url.searchParams.delete('auth');
    url.searchParams.delete('authError');
    window.history.replaceState({}, document.title, url.toString());

    if (authError) {
      return {
        type: 'error',
        message: decodeAuthError(authError)
      };
    }

    if (String(auth || '').toLowerCase() === 'pending') {
      return {
        type: 'pending',
         message: '사용 요청이 관리자에게 전달되었습니다. 승인을 기다려주세요.'
      };
    }

    return {
      type: 'success',
       message: '네이버 로그인이 완료되었습니다.'
    };
  }

  /* ── Login Network Canvas Animation (ported from Old CableNetworkBackground) ── */
  function initLoginNetworkCanvas() {
    const canvas = document.getElementById('loginNetworkCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const COLS = 12, ROWS = 8;
    const NODE_R = 2.5;
    const EDGE_COLOR = 'rgba(6,182,212,0.12)';
    const NODE_COLOR = 'rgba(6,182,212,0.35)';
    const PACKET_COLOR = '#06b6d4';
    const PULSE_COLOR = 'rgba(6,182,212,0.55)';

    // Build grid nodes
    let nodes = [];
    let edges = [];
    let packets = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
    }

    function buildGrid() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const cellW = w / (COLS + 1), cellH = h / (ROWS + 1);
      nodes = [];
      edges = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const jx = (Math.random() - 0.5) * cellW * 0.35;
          const jy = (Math.random() - 0.5) * cellH * 0.35;
          nodes.push({ x: (c + 1) * cellW + jx, y: (r + 1) * cellH + jy });
        }
      }
      // horizontal edges
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 1; c++) {
          if (Math.random() < 0.7) edges.push([r * COLS + c, r * COLS + c + 1]);
        }
      }
      // vertical edges
      for (let r = 0; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS; c++) {
          if (Math.random() < 0.5) edges.push([r * COLS + c, (r + 1) * COLS + c]);
        }
      }
      // seed initial packets
      packets = [];
      for (let i = 0; i < 8; i++) spawnPacket();
    }

    function spawnPacket() {
      if (!edges.length) return;
      const e = edges[Math.floor(Math.random() * edges.length)];
      const dir = Math.random() < 0.5 ? 0 : 1;
      packets.push({ from: e[dir], to: e[1 - dir], t: 0, speed: 0.003 + Math.random() * 0.006 });
    }

    function draw() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // edges
      ctx.strokeStyle = EDGE_COLOR;
      ctx.lineWidth = 1;
      for (const [a, b] of edges) {
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.stroke();
      }

      // nodes
      ctx.fillStyle = NODE_COLOR;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, NODE_R, 0, Math.PI * 2);
        ctx.fill();
      }

      // packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.t += p.speed;
        if (p.t >= 1) {
          // pulse at destination
          const dest = nodes[p.to];
          ctx.beginPath();
          ctx.arc(dest.x, dest.y, NODE_R * 3, 0, Math.PI * 2);
          ctx.fillStyle = PULSE_COLOR;
          ctx.fill();
          packets.splice(i, 1);
          spawnPacket();
          continue;
        }
        const a = nodes[p.from], b = nodes[p.to];
        const px = a.x + (b.x - a.x) * p.t;
        const py = a.y + (b.y - a.y) * p.t;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = PACKET_COLOR;
        ctx.fill();
        // glow
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(px, py, 1, px, py, 7);
        grad.addColorStop(0, 'rgba(6,182,212,0.4)');
        grad.addColorStop(1, 'rgba(6,182,212,0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();

    // Stop animation when overlay is hidden
    const observer = new MutationObserver(() => {
      const overlay = document.getElementById('loginOverlay');
      if (overlay?.classList.contains('hidden')) {
        cancelAnimationFrame(animId);
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById('loginOverlay'), { attributes: true, attributeFilter: ['class'] });
  }

  async function initAuth() {
    const authQueryState = consumeAuthQueryParams();
    restoreFallbackSession();
    try {
      const payload = await apiRequest('/session', { method: 'GET' });
      state.auth.backendAvailable = true;
      applyAuthPayload(payload);
      state.auth.googleRendered = false;
      setDependencyStatus(dom.depApi, 'ok', 'AUTH API');
      if (authQueryState?.type === 'error') {
        updateAuthStatus('error', authQueryState.message);
      } else if (payload.user?.status === 'pending') {
        updateAuthStatus('warn', payload.message || 'Access request sent to the administrator. Approval is pending.');
      } else if (authQueryState?.type === 'pending') {
        updateAuthStatus('warn', authQueryState.message);
      } else if (payload.user) {
        updateAuthStatus(
          payload.user.role === 'admin' || payload.user.status === 'active' ? 'success' : 'warn',
          payload.message || (String(payload.user.name || 'User') + ' session restored.')
        );
      } else {
        updateAuthStatus('info', '');
      }
    } catch (error) {
      state.auth.backendAvailable = false;
      setDependencyStatus(dom.depApi, 'warn', 'AUTH API');
      if (state.auth.user && DEMO_AUTH_ENABLED) {
        ensureFallbackAdminContext();
         updateAuthStatus('warn', '백엔드가 없어 로컬 관리자 데모 세션으로 진입합니다.');
      } else if (authQueryState?.type === 'error') {
        updateAuthStatus('error', authQueryState.message);
      } else {
         updateAuthStatus('warn', '인증 백엔드를 찾지 못했습니다. 운영 배포에서는 auth worker와 서버 환경설정이 필요합니다.');
      }
    }

    applyAuthState();
    updateDependencyPills();
    renderGoogleButtonWithRetry();
    initLoginNetworkCanvas();
    await loadProjectFromServer({ announce: false });
  }

  async function handleLocalLogin() {
    const id = trimText(dom.loginId.value);
    const password = dom.loginPw.value;

    if (!id || !password) {
       updateAuthStatus('warn', 'ID와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (state.auth.backendAvailable) {
      try {
        const payload = await apiRequest('/local/login', {
          method: 'POST',
          body: JSON.stringify({ username: id, password })
        });
        applyAuthPayload(payload);
        removeFallbackSession();
        updateAuthStatus('success', payload.message || (String(payload.user.name || 'User') + ' login success'));
        applyAuthState();
        await loadProjectFromServer({ announce: false });
        renderAll();
        return;
      } catch (error) {
         updateAuthStatus('error', error.message || '관리자 로그인에 실패했습니다.');
      }
    }

    if (DEMO_AUTH_ENABLED && id === FALLBACK_VIP_CREDENTIALS.id && password === FALLBACK_VIP_CREDENTIALS.password) {
      state.auth.user = { ...FALLBACK_VIP_USER };
      persistFallbackSession();
       updateAuthStatus('success', '권욱 VIP 로그인에 성공했습니다.');
      applyAuthState();
      await loadProjectFromServer({ announce: false });
      renderAll();
      return;
    }

    if (DEMO_AUTH_ENABLED && id === FALLBACK_LOCAL_CREDENTIALS.id && password === FALLBACK_LOCAL_CREDENTIALS.password) {
      state.auth.user = { ...FALLBACK_LOCAL_USER };
      persistFallbackSession();
      ensureFallbackAdminContext();
       updateAuthStatus('success', '로컬 관리자 데모 로그인에 성공했습니다.');
      applyAuthState();
      await loadProjectFromServer({ announce: false });
      renderAll();
      return;
    }

     updateAuthStatus('error', state.auth.backendAvailable ? '관리자 로그인 정보가 맞지 않습니다.' : '관리자 로그인은 auth worker와 ADMIN_* 서버 설정이 준비된 뒤 사용할 수 있습니다.');
  }

  function applyAuthState() {
    const user = state.auth.user;
    const canAccess = isWorkspaceAllowed(user);
    const isAdmin = isAdminUser(user);

    if (dom.loginHint) {
      dom.loginHint.textContent = '';
    }

    dom.naverLoginBtn.disabled = !state.auth.backendAvailable;
    dom.authRequestMeta.classList.add('hidden');
    dom.overlayLogoutBtn.classList.add('hidden');

    if (!user) {
      dom.loginOverlay.classList.remove('hidden');
      dom.userPanel.classList.add('hidden');
      dom.authBackendHint.textContent = '';
      renderGroupSpace();
      return;
    }

    dom.userName.textContent = user.name || user.email || user.id || 'User';
    dom.userRole.textContent = String(user.role || 'user').toUpperCase();
    dom.userProvider.textContent = user.provider || 'local';
    dom.userGroup.textContent = trimText(user.groupCode || user.groupName) || 'NO GROUP';

    if (!canAccess) {
      dom.loginOverlay.classList.remove('hidden');
      dom.userPanel.classList.add('hidden');
      dom.overlayLogoutBtn.classList.remove('hidden');
      dom.authRequestMeta.classList.remove('hidden');
      dom.authRequestMeta.textContent = user.status === 'pending'
        ? ('Access request submitted. Current status: ' + String(user.status).toUpperCase() + '.')
        : ('Current account status: ' + String(user.status || 'unknown').toUpperCase() + '.');
      dom.authBackendHint.textContent = 'Main workspace stays locked until an administrator approves access.';
      renderGroupSpace();
      return;
    }

    dom.loginOverlay.classList.add('hidden');
    dom.userPanel.classList.remove('hidden');
    dom.authBackendHint.textContent = isAdmin
      ? 'Administrators can approve requests, assign groups, and manage group spaces.'
      : isVipUser(user)
        ? '권욱 VIP 계정으로 접속했습니다. 라우팅, BOM, 보고서, 내보내기 등 모든 기능을 사용할 수 있습니다.'
        : ('Current group: ' + (trimText(user.groupCode || user.groupName) || 'UNASSIGNED'));
    renderGroupSpace();

    // ■ V1 플로우: 로그인 직후 반드시 호선 선택 모달 표시
    // 저장된 호선이 없거나 데이터가 없으면 Ship Select 강제 표시
    if (typeof showShipSelect === 'function') {
      const savedShip = typeof getCurrentShip === 'function' ? getCurrentShip() : null;
      if (!savedShip) {
        // 호선이 선택된 적 없으면 강제 표시
        setTimeout(() => showShipSelect(), 300);
      }
    }
  }

  async function handleGoogleCredential(response) {
    if (!response?.credential) {
       updateAuthStatus('error', 'Google 인증 토큰이 비어 있습니다.');
      return;
    }
    if (!state.auth.backendAvailable) {
       updateAuthStatus('warn', '백엔드가 없어 Google 인증을 검증할 수 없습니다.');
      return;
    }
    try {
      const payload = await apiRequest('/google/verify', {
        method: 'POST',
        body: JSON.stringify({ credential: response.credential })
      });
      applyAuthPayload(payload);
      updateAuthStatus(
        payload.user?.status === 'pending' ? 'warn' : 'success',
        payload.message || (String(payload.user?.name || 'User') + ' login success')
      );
      applyAuthState();
      await loadProjectFromServer({ announce: false });
      renderAll();
    } catch (error) {
       updateAuthStatus('error', error.message || 'Google 인증 검증에 실패했습니다.');
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
    state.auth.groups = [];
    state.auth.groupSpaces = [];
    state.auth.pendingRequests = [];
    state.auth.activeGroupCode = '';
    state.auth.selectedGroupCode = '';
    state.auth.googleRendered = false;
    state.project = {
      ...state.project,
      groupCode: '',
      source: 'memory',
      dirty: false
    };
     updateAuthStatus('info', '로그아웃했습니다.');
    applyAuthState();
    renderGoogleButtonWithRetry();
    updateProjectStatus('LOGGED OUT');
    renderAll();
  }

  async function handleGroupSelectionChange() {
    state.auth.selectedGroupCode = trimText(dom.spaceGroupSelect.value);
    await loadProjectFromServer({ announce: false });
    renderGroupSpace();
  }

  async function saveCurrentGroupSpace() {
    const user = state.auth.user;
    const groupCode = getCurrentGroupCode();
    if (!user || !groupCode) {
       pushToast('저장할 그룹 공간이 없습니다.', 'warn');
      return;
    }
    if (!isAdminUser(user) && trimText(user.groupCode) !== groupCode) {
       pushToast('현재 그룹 공간만 수정할 수 있습니다.', 'warn');
      return;
    }

    const announcement = trimText(dom.spaceAnnouncement.value);
    const notes = trimText(dom.spaceNotes.value);

    if (!state.auth.backendAvailable) {
      const spaces = loadFallbackGroupSpaces();
      spaces[groupCode] = {
        ...(spaces[groupCode] || {}),
        groupCode,
        groupName: groupCode,
        announcement,
        notes,
        updatedAt: new Date().toISOString(),
        updatedBy: user.name || user.id,
        memberCount: 1,
        memberNames: [user.name || user.id]
      };
      saveFallbackGroupSpaces(spaces);
      ensureFallbackAdminContext();
      renderAll();
       pushToast('로컬 그룹 공간을 저장했습니다.', 'success');
      return;
    }

    try {
      await apiRequest('/groups/space', {
        method: 'POST',
        body: JSON.stringify({ groupCode, announcement, notes })
      });
      await refreshAuthContext();
       pushToast('그룹 공간을 저장했습니다.', 'success');
    } catch (error) {
      pushToast(error.message || '그룹 공간 저장에 실패했습니다.', 'error');
    }
  }

  async function handleAdminRequestAction(event) {
    const button = event.target.closest('[data-request-action]');
    if (!button) return;
    if (!isAdminUser()) {
       pushToast('관리자만 요청을 처리할 수 있습니다.', 'warn');
      return;
    }
    if (!state.auth.backendAvailable) {
       pushToast('이 기능은 auth worker가 연결된 상태에서만 동작합니다.', 'warn');
      return;
    }

    const requestId = trimText(button.dataset.requestId);
    const action = trimText(button.dataset.requestAction);
    if (!requestId || !action) return;

    const row = button.closest('[data-request-id]');
    const groupCode = trimText(row?.querySelector('[data-field=\"groupCode\"]')?.value);
    const groupName = trimText(row?.querySelector('[data-field=\"groupName\"]')?.value);

    try {
      if (action === 'approve') {
        await apiRequest('/admin/requests/' + encodeURIComponent(requestId) + '/approve', {
          method: 'POST',
          body: JSON.stringify({ groupCode, groupName })
        });
        pushToast('사용 요청이 승인되었습니다.', 'success');
      } else if (action === 'reject') {
        await apiRequest('/admin/requests/' + encodeURIComponent(requestId) + '/reject', {
          method: 'POST',
          body: JSON.stringify({})
        });
         pushToast('사용 요청이 반려됐습니다.', 'warn');
      }
      await refreshAuthContext();
    } catch (error) {
      pushToast(error.message || '요청 처리에 실패했습니다.', 'error');
    }
  }

  function renderGroupSpace() {
    if (!dom.spaceGroupSelect) return;

    const user = state.auth.user;
    const canAccess = isWorkspaceAllowed(user);
    const isAdmin = isAdminUser(user);
    const groups = Array.isArray(state.auth.groups) ? state.auth.groups : [];
    const selectedCode = getCurrentGroupCode();
    const space = getCurrentGroupSpace();
    const accessLabel = !user ? 'LOCKED' : isAdmin ? 'ADMIN' : canAccess ? 'ACTIVE' : String(user.status || 'LOCKED').toUpperCase();

    dom.spaceGroupSelect.innerHTML = ['<option value="">No Group</option>']
      .concat(groups.map((group) => {
        const code = escapeHtml(group.code);
        const suffix = group.name && group.name !== group.code ? (' - ' + escapeHtml(group.name)) : '';
        return '<option value="' + code + '">' + code + suffix + '</option>';
      }))
      .join('');
    dom.spaceStatus.textContent = !user
      ? 'Log in to access group spaces.'
      : !canAccess
        ? 'Group space remains locked until an administrator approves access.'
        : isAdmin ? 'Administrator mode can access and edit every group space.' : ((trimText(user.groupCode || user.groupName) || 'UNASSIGNED') + ' group space connected.');

    dom.spaceActiveGroup.textContent = space?.groupCode || selectedCode || '-';
    dom.spaceMemberCount.textContent = formatInt(space?.memberCount || 0);
    dom.spaceUpdatedAt.textContent = space?.updatedAt ? formatDateTime(space.updatedAt) : '-';
    dom.spaceAccessLevel.textContent = accessLabel;
    dom.spaceAnnouncement.value = space?.announcement || '';
    dom.spaceNotes.value = space?.notes || '';

    const editable = Boolean(user && (isAdmin || (user.status === 'active' && trimText(user.groupCode) === selectedCode)));
    dom.spaceGroupSelect.disabled = !user || (!isAdmin && groups.length <= 1);
    dom.spaceAnnouncement.disabled = !editable;
    dom.spaceNotes.disabled = !editable;
    dom.saveSpaceBtn.disabled = !editable;

    const memberNames = Array.isArray(space?.memberNames) ? space.memberNames : [];
    dom.spaceMemberList.innerHTML = memberNames.length
      ? memberNames.map((name) => renderIssueItem('info', name)).join('')
       : '<div class="empty-state">표시할 그룹 멤버가 없습니다.</div>';

    dom.adminApprovalPanel.classList.toggle('hidden', !isAdmin);
    dom.refreshAdminBtn.disabled = !isAdmin;
    renderAdminRequestList();
  }

  function renderAdminRequestList() {
    if (!dom.adminRequestList) return;
    const requests = Array.isArray(state.auth.pendingRequests) ? state.auth.pendingRequests : [];
    const groups = Array.isArray(state.auth.groups) ? state.auth.groups : [];
    const activeUsers = Array.isArray(state.auth.groupSpaces)
      ? state.auth.groupSpaces.reduce((sum, space) => sum + toNumber(space.memberCount, 0), 0)
      : 0;

    dom.adminPendingCount.textContent = formatInt(requests.length);
    dom.adminGroupCount.textContent = formatInt(groups.length);
    dom.adminActiveUsers.textContent = formatInt(activeUsers);
    if (dom.adminDisplayName) {
       dom.adminDisplayName.textContent = isAdminUser() ? (state.auth.user?.name || '관리자') : '관리자';
    }

    if (!isAdminUser()) {
       dom.adminRequestList.innerHTML = '<div class="empty-state">관리자만 사인 요청을 볼 수 있습니다.</div>';
      return;
    }

    if (!requests.length) {
       dom.adminRequestList.innerHTML = '<div class="empty-state">현재 대기 중인 사용 요청이 없습니다.</div>';
      return;
    }

    dom.adminRequestList.innerHTML = requests.map((request) => {
      const requestIdValue = escapeHtml(request.id);
      const requestName = escapeHtml(request.name || request.email || request.userId);
      const requestProvider = escapeHtml(request.provider || 'social');
      const requestEmail = escapeHtml(request.email || 'no-email');
      const requestStatus = escapeHtml(String(request.status || 'pending').toUpperCase());
      const requestGroupCode = escapeHtml(request.suggestedGroupCode || 'GROUP-A');
      const requestGroupName = escapeHtml(request.suggestedGroupName || request.suggestedGroupCode || 'Group A');
      const requestDate = escapeHtml(formatDateTime(request.requestedAt));
      var requestPhone = escapeHtml(request.phone || '');
      var requestCompany = escapeHtml(request.company || '');
      return ''
        + '<div class="admin-request-row" data-request-id="' + requestIdValue + '">'
        + '<div class="admin-request-head">'
        + '<div><strong>' + requestName + '</strong><div class="muted">' + requestProvider + ' - ' + requestEmail + (requestPhone ? ' / ' + requestPhone : '') + (requestCompany ? ' / ' + requestCompany : '') + '</div></div>'
        + '<span class="badge badge-warn">' + requestStatus + '</span>'
        + '</div>'
        + '<div class="admin-request-grid">'
        + '<label class="field"><span>GROUP CODE</span><input data-field="groupCode" type="text" value="' + requestGroupCode + '" placeholder="GROUP-A"></label>'
        + '<label class="field"><span>GROUP NAME</span><input data-field="groupName" type="text" value="' + requestGroupName + '" placeholder="Group A"></label>'
        + '<div class="admin-request-meta">Requested at: ' + requestDate + '</div>'
        + '</div>'
        + '<div class="editor-actions">'
        + '<button class="toolbar-btn accent" type="button" data-request-id="' + requestIdValue + '" data-request-action="approve">Approve + Assign Group</button>'
        + '<button class="toolbar-btn danger" type="button" data-request-id="' + requestIdValue + '" data-request-action="reject">Reject</button>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    if (tab === 'reports') {
      renderReportsTab();
    }
    if (tab === 'space') {
      renderGroupSpace();
    }
    if (tab === 'cabletype') {
      renderCableTypeTab();
    }
    if (tab === 'diagnostics') {
      renderDiagnostics();
      renderVersionComparison();
    }
  }

  function renderAll() {
    renderSummary();
    renderGrid();
    renderSelectedCable();
    renderRoutingPanel();
    renderNodesPanel();
    renderBomTab();
    renderReportsTab();
    renderGroupSpace();
    renderDiagnostics();
    renderVersionComparison();
    buildDeckTree();
    applyAuthState();
    updateProjectStatus();
    updateHistoryControls();
    normalizeUiText();
  }

  function setTextContent(element, text) {
    if (element) {
      element.textContent = text;
    }
  }

  function setPlaceholder(element, text) {
    if (element) {
      element.placeholder = text;
    }
  }

  function normalizeUiText() {
    const mediaCopy = document.querySelector('.login-media-copy');
    if (mediaCopy) {
      mediaCopy.remove();
    }

    const loginCardHead = document.querySelector('.login-card-head');
    if (loginCardHead) {
      loginCardHead.style.gridTemplateColumns = '';
      loginCardHead.style.gap = '';
    }

    const loginVideo = document.querySelector('.login-video');
    if (loginVideo) {
      loginVideo.style.objectFit = 'contain';
      loginVideo.style.objectPosition = 'center center';
      loginVideo.style.background = '#081421';
    }

    setTextContent(dom.busyText, '준비 중...');
    setTextContent(dom.overlayLogoutBtn, '로그아웃');
    setTextContent(dom.logoutBtn, '로그아웃');
    // Preserve Naver button SVG icon — only update text node
    if (dom.naverLoginBtn) {
      const textNode = Array.from(dom.naverLoginBtn.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
      if (textNode) textNode.textContent = ' SIGN IN WITH NAVER';
    }
    setTextContent(dom.localLoginBtn, 'SECURE LOGIN');
    setPlaceholder(dom.loginId, 'Employee ID');
    setPlaceholder(dom.loginPw, '••••••••');

    const searchLabel = dom.searchInput?.closest('label')?.querySelector('span');
    const validationLabel = dom.validationFilter?.closest('label')?.querySelector('span');
    const systemLabel = dom.systemFilter?.closest('label')?.querySelector('span');
    setTextContent(searchLabel, '검색');
    setTextContent(validationLabel, '검증');
    setTextContent(systemLabel, '시스템');
    setPlaceholder(dom.searchInput, '케이블명, 노드, 시스템');
    if (dom.validationFilter?.options?.[0]) {
      dom.validationFilter.options[0].text = '전체';
    }
    if (dom.systemFilter?.options?.[0]) {
      dom.systemFilter.options[0].text = '전체';
    }

    setTextContent(dom.metricCables?.closest('.summary-card')?.querySelector('span'), '케이블');
    setTextContent(dom.metricUploadedNodes?.closest('.summary-card')?.querySelector('span'), '업로드 노드');
    setTextContent(dom.metricMergedNodes?.closest('.summary-card')?.querySelector('span'), '병합 노드');
    setTextContent(dom.metricRouted?.closest('.summary-card')?.querySelector('span'), '경로 완료');
    setTextContent(dom.metricGraphIssues?.closest('.summary-card')?.querySelector('span'), '그래프 이슈');

    setTextContent(document.querySelector('[data-panel="dashboard"] .panel-header h3'), '케이블 마스터 리스트');
    setTextContent(document.querySelector('[data-panel="dashboard"] .detail-panel .panel-header h3'), '길이 분해와 검증 결과');
    setTextContent(dom.detailEmpty, '케이블을 선택하면 상세 경로, 검증 결과, 미니 2D 맵이 여기에 표시됩니다.');

    setTextContent(document.querySelector('[data-panel="routing"] .route-side .panel-header h3'), '수동 경로 검증과 경유 노드 확인');
    setPlaceholder(dom.routeCheck, '쉼표로 구분');
    setTextContent(dom.previewRouteBtn, '경로 미리보기');
    setTextContent(dom.clearPreviewBtn, '미리보기 해제');
    setTextContent(dom.useSelectedRouteBtn, '선택 케이블 값 가져오기');
    setTextContent(document.querySelector('[data-panel="routing"] .validation-steps')?.previousElementSibling, '3중 검증 방법');
    setTextContent(document.querySelector('[data-panel="routing"] .map-card:first-of-type h3'), '경로와 연결 상태를 직접 확인');
    setTextContent(document.querySelector('[data-panel="routing"] .map-card:last-of-type h3'), '동일 경로의 3D 보조 시각화');

    const validationSteps = document.querySelectorAll('[data-panel="routing"] .validation-steps li');
    if (validationSteps[0]) validationSteps[0].textContent = '1차 Graph Cross Check: 노드 존재, relation 대상, 비대칭 relation, 단절 여부를 확인합니다.';
    if (validationSteps[1]) validationSteps[1].textContent = '2차 Route Cross Check: path의 연속 edge 실존 여부와 graphLength 합산, FROM_REST와 TO_REST 반영 여부를 확인합니다.';
    if (validationSteps[2]) validationSteps[2].textContent = '3차 Map Cross Check: 2D와 3D가 같은 path를 사용하고 좌표 부족을 정확히 경고하는지 확인합니다.';

    setTextContent(document.querySelector('[data-panel="nodes"] .node-list-side .panel-header h3'), '전체 노드 리스트와 자동 Tray Width');
    setTextContent(dom.nodeDetailTitle, '노드를 선택해 주세요.');
    setTextContent(dom.nodeDetailMeta, '리스트를 더블클릭하면 3D 맵에서 바로 포커스됩니다.');
    setTextContent(document.querySelector('[data-panel="nodes"] .node-map-stack .map-card:first-of-type h3'), '리스트와 같은 노드 좌표를 2D로 확인');
    setTextContent(document.querySelector('[data-panel="nodes"] .node-map-stack .map-card:last-of-type h3'), '전체 노드 위에서 선택 노드를 강조');

    setTextContent(document.querySelector('[data-panel="space"] .panel-header h3'), '승인된 그룹별 전용 공간');
    setPlaceholder(dom.spaceAnnouncement, '그룹 공지나 공용 메모를 입력해 주세요.');
    setPlaceholder(dom.spaceNotes, '그룹별 작업 기준, 인수인계, 특이사항을 기록해 주세요.');
    setTextContent(document.querySelector('#adminApprovalPanel .panel-header h3'), '사용 요청 승인과 그룹 배정');

    setTextContent(document.querySelector('[data-panel="diagnostics"] .panel:first-of-type .panel-header h3'), '3중 크로스 검증 집계');
    setTextContent(document.querySelector('[data-panel="diagnostics"] .panel:last-of-type .panel-header h3'), '문제가 있는 케이블 우선 표시');
  }

  function decodeAuthError(code) {
    const key = String(code || '').toLowerCase();
    const map = {
      naver_state_mismatch: 'Naver 로그인 state 검증에 실패했습니다.',
      naver_token_exchange_failed: 'Naver 토큰 교환에 실패했습니다.',
      naver_profile_failed: 'Naver 사용자 프로필 조회에 실패했습니다.',
      access_denied: '로그인이 취소되었습니다.'
    };
    return map[key] || `인증 오류: ${code}`;
  }

  async function startNaverLogin() {
    normalizeUiText();
    const naverProviderEnabled = Boolean(state.auth.backendAvailable && state.auth.providers?.naver?.enabled);
    if (!state.auth.backendAvailable) {
      updateAuthStatus('warn', 'Naver 로그인을 사용하려면 인증 워커와 OAuth 설정이 필요합니다.');
      return;
    }
    if (!naverProviderEnabled) {
      updateAuthStatus('warn', 'Naver OAuth 설정이 아직 연결되지 않았습니다.');
      return;
    }
    window.location.href = `${state.apiBase}/naver/start`;
  }

  function renderGoogleButtonWithRetry(attempt = 0) {
    normalizeUiText();
    updateDependencyPills();
    const googleConfig = state.auth.providers.google || { enabled: false, clientId: '' };
    if (!state.auth.backendAvailable || !googleConfig.enabled || !googleConfig.clientId) {
      dom.googleButtonHost.innerHTML = '';
      dom.googleButtonHost.style.display = 'none';
      return;
    }
    dom.googleButtonHost.style.display = '';

    if (!window.google?.accounts?.id) {
      if (attempt < 10) {
        window.setTimeout(() => renderGoogleButtonWithRetry(attempt + 1), 400);
      } else {
        dom.googleButtonHost.innerHTML = '<div class="login-note">Google GIS 스크립트를 불러오지 못했습니다.</div>';
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

  function ensureFallbackAdminContext() {
    const spaces = loadFallbackGroupSpaces();
    const now = new Date().toISOString();
    if (!spaces.ADMIN) {
      spaces.ADMIN = {
        groupCode: 'ADMIN',
        groupName: 'ADMIN',
        announcement: '로컬 관리자 그룹 공간입니다.',
        notes: '배포 전에는 소셜 승인과 그룹 공간 관리가 로컬 모드로 동작합니다.',
        updatedAt: now,
        updatedBy: '관리자',
        memberCount: 1,
        memberNames: ['관리자']
      };
      saveFallbackGroupSpaces(spaces);
    }
    state.auth.groups = [{
      code: 'ADMIN',
      name: 'ADMIN',
      description: '관리자 그룹',
      memberCount: 1,
      memberNames: ['관리자'],
      updatedAt: spaces.ADMIN.updatedAt
    }];
    state.auth.groupSpaces = [spaces.ADMIN];
    state.auth.pendingRequests = [];
    state.auth.activeGroupCode = 'ADMIN';
    state.auth.selectedGroupCode = 'ADMIN';
  }

  function consumeAuthQueryParams() {
    const url = new URL(window.location.href);
    const auth = url.searchParams.get('auth');
    const authError = url.searchParams.get('authError');
    if (!auth && !authError) return null;

    url.searchParams.delete('auth');
    url.searchParams.delete('authError');
    window.history.replaceState({}, document.title, url.toString());

    if (authError) {
      return {
        type: 'error',
        message: decodeAuthError(authError)
      };
    }

    if (String(auth || '').toLowerCase() === 'pending') {
      return {
        type: 'pending',
        message: '사용 요청이 관리자에게 전달되었습니다. 승인 후 사용할 수 있습니다.'
      };
    }

    return {
      type: 'success',
      message: '소셜 로그인이 완료되었습니다.'
    };
  }

  // ============================================================
  // ■ SHIP SELECT & GROUP SHARING SYSTEM
  // ============================================================
  const SHIP_STORAGE_KEY = 'seastar_v3_ships';
  const SHIP_SESSION_KEY = 'seastar_v3_current_ship';

  function getShips() {
    try {
      const ships = JSON.parse(localStorage.getItem(SHIP_STORAGE_KEY)) || [];
      // TEST1 기본 호선 자동 추가
      if (!ships.some(function(s) { return s.id === 'ship_default_test1'; })) {
        ships.unshift({ id: 'ship_default_test1', name: 'TEST1', no: 'HULL-001', groupCode: 'DEFAULT', createdBy: 'system', createdAt: '2023-01-01T00:00:00.000Z' });
        localStorage.setItem(SHIP_STORAGE_KEY, JSON.stringify(ships));
      }
      return ships;
    }
    catch { return [{ id: 'ship_default_test1', name: 'TEST1', no: 'HULL-001', groupCode: 'DEFAULT', createdBy: 'system', createdAt: '2023-01-01T00:00:00.000Z' }]; }
  }
  function saveShips(ships) {
    localStorage.setItem(SHIP_STORAGE_KEY, JSON.stringify(ships));
  }
  function getCurrentShip() {
    try { return JSON.parse(localStorage.getItem(SHIP_SESSION_KEY)); }
    catch { return null; }
  }
  function setCurrentShip(ship) {
    localStorage.setItem(SHIP_SESSION_KEY, JSON.stringify(ship));
    // Update badge
    const badge = document.getElementById('shipBadge');
    const changeBtn = document.getElementById('changeShipBtn');
    if (badge) {
      badge.textContent = 'SHIP: ' + (ship ? ship.name : '-');
      badge.classList.toggle('hidden', !ship);
    }
    if (changeBtn) changeBtn.classList.toggle('hidden', !ship);
  }

  function getMyShips() {
    const ships = getShips();
    const user = state.auth.user;
    if (!user) return [];
    const groupCode = user.groupCode || user.groupName || 'DEFAULT';
    // Admin sees all; others see only their group
    if (user.role === 'admin' || user.role === 'vip') return ships;
    return ships.filter(s => s.groupCode === groupCode);
  }

  function renderShipList(filterText) {
    const list = document.getElementById('shipList');
    const current = getCurrentShip();
    if (!list) return;
    list.innerHTML = '';

    var myShips = getMyShips();
    if (filterText) {
      var lc = filterText.toLowerCase();
      myShips = myShips.filter(function(s) {
        return (s.name || '').toLowerCase().includes(lc)
          || (s.no || '').toLowerCase().includes(lc)
          || (s.groupCode || '').toLowerCase().includes(lc);
      });
    }

    if (!myShips.length) {
      list.innerHTML = '<div class="ship-empty-state">' + (filterText ? '검색 결과가 없습니다.' : '등록된 호선이 없습니다. 아래에서 새 호선을 추가하세요.') + '</div>';
      return;
    }

    myShips.forEach(function(ship) {
      var isCurrent = current && current.id === ship.id;
      var card = document.createElement('div');
      card.className = 'ship-card' + (isCurrent ? ' selected' : '');
      card.dataset.shipId = ship.id;

      var dateStr = ship.createdAt ? new Date(ship.createdAt).toLocaleDateString() : '-';

      card.innerHTML = '<div class="ship-card-icon">&#x1F6A2;</div>'
        + '<div class="ship-card-info">'
        + '<div class="ship-card-name">' + (ship.name || '-') + '</div>'
        + '<div class="ship-card-meta">' + (ship.no || 'No Hull#') + ' | Group: ' + (ship.groupCode || '-') + ' | ' + dateStr + '</div>'
        + '</div>'
        + '<div class="ship-card-actions">'
        + (isCurrent ? '<span class="ship-card-badge">CURRENT</span>' : '')
        + '<button class="ship-card-delete" data-ship-id="' + ship.id + '" title="삭제">&times;</button>'
        + '</div>';

      card.addEventListener('click', function(e) {
        if (e.target.classList.contains('ship-card-delete')) return;
        list.querySelectorAll('.ship-card').forEach(function(el) { el.classList.remove('selected'); });
        card.classList.add('selected');
      });

      list.appendChild(card);
    });

    // Bind delete buttons
    list.querySelectorAll('.ship-card-delete').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var shipId = btn.dataset.shipId;
        var ships = getShips();
        var target = ships.find(function(s) { return s.id === shipId; });
        if (!target) return;
        if (!confirm('정말 "' + target.name + '" 호선을 삭제하시겠습니까?')) return;
        var filtered = ships.filter(function(s) { return s.id !== shipId; });
        saveShips(filtered);
        var cur = getCurrentShip();
        if (cur && cur.id === shipId) {
          localStorage.removeItem(SHIP_SESSION_KEY);
          setCurrentShip(null);
        }
        showShipSelect();
        if (typeof pushToast === 'function') pushToast('호선이 삭제되었습니다.', 'info');
      });
    });
  }

  function showShipSelect() {
    var overlay = document.getElementById('shipSelectOverlay');
    if (!overlay) return;
    overlay.classList.add('active');

    var user = state.auth.user;
    var groupCode = user?.groupCode || user?.groupName || 'DEFAULT';
    var groupInfo = document.getElementById('shipGroupInfo');
    if (groupInfo) {
      groupInfo.textContent = 'Group: ' + groupCode + ' | ' + (user?.name || user?.id || '-') + ' (' + (user?.role || 'user') + ')';
    }

    var searchInput = document.getElementById('shipSearchInput');
    if (searchInput) {
      searchInput.value = '';
    }

    renderShipList('');
  }

  function hideShipSelect() {
    var overlay = document.getElementById('shipSelectOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  function confirmShipSelect() {
    var selected = document.querySelector('#shipList .ship-card.selected');
    if (!selected) {
      if (typeof pushToast === 'function') pushToast('호선을 선택해주세요.', 'warning');
      return;
    }
    var shipId = selected.dataset.shipId;
    var ships = getShips();
    var ship = ships.find(function(s) { return s.id === shipId; });
    if (ship) {
      setCurrentShip(ship);
      if (typeof pushToast === 'function') pushToast('호선 선택: ' + ship.name, 'success');
    }
    hideShipSelect();
  }

  function addNewShip() {
    var nameInput = document.getElementById('newShipName');
    var noInput = document.getElementById('newShipNo');
    if (!nameInput) return;
    var name = nameInput.value.trim();
    if (!name) {
      if (typeof pushToast === 'function') pushToast('호선 이름을 입력하세요.', 'warning');
      return;
    }
    var user = state.auth.user;
    var groupCode = user?.groupCode || user?.groupName || 'DEFAULT';
    var ships = getShips();
    var newShip = {
      id: 'ship_' + Date.now(),
      name: name,
      no: noInput ? noInput.value.trim() : '',
      groupCode: groupCode,
      createdBy: user?.id || 'unknown',
      createdAt: new Date().toISOString()
    };
    ships.push(newShip);
    saveShips(ships);
    nameInput.value = '';
    if (noInput) noInput.value = '';
    showShipSelect();
    if (typeof pushToast === 'function') pushToast('호선 추가: ' + name, 'success');
  }

  // Bind ship select events after DOM ready
  function bindShipSelectEvents() {
    var okBtn = document.getElementById('shipSelectOk');
    var cancelBtn = document.getElementById('shipSelectCancel');
    var closeBtn = document.getElementById('shipSelectClose');
    var addBtn = document.getElementById('addShipBtn');
    var addToggle = document.getElementById('shipAddToggle');
    var changeBtn = document.getElementById('changeShipBtn');
    var shipBadge = document.getElementById('shipBadge');
    var searchInput = document.getElementById('shipSearchInput');
    var overlay = document.getElementById('shipSelectOverlay');

    if (okBtn) okBtn.addEventListener('click', confirmShipSelect);
    if (cancelBtn) cancelBtn.addEventListener('click', hideShipSelect);
    if (closeBtn) closeBtn.addEventListener('click', hideShipSelect);
    if (addBtn) addBtn.addEventListener('click', addNewShip);
    if (changeBtn) changeBtn.addEventListener('click', showShipSelect);
    if (shipBadge) shipBadge.addEventListener('click', showShipSelect);

    // Toggle add form
    if (addToggle) {
      addToggle.addEventListener('click', function() {
        var form = document.getElementById('shipAddForm');
        if (form) form.classList.toggle('hidden');
      });
    }

    // Search filter
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        renderShipList(searchInput.value.trim());
      });
    }

    // Backdrop click to close
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) hideShipSelect();
      });
    }

    // Restore current ship on load
    var saved = getCurrentShip();
    if (saved) setCurrentShip(saved);
  }

  // ============================================================
  // ADMIN CONSOLE TAB
  // ============================================================
  function renderAdminTab() {
    // Stats
    var cables = state.cables || [];
    var nodes = state.mergedNodes || [];
    var validOk = cables.filter(function(c) { return c.validationStatus === 'ok' || c.validationStatus === 'valid'; }).length;
    var validFail = cables.filter(function(c) { return c.validationStatus === 'error' || c.validationStatus === 'fail'; }).length;

    var elCables = document.getElementById('adminStatCables');
    var elNodes = document.getElementById('adminStatNodes');
    var elValid = document.getElementById('adminStatValid');
    var elInvalid = document.getElementById('adminStatInvalid');
    if (elCables) elCables.textContent = cables.length;
    if (elNodes) elNodes.textContent = nodes.length;
    if (elValid) elValid.textContent = validOk;
    if (elInvalid) elInvalid.textContent = validFail;

    // User list
    var userList = document.getElementById('adminUserList');
    if (userList) {
      var groups = state.auth.groups || [];
      var allMembers = [];
      groups.forEach(function(g) {
        (g.memberNames || []).forEach(function(name) {
          allMembers.push({ name: name, groupCode: g.code, role: '-' });
        });
      });
      // Also include current user
      var user = state.auth.user;
      if (user && !allMembers.find(function(m) { return m.name === user.name; })) {
        allMembers.unshift({ name: user.name || user.id, groupCode: user.groupCode || '-', role: user.role || 'user' });
      }
      if (!allMembers.length) {
        userList.innerHTML = '<div class="admin-empty">사용자 정보가 없습니다.</div>';
      } else {
        userList.innerHTML = allMembers.map(function(m) {
          var roleClass = (m.role === 'admin') ? ' admin' : (m.role === 'vip') ? ' vip' : (m.role === 'active' || m.role === '-') ? '' : '';
          return '<div class="admin-user-row">'
            + '<span class="admin-user-name">' + (m.name || '-') + '</span>'
            + '<span class="admin-user-role' + roleClass + '">' + (m.role || '-').toUpperCase() + '</span>'
            + '<span style="color:var(--muted);font-size:10px">' + (m.groupCode || '-') + '</span>'
            + '</div>';
        }).join('');
      }
    }

    // Pending requests
    var pendingList = document.getElementById('adminPendingList');
    if (pendingList) {
      var requests = state.auth.pendingRequests || [];
      if (!requests.length) {
        pendingList.innerHTML = '<div class="admin-empty">대기 중인 요청이 없습니다.</div>';
      } else {
        pendingList.innerHTML = requests.map(function(r) {
          var rDate = r.createdAt ? new Date(r.createdAt).toLocaleString() : '-';
          return '<div class="admin-pending-row">'
            + '<div class="admin-pending-info">'
            + '<div class="admin-pending-name">' + (r.name || r.email || r.id || '-') + '</div>'
            + '<div class="admin-pending-date">' + rDate + '</div>'
            + '</div>'
            + '<div class="admin-pending-actions">'
            + '<button class="admin-approve-btn" data-request-id="' + (r.id || '') + '">승인</button>'
            + '<button class="admin-reject-btn" data-request-id="' + (r.id || '') + '">거부</button>'
            + '</div>'
            + '</div>';
        }).join('');

        pendingList.querySelectorAll('.admin-approve-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var evt = { target: btn };
            btn.dataset.action = 'approve';
            if (typeof handleAdminRequestAction === 'function') handleAdminRequestAction(evt);
          });
        });
        pendingList.querySelectorAll('.admin-reject-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var evt = { target: btn };
            btn.dataset.action = 'reject';
            if (typeof handleAdminRequestAction === 'function') handleAdminRequestAction(evt);
          });
        });
      }
    }

    // Server data
    var serverData = document.getElementById('adminServerData');
    if (serverData) {
      var ships = getShips();
      if (!ships.length) {
        serverData.innerHTML = '<div class="admin-empty">서버에 저장된 호선 데이터가 없습니다.</div>';
      } else {
        serverData.innerHTML = ships.map(function(s) {
          return '<div class="admin-server-row">'
            + '<span class="admin-server-name">' + (s.name || s.id) + '</span>'
            + '<span class="admin-server-size">' + (s.groupCode || '-') + '</span>'
            + '<button class="admin-server-delete" data-ship-id="' + s.id + '">삭제</button>'
            + '</div>';
        }).join('');

        serverData.querySelectorAll('.admin-server-delete').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var shipId = btn.dataset.shipId;
            var allShips = getShips();
            var target = allShips.find(function(s) { return s.id === shipId; });
            if (!target) return;
            if (!confirm('"' + target.name + '" 데이터를 삭제하시겠습니까?')) return;
            saveShips(allShips.filter(function(s) { return s.id !== shipId; }));
            renderAdminTab();
            if (typeof pushToast === 'function') pushToast('데이터 삭제: ' + target.name, 'info');
          });
        });
      }
    }
  }

  function showAdminTabIfAllowed() {
    var adminTabBtn = document.getElementById('adminTabBtn');
    if (adminTabBtn) {
      adminTabBtn.classList.toggle('hidden', !isAdminUser());
    }
  }

  // Hook into afterLogin flow: show ship select after successful auth
  const _origApplyAuthState = typeof applyAuthState === 'function' ? applyAuthState : null;

  // Patch: after auth state applied, show ship select if no ship chosen
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
      bindShipSelectEvents();
      showAdminTabIfAllowed();
      var adminRefresh = document.getElementById('adminRefreshAll');
      if (adminRefresh) adminRefresh.addEventListener('click', renderAdminTab);
    });
    // Also try immediate binding (DOM might already be ready)
    if (document.readyState !== 'loading') {
      bindShipSelectEvents();
      showAdminTabIfAllowed();
    }
  }

  // ============================================================
  // ■ FEATURE: Guest Access Mode
  // ============================================================

  function loginAsGuest() {
    var nameInput = document.getElementById('guestName');
    var codeInput = document.getElementById('guestCode');
    var hint = document.getElementById('guestHint');
    var guestName = (nameInput ? nameInput.value : '').trim();
    var guestCode = (codeInput ? codeInput.value : '').trim();

    if (!guestName) {
      if (hint) { hint.textContent = '이름을 입력하세요'; hint.style.color = '#ef4444'; }
      return;
    }
    if (guestCode !== '0953') {
      if (hint) { hint.textContent = '승인코드가 올바르지 않습니다'; hint.style.color = '#ef4444'; }
      return;
    }
    if (hint) { hint.textContent = ''; }

    state.auth.user = {
      id: 'guest:' + guestName,
      name: guestName,
      email: '',
      provider: 'guest',
      role: 'viewer',
      status: 'active',
      groupCode: 'GUEST',
      groupName: 'GUEST'
    };
    state.auth.groups = [{
      code: 'GUEST',
      name: 'GUEST',
      description: 'Guest read-only group',
      memberCount: 1,
      memberNames: [guestName],
      updatedAt: new Date().toISOString()
    }];
    state.auth.groupSpaces = [{
      groupCode: 'GUEST',
      groupName: 'GUEST',
      announcement: 'Read-only guest access.',
      notes: '',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
      memberCount: 1,
      memberNames: [guestName]
    }];
    state.auth.activeGroupCode = 'GUEST';
    state.auth.selectedGroupCode = 'GUEST';
    updateAuthStatus('info', 'Guest mode — read-only access (' + guestName + ').');
    applyAuthState();
    renderAll();
  }

  // Patch applyAuthState to handle guest-mode body class
  const _origApplyAuthStateForGuest = applyAuthState;
  // We wrap via monkey-patching the internal reference is already bound,
  // so we add a MutationObserver-style post-hook instead.
  (function patchGuestMode() {
    const origRenderAll = renderAll;
    renderAll = function () {
      origRenderAll.call(this);
      const user = state.auth.user;
      // guest-mode
      if (user && user.role === 'viewer') {
        document.body.classList.add('guest-mode');
      } else {
        document.body.classList.remove('guest-mode');
      }
      // vip-mode: 권욱 — 전체 열람, 수정 불가, 어드민 탭 숨김
      if (user && user.role === 'vip') {
        document.body.classList.add('vip-mode');
      } else {
        document.body.classList.remove('vip-mode');
      }
      showAdminTabIfAllowed();
    };
  })();

  // Bind guest login button and toggle
  (function bindGuestButton() {
    function attach() {
      var toggleBtn = document.getElementById('guestToggleBtn');
      var guestForm = document.getElementById('guestForm');
      if (toggleBtn && guestForm) {
        toggleBtn.addEventListener('click', function () {
          guestForm.classList.toggle('hidden');
        });
      }
      var btn = document.getElementById('guestLoginBtn');
      if (btn) btn.addEventListener('click', loginAsGuest);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    } else {
      attach();
    }
  })();

  // ============================================================
  // ■ REGISTRATION MODAL (Naver first-login)
  // ============================================================

  function showRegModal() {
    var overlay = document.getElementById('regModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    // Pre-fill from Naver profile if available
    var user = state.auth.user;
    if (user) {
      var nameEl = document.getElementById('regName');
      var emailEl = document.getElementById('regEmail');
      if (nameEl && user.name) nameEl.value = user.name;
      if (emailEl && user.email) emailEl.value = user.email;
    }
  }

  function hideRegModal() {
    var overlay = document.getElementById('regModalOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  async function submitRegistration() {
    var nameEl = document.getElementById('regName');
    var phoneEl = document.getElementById('regPhone');
    var companyEl = document.getElementById('regCompany');
    var emailEl = document.getElementById('regEmail');
    var hint = document.getElementById('regHint');

    var regName = (nameEl ? nameEl.value : '').trim();
    var regPhone = (phoneEl ? phoneEl.value : '').trim();
    var regCompany = (companyEl ? companyEl.value : '').trim();
    var regEmail = (emailEl ? emailEl.value : '').trim();

    if (!regName) {
      if (hint) { hint.textContent = '이름을 입력하세요'; hint.style.color = '#ef4444'; }
      return;
    }
    if (!regPhone) {
      if (hint) { hint.textContent = '전화번호를 입력하세요'; hint.style.color = '#ef4444'; }
      return;
    }
    if (!regCompany) {
      if (hint) { hint.textContent = '회사명을 입력하세요'; hint.style.color = '#ef4444'; }
      return;
    }

    try {
      await apiRequest('/register-info', {
        method: 'POST',
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          company: regCompany,
          email: regEmail
        })
      });
      if (hint) { hint.textContent = '등록 신청 완료! 관리자 승인을 기다려주세요.'; hint.style.color = '#22c55e'; }
      setTimeout(function () {
        hideRegModal();
        updateAuthStatus('warn', '사용 등록 신청이 완료되었습니다. 관리자 승인을 기다려주세요.');
      }, 1500);
    } catch (err) {
      if (hint) { hint.textContent = err.message || '등록 실패'; hint.style.color = '#ef4444'; }
    }
  }

  (function bindRegModal() {
    function attach() {
      var submitBtn = document.getElementById('regSubmitBtn');
      var cancelBtn = document.getElementById('regCancelBtn');
      if (submitBtn) submitBtn.addEventListener('click', submitRegistration);
      if (cancelBtn) cancelBtn.addEventListener('click', hideRegModal);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    } else {
      attach();
    }
  })();

  // Show registration modal when Naver login results in pending status
  var _origApplyAuthStateForReg = applyAuthState;
  (function patchRegModal() {
    var origRenderAllForReg = renderAll;
    renderAll = function () {
      origRenderAllForReg.call(this);
      var user = state.auth.user;
      if (user && user.status === 'pending' && user.provider === 'naver') {
        // Auto-show registration modal for first-time Naver users
        showRegModal();
      }
    };
  })();

  // ============================================================
  // ■ FEATURE: Installation Status Tracking
  // ============================================================

  function renderInstallationStatus() {
    const panel = document.getElementById('installPanel');
    if (!panel) return;

    const cables = state.cables || [];
    const installed = cables.filter(function (c) { return c.installStatus === 'installed'; }).length;
    const inProgress = cables.filter(function (c) { return c.installStatus === 'in-progress'; }).length;
    const pending = cables.filter(function (c) { return !c.installStatus || c.installStatus === 'pending'; }).length;
    const total = cables.length || 1;
    const pct = Math.round((installed / total) * 100);

    panel.innerHTML =
      '<div class="install-status-container">' +
        '<div class="panel-header compact"><div>' +
          '<p class="eyebrow">INSTALLATION TRACKING</p>' +
          '<h3>Cable Installation Status</h3>' +
        '</div></div>' +
        '<div class="install-progress-wrap">' +
          '<div class="install-progress-bar">' +
            '<div class="install-progress-fill" style="width:' + pct + '%"></div>' +
          '</div>' +
          '<span class="install-progress-label">' + pct + '% Complete (' + installed + ' / ' + total + ')</span>' +
        '</div>' +
        '<div class="install-status-cards">' +
          '<button class="install-card installed" data-filter="installed">' +
            '<strong>' + installed + '</strong><span>Installed</span>' +
          '</button>' +
          '<button class="install-card in-progress" data-filter="in-progress">' +
            '<strong>' + inProgress + '</strong><span>In Progress</span>' +
          '</button>' +
          '<button class="install-card pending" data-filter="pending">' +
            '<strong>' + pending + '</strong><span>Pending</span>' +
          '</button>' +
        '</div>' +
        '<div id="installFilteredGrid" class="install-filtered-grid"></div>' +
      '</div>';

    // Bind filter clicks
    panel.querySelectorAll('.install-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var filterVal = card.dataset.filter;
        var grid = document.getElementById('installFilteredGrid');
        if (!grid) return;
        var filtered = (state.cables || []).filter(function (c) {
          var st = c.installStatus || 'pending';
          return st === filterVal;
        });
        if (!filtered.length) {
          grid.innerHTML = '<p style="padding:8px;color:var(--muted);font-size:12px;">No cables with status: ' + filterVal + '</p>';
          return;
        }
        var rows = filtered.slice(0, 100).map(function (c) {
          return '<div class="install-row">' +
            '<span class="install-row-name">' + (c.name || c.id || '—') + '</span>' +
            '<span class="install-row-status ' + (c.installStatus || 'pending') + '">' + (c.installStatus || 'pending').toUpperCase() + '</span>' +
          '</div>';
        }).join('');
        grid.innerHTML = '<div class="install-grid-header">Showing ' + filtered.length + ' cable(s) — ' + filterVal.toUpperCase() + '</div>' + rows;
      });
    });
  }

  // Patch setActiveTab to handle 'install' and 'admin' tabs
  (function patchInstallTab() {
    var origSetActiveTab = setActiveTab;
    setActiveTab = function (tab) {
      origSetActiveTab(tab);
      if (tab === 'install') {
        renderInstallationStatus();
      }
      if (tab === 'admin') {
        showAdminTabIfAllowed();
        renderAdminTab();
      }
    };
  })();

  // ============================================================
  // ■ FEATURE: Settings Panel
  // ============================================================

  var SETTINGS_KEY = 'seastar_v3_settings';

  function loadSettings() {
    try {
      var raw = window.localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveSettings(settings) {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function getSettings() {
    var defaults = { theme: 'dark', autoSaveInterval: 5, language: 'KO' };
    var saved = loadSettings();
    return Object.assign({}, defaults, saved);
  }

  function applySettings(settings) {
    // Theme
    if (settings.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    // Auto-save interval
    if (window._seastarAutoSaveTimer) {
      clearInterval(window._seastarAutoSaveTimer);
    }
    var intervalMs = (settings.autoSaveInterval || 5) * 60 * 1000;
    window._seastarAutoSaveTimer = setInterval(function () {
      if (state.project && state.project.dirty && typeof saveProjectToServer === 'function') {
        saveProjectToServer({ silent: true });
      }
    }, intervalMs);
    // Language stored for future use
    saveSettings(settings);
  }

  function renderSettingsPanel() {
    var existing = document.getElementById('settingsPanel');
    if (existing) {
      existing.remove();
      return;
    }
    var settings = getSettings();
    var overlay = document.createElement('div');
    overlay.id = 'settingsPanel';
    overlay.className = 'settings-overlay';
    overlay.innerHTML =
      '<div class="settings-card">' +
        '<div class="settings-header">' +
          '<h3>Settings</h3>' +
          '<button id="settingsCloseBtn" class="toolbar-btn subtle view-only" type="button">✕</button>' +
        '</div>' +
        '<div class="settings-body">' +
          '<label class="settings-row">' +
            '<span>Theme</span>' +
            '<select id="settingTheme" class="toolbar-input">' +
              '<option value="dark"' + (settings.theme === 'dark' ? ' selected' : '') + '>Dark</option>' +
              '<option value="light"' + (settings.theme === 'light' ? ' selected' : '') + '>Light</option>' +
            '</select>' +
          '</label>' +
          '<label class="settings-row">' +
            '<span>Auto-save Interval</span>' +
            '<select id="settingAutoSave" class="toolbar-input">' +
              '<option value="1"' + (settings.autoSaveInterval === 1 ? ' selected' : '') + '>1 min</option>' +
              '<option value="5"' + (settings.autoSaveInterval === 5 ? ' selected' : '') + '>5 min</option>' +
              '<option value="10"' + (settings.autoSaveInterval === 10 ? ' selected' : '') + '>10 min</option>' +
            '</select>' +
          '</label>' +
          '<label class="settings-row">' +
            '<span>Language</span>' +
            '<select id="settingLanguage" class="toolbar-input">' +
              '<option value="KO"' + (settings.language === 'KO' ? ' selected' : '') + '>KO</option>' +
              '<option value="EN"' + (settings.language === 'EN' ? ' selected' : '') + '>EN</option>' +
            '</select>' +
          '</label>' +
        '</div>' +
        '<div class="settings-footer">' +
          '<button id="settingsSaveBtn" class="login-btn-primary" type="button">Save</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('settingsCloseBtn').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
    document.getElementById('settingsSaveBtn').addEventListener('click', function () {
      var newSettings = {
        theme: document.getElementById('settingTheme').value,
        autoSaveInterval: parseInt(document.getElementById('settingAutoSave').value, 10),
        language: document.getElementById('settingLanguage').value
      };
      applySettings(newSettings);
      showToast('Settings saved.', 'success');
      overlay.remove();
    });
  }

  // Bind settings gear icon
  (function bindSettingsButton() {
    function attach() {
      var btn = document.getElementById('settingsGearBtn');
      if (btn) btn.addEventListener('click', renderSettingsPanel);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    } else {
      attach();
    }
  })();

  // Apply saved settings on load
  (function initSettings() {
    function apply() { applySettings(getSettings()); }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', apply);
    } else {
      apply();
    }
  })();

  // ============================================================
  // ■ BOTTOM SHEET — Slide-up + drag-to-dismiss + horizontal swipe
  // ============================================================
  const _sheetState = { open: false, activeSlide: 0, startY: 0, currentY: 0, dragging: false, swipeStartX: 0, swiping: false };
  let _sheetEl = null, _sheetBackdrop = null, _sheetCarousel = null, _sheetSlides = [], _sheetDots = [], _sheetTabs = [];

  function createBottomSheet(config) {
    // config: { tabs: [{ id, label, render(container) }] }
    if (_sheetEl) { openBottomSheet(); return; }

    _sheetBackdrop = document.createElement('div');
    _sheetBackdrop.className = 'bottom-sheet-backdrop';
    _sheetBackdrop.addEventListener('click', closeBottomSheet);

    _sheetEl = document.createElement('div');
    _sheetEl.className = 'bottom-sheet';

    // Drag handle
    const handle = document.createElement('div');
    handle.className = 'bottom-sheet-handle';
    handle.addEventListener('pointerdown', onSheetDragStart);
    _sheetEl.appendChild(handle);

    // Tab header
    const header = document.createElement('div');
    header.className = 'bottom-sheet-header';
    _sheetTabs = [];
    config.tabs.forEach((tab, i) => {
      const btn = document.createElement('button');
      btn.className = 'sheet-tab' + (i === 0 ? ' is-active' : '');
      btn.textContent = tab.label;
      btn.addEventListener('click', () => goToSlide(i));
      header.appendChild(btn);
      _sheetTabs.push(btn);
    });
    _sheetEl.appendChild(header);

    // Carousel
    _sheetCarousel = document.createElement('div');
    _sheetCarousel.className = 'bottom-sheet-carousel';
    _sheetCarousel.addEventListener('pointerdown', onSwipeStart);
    _sheetSlides = [];
    config.tabs.forEach((tab) => {
      const slide = document.createElement('div');
      slide.className = 'bottom-sheet-slide';
      slide.dataset.sheetTab = tab.id;
      tab.render(slide);
      _sheetCarousel.appendChild(slide);
      _sheetSlides.push(slide);
    });
    _sheetEl.appendChild(_sheetCarousel);

    // Dots
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'bottom-sheet-dots';
    _sheetDots = [];
    config.tabs.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'bottom-sheet-dot' + (i === 0 ? ' is-active' : '');
      dotsWrap.appendChild(dot);
      _sheetDots.push(dot);
    });
    _sheetEl.appendChild(dotsWrap);

    document.body.appendChild(_sheetBackdrop);
    document.body.appendChild(_sheetEl);
    requestAnimationFrame(() => openBottomSheet());
  }

  function openBottomSheet() {
    if (!_sheetEl) return;
    _sheetState.open = true;
    _sheetBackdrop.classList.add('is-open');
    _sheetEl.classList.add('is-open');
  }

  function closeBottomSheet() {
    if (!_sheetEl) return;
    _sheetState.open = false;
    _sheetEl.classList.remove('is-open');
    _sheetBackdrop.classList.remove('is-open');
  }

  function destroyBottomSheet() {
    closeBottomSheet();
    setTimeout(() => {
      _sheetEl?.remove(); _sheetBackdrop?.remove();
      _sheetEl = null; _sheetBackdrop = null; _sheetCarousel = null;
      _sheetSlides = []; _sheetDots = []; _sheetTabs = [];
    }, 400);
  }

  function goToSlide(index) {
    _sheetState.activeSlide = Math.max(0, Math.min(index, _sheetSlides.length - 1));
    const offset = -_sheetState.activeSlide * 100;
    _sheetSlides.forEach(s => { s.style.transform = `translateX(${offset}%)`; });
    _sheetTabs.forEach((t, i) => t.classList.toggle('is-active', i === _sheetState.activeSlide));
    _sheetDots.forEach((d, i) => d.classList.toggle('is-active', i === _sheetState.activeSlide));
  }

  // Vertical drag to dismiss
  function onSheetDragStart(e) {
    _sheetState.dragging = true;
    _sheetState.startY = e.clientY;
    _sheetState.currentY = 0;
    _sheetEl.style.transition = 'none';
    document.addEventListener('pointermove', onSheetDragMove);
    document.addEventListener('pointerup', onSheetDragEnd);
  }
  function onSheetDragMove(e) {
    if (!_sheetState.dragging) return;
    const dy = Math.max(0, e.clientY - _sheetState.startY);
    _sheetState.currentY = dy;
    _sheetEl.style.transform = window.innerWidth >= 768
      ? `translate(-50%, ${dy}px)` : `translateY(${dy}px)`;
  }
  function onSheetDragEnd() {
    _sheetState.dragging = false;
    document.removeEventListener('pointermove', onSheetDragMove);
    document.removeEventListener('pointerup', onSheetDragEnd);
    _sheetEl.style.transition = '';
    if (_sheetState.currentY > 120) {
      closeBottomSheet();
    } else {
      _sheetEl.style.transform = '';
      _sheetEl.classList.add('is-open');
    }
    _sheetState.currentY = 0;
  }

  // Horizontal swipe for carousel
  function onSwipeStart(e) {
    if (_sheetState.dragging) return;
    _sheetState.swiping = true;
    _sheetState.swipeStartX = e.clientX;
    _sheetSlides.forEach(s => { s.style.transition = 'none'; });
    document.addEventListener('pointermove', onSwipeMove);
    document.addEventListener('pointerup', onSwipeEnd);
  }
  function onSwipeMove(e) {
    if (!_sheetState.swiping) return;
    const dx = e.clientX - _sheetState.swipeStartX;
    const base = -_sheetState.activeSlide * 100;
    const pct = base + (dx / (_sheetCarousel?.offsetWidth || 400)) * 100;
    _sheetSlides.forEach(s => { s.style.transform = `translateX(${pct}%)`; });
  }
  function onSwipeEnd(e) {
    if (!_sheetState.swiping) return;
    _sheetState.swiping = false;
    document.removeEventListener('pointermove', onSwipeMove);
    document.removeEventListener('pointerup', onSwipeEnd);
    _sheetSlides.forEach(s => { s.style.transition = ''; });
    const dx = e.clientX - _sheetState.swipeStartX;
    if (dx < -50 && _sheetState.activeSlide < _sheetSlides.length - 1) {
      goToSlide(_sheetState.activeSlide + 1);
    } else if (dx > 50 && _sheetState.activeSlide > 0) {
      goToSlide(_sheetState.activeSlide - 1);
    } else {
      goToSlide(_sheetState.activeSlide);
    }
  }

  // ── Quick-view sheets for Node / Cable Type / Fill ──
  function openNodeSheet() {
    const nodes = state.mergedNodes || [];
    createBottomSheet({
      tabs: [
        {
          id: 'nodes', label: 'NODES (' + nodes.length + ')',
          render(el) {
            if (!nodes.length) { el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:32px">노드 데이터를 먼저 로드하세요</p>'; return; }
            nodes.slice(0, 200).forEach((n, i) => {
              const item = document.createElement('div');
              item.className = 'sheet-list-item';
              item.innerHTML = '<span class="sheet-item-badge">' + (i + 1) + '</span>'
                + '<div><div class="sheet-item-title">' + (n.name || '-') + '</div>'
                + '<div class="sheet-item-sub">' + (n.structure || '') + ' · ' + (n.type || '') + ' · Link: ' + (n.linkLength || 0) + 'm</div></div>';
              item.addEventListener('click', () => { selectNode(n.name, { activateTab: true }); closeBottomSheet(); });
              el.appendChild(item);
            });
          }
        },
        {
          id: 'fill', label: 'FILL RATIO',
          render(el) {
            if (!nodes.length) { el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:32px">노드 데이터 없음</p>'; return; }
            const sorted = [...nodes].filter(n => n.areaFillRatio > 0).sort((a, b) => b.areaFillRatio - a.areaFillRatio);
            sorted.slice(0, 100).forEach(n => {
              const pct = Math.min(100, Math.round((n.areaFillRatio || 0) * 100));
              const item = document.createElement('div');
              item.className = 'sheet-list-item';
              item.style.flexDirection = 'column'; item.style.alignItems = 'stretch';
              item.innerHTML = '<div style="display:flex;justify-content:space-between"><span class="sheet-item-title">' + n.name + '</span><span style="font-weight:700;font-size:13px;color:' + (pct > 80 ? '#ef4444' : pct > 50 ? '#eab308' : '#22c55e') + '">' + pct + '%</span></div>'
                + '<div class="sheet-fill-bar"><div class="sheet-fill-bar-inner" style="width:' + pct + '%"></div></div>';
              el.appendChild(item);
            });
          }
        }
      ]
    });
  }

  function openCableTypeSheet() {
    const types = typeof CABLE_TYPE_DB !== 'undefined' ? CABLE_TYPE_DB : [];
    createBottomSheet({
      tabs: [
        {
          id: 'types', label: 'CABLE TYPES (' + types.length + ')',
          render(el) {
            const search = document.createElement('input');
            search.type = 'search'; search.placeholder = '케이블 타입 검색...';
            search.style.cssText = 'width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;font-size:13px;';
            el.appendChild(search);
            const list = document.createElement('div');
            el.appendChild(list);
            function renderTypes(filter) {
              list.innerHTML = '';
              const filtered = filter ? types.filter(t => (t.type || '').toLowerCase().includes(filter.toLowerCase())) : types;
              filtered.slice(0, 150).forEach(t => {
                const item = document.createElement('div');
                item.className = 'sheet-list-item';
                item.innerHTML = '<span class="sheet-item-badge" style="font-size:9px;min-width:36px">' + (t.voltage || '-') + '</span>'
                  + '<div><div class="sheet-item-title">' + (t.type || '-') + '</div>'
                  + '<div class="sheet-item-sub">OD: ' + (t.od || '-') + 'mm · W: ' + (t.weight || '-') + 'kg/m · Gland: ' + (t.glandSize || '-') + '</div></div>';
                list.appendChild(item);
              });
              if (!filtered.length) list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:24px">결과 없음</p>';
            }
            renderTypes('');
            search.addEventListener('input', () => renderTypes(search.value));
          }
        },
        {
          id: 'summary', label: 'SUMMARY',
          render(el) {
            const cables = state.cables || [];
            const typeMap = {};
            cables.forEach(c => { const t = c.type || 'UNKNOWN'; typeMap[t] = (typeMap[t] || 0) + 1; });
            const sorted = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);
            sorted.forEach(([type, count]) => {
              const item = document.createElement('div');
              item.className = 'sheet-list-item';
              item.innerHTML = '<span class="sheet-item-badge">' + count + '</span>'
                + '<div class="sheet-item-title">' + type + '</div>';
              el.appendChild(item);
            });
            if (!sorted.length) el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:24px">케이블 데이터 없음</p>';
          }
        }
      ]
    });
  }

  // Expose for toolbar buttons
  window.__openNodeSheet = openNodeSheet;
  window.__openCableTypeSheet = openCableTypeSheet;
  window.__openBottomSheet = createBottomSheet;
  window.__closeBottomSheet = closeBottomSheet;

})();
