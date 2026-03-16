    return Boolean(state.auth.backendAvailable && state.auth.providers?.local?.enabled);
  }

  async function initAuth() {
    const authQueryState = consumeAuthQueryParams();
    if (DEMO_AUTH_ENABLED) {
      restoreFallbackSession();
    } else {
      removeFallbackSession();
    }

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
      } else if (payload.user) {
        updateAuthStatus(
          payload.user.role === 'admin' || payload.user.status === 'active' ? 'success' : 'warn',
          payload.message || (String(payload.user.name || 'User') + ' session restored.')
        );
      } else {
        updateAuthStatus('info', 'Select a login method.');
      }
    } catch (error) {
      state.auth.backendAvailable = false;
      setDependencyStatus(dom.depApi, 'warn', 'AUTH API');

      if (state.auth.user && DEMO_AUTH_ENABLED) {
        ensureFallbackAdminContext();
        updateAuthStatus('warn', '諛깆뿏?쒓? ?놁뼱 ?곕え 愿由ъ옄 ?몄뀡?쇰줈 吏꾩엯?⑸땲??');
      } else if (authQueryState?.type === 'error') {
        updateAuthStatus('error', authQueryState.message);
      } else {
        updateAuthStatus('warn', '?몄쬆 ?뚯빱瑜?李얠? 紐삵뻽?듬땲?? ?댁쁺 諛고룷?먯꽌??auth worker? ?섍꼍?ㅼ젙???꾩슂?⑸땲??');
      }
    }

    applyAuthState();
    updateDependencyPills();
    renderGoogleButtonWithRetry();
  }

  async function handleLocalLogin() {
    const id = trimText(dom.loginId.value);
    const password = dom.loginPw.value;

    if (!id || !password) {
      updateAuthStatus('warn', 'ID? 鍮꾨?踰덊샇瑜?紐⑤몢 ?낅젰??二쇱꽭??');
      return;
    }

    if (localProviderEnabled()) {
      try {
        const payload = await apiRequest('/local/login', {
          method: 'POST',
          body: JSON.stringify({ username: id, password })
        });
        applyAuthPayload(payload);
        removeFallbackSession();
        updateAuthStatus('success', payload.message || (String(payload.user.name || 'User') + ' login success'));
        applyAuthState();
        renderAll();
        return;
      } catch (error) {
        updateAuthStatus('error', error.message || '愿由ъ옄 濡쒓렇?몄뿉 ?ㅽ뙣?덉뒿?덈떎.');
        return;
      }
    }

    if (DEMO_AUTH_ENABLED && id === FALLBACK_LOCAL_CREDENTIALS.id && password === FALLBACK_LOCAL_CREDENTIALS.password) {
      state.auth.user = { ...FALLBACK_LOCAL_USER };
      persistFallbackSession();
      ensureFallbackAdminContext();
      updateAuthStatus('success', '?곕え 愿由ъ옄 濡쒓렇?몄뿉 ?깃났?덉뒿?덈떎.');
      applyAuthState();
      renderAll();
      return;
    }

    updateAuthStatus('warn', state.auth.backendAvailable
      ? '愿由ъ옄 濡쒖뺄 濡쒓렇?몄? ?쒕쾭 ?섍꼍?ㅼ젙???꾨즺?????ъ슜?????덉뒿?덈떎.'
      : '?몄쬆 ?뚯빱媛 ?놁쑝硫?愿由ъ옄 濡쒖뺄 濡쒓렇?몄쓣 ?ъ슜?????놁뒿?덈떎.');
  }

  function applyAuthState() {
    const user = state.auth.user;
    const canAccess = isWorkspaceAllowed(user);
    const isAdmin = isAdminUser(user);

    if (dom.loginHint) {
      dom.loginHint.textContent = localProviderEnabled()
        ? '愿由ъ옄 怨꾩젙? ?쒕쾭 ?섍꼍?ㅼ젙?먯꽌留?愿由щ맗?덈떎.'
        : '?댁쁺 諛고룷?먯꽌??auth worker? SESSION_SECRET, ADMIN_* ?섍꼍?ㅼ젙???꾩슂?⑸땲??';
    }

    dom.naverLoginBtn.disabled = !state.auth.backendAvailable;
    dom.localLoginBtn.disabled = !localProviderEnabled() && !DEMO_AUTH_ENABLED;
    dom.authRequestMeta.classList.add('hidden');
    dom.overlayLogoutBtn.classList.add('hidden');

    if (!user) {
      dom.loginOverlay.classList.remove('hidden');
      dom.userPanel.classList.add('hidden');
      dom.authBackendHint.textContent = state.auth.backendAvailable
        ? 'Google / Naver 濡쒓렇?몄? 愿由ъ옄 ?뱀씤 ???쒖꽦?붾맗?덈떎. 愿由ъ옄 濡쒖뺄 濡쒓렇?몄? ?쒕쾭 ?섍꼍?ㅼ젙 ?꾨즺 ???ъ슜?????덉뒿?덈떎.'
        : '?댁쁺 諛고룷?먯꽌???몄쬆 ?뚯빱? ?섍꼍蹂?섎? 癒쇱? ?곌껐?댁빞 ?⑸땲??';
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
      : ('Current group: ' + (trimText(user.groupCode || user.groupName) || 'UNASSIGNED'));
    renderGroupSpace();
  }

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

  function isWorkspaceAllowed(user = state.auth.user) {
    return Boolean(user && (user.role === 'admin' || user.status === 'active'));
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
        announcement: '濡쒖뺄 ?곕え 愿由ъ옄 怨듦컙?낅땲??',
        notes: '諛고룷 ?꾩뿉??Google/Naver ?뱀씤 ?붿껌怨?洹몃９ 怨듦컙??auth worker????λ맗?덈떎.',
        updatedAt: now,
        updatedBy: '愿由ъ옄',
        memberCount: 1,
        memberNames: ['愿由ъ옄']
      };
      saveFallbackGroupSpaces(spaces);
    }
    state.auth.groups = [{
      code: 'ADMIN',
      name: 'ADMIN',
      description: '愿由ъ옄 洹몃９',
      memberCount: 1,
      memberNames: ['愿由ъ옄'],
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
        message: '?ъ슜 ?붿껌??愿由ъ옄?먭쾶 ?꾨떖?섏뿀?듬땲?? ?뱀씤??湲곕떎?ㅼ＜?몄슂.'
      };
    }

    return {
      type: 'success',
      message: '?뚯뀥 濡쒓렇?몄씠 ?꾨즺?섏뿀?듬땲??'
    };
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
        updateAuthStatus('info', 'Select a login method.');
      }
    } catch (error) {
      state.auth.backendAvailable = false;
      setDependencyStatus(dom.depApi, 'warn', 'AUTH API');
      if (state.auth.user && DEMO_AUTH_ENABLED) {
        ensureFallbackAdminContext();
        updateAuthStatus('warn', '諛깆뿏?쒓? ?놁뼱 濡쒖뺄 愿由ъ옄 ?곕え ?몄뀡?쇰줈 吏꾩엯?⑸땲??');
      } else if (authQueryState?.type === 'error') {
        updateAuthStatus('error', authQueryState.message);
      } else {
        updateAuthStatus('warn', '?몄쬆 ?뚯빱瑜?李얠? 紐삵뻽?듬땲?? ?댁쁺 諛고룷?먯꽌??auth worker? ?쒕쾭 ?섍꼍?ㅼ젙???꾩슂?⑸땲??');
      }
    }

    applyAuthState();
    updateDependencyPills();
    renderGoogleButtonWithRetry();
    await loadProjectFromServer({ announce: false });
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
        applyAuthPayload(payload);
        removeFallbackSession();
        updateAuthStatus('success', payload.message || (String(payload.user.name || 'User') + ' login success'));
        applyAuthState();
        await loadProjectFromServer({ announce: false });
        renderAll();
        return;
      } catch (error) {
        updateAuthStatus('error', error.message || '愿由ъ옄 濡쒓렇?몄뿉 ?ㅽ뙣?덉뒿?덈떎.');
      }
    }

    if (DEMO_AUTH_ENABLED && id === FALLBACK_LOCAL_CREDENTIALS.id && password === FALLBACK_LOCAL_CREDENTIALS.password) {
      state.auth.user = { ...FALLBACK_LOCAL_USER };
      persistFallbackSession();
      ensureFallbackAdminContext();
      updateAuthStatus('success', '濡쒖뺄 愿由ъ옄 ?곕え 濡쒓렇?몄뿉 ?깃났?덉뒿?덈떎.');
      applyAuthState();
      await loadProjectFromServer({ announce: false });
      renderAll();
      return;
    }

    updateAuthStatus('error', state.auth.backendAvailable ? '愿由ъ옄 濡쒓렇???뺣낫媛 留욎? ?딆뒿?덈떎.' : '愿由ъ옄 濡쒓렇?몄? auth worker? ADMIN_* ?쒕쾭 ?ㅼ젙??以鍮꾨맂 ???ъ슜?????덉뒿?덈떎.');
  }

  function applyAuthState() {
    const user = state.auth.user;
    const canAccess = isWorkspaceAllowed(user);
    const isAdmin = isAdminUser(user);

    if (dom.loginHint) {
      dom.loginHint.textContent = state.auth.backendAvailable
        ? '愿由ъ옄 怨꾩젙? ?쒕쾭 ?섍꼍?ㅼ젙?먯꽌留?愿由щ맗?덈떎.'
        : '?댁쁺 諛고룷?먯꽌??auth worker? ADMIN_* ?섍꼍?ㅼ젙???꾩슂?⑸땲??';
    }

    dom.naverLoginBtn.disabled = !state.auth.backendAvailable;
    dom.authRequestMeta.classList.add('hidden');
    dom.overlayLogoutBtn.classList.add('hidden');

    if (!user) {
      dom.loginOverlay.classList.remove('hidden');
      dom.userPanel.classList.add('hidden');
      dom.authBackendHint.textContent = state.auth.backendAvailable
        ? 'Google / Naver 濡쒓렇?몄? 愿由ъ옄 ?뱀씤 ???쒖꽦?붾맗?덈떎. 愿由ъ옄 濡쒓렇???먮뒗 ?뚯뀥 濡쒓렇?몄쑝濡?吏꾩엯??二쇱꽭??'
        : '?몄쬆 ?뚯빱媛 ?놁쑝硫?紐⑤뱺 濡쒓렇?몄? 李⑤떒?⑸땲?? ?댁쁺 諛고룷?먯꽌??auth worker? ?섍꼍蹂?섎? 癒쇱? ?곌껐?섏꽭??';
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
      : ('Current group: ' + (trimText(user.groupCode || user.groupName) || 'UNASSIGNED'));
    renderGroupSpace();
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
      applyAuthPayload(payload);
      updateAuthStatus(
        payload.user?.status === 'pending' ? 'warn' : 'success',
        payload.message || (String(payload.user?.name || 'User') + ' login success')
      );
      applyAuthState();
      await loadProjectFromServer({ announce: false });
      renderAll();
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
    updateAuthStatus('info', '濡쒓렇?꾩썐?섏뿀?듬땲??');
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
      pushToast('??ν븷 洹몃９ 怨듦컙???놁뒿?덈떎.', 'warn');
      return;
    }
    if (!isAdminUser(user) && trimText(user.groupCode) !== groupCode) {
      pushToast('?꾩옱 洹몃９ 怨듦컙留??섏젙?????덉뒿?덈떎.', 'warn');
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
      pushToast('濡쒖뺄 洹몃９ 怨듦컙????ν뻽?듬땲??', 'success');
      return;
    }

    try {
      await apiRequest('/groups/space', {
        method: 'POST',
        body: JSON.stringify({ groupCode, announcement, notes })
      });
      await refreshAuthContext();
      pushToast('洹몃９ 怨듦컙????ν뻽?듬땲??', 'success');
    } catch (error) {
      pushToast(error.message || '洹몃９ 怨듦컙 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎.', 'error');
    }
  }

  async function handleAdminRequestAction(event) {
    const button = event.target.closest('[data-request-action]');
    if (!button) return;
    if (!isAdminUser()) {
      pushToast('愿由ъ옄留??붿껌??泥섎━?????덉뒿?덈떎.', 'warn');
      return;
    }
    if (!state.auth.backendAvailable) {
      pushToast('??湲곕뒫? auth worker媛 ?곌껐???곹깭?먯꽌留??숈옉?⑸땲??', 'warn');
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
        pushToast('?ъ슜 ?붿껌???뱀씤?덉뒿?덈떎.', 'success');
      } else if (action === 'reject') {
        await apiRequest('/admin/requests/' + encodeURIComponent(requestId) + '/reject', {
          method: 'POST',
          body: JSON.stringify({})
        });
        pushToast('?ъ슜 ?붿껌??諛섎젮?덉뒿?덈떎.', 'warn');
      }
      await refreshAuthContext();
    } catch (error) {
      pushToast(error.message || '?붿껌 泥섎━???ㅽ뙣?덉뒿?덈떎.', 'error');
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
      : '<div class="empty-state">?쒖떆??洹몃９ 硫ㅻ쾭媛 ?놁뒿?덈떎.</div>';

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
      dom.adminDisplayName.textContent = isAdminUser() ? (state.auth.user?.name || '愿由ъ옄') : '愿由ъ옄';
    }

    if (!isAdminUser()) {
      dom.adminRequestList.innerHTML = '<div class="empty-state">愿由ъ옄留??뱀씤 ?먮? 蹂????덉뒿?덈떎.</div>';
      return;
    }

    if (!requests.length) {
      dom.adminRequestList.innerHTML = '<div class="empty-state">?꾩옱 ?湲?以묒씤 ?ъ슜 ?붿껌???놁뒿?덈떎.</div>';
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
      return ''
        + '<div class="admin-request-row" data-request-id="' + requestIdValue + '">'
        + '<div class="admin-request-head">'
        + '<div><strong>' + requestName + '</strong><div class="muted">' + requestProvider + ' - ' + requestEmail + '</div></div>'
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
    if (tab === 'diagnostics') {
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
    applyAuthState();
    updateProjectStatus();
    updateHistoryControls();
  }
})();
