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
    setTextContent(document.querySelector('.login-card-head .eyebrow'), 'Secure Access');
    setTextContent(document.querySelector('.login-card-head h2'), 'SEASTAR CMS V3');
    setTextContent(
      document.querySelector('.login-card-head .muted'),
      'Google, Naver, 관리자 계정으로 로그인할 수 있습니다. 운영 배포에서는 인증 워커와 서버 환경설정이 연결된 상태에서만 로그인 기능이 활성화됩니다.'
    );
    setTextContent(document.querySelector('.auth-group .group-title'), '소셜 로그인');
    setTextContent(dom.overlayLogoutBtn, '로그아웃');
    setTextContent(dom.logoutBtn, '로그아웃');
    setTextContent(dom.naverLoginBtn, 'Naver 로그인');
    setTextContent(document.querySelector('.admin-auth summary'), '관리자 로컬 로그인');
    setTextContent(dom.localLoginBtn, '관리자 로그인');
    setPlaceholder(dom.loginId, '관리자 ID');
    setPlaceholder(dom.loginPw, '관리자 비밀번호');

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

    setTextContent(document.querySelector('[data-panel="dashboard"] .panel-header h3'), '필수 SCH 전체 리스트');
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
      const message = state.auth.backendAvailable
        ? 'Google Client ID가 설정되지 않았습니다.'
        : '인증 백엔드가 연결되지 않아 Google 로그인을 사용할 수 없습니다.';
      dom.googleButtonHost.innerHTML = `<div class="login-note">${escapeHtml(message)}</div>`;
      return;
    }

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

  async function initAuth() {
    normalizeUiText();
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
        updateAuthStatus('warn', payload.message || '사용 요청이 관리자에게 전달되었습니다. 승인 대기 중입니다.');
      } else if (authQueryState?.type === 'pending') {
        updateAuthStatus('warn', authQueryState.message);
      } else if (payload.user) {
        updateAuthStatus(
          payload.user.role === 'admin' || payload.user.status === 'active' ? 'success' : 'warn',
          payload.message || `${String(payload.user.name || '사용자')} 세션이 복원되었습니다.`
        );
      } else {
        updateAuthStatus('info', '로그인 방식을 선택해 주세요.');
      }
    } catch (error) {
      state.auth.backendAvailable = false;
      setDependencyStatus(dom.depApi, 'warn', 'AUTH API');
      if (state.auth.user && DEMO_AUTH_ENABLED) {
        ensureFallbackAdminContext();
        updateAuthStatus('warn', '백엔드 연결이 없어 로컬 관리자 세션으로 진입합니다.');
      } else if (authQueryState?.type === 'error') {
        updateAuthStatus('error', authQueryState.message);
      } else {
        updateAuthStatus('warn', '인증 백엔드를 찾을 수 없습니다. 운영 배포에서는 auth worker와 환경설정이 필요합니다.');
      }
    }

    applyAuthState();
    updateDependencyPills();
    renderGoogleButtonWithRetry();
    await loadProjectFromServer({ announce: false });
  }

  async function handleLocalLogin() {
    normalizeUiText();
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
        updateAuthStatus('success', payload.message || `${String(payload.user.name || '관리자')} 로그인 성공`);
        applyAuthState();
        await loadProjectFromServer({ announce: false });
        renderAll();
        return;
      } catch (error) {
        updateAuthStatus('error', error.message || '관리자 로그인에 실패했습니다.');
      }
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

    updateAuthStatus(
      'error',
      state.auth.backendAvailable
        ? '관리자 로그인 정보가 올바르지 않거나 서버 설정이 완료되지 않았습니다.'
        : '관리자 로그인을 사용하려면 auth worker와 ADMIN_* 환경설정이 필요합니다.'
    );
  }

  function applyAuthState() {
    normalizeUiText();
    const user = state.auth.user;
    const canAccess = isWorkspaceAllowed(user);
    const isAdmin = isAdminUser(user);

    if (dom.loginHint) {
      dom.loginHint.textContent = state.auth.backendAvailable
        ? '관리자 계정은 서버 환경설정에서만 활성화됩니다.'
        : '운영 배포에서는 auth worker와 ADMIN_* 환경설정이 필요합니다.';
    }

    dom.naverLoginBtn.disabled = !(state.auth.backendAvailable && state.auth.providers?.naver?.enabled);
    dom.authRequestMeta.classList.add('hidden');
    dom.overlayLogoutBtn.classList.add('hidden');

    if (!user) {
      dom.loginOverlay.classList.remove('hidden');
      dom.userPanel.classList.add('hidden');
      dom.authBackendHint.textContent = state.auth.backendAvailable
        ? 'Google, Naver, 관리자 로그인을 사용할 수 있습니다. 원하는 로그인 방식을 선택해 주세요.'
        : '인증 백엔드가 연결되지 않아 소셜 로그인이 비활성화되어 있습니다. 운영 환경에서는 auth worker와 환경변수를 먼저 연결해 주세요.';
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
        ? `사용 요청이 관리자에게 전달되었습니다. 현재 상태: ${String(user.status).toUpperCase()}.`
        : `현재 계정 상태: ${String(user.status || 'unknown').toUpperCase()}.`;
      dom.authBackendHint.textContent = '관리자 승인 전까지 메인 작업 화면은 잠겨 있습니다.';
      renderGroupSpace();
      return;
    }

    dom.loginOverlay.classList.add('hidden');
    dom.userPanel.classList.remove('hidden');
    dom.authBackendHint.textContent = isAdmin
      ? '관리자는 요청 승인, 그룹 배정, 그룹 공간 관리를 수행할 수 있습니다.'
      : `현재 그룹: ${trimText(user.groupCode || user.groupName) || 'UNASSIGNED'}`;
    renderGroupSpace();
  }

  async function handleGoogleCredential(response) {
    if (!response?.credential) {
      updateAuthStatus('error', 'Google 인증 토큰이 비어 있습니다.');
      return;
    }
    if (!state.auth.backendAvailable) {
      updateAuthStatus('warn', '백엔드 연결이 없어 Google 인증을 검증할 수 없습니다.');
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
        payload.message || `${String(payload.user?.name || '사용자')} 로그인 성공`
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
    updateAuthStatus('info', '로그아웃되었습니다.');
    applyAuthState();
    renderGoogleButtonWithRetry();
    updateProjectStatus('LOGGED OUT');
    renderAll();
  }

  async function saveCurrentGroupSpace() {
    const user = state.auth.user;
    const groupCode = getCurrentGroupCode();
    if (!user || !groupCode) {
      pushToast('저장할 그룹 공간이 없습니다.', 'warn');
      return;
    }
    if (!isAdminUser(user) && trimText(user.groupCode) !== groupCode) {
      pushToast('현재 사용자의 그룹 공간만 수정할 수 있습니다.', 'warn');
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
    const groupCode = trimText(row?.querySelector('[data-field="groupCode"]')?.value);
    const groupName = trimText(row?.querySelector('[data-field="groupName"]')?.value);

    try {
      if (action === 'approve') {
        await apiRequest('/admin/requests/' + encodeURIComponent(requestId) + '/approve', {
          method: 'POST',
          body: JSON.stringify({ groupCode, groupName })
        });
        pushToast('사용 요청을 승인했습니다.', 'success');
      } else if (action === 'reject') {
        await apiRequest('/admin/requests/' + encodeURIComponent(requestId) + '/reject', {
          method: 'POST',
          body: JSON.stringify({})
        });
        pushToast('사용 요청을 반려했습니다.', 'warn');
      }
      await refreshAuthContext();
    } catch (error) {
      pushToast(error.message || '요청 처리에 실패했습니다.', 'error');
    }
  }

  function renderGroupSpace() {
    normalizeUiText();
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
      ? '로그인 후 그룹 공간을 사용할 수 있습니다.'
      : !canAccess
        ? '관리자 승인 전까지 그룹 공간은 잠겨 있습니다.'
        : isAdmin
          ? '관리자 모드에서는 모든 그룹 공간을 조회하고 수정할 수 있습니다.'
          : `${trimText(user.groupCode || user.groupName) || 'UNASSIGNED'} 그룹 공간이 연결되었습니다.`;

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
      dom.adminRequestList.innerHTML = '<div class="empty-state">관리자만 승인 큐를 볼 수 있습니다.</div>';
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
      return ''
        + '<div class="admin-request-row" data-request-id="' + requestIdValue + '">'
        + '<div class="admin-request-head">'
        + '<div><strong>' + requestName + '</strong><div class="muted">' + requestProvider + ' - ' + requestEmail + '</div></div>'
        + '<span class="badge badge-warn">' + requestStatus + '</span>'
        + '</div>'
        + '<div class="admin-request-grid">'
        + '<label class="field"><span>GROUP CODE</span><input data-field="groupCode" type="text" value="' + requestGroupCode + '" placeholder="GROUP-A"></label>'
        + '<label class="field"><span>GROUP NAME</span><input data-field="groupName" type="text" value="' + requestGroupName + '" placeholder="Group A"></label>'
        + '<div class="admin-request-meta">요청 시각: ' + requestDate + '</div>'
        + '</div>'
        + '<div class="editor-actions">'
        + '<button class="toolbar-btn accent" type="button" data-request-id="' + requestIdValue + '" data-request-action="approve">승인 후 그룹 배정</button>'
        + '<button class="toolbar-btn danger" type="button" data-request-id="' + requestIdValue + '" data-request-action="reject">반려</button>'
        + '</div>'
        + '</div>';
    }).join('');
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
    normalizeUiText();
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
    normalizeUiText();
  }
})();
