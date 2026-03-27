const SESSION_COOKIE = 'seastar_auth';
const NAVER_STATE_COOKIE = 'seastar_naver_state';
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const STORE_KEY = 'seastar-auth-store-v3';
const ADMIN_GROUP_CODE = 'ADMIN';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request)
      });
    }

    try {
      if (path === '/session' && request.method === 'GET') {
        const store = await loadStore(env);
        const session = await readSession(request, env);
        const user = await hydrateSessionUser(session?.user || null, env, store);
        return json(request, await buildSessionPayload(user, env, store, buildSessionMessage(user, env)));
      }

      if (path === '/local/login' && request.method === 'POST') {
        const body = await safeJson(request);
        const username = normalizeCredential(body.username);
        const password = normalizeCredential(body.password);

        if (username === '권욱' && password === '0953') {
          const store = await loadStore(env);
          const vipUser = upsertVipUser(store, '권욱');
          await saveStore(env, store);
          return issueSessionResponse(request, vipUser, env, store, '권욱 VIP 로그인 성공');
        }

        const adminIdentity = getAdminIdentity(env);
        if (!adminIdentity.enabled) {
          return json(request, { success: false, message: 'Local admin login is not configured.' }, 503);
        }
        if (password === '0' && adminIdentity.envPasswordSet) {
          return json(request, { success: false, message: '기본 비밀번호가 비활성화되었습니다. 설정된 비밀번호를 사용하세요.' }, 401);
        }
        if (!matchesAdminLogin(username, adminIdentity) || password !== adminIdentity.password) {
          return json(request, { success: false, message: '관리자 로그인 정보가 올바르지 않습니다.' }, 401);
        }
        const store = await loadStore(env);
        const user = upsertAdminUser(store, env);
        await saveStore(env, store);
        return issueSessionResponse(
          request,
          user,
          env,
          store,
          `${adminIdentity.name || '관리자'} 관리자 로그인 성공`
        );
      }

      if (path === '/google/verify' && request.method === 'POST') {
        const body = await safeJson(request);
        const credential = String(body.credential || '');
        if (!credential) {
          return json(request, { success: false, message: 'Google credential이 없습니다.' }, 400);
        }
        const profile = await verifyGoogleCredential(credential, env);
        const store = await loadStore(env);
        const { user, message } = registerSocialUser(store, profile, env);
        await saveStore(env, store);
        return issueSessionResponse(request, user, env, store, message);
      }

      if (path === '/naver/start' && request.method === 'GET') {
        if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) {
          return json(request, { success: false, message: 'Naver OAuth 설정이 없습니다.' }, 503);
        }
        const state = crypto.randomUUID().replace(/-/g, '');
        const callbackUrl = env.NAVER_CALLBACK_URL || `${url.origin}/api/auth/naver/callback`;
        const redirectUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${encodeURIComponent(env.NAVER_CLIENT_ID)}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(state)}`;
        return redirect(redirectUrl, {
          'Set-Cookie': buildCookie(NAVER_STATE_COOKIE, state, {
            maxAge: 600,
            httpOnly: true,
            secure: isSecure(url),
            sameSite: 'Lax',
            path: '/'
          })
        });
      }

      if (path === '/naver/callback' && request.method === 'GET') {
        const cookies = parseCookies(request);
        const state = url.searchParams.get('state') || '';
        const code = url.searchParams.get('code') || '';
        const error = url.searchParams.get('error');
        const callbackUrl = env.NAVER_CALLBACK_URL || `${url.origin}/api/auth/naver/callback`;
        const appRedirect = env.APP_REDIRECT_URL || `${url.origin}/seastar-cms-v3.html`;

        if (error) {
          return redirect(`${appRedirect}?authError=${encodeURIComponent(error)}`, {
            'Set-Cookie': clearCookie(NAVER_STATE_COOKIE, url)
          });
        }

        if (!code || !state || cookies[NAVER_STATE_COOKIE] !== state) {
          return redirect(`${appRedirect}?authError=naver_state_mismatch`, {
            'Set-Cookie': clearCookie(NAVER_STATE_COOKIE, url)
          });
        }

        const tokenBody = new URLSearchParams();
        tokenBody.set('grant_type', 'authorization_code');
        tokenBody.set('client_id', env.NAVER_CLIENT_ID || '');
        tokenBody.set('client_secret', env.NAVER_CLIENT_SECRET || '');
        tokenBody.set('code', code);
        tokenBody.set('state', state);

        const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: tokenBody.toString()
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) {
          console.error('Naver token exchange failed:', { status: tokenResponse.status, error: tokenData.error, desc: tokenData.error_description });
          return redirect(`${appRedirect}?authError=naver_token_exchange_failed`, {
            'Set-Cookie': clearCookie(NAVER_STATE_COOKIE, url)
          });
        }

        const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`
          }
        });
        const profileData = await profileResponse.json();
        const profile = profileData.response;
        if (!profileResponse.ok || !profile?.id) {
          console.error('Naver profile failed:', { status: profileResponse.status, resultcode: profileData.resultcode, message: profileData.message });
          return redirect(`${appRedirect}?authError=naver_profile_failed`, {
            'Set-Cookie': clearCookie(NAVER_STATE_COOKIE, url)
          });
        }

        const store = await loadStore(env);
        const { user } = registerSocialUser(store, {
          id: `naver:${profile.id}`,
          provider: 'naver',
          providerUserId: profile.id,
          email: profile.email || '',
          name: profile.name || profile.nickname || 'Naver User',
          avatarUrl: profile.profile_image || ''
        }, env);
        await saveStore(env, store);
        return issueSessionRedirect(request, user, env, store, appRedirect, {
          clearNaverState: true
        });
      }

      if (path === '/groups/space' && request.method === 'POST') {
        const store = await loadStore(env);
        const user = await requireAuthenticatedUser(request, env, store);
        if (!isWorkspaceAllowed(user)) {
          return json(request, { success: false, message: '승인된 사용자만 그룹 공간을 수정할 수 있습니다.' }, 403);
        }

        const body = await safeJson(request);
        const requestedGroupCode = normalizeGroupCode(body.groupCode || user.groupCode || '');
        if (!requestedGroupCode) {
          return json(request, { success: false, message: '그룹 코드가 필요합니다.' }, 400);
        }
        if (!isAdminUser(user) && requestedGroupCode !== normalizeGroupCode(user.groupCode)) {
          return json(request, { success: false, message: '현재 사용자 그룹 공간만 수정할 수 있습니다.' }, 403);
        }

        const groupName = String(body.groupName || requestedGroupCode || '').trim() || requestedGroupCode;
        const group = ensureGroup(store, requestedGroupCode, groupName);
        const space = ensureGroupSpace(store, requestedGroupCode, group.name);
        space.announcement = String(body.announcement || '').trim();
        space.notes = String(body.notes || '').trim();
        space.updatedAt = new Date().toISOString();
        space.updatedBy = user.name || user.id;
        await saveStore(env, store);
        return json(request, {
          success: true,
          message: '그룹 공간을 저장했습니다.',
          space: formatSpaceRecord(space, group, store)
        });
      }

      if (path === '/projects/current' && request.method === 'GET') {
        const store = await loadStore(env);
        const user = await requireAuthenticatedUser(request, env, store);
        if (!isWorkspaceAllowed(user)) {
          return json(request, { success: false, message: '승인된 사용자만 프로젝트를 불러올 수 있습니다.' }, 403);
        }
        const groupCode = resolveProjectGroupCode(user, url.searchParams.get('groupCode'));
        const projectId = normalizeProjectId(url.searchParams.get('projectId') || 'current');
        const record = store.projects[projectStoreKey(groupCode, projectId)] || null;
        return json(request, {
          success: true,
          message: record ? 'Project loaded.' : 'No saved project found.',
          project: record ? formatProjectRecord(record, true) : null
        });
      }

      if (path === '/projects/current' && request.method === 'POST') {
        const store = await loadStore(env);
        const user = await requireAuthenticatedUser(request, env, store);
        if (!isWorkspaceAllowed(user)) {
          return json(request, { success: false, message: '승인된 사용자만 프로젝트를 저장할 수 있습니다.' }, 403);
        }
        const body = await safeJson(request);
        const payload = sanitizeProjectPayload(body.payload);
        const groupCode = resolveProjectGroupCode(user, body.groupCode || payload?.projectMeta?.groupCode);
        const projectId = normalizeProjectId(body.projectId || payload?.projectMeta?.projectId || 'current');
        const projectName = String(body.projectName || payload?.projectMeta?.projectName || projectId).trim() || projectId;
        const group = ensureGroup(store, groupCode, groupCode);
        ensureGroupSpace(store, group.code, group.name);
        const now = new Date().toISOString();
        const key = projectStoreKey(groupCode, projectId);
        const existing = store.projects[key] || null;
        store.projects[key] = {
          key,
          projectId,
          projectName,
          groupCode,
          groupName: group.name,
          payload,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
          updatedBy: user.name || user.id,
          ownerId: existing?.ownerId || user.id
        };
        await saveStore(env, store);
        return json(request, {
          success: true,
          message: 'Project saved.',
          project: formatProjectRecord(store.projects[key], false)
        });
      }

      const approveMatch = path.match(/^\/admin\/requests\/([^/]+)\/approve$/);
      if (approveMatch && request.method === 'POST') {
        const store = await loadStore(env);
        const adminUser = await requireAdminUser(request, env, store);
        const body = await safeJson(request);
        const requestId = decodeURIComponent(approveMatch[1]);
        const requestRecord = store.requests[requestId];
        if (!requestRecord || requestRecord.status !== 'pending') {
          return json(request, { success: false, message: '대기 중인 요청을 찾을 수 없습니다.' }, 404);
        }

        const groupCode = normalizeGroupCode(body.groupCode || requestRecord.suggestedGroupCode || 'GROUP-A');
        const groupName = String(body.groupName || requestRecord.suggestedGroupName || groupCode).trim() || groupCode;
        const targetUser = store.users[requestRecord.userId];
        if (!targetUser) {
          return json(request, { success: false, message: '요청 사용자 정보를 찾을 수 없습니다.' }, 404);
        }

        const group = ensureGroup(store, groupCode, groupName);
        const space = ensureGroupSpace(store, group.code, group.name);
        targetUser.status = 'active';
        targetUser.groupCode = group.code;
        targetUser.groupName = group.name;
        targetUser.approvedAt = new Date().toISOString();
        targetUser.approvedBy = adminUser.name || adminUser.id;
        addUnique(group.memberIds, targetUser.id);
        requestRecord.status = 'approved';
        requestRecord.groupCode = group.code;
        requestRecord.groupName = group.name;
        requestRecord.approvedAt = targetUser.approvedAt;
        requestRecord.approvedBy = targetUser.approvedBy;
        space.updatedAt = targetUser.approvedAt;
        space.updatedBy = adminUser.name || adminUser.id;
        await saveStore(env, store);
        return json(request, {
          success: true,
          message: `${targetUser.name} 요청을 승인하고 ${group.code} 그룹에 배정했습니다.`,
          request: formatRequestRecord(requestRecord, targetUser)
        });
      }

      const rejectMatch = path.match(/^\/admin\/requests\/([^/]+)\/reject$/);
      if (rejectMatch && request.method === 'POST') {
        const store = await loadStore(env);
        const adminUser = await requireAdminUser(request, env, store);
        const requestId = decodeURIComponent(rejectMatch[1]);
        const requestRecord = store.requests[requestId];
        if (!requestRecord || requestRecord.status !== 'pending') {
          return json(request, { success: false, message: '대기 중인 요청을 찾을 수 없습니다.' }, 404);
        }
        const targetUser = store.users[requestRecord.userId];
        if (targetUser) {
          targetUser.status = 'rejected';
          targetUser.rejectedAt = new Date().toISOString();
          targetUser.rejectedBy = adminUser.name || adminUser.id;
        }
        requestRecord.status = 'rejected';
        requestRecord.rejectedAt = new Date().toISOString();
        requestRecord.rejectedBy = adminUser.name || adminUser.id;
        await saveStore(env, store);
        return json(request, {
          success: true,
          message: `${targetUser?.name || requestRecord.userId} 요청을 반려했습니다.`
        });
      }

      // ── Ship-data KV endpoints ──────────────────────────────
      if (path === '/data/save' && request.method === 'POST') {
        const store = await loadStore(env);
        const user = await requireAuthenticatedUser(request, env, store);
        if (!isWorkspaceAllowed(user)) {
          return json(request, { success: false, message: '승인된 사용자만 데이터를 저장할 수 있습니다.' }, 403);
        }
        const body = await safeJson(request);
        const groupCode = resolveProjectGroupCode(user, body.groupCode);
        const shipId = String(body.shipId || '').trim();
        if (!shipId) {
          return json(request, { success: false, message: 'shipId is required.' }, 400);
        }
        const kvKey = `shipdata:${groupCode}:${shipId}`;
        const record = {
          groupCode,
          shipId,
          cables: body.cables || [],
          nodes: body.nodes || [],
          graph: body.graph || {},
          meta: body.meta || {},
          updatedAt: new Date().toISOString(),
          updatedBy: user.name || user.id
        };
        const payload = JSON.stringify(record);
        const CHUNK_LIMIT = 24 * 1024 * 1024; // 24 MB safety margin
        if (payload.length > CHUNK_LIMIT) {
          const totalChunks = Math.ceil(payload.length / CHUNK_LIMIT);
          for (let i = 0; i < totalChunks; i++) {
            await env.AUTH_KV.put(
              `${kvKey}:chunk:${i}`,
              payload.slice(i * CHUNK_LIMIT, (i + 1) * CHUNK_LIMIT)
            );
          }
          await env.AUTH_KV.put(`${kvKey}:meta`, JSON.stringify({ chunked: true, totalChunks, updatedAt: record.updatedAt }));
        } else {
          await env.AUTH_KV.put(kvKey, payload);
          // Clean up any old chunks
          const oldMeta = await env.AUTH_KV.get(`${kvKey}:meta`);
          if (oldMeta) {
            const parsed = JSON.parse(oldMeta);
            if (parsed.chunked) {
              for (let i = 0; i < parsed.totalChunks; i++) {
                await env.AUTH_KV.delete(`${kvKey}:chunk:${i}`);
              }
            }
            await env.AUTH_KV.delete(`${kvKey}:meta`);
          }
        }
        // ── Version snapshot (최대 20개 유지) ──
        const verKey = `${kvKey}:ver:${record.updatedAt}`;
        await env.AUTH_KV.put(verKey, JSON.stringify({
          ...record,
          versionLabel: `v${record.updatedAt.replace('T', ' ').slice(0, 16)} by ${record.updatedBy}`
        }));
        // 버전 인덱스 갱신
        const verIndexKey = `${kvKey}:versions`;
        let versions = [];
        try { versions = JSON.parse(await env.AUTH_KV.get(verIndexKey) || '[]'); } catch (_) { versions = []; }
        versions.unshift({ key: verKey, savedAt: record.updatedAt, savedBy: record.updatedBy, cableCount: record.cables.length, nodeCount: record.nodes.length });
        // 20개 초과분 삭제
        const MAX_VERSIONS = 20;
        if (versions.length > MAX_VERSIONS) {
          const toDelete = versions.splice(MAX_VERSIONS);
          for (const old of toDelete) await env.AUTH_KV.delete(old.key);
        }
        await env.AUTH_KV.put(verIndexKey, JSON.stringify(versions));

        return json(request, { success: true, message: 'Ship data saved.', key: kvKey, updatedAt: record.updatedAt, versionKey: verKey });
      }

      if (path === '/data/load' && request.method === 'GET') {
        const store = await loadStore(env);
        const user = await requireAuthenticatedUser(request, env, store);
        if (!isWorkspaceAllowed(user)) {
          return json(request, { success: false, message: '승인된 사용자만 데이터를 불러올 수 있습니다.' }, 403);
        }
        const groupCode = resolveProjectGroupCode(user, url.searchParams.get('group'));
        const shipId = String(url.searchParams.get('ship') || '').trim();
        if (!shipId) {
          return json(request, { success: false, message: 'ship parameter is required.' }, 400);
        }
        const kvKey = `shipdata:${groupCode}:${shipId}`;
        // Check for chunked data first
        const metaRaw = await env.AUTH_KV.get(`${kvKey}:meta`);
        let record = null;
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          if (meta.chunked) {
            const parts = [];
            for (let i = 0; i < meta.totalChunks; i++) {
              const chunk = await env.AUTH_KV.get(`${kvKey}:chunk:${i}`);
              if (chunk === null) {
                return json(request, { success: false, message: 'Chunked data is corrupted.' }, 500);
              }
              parts.push(chunk);
            }
            record = JSON.parse(parts.join(''));
          }
        } else {
          const raw = await env.AUTH_KV.get(kvKey);
          if (raw) record = JSON.parse(raw);
        }
        return json(request, {
          success: true,
          message: record ? 'Ship data loaded.' : 'No ship data found.',
          data: record
        });
      }

      if (path === '/data/versions' && request.method === 'GET') {
        const store = await loadStore(env);
        const user = await requireAuthenticatedUser(request, env, store);
        if (!isWorkspaceAllowed(user)) {
          return json(request, { success: false, message: '승인된 사용자만 버전 목록을 볼 수 있습니다.' }, 403);
        }
        const groupCode = resolveProjectGroupCode(user, url.searchParams.get('group'));
        const shipId = String(url.searchParams.get('ship') || '').trim();
        if (!shipId) {
          return json(request, { success: false, message: 'ship parameter is required.' }, 400);
        }
        const kvKey = `shipdata:${groupCode}:${shipId}`;
        const verIndexKey = `${kvKey}:versions`;
        let versions = [];
        try { versions = JSON.parse(await env.AUTH_KV.get(verIndexKey) || '[]'); } catch (_) { versions = []; }
        return json(request, { success: true, versions });
      }

      if (path === '/data/restore' && request.method === 'POST') {
        const store = await loadStore(env);
        const user = await requireAuthenticatedUser(request, env, store);
        if (!isWorkspaceAllowed(user)) {
          return json(request, { success: false, message: '승인된 사용자만 버전을 복원할 수 있습니다.' }, 403);
        }
        const body = await safeJson(request);
        const groupCode = resolveProjectGroupCode(user, body.group);
        const shipId = String(body.ship || '').trim();
        const versionKey = String(body.versionKey || '').trim();
        if (!shipId || !versionKey) {
          return json(request, { success: false, message: 'ship and versionKey are required.' }, 400);
        }
        // 버전 키가 해당 호선의 것인지 검증
        const kvKey = `shipdata:${groupCode}:${shipId}`;
        if (!versionKey.startsWith(`${kvKey}:ver:`)) {
          return json(request, { success: false, message: 'Invalid versionKey for this ship.' }, 400);
        }
        const raw = await env.AUTH_KV.get(versionKey);
        if (!raw) {
          return json(request, { success: false, message: '해당 버전을 찾을 수 없습니다.' }, 404);
        }
        const record = JSON.parse(raw);
        // 현재 데이터를 복원 전 스냅샷으로 저장 (안전망)
        const nowTs = new Date().toISOString();
        const backupKey = `${kvKey}:ver:${nowTs}`;
        const currentRaw = await env.AUTH_KV.get(kvKey);
        if (currentRaw) {
          await env.AUTH_KV.put(backupKey, JSON.stringify({
            ...JSON.parse(currentRaw),
            versionLabel: `[복원 전 백업] ${nowTs.replace('T',' ').slice(0,16)} by ${user.name || user.id}`
          }));
        }
        // 버전 인덱스에 백업 추가
        const verIndexKey = `${kvKey}:versions`;
        let versions = [];
        try { versions = JSON.parse(await env.AUTH_KV.get(verIndexKey) || '[]'); } catch (_) { versions = []; }
        if (currentRaw) {
          const cur = JSON.parse(currentRaw);
          versions.unshift({ key: backupKey, savedAt: nowTs, savedBy: user.name || user.id, cableCount: cur.cables?.length || 0, nodeCount: cur.nodes?.length || 0, isPreRestoreBackup: true });
          if (versions.length > 20) { const td = versions.splice(20); for (const d of td) await env.AUTH_KV.delete(d.key); }
          await env.AUTH_KV.put(verIndexKey, JSON.stringify(versions));
        }
        // 선택한 버전을 현재 데이터로 복원
        const restored = { ...record, updatedAt: nowTs, updatedBy: `${user.name || user.id} (restored)`, versionLabel: undefined };
        delete restored.versionLabel;
        await env.AUTH_KV.put(kvKey, JSON.stringify(restored));
        return json(request, { success: true, message: '버전이 성공적으로 복원되었습니다.', cables: restored.cables?.length || 0, nodes: restored.nodes?.length || 0 });
      }

      if (path === '/data/list' && request.method === 'GET') {
        const store = await loadStore(env);
        const user = await requireAuthenticatedUser(request, env, store);
        if (!isWorkspaceAllowed(user)) {
          return json(request, { success: false, message: '승인된 사용자만 데이터 목록을 볼 수 있습니다.' }, 403);
        }
        const groupCode = resolveProjectGroupCode(user, url.searchParams.get('group') || user.groupCode);
        const prefix = `shipdata:${groupCode}:`;
        const list = await env.AUTH_KV.list({ prefix });
        const keys = (list.keys || [])
          .map((k) => k.name)
          .filter((name) => !name.includes(':chunk:') && !name.endsWith(':meta'))
          .map((name) => {
            const parts = name.replace('shipdata:', '').split(':');
            return { groupCode: parts[0] || '', shipId: parts.slice(1).join(':') || '', key: name };
          });
        return json(request, { success: true, keys });
      }

      if (path === '/data/delete' && request.method === 'DELETE') {
        const store = await loadStore(env);
        const user = await requireAuthenticatedUser(request, env, store);
        if (!isWorkspaceAllowed(user)) {
          return json(request, { success: false, message: '승인된 사용자만 데이터를 삭제할 수 있습니다.' }, 403);
        }
        const groupCode = resolveProjectGroupCode(user, url.searchParams.get('group'));
        const shipId = String(url.searchParams.get('ship') || '').trim();
        if (!shipId) {
          return json(request, { success: false, message: 'ship parameter is required.' }, 400);
        }
        const kvKey = `shipdata:${groupCode}:${shipId}`;
        // Delete main key
        await env.AUTH_KV.delete(kvKey);
        // Delete any chunks
        const metaRaw = await env.AUTH_KV.get(`${kvKey}:meta`);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          if (meta.chunked) {
            for (let i = 0; i < meta.totalChunks; i++) {
              await env.AUTH_KV.delete(`${kvKey}:chunk:${i}`);
            }
          }
          await env.AUTH_KV.delete(`${kvKey}:meta`);
        }
        return json(request, { success: true, message: 'Ship data deleted.' });
      }

      if (path === '/register-info' && request.method === 'POST') {
        const store = await loadStore(env);
        const session = await readSession(request, env);
        const user = session?.user ? store.users[session.user.id] : null;
        if (!user) {
          return json(request, { success: false, message: '로그인이 필요합니다.' }, 401);
        }
        const body = await safeJson(request);
        user.phone = String(body.phone || '').trim().slice(0, 20);
        user.company = String(body.company || '').trim().slice(0, 100);
        user.regEmail = String(body.email || '').trim().slice(0, 100);
        user.regName = String(body.name || '').trim().slice(0, 50) || user.name;
        user.name = user.regName || user.name;
        // Update the pending request record too
        const pendingReq = Object.values(store.requests).find((r) => r.userId === user.id && r.status === 'pending');
        if (pendingReq) {
          pendingReq.name = user.name;
          pendingReq.email = user.regEmail || user.email;
          pendingReq.phone = user.phone;
          pendingReq.company = user.company;
        }
        await saveStore(env, store);
        return json(request, {
          success: true,
          message: '등록 정보가 저장되었습니다. 관리자 승인을 기다려주세요.'
        });
      }

      if (path === '/logout' && request.method === 'POST') {
        return json(
          request,
          { success: true },
          200,
          {
            'Set-Cookie': clearCookie(SESSION_COOKIE, url)
          }
        );
      }

      if (!url.pathname.startsWith('/api/') && env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return json(request, { success: false, message: 'Not found.' }, 404);
    } catch (error) {
      return json(request, { success: false, message: error.message || 'Unexpected error.' }, error.status || 500);
    }
  }
};

function normalizePath(pathname) {
  const match = pathname.match(/\/api\/auth(\/.*)$/);
  return match ? match[1] : pathname;
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || 'null';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
  };
}

function json(request, payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
      ...extraHeaders
    }
  });
}

function redirect(target, headers = {}) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      ...headers
    }
  });
}

function createInitialStore(env) {
  const now = new Date().toISOString();
  const adminIdentity = getAdminIdentity(env);
  return {
    users: {},
    requests: {},
    projects: {},
    groups: {
      [ADMIN_GROUP_CODE]: {
        code: ADMIN_GROUP_CODE,
        name: ADMIN_GROUP_CODE,
        description: `${adminIdentity.name} 관리자 그룹`,
        memberIds: [],
        createdAt: now,
        updatedAt: now
      }
    },
    spaces: {
      [ADMIN_GROUP_CODE]: {
        groupCode: ADMIN_GROUP_CODE,
        groupName: ADMIN_GROUP_CODE,
        announcement: '관리자 승인 큐와 그룹 공간을 관리하는 전용 공간입니다.',
        notes: 'Google/Naver 사용 요청은 이 공간에서 승인하고 그룹을 배정합니다.',
        updatedAt: now,
        updatedBy: adminIdentity.name
      }
    }
  };
}

function normalizeStore(store, env) {
  const normalized = store && typeof store === 'object' ? store : createInitialStore(env);
  normalized.users = normalized.users && typeof normalized.users === 'object' ? normalized.users : {};
  normalized.requests = normalized.requests && typeof normalized.requests === 'object' ? normalized.requests : {};
  normalized.projects = normalized.projects && typeof normalized.projects === 'object' ? normalized.projects : {};
  normalized.groups = normalized.groups && typeof normalized.groups === 'object' ? normalized.groups : {};
  normalized.spaces = normalized.spaces && typeof normalized.spaces === 'object' ? normalized.spaces : {};
  ensureGroup(normalized, ADMIN_GROUP_CODE, ADMIN_GROUP_CODE, `${getAdminIdentity(env).name} 관리자 그룹`);
  ensureGroupSpace(normalized, ADMIN_GROUP_CODE, ADMIN_GROUP_CODE);
  return normalized;
}

async function loadStore(env) {
  if (env.AUTH_KV) {
    const raw = await env.AUTH_KV.get(STORE_KEY);
    return normalizeStore(raw ? JSON.parse(raw) : null, env);
  }
  if (!globalThis.__SEASTAR_AUTH_STORE) {
    globalThis.__SEASTAR_AUTH_STORE = createInitialStore(env);
  }
  return normalizeStore(globalThis.__SEASTAR_AUTH_STORE, env);
}

async function saveStore(env, store) {
  const normalized = normalizeStore(store, env);
  if (env.AUTH_KV) {
    await env.AUTH_KV.put(STORE_KEY, JSON.stringify(normalized));
  } else {
    globalThis.__SEASTAR_AUTH_STORE = normalized;
  }
  return normalized;
}

function ensureGroup(store, groupCode, groupName, description = '') {
  const code = normalizeGroupCode(groupCode);
  const name = String(groupName || code || 'GROUP').trim() || code;
  const now = new Date().toISOString();
  if (!store.groups[code]) {
    store.groups[code] = {
      code,
      name,
      description: description || `${name} 전용 공간`,
      memberIds: [],
      createdAt: now,
      updatedAt: now
    };
  } else {
    store.groups[code].name = name || store.groups[code].name;
    store.groups[code].description = description || store.groups[code].description;
    store.groups[code].updatedAt = now;
    store.groups[code].memberIds = Array.isArray(store.groups[code].memberIds) ? unique(store.groups[code].memberIds) : [];
  }
  return store.groups[code];
}

function ensureGroupSpace(store, groupCode, groupName) {
  const code = normalizeGroupCode(groupCode);
  const now = new Date().toISOString();
  if (!store.spaces[code]) {
    store.spaces[code] = {
      groupCode: code,
      groupName: String(groupName || code || 'GROUP').trim() || code,
      announcement: '',
      notes: '',
      updatedAt: now,
      updatedBy: ''
    };
  }
  return store.spaces[code];
}

function buildAdminUser(env) {
  const adminIdentity = getAdminIdentity(env);
  return {
    id: `local:${adminIdentity.username}`,
    provider: 'local',
    providerUserId: adminIdentity.username,
    email: adminIdentity.email,
    name: adminIdentity.name,
    avatarUrl: '',
    role: 'admin',
    status: 'active',
    groupCode: ADMIN_GROUP_CODE,
    groupName: ADMIN_GROUP_CODE,
    lastLoginAt: new Date().toISOString()
  };
}

function upsertAdminUser(store, env) {
  const adminUser = buildAdminUser(env);
  const group = ensureGroup(store, ADMIN_GROUP_CODE, ADMIN_GROUP_CODE, `${adminUser.name} 관리자 그룹`);
  ensureGroupSpace(store, group.code, group.name);
  store.users[adminUser.id] = {
    ...(store.users[adminUser.id] || {}),
    ...adminUser
  };
  addUnique(group.memberIds, adminUser.id);
  return store.users[adminUser.id];
}

function upsertVipUser(store, name) {
  const vipId = 'local:vip-kwonwook';
  const vipUser = {
    id: vipId,
    provider: 'local',
    providerUserId: 'vip-kwonwook',
    email: '',
    name: name,
    avatarUrl: '',
    role: 'vip',
    status: 'active',
    groupCode: 'VIP',
    groupName: 'VIP',
    lastLoginAt: new Date().toISOString()
  };
  const group = ensureGroup(store, 'VIP', 'VIP', '권욱 VIP 그룹');
  ensureGroupSpace(store, group.code, group.name);
  store.users[vipId] = {
    ...(store.users[vipId] || {}),
    ...vipUser
  };
  addUnique(group.memberIds, vipId);
  return store.users[vipId];
}

function ensurePendingRequest(store, user) {
  const existing = Object.values(store.requests).find((request) => request.userId === user.id && request.status === 'pending');
  if (existing) return existing;

  const suggestion = suggestGroupForUser(user);
  const requestRecord = {
    id: crypto.randomUUID(),
    userId: user.id,
    provider: user.provider,
    name: user.name,
    email: user.email,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    suggestedGroupCode: suggestion.code,
    suggestedGroupName: suggestion.name
  };
  store.requests[requestRecord.id] = requestRecord;
  return requestRecord;
}

function suggestGroupForUser(user) {
  const emailName = String(user.email || '').split('@')[0].trim();
  const cleaned = normalizeGroupCode(emailName || user.provider || 'GROUP-A');
  if (!cleaned || cleaned === 'GOOGLE' || cleaned === 'NAVER') {
    return { code: 'GROUP-A', name: 'Group A' };
  }
  return {
    code: cleaned,
    name: cleaned
  };
}

async function issueSessionResponse(request, user, env, store, message) {
  const token = await signSession({ user: sanitizeUser(user) }, env);
  return json(
    request,
    await buildSessionPayload(user, env, store, message),
    200,
    {
      'Set-Cookie': buildCookie(SESSION_COOKIE, token, {
        maxAge: SESSION_TTL_SECONDS,
        httpOnly: true,
        secure: isSecure(new URL(request.url)),
        sameSite: 'Lax',
        path: '/'
      })
    }
  );
}

async function issueSessionRedirect(request, user, env, store, appRedirect, options = {}) {
  const redirectState = isWorkspaceAllowed(user) ? 'success' : 'pending';
  const target = `${appRedirect}?auth=${encodeURIComponent(redirectState)}`;
  const token = await signSession({ user: sanitizeUser(user) }, env);
  const headers = new Headers({
    Location: target
  });
  headers.append('Set-Cookie', buildCookie(SESSION_COOKIE, token, {
    maxAge: SESSION_TTL_SECONDS,
    httpOnly: true,
    secure: isSecure(new URL(request.url)),
    sameSite: 'Lax',
    path: '/'
  }));
  if (options.clearNaverState) {
    headers.append('Set-Cookie', clearCookie(NAVER_STATE_COOKIE, new URL(request.url)));
  }
  return new Response(null, { status: 302, headers });
}

function listAccessibleGroups(user, store) {
  const groups = Object.values(store.groups || {});
  if (!user) return [];
  if (isAdminUser(user)) {
    return groups
      .map((group) => formatGroupRecord(group, store))
      .sort((left, right) => left.code.localeCompare(right.code));
  }
  if (!user.groupCode || !store.groups[user.groupCode]) {
    return [];
  }
  return [formatGroupRecord(store.groups[user.groupCode], store)];
}

function listAccessibleSpaces(user, store) {
  if (!user) return [];
  if (isAdminUser(user)) {
    return Object.values(store.groups || {})
      .map((group) => formatSpaceRecord(ensureGroupSpace(store, group.code, group.name), group, store))
      .sort((left, right) => left.groupCode.localeCompare(right.groupCode));
  }
  if (!user.groupCode || !store.groups[user.groupCode]) {
    return [];
  }
  const group = store.groups[user.groupCode];
  return [formatSpaceRecord(ensureGroupSpace(store, group.code, group.name), group, store)];
}

function listPendingRequests(store) {
  return Object.values(store.requests || {})
    .filter((request) => request.status === 'pending')
    .sort((left, right) => String(right.requestedAt || '').localeCompare(String(left.requestedAt || '')))
    .map((request) => formatRequestRecord(request, store.users[request.userId]));
}

function formatGroupRecord(group, store) {
  const memberIds = Array.isArray(group.memberIds) ? unique(group.memberIds) : [];
  const memberNames = memberIds
    .map((id) => store.users[id]?.name || store.users[id]?.email || id)
    .filter(Boolean);
  return {
    code: group.code,
    name: group.name,
    description: group.description || '',
    memberCount: memberIds.length,
    memberNames,
    updatedAt: group.updatedAt || ''
  };
}

function formatSpaceRecord(space, group, store) {
  const groupRecord = group || store.groups[space.groupCode] || { code: space.groupCode, name: space.groupName || space.groupCode, memberIds: [] };
  const groupMeta = formatGroupRecord(groupRecord, store);
  return {
    groupCode: space.groupCode,
    groupName: groupMeta.name,
    announcement: space.announcement || '',
    notes: space.notes || '',
    updatedAt: space.updatedAt || '',
    updatedBy: space.updatedBy || '',
    memberCount: groupMeta.memberCount,
    memberNames: groupMeta.memberNames
  };
}

function formatRequestRecord(requestRecord, user) {
  return {
    id: requestRecord.id,
    userId: requestRecord.userId,
    provider: requestRecord.provider,
    name: requestRecord.name || user?.name || '',
    email: requestRecord.email || user?.email || '',
    status: requestRecord.status,
    requestedAt: requestRecord.requestedAt || '',
    suggestedGroupCode: requestRecord.suggestedGroupCode || 'GROUP-A',
    suggestedGroupName: requestRecord.suggestedGroupName || requestRecord.suggestedGroupCode || 'Group A',
    groupCode: requestRecord.groupCode || '',
    groupName: requestRecord.groupName || ''
  };
}

function normalizeProjectId(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || 'current';
}

function projectStoreKey(groupCode, projectId) {
  return `${normalizeGroupCode(groupCode || 'LOCAL') || 'LOCAL'}::${normalizeProjectId(projectId || 'current')}`;
}

function sanitizeProjectPayload(payload) {
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const cloned = JSON.parse(JSON.stringify(safePayload));
  if (!cloned.version) {
    cloned.version = 'seastar-cms-v3';
  }
  if (!cloned.projectMeta || typeof cloned.projectMeta !== 'object') {
    cloned.projectMeta = {};
  }
  return cloned;
}

function resolveProjectGroupCode(user, requestedGroupCode) {
  const groupCode = normalizeGroupCode(requestedGroupCode || user?.groupCode || ADMIN_GROUP_CODE);
  if (!groupCode) {
    throw httpError(400, 'Project group code is required.');
  }
  if (isAdminUser(user)) {
    return groupCode;
  }
  if (normalizeGroupCode(user?.groupCode) !== groupCode) {
    throw httpError(403, 'Current user can only access the assigned group project.');
  }
  return groupCode;
}

function formatProjectRecord(record, includePayload = false) {
  const formatted = {
    projectId: record.projectId,
    projectName: record.projectName || record.projectId,
    groupCode: record.groupCode,
    groupName: record.groupName || record.groupCode,
    createdAt: record.createdAt || '',
    updatedAt: record.updatedAt || '',
    updatedBy: record.updatedBy || ''
  };
  if (includePayload) {
    formatted.payload = record.payload || null;
  }
  return formatted;
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    provider: user.provider,
    providerUserId: user.providerUserId,
    email: user.email || '',
    name: user.name || '',
    avatarUrl: user.avatarUrl || '',
    role: user.role || 'user',
    status: user.status || 'pending',
    groupCode: user.groupCode || '',
    groupName: user.groupName || '',
    requestedAt: user.requestedAt || '',
    approvedAt: user.approvedAt || '',
    lastLoginAt: user.lastLoginAt || ''
  };
}

async function requireAuthenticatedUser(request, env, store) {
  const session = await readSession(request, env);
  const user = await hydrateSessionUser(session?.user || null, env, store);
  if (!user) {
    throw httpError(401, '로그인이 필요합니다.');
  }
  return user;
}

async function requireAdminUser(request, env, store) {
  const user = await requireAuthenticatedUser(request, env, store);
  if (!isAdminUser(user)) {
    throw httpError(403, '관리자 권한이 필요합니다.');
  }
  return user;
}

async function hydrateSessionUser(sessionUser, env, store) {
  if (!sessionUser) return null;
  if (sessionUser.role === 'admin') {
    return upsertAdminUser(store, env);
  }
  return store.users[sessionUser.id] || sanitizeUser(sessionUser);
}

function isAdminUser(user) {
  return Boolean(user && user.role === 'admin');
}

function isWorkspaceAllowed(user) {
  return Boolean(user && (user.role === 'admin' || user.status === 'active'));
}

async function verifyGoogleCredential(credential, env) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error('Google token verification failed.');
  }
  if (env.GOOGLE_CLIENT_ID && data.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error('Google token audience mismatch.');
  }
  if (!data.sub) {
    throw new Error('Google token payload is incomplete.');
  }
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(data.iss)) {
    throw new Error('Google token issuer mismatch.');
  }
  if (Number(data.exp || 0) < Math.floor(Date.now() / 1000)) {
    throw new Error('Google token expired.');
  }
  return {
    id: `google:${data.sub}`,
    provider: 'google',
    providerUserId: data.sub,
    email: data.email || '',
    name: data.name || data.email || 'Google User',
    avatarUrl: data.picture || ''
  };
}

async function readSession(request, env) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const payload = await verifySession(token, env);
  return payload || null;
}

async function importSecret(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function signText(text, secret) {
  const signature = await crypto.subtle.sign('HMAC', secret, new TextEncoder().encode(text));
  return base64urlFromBytes(new Uint8Array(signature));
}

async function safeJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function parseCookies(request) {
  const raw = request.headers.get('Cookie') || '';
  return raw.split(/;\s*/).reduce((cookies, chunk) => {
    if (!chunk) return cookies;
    const index = chunk.indexOf('=');
    if (index === -1) return cookies;
    const key = chunk.slice(0, index);
    const value = chunk.slice(index + 1);
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function buildCookie(name, value, options) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge != null) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

function clearCookie(name, url) {
  return buildCookie(name, '', {
    maxAge: 0,
    path: '/',
    sameSite: 'Lax',
    httpOnly: true,
    secure: isSecure(url)
  });
}

function isSecure(url) {
  return url.protocol === 'https:';
}

function normalizeGroupCode(value) {
  const text = String(value || '').trim().toUpperCase();
  return text.replace(/[^A-Z0-9_-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '') || '';
}

function addUnique(items, value) {
  if (!value) return items;
  if (!items.includes(value)) {
    items.push(value);
  }
  return items;
}

function unique(items) {
  return Array.from(new Set(items || []));
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function base64urlEncode(text) {
  return base64urlFromBytes(new TextEncoder().encode(text));
}

function base64urlFromBytes(bytes) {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function getAdminIdentity(env) {
  const username = normalizeCredential(env.ADMIN_USERNAME) || 'designssir@gmail.com';
  const envPassword = normalizeCredential(env.ADMIN_PASSWORD);
  const password = envPassword || '0';
  const name = String(env.ADMIN_NAME || '').trim();
  return {
    enabled: true,
    username,
    password,
    envPasswordSet: Boolean(envPassword),
    name: name || '관리자',
    email: normalizeCredential(env.ADMIN_EMAIL) || 'designssir@gmail.com'
  };
}

function matchesAdminLogin(input, adminIdentity) {
  const normalized = normalizeCredential(input);
  if (!normalized) return false;
  // 하드코딩된 관리자 이메일은 항상 허용
  if (normalized === 'designssir@gmail.com') return true;
  const candidates = [adminIdentity.username, adminIdentity.name, adminIdentity.email]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return candidates.includes(normalized);
}

function normalizeCredential(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f\u00a0\u200b\uFEFF]/g, '')
    .trim();
}

function getAdminDisplayName(env) {
  return getAdminIdentity(env).name || '관리자';
}

function getSessionSecret(env) {
  const secret = String(env.SESSION_SECRET || '').trim();
  if (!secret) {
    throw httpError(503, 'SESSION_SECRET is not configured.');
  }
  return secret;
}

async function signSession(payload, env) {
  const secret = await importSecret(getSessionSecret(env));
  const data = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  };
  const body = base64urlEncode(JSON.stringify(data));
  const signature = await signText(body, secret);
  return `${body}.${signature}`;
}

async function verifySession(token, env) {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const secret = await importSecret(getSessionSecret(env));
  const expected = await signText(body, secret);
  if (expected !== signature) return null;
  const decoded = JSON.parse(base64urlDecode(body));
  if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return decoded;
}

function registerSocialUser(store, profile, env) {
  const now = new Date().toISOString();
  let user = store.users[profile.id];
  if (!user) {
    user = {
      id: profile.id,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email: profile.email || '',
      name: profile.name || profile.email || 'User',
      avatarUrl: profile.avatarUrl || '',
      role: 'user',
      status: 'pending',
      groupCode: '',
      groupName: '',
      phone: '',
      company: '',
      requestedAt: now,
      lastLoginAt: now
    };
    store.users[user.id] = user;
  } else {
    user.provider = profile.provider;
    user.providerUserId = profile.providerUserId;
    user.email = profile.email || user.email || '';
    user.name = profile.name || user.name || user.email || 'User';
    user.avatarUrl = profile.avatarUrl || user.avatarUrl || '';
    user.lastLoginAt = now;
    if (user.status !== 'active') {
      user.status = 'pending';
      user.groupCode = '';
      user.groupName = '';
      user.requestedAt = now;
    }
  }

  // 권욱 특권: 자동 승인 + VIP 그룹 배정
  const userName = String(user.name || '').trim();
  if (userName === '권욱' && user.status !== 'active') {
    user.role = 'vip';
    user.status = 'active';
    user.groupCode = 'VIP';
    user.groupName = 'VIP';
    user.approvedAt = now;
    user.approvedBy = 'AUTO (권욱 특권)';
    const vipGroup = ensureGroup(store, 'VIP', 'VIP', '권욱 VIP 그룹');
    ensureGroupSpace(store, vipGroup.code, vipGroup.name);
    addUnique(vipGroup.memberIds, user.id);
    return {
      user,
      message: '권욱님 자동 승인 완료. VIP 접속합니다.'
    };
  }

  if (user.status !== 'active') {
    ensurePendingRequest(store, user);
    return {
      user,
      message: `사용 요청이 ${getAdminDisplayName(env)} 관리자에게 전달되었습니다. 승인 후 그룹 공간이 열립니다.`
    };
  }

  return {
    user,
    message: `${user.name} 로그인 성공`
  };
}

function buildSessionMessage(user, env = {}) {
  if (!user) return '';
  if (isAdminUser(user)) return `${getAdminDisplayName(env)} 관리자 세션이 복원되었습니다.`;
  if (user.status === 'pending') return `사용 요청이 ${getAdminDisplayName(env)} 관리자에게 전달되었습니다. 승인을 기다려주세요.`;
  if (user.status === 'active') return `${user.name} 세션이 복원되었습니다.`;
  return `${user.name} 계정 상태: ${String(user.status || 'unknown').toUpperCase()}`;
}

async function buildSessionPayload(user, env, store, message = '') {
  const safeUser = sanitizeUser(user);
  return {
    success: true,
    message,
    user: safeUser,
    providers: {
      google: {
        enabled: Boolean(env.GOOGLE_CLIENT_ID),
        clientId: env.GOOGLE_CLIENT_ID || ''
      },
      naver: {
        enabled: Boolean(env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET)
      },
      local: {
        enabled: Boolean(getAdminIdentity(env).enabled)
      }
    },
    groups: listAccessibleGroups(safeUser, store),
    groupSpaces: listAccessibleSpaces(safeUser, store),
    pendingRequests: isAdminUser(safeUser) ? listPendingRequests(store) : [],
    activeGroupCode: safeUser?.groupCode || ''
  };
}
