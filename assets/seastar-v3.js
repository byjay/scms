// Built from assets/src-js. Edit the split sources, not this bundle.

// --- BEGIN 00-bootstrap-core.js ---
(() => {
  'use strict';

  const ROW_HEIGHT = 54;
  const EPSILON = 0.01;
  const DEMO_AUTH_ENABLED = Boolean(window.SEASTAR_ENABLE_DEMO_AUTH) && window.location.protocol === 'file:';
  const FALLBACK_SESSION_KEY = 'seastar_v3_demo_session';
  const FALLBACK_GROUP_SPACE_KEY = 'seastar_v3_demo_group_spaces';
  const FALLBACK_PROJECTS_KEY = 'seastar_v3_local_projects';
  const FALLBACK_LOCAL_USER = {
    id: 'local:demo-admin',
    name: 'Demo Admin',
    email: '',
    provider: 'local-demo',
    role: 'admin',
    status: 'active',
    groupCode: 'ADMIN',
    groupName: 'ADMIN'
  };
  const FALLBACK_LOCAL_CREDENTIALS = {
    id: 'demo-admin',
    password: 'change-me'
  };
  const DEFAULT_API_BASE = window.SEASTAR_API_BASE ||
    (window.location.protocol === 'file:' ? 'http://127.0.0.1:8787/api/auth' : '/api/auth');

  const CABLE_ALIASES = {
    id: ['ID', 'CABLE_ID'],
    name: ['CABLE_NAME', 'NAME', 'Cable Name'],
    type: ['CABLE_TYPE', 'TYPE', 'Type'],
    system: ['CABLE_SYSTEM', 'SYSTEM', 'System'],
    wdPage: ['WD_PAGE', 'DRAWING_PAGE', 'PAGE'],
    fromNode: ['FROM_NODE', 'FROM', 'From Node'],
    fromRoom: ['FROM_ROOM', 'From Room'],
    fromEquip: ['FROM_EQUIP', 'From Equip'],
    fromRest: ['FROM_REST', 'FROM REST', 'FROMREST'],
    toNode: ['TO_NODE', 'TO', 'To Node'],
    toRoom: ['TO_ROOM', 'To Room'],
    toEquip: ['TO_EQUIP', 'To Equip'],
    toRest: ['TO_REST', 'TO REST', 'TOREST'],
    length: ['POR_LENGTH', 'LENGTH', 'BASE_LENGTH', 'Length'],
    outDia: ['CABLE_OUTDIA', 'OUT_DIA', 'OUTDIA', 'Diameter', 'OD'],
    checkNode: ['CHECK_NODE', 'Check Node', 'Check'],
    path: ['CABLE_PATH', 'PATH', 'Path'],
    calculatedPath: ['CALCULATED_PATH', 'ROUTED_PATH'],
    calculatedLength: ['CALCULATED_LENGTH', 'CALC_LENGTH', 'TOTAL_LENGTH'],
    supplyDeck: ['SUPPLY_DECK', 'SUPPLY_DK', 'DECK'],
    porWeight: ['POR_WEIGHT', 'WEIGHT'],
    interference: ['INTERFERENCE'],
    remark: ['REMARK'],
    remark1: ['REMARK1'],
    remark2: ['REMARK2'],
    remark3: ['REMARK3'],
    revision: ['REVISION', 'REV'],
    cableWeight: ['CABLE_WEIGHT']
  };

  const NODE_ALIASES = {
    name: ['NODE_RNAME', 'NODE_NAME', 'NAME', 'Node'],
    structure: ['STRUCTURE_NAME', 'STRUCTURE', 'Structure'],
    component: ['COMPONENT', 'Component'],
    type: ['NODE_TYPE', 'TYPE', 'Type'],
    relations: ['RELATION', 'RELATIONS', 'Relation'],
    linkLength: ['LINK_LENGTH', 'Link Length'],
    areaSize: ['AREA_SIZE', 'Area Size', 'Area'],
    x: ['X', 'x', 'COORD_X', 'X_COORD'],
    y: ['Y', 'y', 'COORD_Y', 'Y_COORD'],
    z: ['Z', 'z', 'COORD_Z', 'Z_COORD'],
    point: ['POINT', 'POINTS']
  };

  const GRID_COLUMNS = [
    { key: 'system', label: 'CABLE_SYSTEM', width: 140 },
    { key: 'wdPage', label: 'WD_PAGE', width: 92, className: 'mono' },
    { key: 'name', label: 'CABLE_NAME', width: 220 },
    { key: 'type', label: 'CABLE_TYPE', width: 110 },
    { key: 'fromRoom', label: 'FROM_ROOM', width: 150 },
    { key: 'fromEquip', label: 'FROM_EQUIP', width: 210 },
    { key: 'fromNode', label: 'FROM_NODE', width: 110 },
    { key: 'fromRest', label: 'FROM_REST', width: 96, className: 'mono' },
    { key: 'toRoom', label: 'TO_ROOM', width: 150 },
    { key: 'toEquip', label: 'TO_EQUIP', width: 210 },
    { key: 'toNode', label: 'TO_NODE', width: 110 },
    { key: 'toRest', label: 'TO_REST', width: 96, className: 'mono' },
    { key: 'length', label: 'POR_LENGTH', width: 108, className: 'mono' },
    { key: 'path', label: 'CABLE_PATH', width: 260, className: 'path-cell' },
    { key: 'outDia', label: 'CABLE_OUTDIA', width: 110, className: 'mono' },
    { key: 'checkNode', label: 'CHECK_NODE', width: 180 },
    { key: 'supplyDeck', label: 'SUPPLY_DECK', width: 120 },
    { key: 'porWeight', label: 'POR_WEIGHT', width: 110, className: 'mono' },
    { key: 'interference', label: 'INTERFERENCE', width: 120 },
    { key: 'remark', label: 'REMARK', width: 180 },
    { key: 'remark1', label: 'REMARK1', width: 180 },
    { key: 'remark2', label: 'REMARK2', width: 180 },
    { key: 'remark3', label: 'REMARK3', width: 180 },
    { key: 'revision', label: 'REVISION', width: 96, className: 'mono' },
    { key: 'cableWeight', label: 'CABLE_WEIGHT', width: 120, className: 'mono' },
    { key: 'graphLength', label: 'GRAPH_LENGTH', width: 116, className: 'mono' },
    { key: 'calculatedLength', label: 'TOTAL_LENGTH', width: 116, className: 'mono' },
    { key: 'calculatedPath', label: 'CALCULATED_PATH', width: 320, className: 'path-cell' },
    { key: 'validation', label: 'VALIDATION', width: 118, special: 'validation' },
    { key: 'mapStatus', label: 'MAP_STATUS', width: 118, special: 'mapStatus' }
  ];

  const GRID_TEMPLATE = GRID_COLUMNS.map((column) => `${column.width}px`).join(' ');
  const DEFAULT_DECK_RULES = [
    { prefix: 'SF', label: 'Main Deck' },
    { prefix: 'TW', label: 'Tween Deck' },
    { prefix: 'PA', label: 'Upper Deck' },
    { prefix: 'PR', label: 'Platform' },
    { prefix: 'BC', label: 'Bridge' },
    { prefix: 'TO', label: 'Main Deck' }
  ];
  const BOM_GROUP_PRESETS = {
    SYSTEM_TYPE_DECK: ['system', 'type', 'deck'],
    SYSTEM_TYPE: ['system', 'type'],
    SYSTEM_DECK: ['system', 'deck'],
    TYPE_DECK: ['type', 'deck'],
    SYSTEM: ['system'],
    TYPE: ['type'],
    DECK: ['deck']
  };
  const VERSION_COMPARISON_ROWS = [
    {
      version: 'old/v0',
      strengths: 'Strong 2D routing, deck prefix rules, monolithic portability, BOM seed feature.',
      gaps: 'Hardcoded BOM extra length, fake graph assumptions, weak workbook roundtrip, no modern auth.',
      v3Delta: 'Replaced hardcoded BOM math, added triple validation, workbook roundtrip, real auth worker hooks.'
    },
    {
      version: 'old/v1',
      strengths: 'Adds sticky editing patterns, richer 3D companion view, broader tab structure, local login shell.',
      gaps: 'Still monolithic, no real OAuth flow, no strict graph/route/map cross-check contract.',
      v3Delta: 'Kept sticky editing and 3D helper ideas, replaced login with Google/Naver/local flow and unified validation.'
    },
    {
      version: 'v8 enterprise',
      strengths: 'Separated BOM page and export services, clearer modular React structure.',
      gaps: 'BOM still generic, export preserved reports but not v3-style exact graph validation workbook.',
      v3Delta: 'Pulled modular BOM reporting ideas into a single-file deliverable with path-aware totals.'
    },
    {
      version: 'v9 enterprise',
      strengths: 'Wide app composition with auth, overview, reports, BOM pivot, project save/load.',
      gaps: 'Project load remained JSON-centric and did not guarantee route workbook roundtrip.',
      v3Delta: 'Condensed the feature spread into one static front-end and one auth worker with workbook import/export.'
    },
    {
      version: 'v10 enterprise',
      strengths: 'Simple multi-sheet Excel export with BOM pivot and JSON export service.',
      gaps: 'Export is summary-focused, not a project-grade roundtrip package with validation evidence.',
      v3Delta: 'Extended export into project workbook, validation detail sheet, graph sheet, BOM sheet, comparison sheet.'
    },
    {
      version: 'v3 current',
      strengths: 'Sticky 3-row editor, exact route engine, triple validation, 2D/3D sync, OAuth-ready login.',
      gaps: 'Needs deployed auth secrets for live social sign-in.',
      v3Delta: 'Acts as the consolidated release baseline for this workspace.'
    }
  ];

  const EDITOR_TEXT_FIELDS = [
    'editName',
    'editType',
    'editSystem',
    'editWdPage',
    'editFromNode',
    'editFromRoom',
    'editFromEquip',
    'editToNode',
    'editToRoom',
    'editToEquip',
    'editCheckNode',
    'editSupplyDeck',
    'editPath',
    'editInterference',
    'editRemark',
    'editRemark1',
    'editRemark2',
    'editRemark3',
    'editRevision'
  ];

  const EDITOR_NUMBER_FIELDS = [
    'editLength',
    'editOutDia',
    'editFromRest',
    'editToRest',
    'editPorWeight',
    'editCableWeight'
  ];

  const state = {
    apiBase: DEFAULT_API_BASE,
    cables: [],
    embeddedNodes: [],
    uploadedNodes: [],
    mergedNodes: [],
    graph: createEmptyGraph(),
    selectedCableId: null,
    selectedNodeName: '',
    nodeMetrics: [],
    nodeMetricMap: Object.create(null),
    validationRunAt: null,
    diagnostics: {
      pass: 0,
      warn: 0,
      fail: 0,
      pending: 0,
      graphIssues: 0
    },
    manualPreview: null,
    auth: {
      backendAvailable: false,
      providers: {
        google: { enabled: false, clientId: '' },
        naver: { enabled: false },
        local: { enabled: false }
      },
      user: null,
      googleRendered: false,
      groups: [],
      groupSpaces: [],
      pendingRequests: [],
      activeGroupCode: '',
      selectedGroupCode: ''
    },
    project: {
      projectId: 'current',
      projectName: '',
      groupCode: '',
      source: 'memory',
      dirty: false,
      loadedAt: '',
      lastSavedAt: '',
      fileName: ''
    },
    bom: {
      marginPct: 10,
      rows: [],
      posMap: {}
    },
    reports: {
      drumLength: 500,
      lastRenderedAt: ''
    },
    history: {
      entries: [],
      index: -1,
      limit: 50,
      suspended: false
    },
    three: {
      renderer: null,
      frameId: 0
    },
    nodeThree: {
      renderer: null,
      frameId: 0
    }
  };

  const dom = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheDom();
    if (dom.loginHint) {
      dom.loginHint.textContent = state.auth.backendAvailable
        ? '愿由ъ옄 怨꾩젙? ?쒕쾭 ?섍꼍?ㅼ젙?먯꽌留?愿由щ맗?덈떎.'
        : '?댁쁺 諛고룷?먯꽌??auth worker? ADMIN_* ?섍꼍?ㅼ젙???꾩슂?⑸땲??';
    }
    buildGridHeader();
    bindEvents();
    updateDependencyPills();
    bootstrapEmbeddedNodes();
    refreshGraph();
    runTripleValidation({ quiet: true });
    renderAll();
    renderAll();
    await initAuth();
    commitHistory('startup');
    updateHistoryControls();
    if (!state.cables.length) {
      pushToast('耳?대툝 ?뚯씪??遺덈윭?ㅻ㈃ 寃쎈줈 ?곗텧怨?3以?寃利앹씠 ?쒖옉?⑸땲??', 'info');
    }
  }

  function cacheDom() {
    [
      'busyOverlay',
      'busyText',
      'loginOverlay',
      'authStatus',
      'googleButtonHost',
      'naverLoginBtn',
      'loginId',
      'loginPw',
      'localLoginBtn',
      'overlayLogoutBtn',
      'loginHint',
      'authBackendHint',
      'authRequestMeta',
      'depXlsx',
      'depThree',
      'depGoogle',
      'depApi',
      'userPanel',
      'userName',
      'userRole',
      'userProvider',
      'userGroup',
      'logoutBtn',
      'loadCableBtn',
      'loadNodeBtn',
      'importProjectBtn',
      'loadServerProjectBtn',
      'saveServerProjectBtn',
      'undoBtn',
      'redoBtn',
      'routeAllBtn',
      'validateAllBtn',
      'exportJsonBtn',
      'exportXlsxBtn',
      'projectStatus',
      'historyStatus',
      'cableFileInput',
      'nodeFileInput',
      'projectFileInput',
      'searchInput',
      'validationFilter',
      'systemFilter',
      'metricCables',
      'metricUploadedNodes',
      'metricMergedNodes',
      'metricRouted',
      'metricValidation',
      'metricGraphIssues',
      'editorDock',
      'editorStatus',
      'editName',
      'editType',
      'editSystem',
      'editWdPage',
      'editLength',
      'editOutDia',
      'editFromNode',
      'editFromRoom',
      'editFromEquip',
      'editFromRest',
      'editToNode',
      'editToRoom',
      'editToEquip',
      'editToRest',
      'editCheckNode',
      'editSupplyDeck',
      'editPorWeight',
      'editCableWeight',
      'editPath',
      'editInterference',
      'editRemark',
      'editRemark1',
      'editRemark2',
      'editRemark3',
      'editRevision',
      'saveEditorBtn',
      'saveRecalcBtn',
      'forceRouteBtn',
      'validateSelectedBtn',
      'focusMapBtn',
      'resetEditorBtn',
      'newCableBtn',
      'duplicateCableBtn',
      'deleteCableBtn',
      'listCount',
      'cableGridHeader',
      'cableGridViewport',
      'cableGridInner',
      'detailEmpty',
      'detailContent',
      'detailBaseLength',
      'detailGraphLength',
      'detailTotalLength',
      'detailMapStatus',
      'lengthBreakdown',
      'validationList',
      'pathCompare',
      'detailMapCanvas',
      'detailMapMeta',
      'routeFrom',
      'routeTo',
      'routeCheck',
      'routeFromRest',
      'routeToRest',
      'previewRouteBtn',
      'clearPreviewBtn',
      'useSelectedRouteBtn',
      'routePreviewMeta',
      'routePreviewPath',
      'graphSummary',
      'graphIssueList',
      'routeMapCanvas',
      'routeMapMeta',
      'threeContainer',
      'threeMeta',
      'nodeSearch',
      'nodeSort',
      'nodeListCount',
      'nodeVisibleCount',
      'nodeCoordReadyCount',
      'nodeTrayDemand',
      'nodeFocusedName',
      'nodeAutoMeta',
      'nodeList',
      'nodeDetailTitle',
      'nodeDetailMeta',
      'nodeDetailTrayWidth',
      'nodeDetailCableCount',
      'nodeDetailRelationCount',
      'nodeDetailCoordStatus',
      'nodeSummaryList',
      'nodeTrayRule',
      'nodeTrayList',
      'nodeCableList',
      'nodeRelationList',
      'nodeMapCanvas',
      'nodeMapMeta',
      'nodeThreeContainer',
      'nodeThreeMeta',
      'bomGroupBy',
      'bomSystemFilter',
      'bomTypeFilter',
      'bomDeckFilter',
      'bomSearch',
      'bomMargin',
      'generateBomPosBtn',
      'exportBomBtn',
      'bomGroupCount',
      'bomCableCount',
      'bomRequiredLength',
      'bomTotalLength',
      'bomDeckRule',
      'bomTable',
      'reportDrumLength',
      'refreshReportsBtn',
      'exportReportsBtn',
      'reportSnapshotAt',
      'reportSystemCount',
      'reportTypeCount',
      'reportDeckCount',
      'reportDrumCount',
      'reportFailWatchCount',
      'reportSystemTable',
      'reportTypeTable',
      'reportHotspotTable',
      'reportValidationTable',
      'reportDrumTable',
      'reportUpgradeGuide',
      'spaceStatus',
      'spaceActiveGroup',
      'spaceMemberCount',
      'spaceUpdatedAt',
      'spaceAccessLevel',
      'spaceGroupSelect',
      'refreshSpaceBtn',
      'saveSpaceBtn',
      'spaceAnnouncement',
      'spaceNotes',
      'spaceMemberList',
      'adminApprovalPanel',
      'refreshAdminBtn',
      'adminPendingCount',
      'adminGroupCount',
      'adminActiveUsers',
      'adminDisplayName',
      'adminRequestList',
      'diagnosticRunAt',
      'diagPass',
      'diagWarn',
      'diagFail',
      'diagGraphIssues',
      'diagnosticGraphTable',
      'diagnosticCableTable',
      'versionCompareTable',
      'toastStack'
    ].forEach((id) => {
      dom[id] = document.getElementById(id);
    });

    dom.tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    dom.tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
  }

  function buildGridHeader() {
    dom.cableGridHeader.style.gridTemplateColumns = GRID_TEMPLATE;
    dom.cableGridHeader.innerHTML = GRID_COLUMNS
      .map((column) => `<div class="grid-header-cell">${escapeHtml(column.label)}</div>`)
      .join('');
  }

  function bindEvents() {
    dom.loadCableBtn.addEventListener('click', () => dom.cableFileInput.click());
    dom.loadNodeBtn.addEventListener('click', () => dom.nodeFileInput.click());
    dom.importProjectBtn.addEventListener('click', () => dom.projectFileInput.click());
    dom.loadServerProjectBtn.addEventListener('click', () => {
      loadProjectFromServer({ force: true }).catch((error) => {
        console.error(error);
        pushToast(error.message || 'Server project load failed.', 'error');
      });
    });
    dom.saveServerProjectBtn.addEventListener('click', () => {
      persistProjectState({ announce: true, reason: 'manual-save' }).catch((error) => {
        console.error(error);
        pushToast(error.message || 'Server project save failed.', 'error');
      });
    });
    dom.undoBtn.addEventListener('click', () => {
      restoreHistoryStep(-1).catch((error) => {
        console.error(error);
        pushToast(error.message || 'Undo failed.', 'error');
      });
    });
    dom.redoBtn.addEventListener('click', () => {
      restoreHistoryStep(1).catch((error) => {
        console.error(error);
        pushToast(error.message || 'Redo failed.', 'error');
      });
    });
    dom.routeAllBtn.addEventListener('click', () => recalculateAllCables());
    dom.validateAllBtn.addEventListener('click', () => {
      runTripleValidation();
      renderAll();
      pushToast('3以??щ줈??寃利앹쓣 ?ㅼ떆 ?ㅽ뻾?덉뒿?덈떎.', 'success');
    });
    dom.exportJsonBtn.addEventListener('click', exportProjectJson);
    dom.exportXlsxBtn.addEventListener('click', exportProjectWorkbook);
    dom.cableFileInput.addEventListener('change', (event) => handleDataFile(event, 'cable'));
    dom.nodeFileInput.addEventListener('change', (event) => handleDataFile(event, 'node'));
    dom.projectFileInput.addEventListener('change', handleProjectImport);
    dom.searchInput.addEventListener('input', renderGrid);
    dom.validationFilter.addEventListener('change', renderGrid);
    dom.systemFilter.addEventListener('change', renderGrid);
    dom.cableGridViewport.addEventListener('scroll', renderGrid);
    dom.saveEditorBtn.addEventListener('click', () => saveSelectedCable({ recalc: false, validate: false }));
    dom.saveRecalcBtn.addEventListener('click', () => saveSelectedCable({ recalc: true, validate: true }));
    dom.forceRouteBtn.addEventListener('click', () => saveSelectedCable({ recalc: true, validate: true, forceRoute: true }));
    dom.validateSelectedBtn.addEventListener('click', () => validateSelectedCable(true));
    dom.focusMapBtn.addEventListener('click', focusSelectedCableOnMap);
    dom.resetEditorBtn.addEventListener('click', resetEditor);
    dom.newCableBtn.addEventListener('click', createNewCable);
    dom.duplicateCableBtn.addEventListener('click', duplicateSelectedCable);
    dom.deleteCableBtn.addEventListener('click', deleteSelectedCable);
    dom.previewRouteBtn.addEventListener('click', previewManualRoute);
    dom.clearPreviewBtn.addEventListener('click', clearManualPreview);
    dom.useSelectedRouteBtn.addEventListener('click', syncRouteInputsFromSelected);
    dom.nodeSearch.addEventListener('input', renderNodesPanel);
    dom.nodeSort.addEventListener('change', renderNodesPanel);
    dom.nodeList.addEventListener('click', handleNodeListClick);
    dom.nodeList.addEventListener('dblclick', handleNodeListDoubleClick);
    dom.bomGroupBy.addEventListener('change', renderBomTab);
    dom.bomSystemFilter.addEventListener('change', renderBomTab);
    dom.bomTypeFilter.addEventListener('change', renderBomTab);
    dom.bomDeckFilter.addEventListener('change', renderBomTab);
    dom.bomSearch.addEventListener('input', renderBomTab);
    dom.bomMargin.addEventListener('input', () => {
      state.bom.marginPct = Math.max(0, toNumber(dom.bomMargin.value, 10));
      renderBomTab();
    });
    dom.generateBomPosBtn.addEventListener('click', generateBomPos);
    dom.exportBomBtn.addEventListener('click', exportBomWorkbook);
    dom.bomTable.addEventListener('input', handleBomTableInput);
    dom.refreshReportsBtn.addEventListener('click', () => {
      renderReportsTab();
      pushToast('Reports refreshed.', 'success');
    });
    dom.reportDrumLength.addEventListener('input', () => {
      state.reports.drumLength = Math.max(10, toNumber(dom.reportDrumLength.value, state.reports.drumLength || 500));
      renderReportsTab();
    });
    dom.exportReportsBtn.addEventListener('click', exportReportsWorkbook);
    dom.naverLoginBtn.addEventListener('click', startNaverLogin);
    dom.localLoginBtn.addEventListener('click', handleLocalLogin);
    dom.logoutBtn.addEventListener('click', logout);
    dom.overlayLogoutBtn.addEventListener('click', logout);
    dom.refreshSpaceBtn.addEventListener('click', refreshAuthContext);
    dom.saveSpaceBtn.addEventListener('click', saveCurrentGroupSpace);
    dom.spaceGroupSelect.addEventListener('change', handleGroupSelectionChange);
    dom.refreshAdminBtn.addEventListener('click', refreshAuthContext);
    dom.adminRequestList.addEventListener('click', handleAdminRequestAction);

    dom.loginPw.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        handleLocalLogin();
      }
    });

    dom.tabButtons.forEach((button) => {
      button.addEventListener('click', () => setActiveTab(button.dataset.tab));
    });

    window.addEventListener('resize', debounce(() => {
      renderGrid();
      renderSelectedCable();
      renderRoutingPanel();
      renderNodesPanel();
    }, 120));
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
      state.auth.providers = payload.providers || state.auth.providers;
      state.auth.googleRendered = false;
      if (payload.user) {
        state.auth.user = payload.user;
      }
      setDependencyStatus(dom.depApi, 'ok', 'AUTH API');
      if (authQueryState?.type === 'success' && payload.user) {
        updateAuthStatus('success', authQueryState.message);
      } else if (authQueryState?.type === 'error') {
        updateAuthStatus('error', authQueryState.message);
      } else if (payload.user) {
        updateAuthStatus('success', String(payload.user.name || 'User') + ' session restored.');
      } else {
        updateAuthStatus('info', '濡쒓렇??諛⑹떇???좏깮??二쇱꽭??');
      }
    } catch (error) {
      state.auth.backendAvailable = false;
      setDependencyStatus(dom.depApi, 'warn', 'AUTH API');
      if (authQueryState?.type === 'error') {
        updateAuthStatus('error', authQueryState.message);
      } else if (state.auth.user) {
        updateAuthStatus('warn', '諛깆뿏?쒓? ?놁뼱??濡쒖뺄 ?곕え ?몄뀡?쇰줈 吏꾩엯?⑸땲??');
      } else {
        updateAuthStatus('warn', '?몄쬆 ?뚯빱瑜?李얠? 紐삵뻽?듬땲?? 濡쒖뺄 ?곕え 濡쒓렇?몃쭔 ?ъ슜?????덉뒿?덈떎.');
      }
    }

    applyAuthState();
    updateDependencyPills();
    renderGoogleButtonWithRetry();
  }

  function consumeAuthQueryParams() {
    const url = new URL(window.location.href);
    const auth = url.searchParams.get('auth');
    const authError = url.searchParams.get('authError');
    if (!auth && !authError) {
      return null;
    }

    url.searchParams.delete('auth');
    url.searchParams.delete('authError');
    window.history.replaceState({}, document.title, url.toString());

    if (authError) {
      return {
        type: 'error',
        message: decodeAuthError(authError)
      };
    }

    return {
      type: 'success',
      message: '?뚯뀥 濡쒓렇?몄씠 ?꾨즺?섏뿀?듬땲??'
    };
  }

  function decodeAuthError(code) {
    const key = String(code || '').toLowerCase();
    const map = {
      naver_state_mismatch: 'Naver 濡쒓렇??state 寃利앹뿉 ?ㅽ뙣?덉뒿?덈떎.',
      naver_token_exchange_failed: 'Naver ?좏겙 援먰솚???ㅽ뙣?덉뒿?덈떎.',
      naver_profile_failed: 'Naver ?ъ슜???꾨줈??議고쉶???ㅽ뙣?덉뒿?덈떎.',
      access_denied: '濡쒓렇?몄씠 痍⑥냼?섏뿀?듬땲??'
    };
    return map[key] || `?몄쬆 ?ㅻ쪟: ${code}`;
  }

  function updateDependencyPills() {
    setDependencyStatus(dom.depXlsx, window.XLSX ? 'ok' : 'warn', 'XLSX');
    setDependencyStatus(dom.depThree, window.THREE ? 'ok' : 'warn', 'THREE');
    setDependencyStatus(dom.depGoogle, window.google?.accounts?.id ? 'ok' : 'warn', 'GIS');
    if (!state.auth.backendAvailable) {
      setDependencyStatus(dom.depApi, 'warn', 'AUTH API');
    }
  }

  function setDependencyStatus(element, status, label) {
    if (!element) return;
    element.className = `dep-pill ${status}`;
    element.textContent = label;
  }

  function bootstrapEmbeddedNodes() {
    const embedded = Array.isArray(window.SEASTAR_EMBEDDED_NODES) ? window.SEASTAR_EMBEDDED_NODES : [];
    state.embeddedNodes = embedded.map((node, index) => normalizeNodeRecord(node, 'embedded', index)).filter((node) => node.name);
    if (!state.embeddedNodes.length) {
      pushToast('?댁옣 ?몃뱶 ?곗씠?곕? 李얠? 紐삵뻽?듬땲?? ?몃뱶 ?뚯씪??吏곸젒 遺덈윭? 二쇱꽭??', 'warn');
    }
  }

  function createEmptyGraph() {
    return {
      nodeMap: Object.create(null),
      adjacency: Object.create(null),
      pairMap: new Map(),
      issues: {
        missingRelationTargets: [],
        asymmetricRelations: [],
        coordMissingNodes: [],
        disconnectedComponents: []
      }
    };
  }

  function normalizeNodeRecord(raw, source, index) {
    const lookup = createNormalizedLookup(raw);
    const relationsRaw = raw.relations ?? raw.relation ?? readAliasValue(lookup, NODE_ALIASES.relations);
    const pointRaw = trimText(raw.point || raw.POINT || readAliasValue(lookup, NODE_ALIASES.point));
    const pointCoords = parsePointCoordinates(pointRaw);
    const resolvedX = finiteOrNull(raw.x ?? readAliasValue(lookup, NODE_ALIASES.x));
    const resolvedY = finiteOrNull(raw.y ?? readAliasValue(lookup, NODE_ALIASES.y));
    const resolvedZ = finiteOrNull(raw.z ?? readAliasValue(lookup, NODE_ALIASES.z));
    const node = {
      id: trimText(raw.id || `NODE-${source}-${index}`),
      name: trimText(raw.name || readAliasValue(lookup, NODE_ALIASES.name)),
      structure: trimText(raw.structure || readAliasValue(lookup, NODE_ALIASES.structure)),
      component: trimText(raw.component || readAliasValue(lookup, NODE_ALIASES.component)),
      type: trimText(raw.type || readAliasValue(lookup, NODE_ALIASES.type) || 'Tray'),
      relations: parseNodeList(relationsRaw),
      linkLength: positiveNumber(raw.linkLength ?? readAliasValue(lookup, NODE_ALIASES.linkLength), 1),
      areaSize: toNumber(raw.areaSize ?? readAliasValue(lookup, NODE_ALIASES.areaSize), 0),
      x: resolvedX ?? pointCoords?.x ?? null,
      y: resolvedY ?? pointCoords?.y ?? null,
      z: resolvedZ ?? pointCoords?.z ?? null,
      pointRaw,
      source
    };
    node.hasCoords = Number.isFinite(node.x) && Number.isFinite(node.y);
    return node;
  }

  function normalizeCableRecord(raw, index) {
    const lookup = createNormalizedLookup(raw);
    return {
      id: trimText(raw.id || readAliasValue(lookup, CABLE_ALIASES.id) || `CABLE-${Date.now()}-${index}`),
      name: trimText(raw.name || readAliasValue(lookup, CABLE_ALIASES.name) || `CABLE_${index + 1}`),
      type: trimText(raw.type || readAliasValue(lookup, CABLE_ALIASES.type) || ''),
      system: trimText(raw.system || readAliasValue(lookup, CABLE_ALIASES.system) || ''),
      wdPage: trimText(raw.wdPage || readAliasValue(lookup, CABLE_ALIASES.wdPage)),
      fromNode: trimText(raw.fromNode || readAliasValue(lookup, CABLE_ALIASES.fromNode)),
      fromRoom: trimText(raw.fromRoom || readAliasValue(lookup, CABLE_ALIASES.fromRoom)),
      fromEquip: trimText(raw.fromEquip || readAliasValue(lookup, CABLE_ALIASES.fromEquip)),
      fromRest: toNumber(raw.fromRest ?? readAliasValue(lookup, CABLE_ALIASES.fromRest), 0),
      toNode: trimText(raw.toNode || readAliasValue(lookup, CABLE_ALIASES.toNode)),
      toRoom: trimText(raw.toRoom || readAliasValue(lookup, CABLE_ALIASES.toRoom)),
      toEquip: trimText(raw.toEquip || readAliasValue(lookup, CABLE_ALIASES.toEquip)),
      toRest: toNumber(raw.toRest ?? readAliasValue(lookup, CABLE_ALIASES.toRest), 0),
      length: toNumber(raw.length ?? readAliasValue(lookup, CABLE_ALIASES.length), 0),
      outDia: toNumber(raw.outDia ?? raw.od ?? readAliasValue(lookup, CABLE_ALIASES.outDia), 0),
      checkNode: trimText(raw.checkNode || readAliasValue(lookup, CABLE_ALIASES.checkNode)),
      path: trimText(raw.path || readAliasValue(lookup, CABLE_ALIASES.path)),
      calculatedPath: trimText(raw.calculatedPath || readAliasValue(lookup, CABLE_ALIASES.calculatedPath)),
      calculatedLength: toNumber(raw.calculatedLength ?? readAliasValue(lookup, CABLE_ALIASES.calculatedLength), 0),
      supplyDeck: trimText(raw.supplyDeck || raw.supplyDk || readAliasValue(lookup, CABLE_ALIASES.supplyDeck)),
      porWeight: finiteOrNull(raw.porWeight ?? readAliasValue(lookup, CABLE_ALIASES.porWeight)),
      interference: trimText(raw.interference || readAliasValue(lookup, CABLE_ALIASES.interference)),
      remark: trimText(raw.remark || readAliasValue(lookup, CABLE_ALIASES.remark)),
      remark1: trimText(raw.remark1 || readAliasValue(lookup, CABLE_ALIASES.remark1)),
      remark2: trimText(raw.remark2 || readAliasValue(lookup, CABLE_ALIASES.remark2)),
      remark3: trimText(raw.remark3 || readAliasValue(lookup, CABLE_ALIASES.remark3)),
      revision: trimText(raw.revision || readAliasValue(lookup, CABLE_ALIASES.revision)),
      cableWeight: finiteOrNull(raw.cableWeight ?? readAliasValue(lookup, CABLE_ALIASES.cableWeight)),
      routeBreakdown: null,
      validation: null
    };
  }

  function createNormalizedLookup(raw) {
    const map = new Map();
    Object.entries(raw || {}).forEach(([key, value]) => {
      map.set(normalizeKey(key), value);
    });
    return map;
  }

  function readAliasValue(lookup, aliases) {
    for (const alias of aliases) {
      const value = lookup.get(normalizeKey(alias));
      if (value !== undefined) return value;
    }
    return '';
  }

  function normalizeKey(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
  }


// --- END 00-bootstrap-core.js ---

// --- BEGIN 10-routing-engine.js ---
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

// --- END 10-routing-engine.js ---

// --- BEGIN 20-cable-dashboard.js ---
  }

  function renderAll() {
    renderSummary();
    renderGrid();
    renderSelectedCable();
    renderRoutingPanel();
    renderDiagnostics();
    applyAuthState();
  }

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
      dom.graphIssueList.innerHTML = renderIssueItem('success', '洹몃옒???댁뒋媛 ?놁뒿?덈떎.');
      return;
    }
    dom.graphIssueList.innerHTML = items.join('');
  }

  function getFilteredCables() {
    const search = trimText(dom.searchInput.value).toLowerCase();
    const validationFilter = dom.validationFilter.value;
    const systemFilter = dom.systemFilter.value;

    return state.cables.filter((cable) => {
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
      dom.cableGridInner.innerHTML = '<div class="empty-state">議곌굔??留욌뒗 耳?대툝???놁뒿?덈떎.</div>';
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
      row.innerHTML = GRID_COLUMNS.map((column) => renderGridCell(cable, column)).join('');
      row.addEventListener('click', () => selectCable(cable.id));
      row.addEventListener('dblclick', () => selectCable(cable.id, { focusEditor: true }));
      dom.cableGridInner.appendChild(row);
    }
  }

  function renderGridCell(cable, column) {
    let content = '';
    let title = '';
    const value = cable[column.key];

    if (column.special === 'validation') {
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
      dom.editorStatus.textContent = 'No cable selected.';
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
    const normalizedCheckNode = parseNodeList(dom.editCheckNode.value).join(', ');
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
        cable.path = cable.calculatedPath || [cable.fromNode, ...parseNodeList(cable.checkNode), cable.toNode].join(' -> ');
      }

      if (options.validate || options.recalc || options.forceRoute || validationChanged) {
        cable.validation = validateCable(cable);
        refreshDiagnosticsSummary();
      } else if (routeChanged) {
        cable.validation = {
          status: 'PENDING',
          issues: [{ severity: 'warn', message: 'Route changed. Recalculation is required.' }],
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
        ? 'Cable route was forced through CHECK_NODE and saved.'
        : options.recalc
          ? 'Cable updated, recalculated, and saved.'
          : 'Cable updated and saved.', 'success');
    } catch (error) {
      console.error(error);
      Object.assign(cable, before);
      populateEditor();
      renderAll();
      pushToast(error.message || 'Cable save failed.', 'error');
    }
  }

  function validateSelectedCable(announce) {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('寃利앺븷 耳?대툝???좏깮??二쇱꽭??', 'warn');
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
      pushToast(`${cable.name} 寃利앹쓣 ?꾨즺?덉뒿?덈떎.`, 'success');
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
    pushToast('?몄쭛湲?媛믪쓣 ?먮옒 耳?대툝 媛믪쑝濡??섎룎?몄뒿?덈떎.', 'info');
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
    pushToast('??耳?대툝??異붽??덉뒿?덈떎.', 'success');
  }

  function duplicateSelectedCable() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('蹂듭젣??耳?대툝???좏깮??二쇱꽭??', 'warn');
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
      issues: [{ severity: 'warn', message: '蹂듭젣 ???ъ궛異쒖씠 ?꾩슂?⑸땲??' }],
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
    pushToast('?좏깮 耳?대툝??蹂듭젣?덉뒿?덈떎.', 'success');
  }

  function deleteSelectedCable() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('??젣??耳?대툝???좏깮??二쇱꽭??', 'warn');
      return;
    }
    if (!window.confirm(`${cable.name} 耳?대툝????젣?좉퉴??`)) {
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
    pushToast('耳?대툝????젣?덉뒿?덈떎.', 'success');
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
    pushToast('?섎룞 寃쎈줈 誘몃━蹂닿린瑜?媛깆떊?덉뒿?덈떎.', 'success');
  }

  function clearManualPreview() {
    state.manualPreview = null;
    renderRoutingPanel();
    pushToast('?섎룞 誘몃━蹂닿린瑜??댁젣?덉뒿?덈떎.', 'info');
  }

  function focusSelectedCableOnMap() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('癒쇱? 耳?대툝???좏깮??二쇱꽭??', 'warn');
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

    const mapStats = renderMapCanvas(dom.detailMapCanvas, route, { fitToPath: true });
    dom.detailMapMeta.textContent = route
      ? `?몃뱶 ${route.pathNodes.length}媛?| 2D drawable segment ${mapStats.drawnSegments}/${Math.max(route.pathNodes.length - 1, 0)}`
      : '怨꾩궛??寃쎈줈媛 ?놁뒿?덈떎.';
  }

  function buildLengthBreakdown(cable) {
    const route = cable.routeBreakdown;
    if (!route) {
      return renderIssueItem('warn', '寃쎈줈媛 ?꾩쭅 怨꾩궛?섏? ?딆븯?듬땲??');
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
      return renderIssueItem('warn', '寃利앹씠 ?꾩쭅 ?ㅽ뻾?섏? ?딆븯?듬땲??');
    }
    const base = [
      renderIssueItem(validation.status === 'PASS' ? 'success' : validation.status === 'WARN' ? 'warn' : 'fail', `STATUS: ${validation.status}`),
      renderIssueItem(validation.lengthMatched ? 'success' : 'fail', `湲몄씠 寃利? ${validation.lengthMatched ? 'OK' : 'NG'}`),
      renderIssueItem(validation.mapSegmentsMatch ? 'success' : 'warn', `留?寃利? ${validation.mapSegmentsMatch ? 'OK' : 'NG'}`),
      renderIssueItem(validation.coordsReady ? 'success' : 'warn', `醫뚰몴 ?곹깭: ${validation.coordsReady ? 'READY' : 'COORD MISSING'}`)
    ];
    const issues = validation.issues.map((issue) => renderIssueItem(issue.severity, issue.message));
    return [...base, ...issues].join('');
  }

  function renderRoutingPanel() {
    const previewCable = state.manualPreview || getSelectedCable();
    const route = previewCable?.routeBreakdown || null;
    const validation = previewCable?.validation || null;

    if (!route) {
      dom.routePreviewMeta.textContent = '?좏깮??寃쎈줈媛 ?놁뒿?덈떎.';
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
      : '寃쎈줈瑜??좏깮?섎㈃ 2D 寃利?留듭씠 ?쒖떆?⑸땲??';

    const threeStats = getActiveTab() === 'routing'
      ? renderThreeScene(route)
      : (disposeThree(), { drawnSegments: countDrawableSegments(route?.pathNodes || []) });
    dom.threeMeta.textContent = route
      ? `3D segment ${threeStats.drawnSegments}/${Math.max(route.pathNodes.length - 1, 0)}`
      : '寃쎈줈瑜??좏깮?섎㈃ 3D 蹂댁“ 酉곌? ?쒖떆?⑸땲??';
  }


// --- END 20-cable-dashboard.js ---

// --- BEGIN 30-nodes-and-maps.js ---
  function getActiveTab() {
    return dom.tabButtons.find((button) => button.classList.contains('is-active'))?.dataset.tab || 'dashboard';
  }

  function syncSelectedNode() {
    const names = state.mergedNodes.map((node) => node.name).filter(Boolean);
    if (!names.length) {
      state.selectedNodeName = '';
      return;
    }
    if (!names.includes(state.selectedNodeName)) {
      state.selectedNodeName = names.find((name) => state.graph.nodeMap[name]?.hasCoords) || names[0];
    }
  }

  function handleNodeListClick(event) {
    const row = event.target.closest('[data-node-name]');
    if (!row) return;
    selectNode(row.dataset.nodeName);
  }

  function handleNodeListDoubleClick(event) {
    const row = event.target.closest('[data-node-name]');
    if (!row) return;
    selectNode(row.dataset.nodeName, { activateTab: true, scrollMap: true });
  }

  function selectNode(name, options = {}) {
    if (!trimText(name)) return;
    state.selectedNodeName = trimText(name);
    if (options.activateTab) {
      setActiveTab('nodes');
    } else {
      renderNodesPanel();
    }
    if (options.scrollMap && dom.nodeThreeContainer) {
      dom.nodeThreeContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function refreshNodeAnalytics() {
    syncSelectedNode();
    const metricMap = Object.create(null);

    state.mergedNodes.forEach((node) => {
      metricMap[node.name] = {
        name: node.name,
        structure: node.structure || '',
        component: node.component || '',
        type: node.type || '',
        hasCoords: Boolean(node.hasCoords),
        x: node.x,
        y: node.y,
        z: node.z,
        pointRaw: node.pointRaw || '',
        relationNames: unique((node.relations || []).filter(Boolean)),
        relationCount: (node.relations || []).filter(Boolean).length,
        systems: new Set(),
        types: new Set(),
        decks: new Set(),
        cables: [],
        cableCount: 0,
        totalOutDia: 0,
        totalCalculatedLength: 0,
        segmentTouches: 0
      };
    });

    state.cables.forEach((cable) => {
      const route = cable.routeBreakdown;
      if (!route?.pathNodes?.length) return;

      const uniqueNodes = unique(route.pathNodes.filter(Boolean));
      const deck = trimText(resolveCableDeck(cable)) || 'UNASSIGNED';
      const outDia = Math.max(0, toNumber(cable.outDia, 0));
      const totalLength = round2(cable.calculatedLength || route.totalLength || 0);

      uniqueNodes.forEach((name) => {
        const metric = metricMap[name];
        if (!metric) return;
        metric.cableCount += 1;
        metric.totalOutDia = round2(metric.totalOutDia + outDia);
        metric.totalCalculatedLength = round2(metric.totalCalculatedLength + totalLength);
        if (trimText(cable.system)) metric.systems.add(trimText(cable.system));
        if (trimText(cable.type)) metric.types.add(trimText(cable.type));
        if (deck) metric.decks.add(deck);
        metric.cables.push({
          name: cable.name,
          system: trimText(cable.system) || 'UNASSIGNED',
          type: trimText(cable.type) || 'UNASSIGNED',
          deck,
          outDia,
          totalLength,
          status: cable.validation?.status || 'PENDING'
        });
      });

      route.pathNodes.forEach((name, index) => {
        const metric = metricMap[name];
        if (!metric) return;
        if (index > 0) metric.segmentTouches += 1;
        if (index < route.pathNodes.length - 1) metric.segmentTouches += 1;
      });
    });

    const metrics = Object.values(metricMap).map((metric) => {
      const tray = calculateNodeTrayWidth(metric.totalOutDia);
      const systems = Array.from(metric.systems).sort();
      const types = Array.from(metric.types).sort();
      const decks = Array.from(metric.decks).sort();
      const cables = metric.cables
        .sort((left, right) => right.outDia - left.outDia || right.totalLength - left.totalLength || left.name.localeCompare(right.name));
      return {
        ...metric,
        systems,
        types,
        decks,
        systemsLabel: systems.length ? systems.join(', ') : 'UNASSIGNED',
        typesLabel: types.length ? types.join(', ') : 'UNASSIGNED',
        decksLabel: decks.length ? decks.join(', ') : 'UNASSIGNED',
        primaryDeck: decks[0] || 'UNASSIGNED',
        cables,
        ...tray
      };
    });

    state.nodeMetrics = metrics;
    state.nodeMetricMap = Object.fromEntries(metrics.map((metric) => [metric.name, metric]));

    if (!state.nodeMetricMap[state.selectedNodeName]) {
      state.selectedNodeName = metrics[0]?.name || '';
    }
  }

  function calculateNodeTrayWidth(totalOutDia) {
    const occupiedWidth = round2(Math.max(0, totalOutDia));
    const designWidth = round2(occupiedWidth * 1.15);
    const recommendedTrayWidth = pickTrayStandardWidth(designWidth);
    const fillRatio = recommendedTrayWidth > 0 ? round2((designWidth / recommendedTrayWidth) * 100) : 0;
    return {
      occupiedWidth,
      designWidth,
      recommendedTrayWidth,
      fillRatio
    };
  }

  function pickTrayStandardWidth(width) {
    if (width <= 0) return 0;
    const standards = [50, 100, 150, 200, 300, 450, 600, 750, 900, 1050, 1200];
    const standard = standards.find((value) => value >= width);
    return standard || Math.ceil(width / 50) * 50;
  }

  function getFilteredNodeMetrics() {
    const search = trimText(dom.nodeSearch?.value).toLowerCase();
    const sort = dom.nodeSort?.value || 'trayDesc';
    const filtered = state.nodeMetrics.filter((metric) => {
      if (!search) return true;
      return [
        metric.name,
        metric.structure,
        metric.component,
        metric.type,
        metric.systemsLabel,
        metric.decksLabel,
        metric.typesLabel
      ].join(' ').toLowerCase().includes(search);
    });

    const sorted = filtered.slice().sort((left, right) => {
      if (sort === 'cableDesc') {
        return right.cableCount - left.cableCount || right.recommendedTrayWidth - left.recommendedTrayWidth || left.name.localeCompare(right.name);
      }
      if (sort === 'nameAsc') {
        return left.name.localeCompare(right.name);
      }
      if (sort === 'relationDesc') {
        return right.relationCount - left.relationCount || right.cableCount - left.cableCount || left.name.localeCompare(right.name);
      }
      return right.recommendedTrayWidth - left.recommendedTrayWidth || right.cableCount - left.cableCount || left.name.localeCompare(right.name);
    });

    return sorted;
  }

  function renderNodesPanel() {
    if (!dom.nodeList) return;

    refreshNodeAnalytics();
    const metrics = getFilteredNodeMetrics();
    const visibleNames = new Set(metrics.map((metric) => metric.name));
    if (metrics.length && !visibleNames.has(state.selectedNodeName)) {
      state.selectedNodeName = metrics[0].name;
    }
    const focusMetric = state.nodeMetricMap[state.selectedNodeName] || metrics[0] || null;

    const coordReadyCount = metrics.filter((metric) => metric.hasCoords).length;
    const totalTrayDemand = metrics.reduce((sum, metric) => sum + metric.recommendedTrayWidth, 0);
    const routedCableCount = state.cables.filter((cable) => cable.routeBreakdown?.pathNodes?.length).length;

    dom.nodeListCount.textContent = `${formatInt(metrics.length)} / ${formatInt(state.nodeMetrics.length)}`;
    dom.nodeVisibleCount.textContent = formatInt(metrics.length);
    dom.nodeCoordReadyCount.textContent = formatInt(coordReadyCount);
    dom.nodeTrayDemand.textContent = formatNumber(totalTrayDemand);
    dom.nodeFocusedName.textContent = focusMetric?.name || '-';
    dom.nodeAutoMeta.textContent = `Tray width = next standard >= sum(CABLE_OUTDIA) x 1.15. Routed cables ${formatInt(routedCableCount)} / ${formatInt(state.cables.length)} are reflected.`;

    if (!metrics.length) {
      dom.nodeList.innerHTML = '<div class="empty-state node-list-empty">?쒖떆???몃뱶媛 ?놁뒿?덈떎.</div>';
    } else {
      dom.nodeList.innerHTML = metrics.map((metric) => `
        <div class="node-list-row${metric.name === state.selectedNodeName ? ' is-selected' : ''}" data-node-name="${escapeHtml(metric.name)}" title="?붾툝?대┃?섎㈃ 3D 留듭뿉???ъ빱?ㅻ맗?덈떎.">
          <div class="node-list-main">
            <div class="node-list-title">${escapeHtml(metric.name)}</div>
            <div class="node-list-subtitle">${escapeHtml([metric.structure || '-', metric.component || '-', metric.primaryDeck].join(' | '))}</div>
          </div>
          <div class="node-list-metric">
            <span>TRAY</span>
            <strong>${formatInt(metric.recommendedTrayWidth)}</strong>
          </div>
          <div class="node-list-metric">
            <span>CABLES</span>
            <strong>${formatInt(metric.cableCount)}</strong>
          </div>
          <div class="node-list-metric">
            <span>REL</span>
            <strong>${formatInt(metric.relationCount)}</strong>
          </div>
          <div class="node-list-metric">
            <span>MAP</span>
            <strong>${metric.hasCoords ? 'READY' : 'MISS'}</strong>
          </div>
        </div>
      `).join('');
    }

    if (!focusMetric) {
      dom.nodeDetailTitle.textContent = 'Select a node.';
      dom.nodeDetailMeta.textContent = 'Double-click a node in the list to focus it in the 3D map.';
      dom.nodeDetailTrayWidth.textContent = '0';
      dom.nodeDetailCableCount.textContent = '0';
      dom.nodeDetailRelationCount.textContent = '0';
      dom.nodeDetailCoordStatus.textContent = 'LOCKED';
      dom.nodeSummaryList.innerHTML = renderIssueItem('warn', 'No node summary is available.');
      dom.nodeTrayRule.textContent = 'Tray width rule is unavailable.';
      dom.nodeTrayList.innerHTML = '';
      dom.nodeCableList.innerHTML = '<div class="empty-state">No matching cables were found.</div>';
      dom.nodeRelationList.innerHTML = '<div class="empty-state">No connected nodes were found.</div>';
      renderNodeMapCanvas(dom.nodeMapCanvas, null);
      disposeNodeThree();
      dom.nodeMapMeta.textContent = 'Select a node to display the 2D map.';
      dom.nodeThreeMeta.textContent = 'Select a node to display the 3D map.';
      return;
    }

    dom.nodeDetailTitle.textContent = focusMetric.name;
    dom.nodeDetailMeta.textContent = `${focusMetric.structure || 'NO STRUCTURE'} | ${focusMetric.component || 'NO COMPONENT'} | ${focusMetric.typesLabel}`;
    dom.nodeDetailTrayWidth.textContent = `${formatInt(focusMetric.recommendedTrayWidth)} mm`;
    dom.nodeDetailCableCount.textContent = formatInt(focusMetric.cableCount);
    dom.nodeDetailRelationCount.textContent = formatInt(focusMetric.relationCount);
    dom.nodeDetailCoordStatus.textContent = focusMetric.hasCoords ? 'READY' : 'COORD MISS';

    dom.nodeSummaryList.innerHTML = [
      `SYSTEMS: ${focusMetric.systemsLabel}`,
      `DECKS: ${focusMetric.decksLabel}`,
      `SEGMENT TOUCHES: ${formatInt(focusMetric.segmentTouches)}`,
      `TOTAL ROUTED LENGTH: ${formatNumber(focusMetric.totalCalculatedLength)}`,
      `POINT: ${focusMetric.pointRaw || buildPointText(focusMetric) || 'N/A'}`
    ].map((line) => renderIssueItem('info', line)).join('');

    dom.nodeTrayRule.textContent = 'Tray width = next standard width >= sum(CABLE_OUTDIA) x 1.15';
    dom.nodeTrayList.innerHTML = [
      `SUM OUT_DIA: ${formatNumber(focusMetric.totalOutDia)}`,
      `DESIGN WIDTH: ${formatNumber(focusMetric.designWidth)}`,
      `RECOMMENDED TRAY: ${formatInt(focusMetric.recommendedTrayWidth)} mm`,
      `FILL RATIO: ${formatNumber(focusMetric.fillRatio)} %`
    ].map((line) => renderIssueItem('info', line)).join('');

    dom.nodeCableList.innerHTML = focusMetric.cables.length
      ? focusMetric.cables.slice(0, 80).map((cable) => `
          <div class="node-cable-row">
            <strong>${escapeHtml(cable.name)}</strong>
            <span>${escapeHtml(cable.system)}</span>
            <span>${escapeHtml(cable.deck)}</span>
            <span>${formatNumber(cable.outDia)} / ${formatNumber(cable.totalLength)}</span>
          </div>
        `).join('')
      : '<div class="empty-state">???몃뱶瑜?吏?섎뒗 耳?대툝???놁뒿?덈떎.</div>';

    dom.nodeRelationList.innerHTML = focusMetric.relationNames.length
      ? focusMetric.relationNames.map((name) => {
          const related = state.graph.nodeMap[name];
          const edge = getEdgeInfo(focusMetric.name, name);
          return `
            <div class="node-relation-row">
              <strong>${escapeHtml(name)}</strong>
              <span>${related?.hasCoords ? 'READY' : 'MISS'}</span>
              <span>${edge ? formatNumber(edge.weight) : '-'}</span>
            </div>
          `;
        }).join('')
      : '<div class="empty-state">?곌껐 relation ?몃뱶媛 ?놁뒿?덈떎.</div>';

    const nodeMapStats = renderNodeMapCanvas(dom.nodeMapCanvas, focusMetric);
    dom.nodeMapMeta.textContent = `2D focus ${focusMetric.name} | relation ${nodeMapStats.drawnRelations}/${focusMetric.relationCount} | routed cables ${focusMetric.cableCount}`;

    const nodeThreeStats = getActiveTab() === 'nodes'
      ? renderNodeThreeScene(focusMetric)
      : (disposeNodeThree(), { drawnRelations: focusMetric.relationCount, drawnNodes: state.mergedNodes.filter((node) => node.hasCoords).length });
    dom.nodeThreeMeta.textContent = `3D nodes ${formatInt(nodeThreeStats.drawnNodes)} | focus links ${formatInt(nodeThreeStats.drawnRelations)}`;
  }

  function renderNodeMapCanvas(canvas, focusMetric) {
    if (!canvas) return { drawnRelations: 0 };

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || canvas.clientWidth || 640));
    const height = Math.max(240, Math.round(rect.height || canvas.clientHeight || 360));
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const allDrawableNodes = state.mergedNodes.filter((node) => node.hasCoords);
    if (!allDrawableNodes.length) {
      drawCanvasMessage(ctx, width, height, '醫뚰몴媛 ?덈뒗 ?몃뱶媛 ?놁뒿?덈떎.');
      return { drawnRelations: 0 };
    }

    const projection = createProjection(allDrawableNodes, width, height);
    drawGridBackground(ctx, width, height);

    state.graph.pairMap.forEach((edge) => {
      const from = state.graph.nodeMap[edge.a];
      const to = state.graph.nodeMap[edge.b];
      if (!from?.hasCoords || !to?.hasCoords) return;
      const p1 = projectNode(projection, from);
      const p2 = projectNode(projection, to);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    allDrawableNodes.forEach((node) => {
      const point = projectNode(projection, node);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(157, 174, 191, 0.54)';
      ctx.arc(point.x, point.y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!focusMetric) {
      return { drawnRelations: 0 };
    }

    const focusNode = state.graph.nodeMap[focusMetric.name];
    if (!focusNode?.hasCoords) {
      drawCanvasMessage(ctx, width, height, '?좏깮 ?몃뱶??醫뚰몴媛 ?놁뼱 2D ?ъ빱?ㅻ? ?쒖떆?????놁뒿?덈떎.');
      return { drawnRelations: 0 };
    }

    let drawnRelations = 0;
    focusMetric.relationNames.forEach((name) => {
      const related = state.graph.nodeMap[name];
      if (!related?.hasCoords) return;
      drawnRelations += 1;
      const start = projectNode(projection, focusNode);
      const end = projectNode(projection, related);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 200, 109, 0.92)';
      ctx.lineWidth = 2.6;
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = '#59c9ff';
      ctx.arc(end.x, end.y, 4.6, 0, Math.PI * 2);
      ctx.fill();
    });

    const focusPoint = projectNode(projection, focusNode);
    ctx.beginPath();
    ctx.fillStyle = '#ff7c7c';
    ctx.arc(focusPoint.x, focusPoint.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5f8fb';
    ctx.font = '12px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(focusMetric.name, focusPoint.x + 10, focusPoint.y - 8);

    return { drawnRelations };
  }

  function renderNodeThreeScene(focusMetric) {
    const container = dom.nodeThreeContainer;
    const placeholder = (message) => {
      disposeNodeThree();
      container.innerHTML = `<div class="three-placeholder">${escapeHtml(message)}</div>`;
      return { drawnRelations: 0, drawnNodes: 0 };
    };

    if (!window.THREE) {
      return placeholder('Three.js媛 ?놁뼱 ?몃뱶 3D 留듭쓣 ?ъ슜?????놁뒿?덈떎.');
    }

    const allDrawableNodes = state.mergedNodes.filter((node) => node.hasCoords);
    if (!allDrawableNodes.length) {
      return placeholder('醫뚰몴媛 ?덈뒗 ?몃뱶媛 ?놁뼱 3D 留듭쓣 洹몃┫ ???놁뒿?덈떎.');
    }

    if (!focusMetric) {
      return placeholder('?몃뱶瑜??좏깮?섎㈃ 3D 留듭씠 ?쒖떆?⑸땲??');
    }

    const focusNode = state.graph.nodeMap[focusMetric.name];
    if (!focusNode?.hasCoords) {
      return placeholder('?좏깮 ?몃뱶??醫뚰몴媛 ?놁뼱 3D ?ъ빱?ㅻ? ?쒖떆?????놁뒿?덈떎.');
    }

    disposeNodeThree();
    container.innerHTML = '';

    try {
      const width = Math.max(320, container.clientWidth || 640);
      const height = Math.max(220, container.clientHeight || 320);
      const renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      const scene = new window.THREE.Scene();
      scene.background = new window.THREE.Color(0x06111b);

      const camera = new window.THREE.PerspectiveCamera(42, width / height, 0.1, 2000);
      camera.position.set(0, 90, 210);

      const ambient = new window.THREE.AmbientLight(0xffffff, 0.62);
      const directional = new window.THREE.DirectionalLight(0x88e2ff, 1.08);
      directional.position.set(40, 80, 120);
      scene.add(ambient, directional);

      const group = new window.THREE.Group();
      scene.add(group);
      group.add(new window.THREE.GridHelper(220, 14, 0x28445d, 0x123149));

      const center = {
        x: average(allDrawableNodes.map((node) => node.x)),
        y: average(allDrawableNodes.map((node) => node.y)),
        z: average(allDrawableNodes.map((node) => node.z ?? 0))
      };
      const maxDelta = Math.max(...allDrawableNodes.flatMap((node) => [
        Math.abs((node.x ?? 0) - center.x),
        Math.abs((node.y ?? 0) - center.y),
        Math.abs((node.z ?? 0) - center.z)
      ]), 1);
      const scale = 88 / maxDelta;
      const toVector = (node) => new window.THREE.Vector3(
        ((node.x ?? 0) - center.x) * scale,
        ((node.z ?? 0) - center.z) * scale,
        ((node.y ?? 0) - center.y) * scale
      );

      const cloudPoints = allDrawableNodes.map((node) => toVector(node));
      group.add(new window.THREE.Points(
        new window.THREE.BufferGeometry().setFromPoints(cloudPoints),
        new window.THREE.PointsMaterial({ color: 0x7f95a9, size: 2.2, transparent: true, opacity: 0.36 })
      ));

      const focusVector = toVector(focusNode);
      const relatedNodes = focusMetric.relationNames
        .map((name) => state.graph.nodeMap[name])
        .filter((node) => node?.hasCoords);

      let drawnRelations = 0;
      relatedNodes.forEach((node) => {
        drawnRelations += 1;
        const points = [focusVector, toVector(node)];
        group.add(new window.THREE.Line(
          new window.THREE.BufferGeometry().setFromPoints(points),
          new window.THREE.LineBasicMaterial({ color: 0xffc86d })
        ));
        const sphere = new window.THREE.Mesh(
          new window.THREE.SphereGeometry(1.9, 16, 16),
          new window.THREE.MeshStandardMaterial({ color: 0x59c9ff, emissive: 0x143446 })
        );
        sphere.position.copy(points[1]);
        group.add(sphere);
      });

      const focusSphere = new window.THREE.Mesh(
        new window.THREE.SphereGeometry(3.2, 20, 20),
        new window.THREE.MeshStandardMaterial({ color: 0xff7c7c, emissive: 0x3a1919 })
      );
      focusSphere.position.copy(focusVector);
      group.add(focusSphere);

      const animate = () => {
        group.rotation.y += 0.0022;
        renderer.render(scene, camera);
        state.nodeThree.frameId = window.requestAnimationFrame(animate);
      };

      state.nodeThree.renderer = renderer;
      state.nodeThree.frameId = window.requestAnimationFrame(animate);
      return { drawnRelations, drawnNodes: allDrawableNodes.length };
    } catch (error) {
      console.error(error);
      return placeholder('?몃뱶 3D ?뚮뜑??珥덇린??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
    }
  }

  function disposeNodeThree() {
    if (state.nodeThree.frameId) {
      window.cancelAnimationFrame(state.nodeThree.frameId);
      state.nodeThree.frameId = 0;
    }
    if (state.nodeThree.renderer) {
      state.nodeThree.renderer.dispose();
      state.nodeThree.renderer = null;
    }
  }

  function renderMapCanvas(canvas, route, options = {}) {
    if (!canvas) return { drawnSegments: 0 };

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || canvas.clientWidth || 640));
    const height = Math.max(240, Math.round(rect.height || canvas.clientHeight || 360));
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const allDrawableNodes = state.mergedNodes.filter((node) => node.hasCoords);
    if (!allDrawableNodes.length) {
      drawCanvasMessage(ctx, width, height, '醫뚰몴媛 ?덈뒗 ?몃뱶媛 ?놁뒿?덈떎.');
      return { drawnSegments: 0 };
    }

    const focusNodes = route?.pathNodes
      .map((name) => state.graph.nodeMap[name])
      .filter((node) => node?.hasCoords) || [];
    const projectionNodes = options.fitToPath && focusNodes.length > 1 ? focusNodes : allDrawableNodes;
    const projection = createProjection(projectionNodes, width, height);

    drawGridBackground(ctx, width, height);

    state.graph.pairMap.forEach((edge) => {
      const from = state.graph.nodeMap[edge.a];
      const to = state.graph.nodeMap[edge.b];
      if (!from?.hasCoords || !to?.hasCoords) return;
      const p1 = projectNode(projection, from);
      const p2 = projectNode(projection, to);
      ctx.beginPath();
      ctx.strokeStyle = edge.symmetric ? 'rgba(255,255,255,0.07)' : 'rgba(255,200,109,0.15)';
      ctx.lineWidth = 1;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    allDrawableNodes.forEach((node) => {
      const point = projectNode(projection, node);
      const inPath = route?.pathNodes.includes(node.name);
      ctx.beginPath();
      ctx.fillStyle = inPath ? '#59c9ff' : 'rgba(186, 201, 219, 0.66)';
      ctx.arc(point.x, point.y, inPath ? 3.8 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    let drawnSegments = 0;
    if (route?.pathNodes?.length) {
      for (let index = 0; index < route.pathNodes.length - 1; index += 1) {
        const a = state.graph.nodeMap[route.pathNodes[index]];
        const b = state.graph.nodeMap[route.pathNodes[index + 1]];
        if (!a?.hasCoords || !b?.hasCoords) continue;
        drawnSegments += 1;
        const p1 = projectNode(projection, a);
        const p2 = projectNode(projection, b);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,124,124,0.92)';
        ctx.lineWidth = 3.2;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      const first = state.graph.nodeMap[route.pathNodes[0]];
      const last = state.graph.nodeMap[route.pathNodes[route.pathNodes.length - 1]];
      [first, last].forEach((node, index) => {
        if (!node?.hasCoords) return;
        const point = projectNode(projection, node);
        ctx.beginPath();
        ctx.fillStyle = index === 0 ? '#57d7a0' : '#ffc86d';
        ctx.arc(point.x, point.y, 6.6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    return { drawnSegments };
  }

  function drawCanvasMessage(ctx, width, height, message) {
    ctx.fillStyle = '#8da7bb';
    ctx.font = '14px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, width / 2, height / 2);
  }

  function createProjection(nodes, width, height) {
    const padding = 28;
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
    return { minX, minY, maxY, scale, padding, height };
  }

  function projectNode(projection, node) {
    const x = projection.padding + (node.x - projection.minX) * projection.scale;
    const y = projection.height - projection.padding - (node.y - projection.minY) * projection.scale;
    return { x, y };
  }

  function drawGridBackground(ctx, width, height) {
    ctx.fillStyle = '#05101a';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function renderThreeScene(route) {
    const container = dom.threeContainer;
    const placeholder = (message) => {
      disposeThree();
      container.innerHTML = `<div class="three-placeholder">${escapeHtml(message)}</div>`;
      return { drawnSegments: 0 };
    };

    if (!window.THREE) {
      return placeholder('Three.js媛 ?놁뼱 3D 酉곕? ?ъ슜?????놁뒿?덈떎.');
    }

    if (!route?.pathNodes?.length) {
      return placeholder('寃쎈줈瑜??좏깮?섎㈃ 3D 酉곌? ?쒖떆?⑸땲??');
    }

    const nodes = route.pathNodes
      .map((name) => state.graph.nodeMap[name])
      .filter((node) => node?.hasCoords);

    if (nodes.length < 2) {
      return placeholder('醫뚰몴媛 異⑸텇?섏? ?딆븘 3D 寃쎈줈瑜?洹몃┫ ???놁뒿?덈떎.');
    }

    disposeThree();
    container.innerHTML = '';

    try {
      const width = Math.max(320, container.clientWidth || 640);
      const height = Math.max(220, container.clientHeight || 320);
      const renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      const scene = new window.THREE.Scene();
      scene.background = new window.THREE.Color(0x06111b);

      const camera = new window.THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
      camera.position.set(0, 80, 180);

      const ambient = new window.THREE.AmbientLight(0xffffff, 0.6);
      const directional = new window.THREE.DirectionalLight(0x88e2ff, 1.1);
      directional.position.set(40, 80, 120);
      scene.add(ambient, directional);

      const group = new window.THREE.Group();
      scene.add(group);
      group.add(new window.THREE.GridHelper(180, 12, 0x28445d, 0x123149));

      const center = {
        x: average(nodes.map((node) => node.x)),
        y: average(nodes.map((node) => node.y)),
        z: average(nodes.map((node) => node.z ?? 0))
      };
      const maxDelta = Math.max(...nodes.flatMap((node) => [
        Math.abs((node.x ?? 0) - center.x),
        Math.abs((node.y ?? 0) - center.y),
        Math.abs((node.z ?? 0) - center.z)
      ]), 1);
      const scale = 70 / maxDelta;
      const points = nodes.map((node) => new window.THREE.Vector3(
        ((node.x ?? 0) - center.x) * scale,
        ((node.z ?? 0) - center.z) * scale,
        ((node.y ?? 0) - center.y) * scale
      ));

      const geometry = new window.THREE.BufferGeometry().setFromPoints(points);
      const material = new window.THREE.LineBasicMaterial({ color: 0xff7c7c, linewidth: 2 });
      group.add(new window.THREE.Line(geometry, material));

      points.forEach((point, index) => {
        const sphere = new window.THREE.Mesh(
          new window.THREE.SphereGeometry(index === 0 || index === points.length - 1 ? 2.8 : 1.8, 18, 18),
          new window.THREE.MeshStandardMaterial({
            color: index === 0 ? 0x57d7a0 : index === points.length - 1 ? 0xffc86d : 0x59c9ff,
            emissive: index === 0 || index === points.length - 1 ? 0x214935 : 0x163042
          })
        );
        sphere.position.copy(point);
        group.add(sphere);
      });

      const animate = () => {
        group.rotation.y += 0.003;
        renderer.render(scene, camera);
        state.three.frameId = window.requestAnimationFrame(animate);
      };

      state.three.renderer = renderer;
      state.three.frameId = window.requestAnimationFrame(animate);
      return { drawnSegments: Math.max(points.length - 1, 0) };
    } catch (error) {
      console.error(error);
      return placeholder('3D ?뚮뜑??珥덇린??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
    }
  }

  function disposeThree() {
    if (state.three.frameId) {
      window.cancelAnimationFrame(state.three.frameId);
      state.three.frameId = 0;
    }
    if (state.three.renderer) {
      state.three.renderer.dispose();
      state.three.renderer = null;
    }
  }

  function renderDiagnostics() {
    dom.diagnosticRunAt.textContent = state.validationRunAt
      ? `${state.validationRunAt.toLocaleDateString()} ${state.validationRunAt.toLocaleTimeString()}`
      : '-';
    dom.diagPass.textContent = formatInt(state.diagnostics.pass);
    dom.diagWarn.textContent = formatInt(state.diagnostics.warn);
    dom.diagFail.textContent = formatInt(state.diagnostics.fail);
    dom.diagGraphIssues.textContent = formatInt(totalGraphIssues());

    const graphRows = [];
    graphRows.push(renderDiagnosticRow('graph', 'Missing Relation Targets', String(state.graph.issues.missingRelationTargets.length), state.graph.issues.missingRelationTargets.slice(0, 20).map((issue) => escapeHtml(`${issue.from} -> ${issue.to}`)).join('<br>') || '-'));
    graphRows.push(renderDiagnosticRow('graph', 'Asymmetric Relations', String(state.graph.issues.asymmetricRelations.length), state.graph.issues.asymmetricRelations.slice(0, 20).map((issue) => escapeHtml(`${issue.a} <-> ${issue.b} (missing ${issue.missing})`)).join('<br>') || '-'));
    graphRows.push(renderDiagnosticRow('graph', 'Disconnected Components', String(state.graph.issues.disconnectedComponents.length), state.graph.issues.disconnectedComponents.slice(0, 8).map((component, index) => escapeHtml(`Component ${index + 1}: ${component.slice(0, 12).join(', ')}`)).join('<br>') || '-'));
    dom.diagnosticGraphTable.innerHTML = graphRows.join('');

    const failingCables = state.cables
      .filter((cable) => (cable.validation?.status || 'PENDING') !== 'PASS')
      .slice(0, 250)
      .map((cable) => renderDiagnosticRow(
        'cable',
        cable.name,
        renderBadge(cable.validation?.status || 'PENDING'),
        (cable.validation?.issues || []).map((issue) => escapeHtml(issue.message)).join('<br>') || '?ъ궛異??꾩슂'
      ));

    dom.diagnosticCableTable.innerHTML = failingCables.length
      ? failingCables.join('')
      : '<div class="empty-state">?꾩옱 FAIL/WARN 耳?대툝???놁뒿?덈떎.</div>';
  }

  function renderDiagnosticRow(kind, key, middle, value) {
    return `
      <div class="diag-row ${kind}">
        <div class="diag-key">${escapeHtml(key)}</div>
        <div class="diag-value">${middle}</div>
        <div class="diag-value">${value}</div>
      </div>
    `;
  }

  function updateSystemFilterOptions() {

// --- END 30-nodes-and-maps.js ---

// --- BEGIN 40-auth-project-foundation.js ---
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

// --- END 40-auth-project-foundation.js ---

// --- BEGIN 50-import-export-bom-reports-utils.js ---
    renderSummary();
    renderGrid();
    renderSelectedCable();
    renderRoutingPanel();
    renderBomTab();
    renderDiagnostics();
    renderVersionComparison();
    applyAuthState();
  }

  async function handleProjectImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      showBusy('Project file import in progress...');
      const payload = await loadFilePayload(file);
      await applyProjectPayload(payload, {
        fileName: file.name,
        source: 'file',
        announce: false,
        statusMessage: 'PROJECT IMPORTED'
      });
      if (isWorkspaceAllowed()) {
        await persistProjectState({
          announce: false,
          reason: 'import',
          fileName: file.name
        });
      } else {
        state.project.dirty = true;
        updateProjectStatus('IMPORTED / UNSAVED');
      }
      pushToast('Project file imported.', 'success');
    } catch (error) {
      console.error(error);
      pushToast(`Project import failed: ${error.message}`, 'error');
    } finally {
      hideBusy();
      event.target.value = '';
    }
  }

  async function loadFilePayload(file) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') {
      const text = await file.text();
      return JSON.parse(text);
    }

    if (!window.XLSX) {
      throw new Error('XLSX library is not loaded.');
    }

    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: 'array' });
    return parseWorkbookPayload(workbook);
  }

  function parseWorkbookPayload(workbook) {
    const rawSheets = {};
    workbook.SheetNames.forEach((sheetName) => {
      rawSheets[sheetName] = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    });

    const cableRows = resolveWorkbookRows(rawSheets, ['Cables', 'Cable List', 'CableList', 'Cable_List'], looksLikeCableRows, true);
    const nodeRows = resolveWorkbookRows(rawSheets, ['Nodes', 'ProjectNodes', 'UploadedNodes', 'Node Info', 'NodeInfo'], looksLikeNodeRows, false);
    const metaRows = resolveWorkbookRows(rawSheets, ['ProjectMeta', 'Meta', 'Summary'], looksLikeMetaRows, false);

    return {
      workbook: true,
      sheetNames: workbook.SheetNames.slice(),
      sheets: {
        ...rawSheets,
        Cables: cableRows,
        Nodes: nodeRows
      },
      projectMeta: rowsToKeyValue(metaRows),
      cables: cableRows,
      nodes: nodeRows
    };
  }

  function resolveWorkbookRows(sheets, preferredNames, detector, fallbackToFirst = true) {
    const entries = Object.entries(sheets || {});
    if (!entries.length) return [];

    const preferred = preferredNames
      .map((name) => normalizeKey(name))
      .find((name) => entries.some(([sheetName]) => normalizeKey(sheetName) === name));
    if (preferred) {
      return entries.find(([sheetName]) => normalizeKey(sheetName) === preferred)?.[1] || [];
    }

    const detected = entries.find(([, rows]) => detector(rows));
    if (detected) {
      return detected[1];
    }

    return fallbackToFirst ? (entries[0][1] || []) : [];
  }

  function looksLikeCableRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return false;
    const lookup = createNormalizedLookup(rows[0]);
    return hasAnyAlias(lookup, CABLE_ALIASES.name) ||
      (hasAnyAlias(lookup, CABLE_ALIASES.fromNode) && hasAnyAlias(lookup, CABLE_ALIASES.toNode));
  }

  function looksLikeNodeRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return false;
    const lookup = createNormalizedLookup(rows[0]);
    return hasAnyAlias(lookup, NODE_ALIASES.name) ||
      (hasAnyAlias(lookup, NODE_ALIASES.relations) && hasAnyAlias(lookup, NODE_ALIASES.linkLength));
  }

  function looksLikeMetaRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return false;
    const keys = Object.keys(rows[0] || {}).map((key) => normalizeKey(key));
    return keys.includes('key') && keys.includes('value');
  }

  function rowsToKeyValue(rows) {
    const meta = {};
    (rows || []).forEach((row) => {
      const key = trimText(row.KEY || row.Key || row.key || row.FIELD || row.Field || row.field);
      if (!key) return;
      meta[key] = row.VALUE ?? row.Value ?? row.value ?? '';
    });
    return meta;
  }

  function hasAnyAlias(lookup, aliases) {
    return aliases.some((alias) => lookup.has(normalizeKey(alias)));
  }

  function extractCablesFromPayload(payload) {
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.cables)
        ? payload.cables
        : payload?.sheets
          ? resolveWorkbookRows(payload.sheets, ['Cables', 'Cable List', 'CableList', 'Cable_List'], looksLikeCableRows, true)
          : [];

    return rows
      .map((row, index) => normalizeCableRecord(row, index))
      .filter((cable) => cable.name);
  }

  function extractNodesFromPayload(payload) {
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.nodes)
        ? payload.nodes
        : payload?.sheets
          ? resolveWorkbookRows(payload.sheets, ['Nodes', 'ProjectNodes', 'UploadedNodes', 'Node Info', 'NodeInfo'], looksLikeNodeRows, false)
          : [];

    return rows
      .map((row, index) => normalizeNodeRecord(row, 'uploaded', index))
      .filter((node) => node.name);
  }

  function exportProjectJson() {
    const payload = buildProjectPayload();
    const projectId = normalizeProjectId(payload.projectMeta?.projectId || state.project.projectId || 'current');
    downloadFile(`seastar-cms-v3-project-${projectId}-${timestampToken()}.json`, JSON.stringify(payload, null, 2), 'application/json');
    pushToast('Project JSON exported.', 'success');
  }

  function exportProjectWorkbook() {
    if (!window.XLSX) {
      pushToast('XLSX library is not loaded.', 'warn');
      return;
    }

    refreshNodeAnalytics();
    const reportPack = buildReportPack();
    const allCableRows = state.cables.map((cable) => createCableWorkbookRow(cable));
    const nodeRows = state.uploadedNodes.map((node) => createNodeWorkbookRow(node));
    const graphRows = state.mergedNodes.map((node) => createNodeWorkbookRow(node));
    const validationRows = state.cables.map((cable) => ({
      CABLE_NAME: cable.name,
      VALIDATION_STATUS: cable.validation?.status || 'PENDING',
      MAP_STATUS: cable.validation?.mapStatus || 'UNCHECKED',
      DECLARED_PATH_MATCH: cable.validation?.declaredPathMatch == null ? '' : cable.validation.declaredPathMatch,
      LENGTH_MATCHED: Boolean(cable.validation?.lengthMatched),
      MAP_SEGMENTS_MATCH: Boolean(cable.validation?.mapSegmentsMatch),
      ISSUES: (cable.validation?.issues || []).map((issue) => `[${issue.severity}] ${issue.message}`).join(' | ')
    }));
    const bomRows = buildBomRows({ ignoreFilters: true, groupBy: 'SYSTEM_TYPE_DECK' }).map((row) => createBomWorkbookRow(row));
    const metaRows = [
      { KEY: 'version', VALUE: 'seastar-cms-v3' },
      { KEY: 'exportedAt', VALUE: new Date().toISOString() },
      { KEY: 'projectId', VALUE: normalizeProjectId(state.project.projectId || 'current') },
      { KEY: 'projectName', VALUE: state.project.projectName || defaultProjectName(getProjectGroupCode(), state.project.fileName) },
      { KEY: 'groupCode', VALUE: getProjectGroupCode() },
      { KEY: 'projectSource', VALUE: state.project.source || 'memory' },
      { KEY: 'projectLastSavedAt', VALUE: state.project.lastSavedAt || '' },
      { KEY: 'cableCount', VALUE: state.cables.length },
      { KEY: 'uploadedNodeCount', VALUE: state.uploadedNodes.length },
      { KEY: 'mergedNodeCount', VALUE: state.mergedNodes.length },
      { KEY: 'bomMarginPct', VALUE: state.bom.marginPct }
    ];
    const comparisonRows = VERSION_COMPARISON_ROWS.map((row) => ({
      VERSION: row.version,
      STRENGTHS: row.strengths,
      LIMITATIONS: row.gaps,
      V3_RESOLUTION: row.v3Delta
    }));

    const workbook = window.XLSX.utils.book_new();
    appendSheet(workbook, 'ProjectMeta', metaRows);
    appendSheet(workbook, 'Cables', allCableRows);
    appendSheet(workbook, 'Nodes', nodeRows);
    appendSheet(workbook, 'GraphNodes', graphRows);
    appendSheet(workbook, 'ValidationDetails', validationRows);
    appendSheet(workbook, 'BOM', bomRows);
    appendSheet(workbook, 'ReportSystems', toReportSystemSheetRows(reportPack.systemRows));
    appendSheet(workbook, 'ReportTypes', toReportTypeSheetRows(reportPack.typeRows));
    appendSheet(workbook, 'ReportHotspots', toReportHotspotSheetRows(reportPack.hotspotRows));
    appendSheet(workbook, 'ReportValidation', toReportValidationSheetRows(reportPack.validationRows));
    appendSheet(workbook, 'ReportDrums', toReportDrumSheetRows(reportPack.drumRows));
    appendSheet(workbook, 'VersionComparison', comparisonRows);
    window.XLSX.writeFile(workbook, `seastar-cms-v3-${timestampToken()}.xlsx`);
    pushToast('Project workbook exported.', 'success');
  }

  function appendSheet(workbook, sheetName, rows) {
    const safeRows = Array.isArray(rows) && rows.length ? rows : [{ EMPTY: '' }];
    window.XLSX.utils.book_append_sheet(workbook, window.XLSX.utils.json_to_sheet(safeRows), sheetName);
  }

  function createCableWorkbookRow(cable) {
    const prepared = prepareCableForBom(cable);
    return {
      CABLE_SYSTEM: cable.system,
      WD_PAGE: cable.wdPage,
      CABLE_NAME: cable.name,
      CABLE_TYPE: cable.type,
      FROM_ROOM: cable.fromRoom,
      FROM_EQUIP: cable.fromEquip,
      FROM_NODE: cable.fromNode,
      FROM_REST: cable.fromRest,
      TO_ROOM: cable.toRoom,
      TO_EQUIP: cable.toEquip,
      TO_NODE: cable.toNode,
      TO_REST: cable.toRest,
      POR_LENGTH: cable.length,
      CABLE_PATH: cable.path,
      CABLE_OUTDIA: cable.outDia,
      CHECK_NODE: cable.checkNode,
      SUPPLY_DECK: cable.supplyDeck || prepared.deck,
      POR_WEIGHT: cable.porWeight,
      INTERFERENCE: cable.interference,
      REMARK: cable.remark,
      REMARK1: cable.remark1,
      REMARK2: cable.remark2,
      REMARK3: cable.remark3,
      REVISION: cable.revision,
      CABLE_WEIGHT: cable.cableWeight,
      CABLE_ID: cable.id,
      TYPE: cable.type,
      SYSTEM: cable.system,
      DECK: prepared.deck,
      BASE_LENGTH: cable.length,
      GRAPH_LENGTH: prepared.graphLength,
      TOTAL_LENGTH: prepared.requiredLength,
      OUT_DIA: cable.outDia,
      ORIGINAL_PATH: cable.path,
      CALCULATED_PATH: cable.calculatedPath,
      PATH_NODE_COUNT: cable.routeBreakdown?.pathNodes?.length || 0,
      SEGMENT_LENGTHS: (cable.routeBreakdown?.segmentLengths || []).join(', '),
      WAYPOINT_SEGMENTS: (cable.routeBreakdown?.waypointSegments || []).map((segment) => `${segment.from}->${segment.to}:${formatNumber(segment.length)}`).join(' | '),
      VALIDATION_STATUS: cable.validation?.status || 'PENDING',
      VALIDATION_ISSUES: (cable.validation?.issues || []).map((issue) => `[${issue.severity}] ${issue.message}`).join(' | '),
      MAP_STATUS: cable.validation?.mapStatus || 'UNCHECKED'
    };
  }

  function createNodeWorkbookRow(node) {
    const metric = state.nodeMetricMap[node.name] || null;
    const cableList = metric?.cables?.map((cable) => cable.name).join(', ') || '';
    const maxCable = metric?.cables?.[0]?.name || '';
    return {
      NODE_RNAME: node.name,
      STRUCTURE_NAME: node.structure,
      COMPONENT: node.component,
      NODE_TYPE: node.type,
      CABLE_LIST: cableList,
      RELATION: (node.relations || []).join(', '),
      LINK_LENGTH: node.linkLength,
      AREA_SIZE: node.areaSize,
      MAX_CABLE: maxCable,
      NODE_CABLE_COUNT: metric?.cableCount || 0,
      TOTAL_OUTDIA: metric?.totalOutDia || 0,
      TRAY_WIDTH: metric?.recommendedTrayWidth || 0,
      TRAY_FILL_RATIO: metric?.fillRatio || 0,
      NODE_SYSTEMS: metric?.systemsLabel || '',
      NODE_DECKS: metric?.decksLabel || '',
      POINT: node.pointRaw || buildPointText(node),
      NODE_NAME: node.name,
      STRUCTURE: node.structure,
      TYPE: node.type,
      RELATIONS: (node.relations || []).join(', '),
      X: node.x,
      Y: node.y,
      Z: node.z,
      HAS_COORDS: Boolean(node.hasCoords),
      SOURCE: node.source
    };
  }

  function createBomWorkbookRow(row) {
    return {
      GROUP_BY: row.groupBy,
      SYSTEM: row.system,
      TYPE: row.type,
      DECK: row.deck,
      CABLES: row.cableCount,
      BASE_LENGTH: row.baseLength,
      GRAPH_LENGTH: row.graphLength,
      REST_LENGTH: row.restLength,
      REQUIRED_LENGTH: row.requiredLength,
      MARGIN_LENGTH: row.marginLength,
      TOTAL_WITH_MARGIN: row.totalWithMargin,
      STATUS: row.statusSummary,
      POS: row.pos
    };
  }

  function renderBomTab() {
    if (!dom.bomTable) return;

    state.bom.marginPct = Math.max(0, toNumber(dom.bomMargin?.value, state.bom.marginPct || 10));
    if (dom.bomMargin && dom.bomMargin.value === '') {
      dom.bomMargin.value = String(state.bom.marginPct);
    }

    const prepared = state.cables.map((cable) => prepareCableForBom(cable));
    syncBomFilterOptions(prepared);

    const rows = buildBomRows();
    state.bom.rows = rows;
    dom.bomDeckRule.textContent = `Default deck mapping: ${DEFAULT_DECK_RULES.map((rule) => `${rule.prefix}=${rule.label}`).join(' | ')}. Fallback uses room, structure, and node prefixes.`;
    dom.bomGroupCount.textContent = formatInt(rows.length);
    dom.bomCableCount.textContent = formatInt(rows.reduce((sum, row) => sum + row.cableCount, 0));
    dom.bomRequiredLength.textContent = formatNumber(rows.reduce((sum, row) => sum + row.requiredLength, 0));
    dom.bomTotalLength.textContent = formatNumber(rows.reduce((sum, row) => sum + row.totalWithMargin, 0));

    if (!rows.length) {
      dom.bomTable.innerHTML = '<div class="empty-state">No BOM rows match the current system/type/deck filters.</div>';
      return;
    }

    const header = `
      <div class="diag-row bom">
        <div class="diag-key">SYSTEM</div>
        <div class="diag-key">TYPE</div>
        <div class="diag-key">DECK</div>
        <div class="diag-key">CABLES</div>
        <div class="diag-key">BASE</div>
        <div class="diag-key">GRAPH</div>
        <div class="diag-key">REST</div>
        <div class="diag-key">REQ</div>
        <div class="diag-key">MARGIN</div>
        <div class="diag-key">TOTAL</div>
        <div class="diag-key">STATUS</div>
        <div class="diag-key">POS</div>
      </div>
    `;
    dom.bomTable.innerHTML = header + rows.map((row) => `
      <div class="diag-row bom">
        <div class="diag-value">${escapeHtml(row.system)}</div>
        <div class="diag-value">${escapeHtml(row.type)}</div>
        <div class="diag-value">${escapeHtml(row.deck)}</div>
        <div class="diag-value">${formatInt(row.cableCount)}</div>
        <div class="diag-value">${formatNumber(row.baseLength)}</div>
        <div class="diag-value">${formatNumber(row.graphLength)}</div>
        <div class="diag-value">${formatNumber(row.restLength)}</div>
        <div class="diag-value">${formatNumber(row.requiredLength)}</div>
        <div class="diag-value">${formatNumber(row.marginLength)}</div>
        <div class="diag-value">${formatNumber(row.totalWithMargin)}</div>
        <div class="diag-value"><span class="bom-pill">${escapeHtml(row.statusSummary)}</span></div>
        <div class="diag-value"><input class="bom-pos-input" data-bom-pos="${escapeHtml(row.key)}" value="${escapeHtml(row.pos)}" placeholder="POS"></div>
      </div>
    `).join('');
  }

  function syncBomFilterOptions(preparedCables) {
    syncBomSelect(dom.bomSystemFilter, unique(preparedCables.map((cable) => cable.system).filter(Boolean)).sort());
    syncBomSelect(dom.bomTypeFilter, unique(preparedCables.map((cable) => cable.type).filter(Boolean)).sort());
    syncBomSelect(dom.bomDeckFilter, unique(preparedCables.map((cable) => cable.deck).filter(Boolean)).sort());
  }

  function syncBomSelect(select, values) {
    if (!select) return;
    const selected = select.value || 'ALL';
    select.innerHTML = ['<option value="ALL">ALL</option>']
      .concat(values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
      .join('');
    select.value = values.includes(selected) ? selected : 'ALL';
  }

  function buildBomRows(options = {}) {
    const groupBy = options.groupBy || dom.bomGroupBy?.value || 'SYSTEM_TYPE_DECK';
    const dimensions = BOM_GROUP_PRESETS[groupBy] || BOM_GROUP_PRESETS.SYSTEM_TYPE_DECK;
    const cables = getBomPreparedCableRows(options);
    const rows = new Map();

    cables.forEach((cable) => {
      const key = dimensions.map((dimension) => cable[dimension] || 'UNASSIGNED').join('||');
      if (!rows.has(key)) {
        rows.set(key, {
          key,
          groupBy,
          system: dimensions.includes('system') ? cable.system : 'ALL',
          type: dimensions.includes('type') ? cable.type : 'ALL',
          deck: dimensions.includes('deck') ? cable.deck : 'ALL',
          cableCount: 0,
          baseLength: 0,
          graphLength: 0,
          restLength: 0,
          requiredLength: 0,
          passCount: 0,
          warnCount: 0,
          failCount: 0
        });
      }

      const row = rows.get(key);
      row.cableCount += 1;
      row.baseLength = round2(row.baseLength + cable.length);
      row.graphLength = round2(row.graphLength + cable.graphLength);
      row.restLength = round2(row.restLength + cable.restLength);
      row.requiredLength = round2(row.requiredLength + cable.requiredLength);
      if (cable.validationStatus === 'PASS') row.passCount += 1;
      else if (cable.validationStatus === 'WARN') row.warnCount += 1;
      else if (cable.validationStatus === 'FAIL') row.failCount += 1;
    });

    return Array.from(rows.values())
      .map((row) => {
        row.marginLength = round2(row.requiredLength * (state.bom.marginPct / 100));
        row.totalWithMargin = round2(row.requiredLength + row.marginLength);
        row.statusSummary = `P:${row.passCount} W:${row.warnCount} F:${row.failCount}`;
        row.pos = state.bom.posMap[row.key] || '';
        return row;
      })
      .sort((left, right) =>
        left.system.localeCompare(right.system) ||
        left.type.localeCompare(right.type) ||
        left.deck.localeCompare(right.deck)
      );
  }

  function getBomPreparedCableRows(options = {}) {
    const ignoreFilters = Boolean(options.ignoreFilters);
    const search = ignoreFilters ? '' : trimText(dom.bomSearch?.value).toLowerCase();
    const systemFilter = ignoreFilters ? 'ALL' : (dom.bomSystemFilter?.value || 'ALL');
    const typeFilter = ignoreFilters ? 'ALL' : (dom.bomTypeFilter?.value || 'ALL');
    const deckFilter = ignoreFilters ? 'ALL' : (dom.bomDeckFilter?.value || 'ALL');

    return state.cables
      .map((cable) => prepareCableForBom(cable))
      .filter((cable) => {
        if (systemFilter !== 'ALL' && cable.system !== systemFilter) return false;
        if (typeFilter !== 'ALL' && cable.type !== typeFilter) return false;
        if (deckFilter !== 'ALL' && cable.deck !== deckFilter) return false;
        if (!search) return true;
        return [cable.name, cable.system, cable.type, cable.deck, cable.fromNode, cable.toNode]
          .join(' ')
          .toLowerCase()
          .includes(search);
      });
  }

  function prepareCableForBom(cable) {
    const route = cable.routeBreakdown;
    const graphLength = round2(route?.graphLength || 0);
    const restLength = round2(toNumber(cable.fromRest, 0) + toNumber(cable.toRest, 0));
    const requiredLength = round2(cable.calculatedLength || route?.totalLength || graphLength + restLength);
    const deck = resolveCableDeck(cable);
    return {
      ...cable,
      system: trimText(cable.system) || 'UNASSIGNED',
      type: trimText(cable.type) || 'UNASSIGNED',
      deck: trimText(deck) || 'UNASSIGNED',
      graphLength,
      restLength,
      requiredLength,
      validationStatus: cable.validation?.status || 'PENDING'
    };
  }

  function resolveCableDeck(cable) {
    const explicitDeck = normalizeDeckCode(cable.supplyDeck);
    if (explicitDeck) {
      return explicitDeck;
    }

    const nodeFrom = state.graph.nodeMap[cable.fromNode] || null;
    const nodeTo = state.graph.nodeMap[cable.toNode] || null;
    const candidates = [
      inferDeckFromNodeName(cable.fromNode),
      inferDeckFromText(cable.fromRoom),
      inferDeckFromText(nodeFrom?.structure),
      inferDeckFromNodeName(cable.toNode),
      inferDeckFromText(cable.toRoom),
      inferDeckFromText(nodeTo?.structure)
    ].filter(Boolean);

    if (!candidates.length) {
      return 'UNASSIGNED';
    }

    const codes = unique(candidates.map((candidate) => candidate.code).filter(Boolean));
    return codes.length === 1 ? codes[0] : codes.join(' -> ');
  }

  function inferDeckFromNodeName(nodeName) {
    const text = trimText(nodeName).toUpperCase();
    if (!text) return null;
    const prefix = text.slice(0, 2);
    const rule = DEFAULT_DECK_RULES.find((item) => item.prefix === prefix);
    return rule ? { code: rule.prefix, label: rule.label } : null;
  }

  function inferDeckFromText(value) {
    const text = trimText(value).toUpperCase();
    if (!text) return null;

    const rule = DEFAULT_DECK_RULES.find((item) => text.startsWith(item.prefix) || text.includes(` ${item.prefix}`));
    if (rule) {
      return { code: rule.prefix, label: rule.label };
    }

    const deckMatch = text.match(/\b(?:DECK|DK)\s*([A-Z0-9-]+)/);
    if (deckMatch) {
      return { code: `DK-${deckMatch[1]}`, label: `Deck ${deckMatch[1]}` };
    }

    return null;
  }

  function normalizeDeckCode(value) {
    const text = trimText(value).toUpperCase();
    if (!text) return '';
    const directRule = DEFAULT_DECK_RULES.find((item) => item.prefix === text);
    if (directRule) return directRule.prefix;
    const prefixedRule = DEFAULT_DECK_RULES.find((item) => text.startsWith(item.prefix));
    if (prefixedRule) return prefixedRule.prefix;
    return text;
  }

  function handleBomTableInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const key = target.dataset.bomPos;
    if (!key) return;
    state.bom.posMap[key] = target.value;
    state.project.dirty = true;
    updateProjectStatus('BOM POS UPDATED');
  }

  function generateBomPos() {
    const rows = state.bom.rows.length ? state.bom.rows : buildBomRows();
    rows.forEach((row, index) => {
      state.bom.posMap[row.key] = `P-${String(index + 1).padStart(3, '0')}`;
    });
    state.project.dirty = true;
    renderBomTab();
    commitHistory('bom-pos-generate');
    pushToast('BOM POS generated.', 'success');
  }

  function exportBomWorkbook() {
    if (!window.XLSX) {
      pushToast('XLSX library is not loaded.', 'warn');
      return;
    }

    const rows = buildBomRows();
    const cableRows = getBomPreparedCableRows().map((cable) => createCableWorkbookRow(cable));
    const workbook = window.XLSX.utils.book_new();
    appendSheet(workbook, 'BOM', rows.map((row) => createBomWorkbookRow(row)));
    appendSheet(workbook, 'BOM_Cables', cableRows);
    window.XLSX.writeFile(workbook, `seastar-bom-${timestampToken()}.xlsx`);
    pushToast('BOM workbook exported.', 'success');
  }

  function getHistorySignature(payload) {
    const meta = payload?.projectMeta || {};
    return JSON.stringify({
      projectMeta: {
        projectId: normalizeProjectId(meta.projectId || 'current'),
        projectName: trimText(meta.projectName),
        groupCode: getProjectGroupCode(meta.groupCode),
        source: trimText(meta.source || 'memory')
      },
      bom: {
        marginPct: round2(payload?.bom?.marginPct || 0),
        posMap: payload?.bom?.posMap || {}
      },
      reports: {
        drumLength: Math.max(10, toNumber(payload?.reports?.drumLength, 500))
      },
      cables: payload?.cables || [],
      nodes: payload?.nodes || []
    });
  }

  function commitHistory(reason = 'snapshot') {
    if (state.history.suspended) return false;
    const payload = buildProjectPayload();
    const signature = getHistorySignature(payload);
    const current = state.history.entries[state.history.index];
    if (current && current.signature === signature) {
      current.reason = reason || current.reason;
      updateHistoryControls();
      return false;
    }

    let entries = state.history.entries.slice(0, state.history.index + 1);
    entries.push({
      reason: reason || 'snapshot',
      createdAt: new Date().toISOString(),
      payload: structuredCloneCompatible(payload),
      signature
    });

    if (entries.length > state.history.limit) {
      entries = entries.slice(entries.length - state.history.limit);
    }

    state.history.entries = entries;
    state.history.index = entries.length - 1;
    updateHistoryControls();
    return true;
  }

  function updateHistoryControls() {
    if (dom.undoBtn) {
      dom.undoBtn.disabled = state.history.index <= 0;
    }
    if (dom.redoBtn) {
      dom.redoBtn.disabled = state.history.index < 0 || state.history.index >= state.history.entries.length - 1;
    }
    if (dom.historyStatus) {
      const total = state.history.entries.length;
      const current = total ? state.history.index + 1 : 0;
      const label = total ? (state.history.entries[state.history.index]?.reason || 'snapshot') : 'EMPTY';
      dom.historyStatus.textContent = `HISTORY: ${current} / ${total} | ${String(label).toUpperCase()}`;
    }
  }

  async function restoreHistoryStep(direction) {
    const nextIndex = state.history.index + direction;
    if (nextIndex < 0 || nextIndex >= state.history.entries.length) {
      pushToast('No history snapshot is available for that direction.', 'warn');
      return;
    }

    const entry = state.history.entries[nextIndex];
    state.history.suspended = true;
    try {
      await applyProjectPayload(structuredCloneCompatible(entry.payload), {
        source: 'history',
        announce: false,
        skipHistory: true,
        statusMessage: direction < 0 ? 'UNDO RESTORED' : 'REDO RESTORED',
        lastSavedAt: entry.payload?.projectMeta?.lastSavedAt || '',
        fileName: entry.payload?.projectMeta?.projectName || state.project.fileName
      });
      state.history.index = nextIndex;
      state.project.dirty = true;
      updateProjectStatus(direction < 0 ? 'UNDO RESTORED' : 'REDO RESTORED');
      renderAll();
      pushToast(`${direction < 0 ? 'Undo' : 'Redo'} restored: ${entry.reason || 'snapshot'}`, 'success');
    } finally {
      state.history.suspended = false;
      updateHistoryControls();
    }
  }

  function buildReportPack() {
    refreshNodeAnalytics();
    const prepared = state.cables.map((cable) => prepareCableForBom(cable));
    const systemRows = buildReportSystemRows(prepared);
    const typeRows = buildReportTypeRows(prepared);
    const hotspotRows = buildReportHotspotRows();
    const validationRows = buildReportValidationRows();
    const drumRows = buildReportDrumRows(prepared);
    const guideRows = buildReportGuideRows();
    return {
      systemRows,
      typeRows,
      hotspotRows,
      validationRows,
      drumRows,
      guideRows,
      systemCount: unique(prepared.map((row) => row.system).filter(Boolean)).length,
      typeCount: unique(prepared.map((row) => row.type).filter(Boolean)).length,
      deckCount: unique(prepared.map((row) => row.deck).filter(Boolean)).length,
      drumCount: drumRows.reduce((sum, row) => sum + row.drumCount, 0),
      failCount: validationRows.filter((row) => row.status === 'FAIL').length,
      warnCount: validationRows.filter((row) => row.status === 'WARN').length
    };
  }

  function buildReportSystemRows(preparedRows) {
    const rows = new Map();
    preparedRows.forEach((row) => {
      const key = row.system || 'UNASSIGNED';
      if (!rows.has(key)) {
        rows.set(key, {
          system: key,
          cableCount: 0,
          baseLength: 0,
          graphLength: 0,
          requiredLength: 0,
          passCount: 0,
          warnCount: 0,
          failCount: 0,
          types: new Set(),
          decks: new Set(),
          totalOutDia: 0
        });
      }
      const target = rows.get(key);
      target.cableCount += 1;
      target.baseLength = round2(target.baseLength + row.length);
      target.graphLength = round2(target.graphLength + row.graphLength);
      target.requiredLength = round2(target.requiredLength + row.requiredLength);
      target.totalOutDia = round2(target.totalOutDia + toNumber(row.outDia, 0));
      target.types.add(row.type || 'UNASSIGNED');
      target.decks.add(row.deck || 'UNASSIGNED');
      if (row.validationStatus === 'PASS') target.passCount += 1;
      else if (row.validationStatus === 'WARN') target.warnCount += 1;
      else if (row.validationStatus === 'FAIL') target.failCount += 1;
    });
    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        typeCoverage: row.types.size,
        deckCoverage: row.decks.size,
        avgOutDia: row.cableCount ? round2(row.totalOutDia / row.cableCount) : 0
      }))
      .sort((left, right) => right.requiredLength - left.requiredLength || right.cableCount - left.cableCount || left.system.localeCompare(right.system));
  }

  function buildReportTypeRows(preparedRows) {
    const rows = new Map();
    preparedRows.forEach((row) => {
      const key = row.type || 'UNASSIGNED';
      if (!rows.has(key)) {
        rows.set(key, {
          type: key,
          cableCount: 0,
          requiredLength: 0,
          graphLength: 0,
          systems: new Set(),
          decks: new Set(),
          totalOutDia: 0
        });
      }
      const target = rows.get(key);
      target.cableCount += 1;
      target.requiredLength = round2(target.requiredLength + row.requiredLength);
      target.graphLength = round2(target.graphLength + row.graphLength);
      target.totalOutDia = round2(target.totalOutDia + toNumber(row.outDia, 0));
      target.systems.add(row.system || 'UNASSIGNED');
      target.decks.add(row.deck || 'UNASSIGNED');
    });
    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        avgOutDia: row.cableCount ? round2(row.totalOutDia / row.cableCount) : 0,
        systemCoverage: row.systems.size,
        deckCoverage: row.decks.size
      }))
      .sort((left, right) => right.requiredLength - left.requiredLength || left.type.localeCompare(right.type));
  }

  function buildReportHotspotRows() {
    return state.nodeMetrics
      .slice()
      .sort((left, right) =>
        right.recommendedTrayWidth - left.recommendedTrayWidth ||
        right.fillRatio - left.fillRatio ||
        right.cableCount - left.cableCount ||
        left.name.localeCompare(right.name)
      )
      .slice(0, 20)
      .map((metric) => ({
        node: metric.name,
        trayWidth: metric.recommendedTrayWidth,
        fillRatio: metric.fillRatio,
        cableCount: metric.cableCount,
        systems: metric.systemsLabel,
        decks: metric.decksLabel,
        coordStatus: metric.hasCoords ? 'READY' : 'COORD MISSING'
      }));
  }

  function buildReportValidationRows() {
    return state.cables
      .map((cable) => ({
        name: cable.name,
        system: trimText(cable.system) || 'UNASSIGNED',
        fromTo: `${trimText(cable.fromNode) || '-'} -> ${trimText(cable.toNode) || '-'}`,
        status: cable.validation?.status || 'PENDING',
        mapStatus: cable.validation?.mapStatus || 'UNCHECKED',
        issues: (cable.validation?.issues || []).map((issue) => issue.message).join(' | ') || 'Needs validation'
      }))
      .filter((row) => row.status !== 'PASS')
      .sort((left, right) =>
        reportStatusScore(right.status) - reportStatusScore(left.status) ||
        left.system.localeCompare(right.system) ||
        left.name.localeCompare(right.name)
      )
      .slice(0, 40);
  }

  function buildReportDrumRows(preparedRows) {
    const drumLength = Math.max(10, toNumber(state.reports.drumLength, 500));
    const rows = new Map();
    preparedRows.forEach((row) => {
      const key = `${row.system}||${row.type}`;
      if (!rows.has(key)) {
        rows.set(key, {
          system: row.system,
          type: row.type,
          cableCount: 0,
          requiredLength: 0,
          passCount: 0,
          warnCount: 0,
          failCount: 0
        });
      }
      const target = rows.get(key);
      target.cableCount += 1;
      target.requiredLength = round2(target.requiredLength + row.requiredLength);
      if (row.validationStatus === 'PASS') target.passCount += 1;
      else if (row.validationStatus === 'WARN') target.warnCount += 1;
      else if (row.validationStatus === 'FAIL') target.failCount += 1;
    });
    return Array.from(rows.values())
      .map((row) => {
        const drumCount = row.requiredLength > 0 ? Math.ceil(row.requiredLength / drumLength) : 0;
        const lastDrumLength = drumCount > 0 ? round2(row.requiredLength - (Math.max(drumCount - 1, 0) * drumLength)) : 0;
        return {
          ...row,
          drumLength,
          drumCount,
          lastDrumLength,
          statusSummary: `P:${row.passCount} W:${row.warnCount} F:${row.failCount}`
        };
      })
      .sort((left, right) => right.requiredLength - left.requiredLength || left.system.localeCompare(right.system) || left.type.localeCompare(right.type));
  }

  function buildReportGuideRows() {
    const guide = [
      { severity: 'success', message: 'v3 now keeps the sticky editor, exact route engine, triple validation, and synchronized 2D/3D mapping as the main baseline.' },
      { severity: 'info', message: 'v8 and v9 style operational reporting is consolidated into the new Reports tab for system health, tray hotspots, and drum planning.' },
      { severity: 'info', message: 'History snapshots now let you undo and redo major project changes such as route-all, cable edits, duplication, deletion, and project loads.' },
      { severity: 'warn', message: 'Live Google and Naver production sign-in still depends on a deployed auth worker with valid Cloudflare and OAuth secrets.' }
    ];
    VERSION_COMPARISON_ROWS.forEach((row) => {
      guide.push({
        severity: row.version === 'v3 current' ? 'success' : 'info',
        message: `${row.version}: ${row.v3Delta}`
      });
    });
    return guide;
  }

  function reportStatusScore(status) {
    if (status === 'FAIL') return 3;
    if (status === 'WARN') return 2;
    if (status === 'PENDING') return 1;
    return 0;
  }

  function renderReportTable(variant, headers, rows) {
    if (!rows.length) {
      return '<div class="empty-state">No report rows available.</div>';
    }
    const renderRow = (cells, header = false) => `
      <div class="diag-row report-${variant}">
        ${cells.map((cell) => `<div class="${header ? 'diag-key' : 'diag-value'}">${cell}</div>`).join('')}
      </div>
    `;
    return renderRow(headers.map((label) => escapeHtml(label)), true) + rows.map((cells) => renderRow(cells)).join('');
  }

  function renderReportsTab() {
    if (!dom.reportSystemTable) return;
    state.reports.drumLength = Math.max(10, toNumber(dom.reportDrumLength?.value, state.reports.drumLength || 500));
    if (dom.reportDrumLength) {
      dom.reportDrumLength.value = String(state.reports.drumLength);
    }

    const pack = buildReportPack();
    state.reports.lastRenderedAt = new Date().toISOString();
    dom.reportSnapshotAt.textContent = `UPDATED: ${formatDateTime(state.reports.lastRenderedAt)}`;
    dom.reportSystemCount.textContent = formatInt(pack.systemCount);
    dom.reportTypeCount.textContent = formatInt(pack.typeCount);
    dom.reportDeckCount.textContent = formatInt(pack.deckCount);
    dom.reportDrumCount.textContent = formatInt(pack.drumCount);
    dom.reportFailWatchCount.textContent = `${formatInt(pack.failCount)} / ${formatInt(pack.warnCount)}`;

    dom.reportSystemTable.innerHTML = renderReportTable('system',
      ['SYSTEM', 'CABLES', 'REQUIRED', 'GRAPH', 'PASS', 'WARN', 'FAIL', 'TYPE/DECK', 'AVG OD'],
      pack.systemRows.map((row) => [
        escapeHtml(row.system),
        escapeHtml(formatInt(row.cableCount)),
        escapeHtml(formatNumber(row.requiredLength)),
        escapeHtml(formatNumber(row.graphLength)),
        escapeHtml(formatInt(row.passCount)),
        escapeHtml(formatInt(row.warnCount)),
        escapeHtml(formatInt(row.failCount)),
        escapeHtml(`${formatInt(row.typeCoverage)} / ${formatInt(row.deckCoverage)}`),
        escapeHtml(formatNumber(row.avgOutDia))
      ])
    );

    dom.reportTypeTable.innerHTML = renderReportTable('type',
      ['TYPE', 'CABLES', 'REQUIRED', 'GRAPH', 'SYSTEMS', 'DECKS', 'AVG OD'],
      pack.typeRows.map((row) => [
        escapeHtml(row.type),
        escapeHtml(formatInt(row.cableCount)),
        escapeHtml(formatNumber(row.requiredLength)),
        escapeHtml(formatNumber(row.graphLength)),
        escapeHtml(formatInt(row.systemCoverage)),
        escapeHtml(formatInt(row.deckCoverage)),
        escapeHtml(formatNumber(row.avgOutDia))
      ])
    );

    dom.reportHotspotTable.innerHTML = renderReportTable('hotspot',
      ['NODE', 'TRAY', 'FILL %', 'CABLES', 'SYSTEMS', 'DECKS', 'MAP'],
      pack.hotspotRows.map((row) => [
        escapeHtml(row.node),
        escapeHtml(formatInt(row.trayWidth)),
        escapeHtml(formatNumber(row.fillRatio)),
        escapeHtml(formatInt(row.cableCount)),
        escapeHtml(truncate(row.systems, 48)),
        escapeHtml(truncate(row.decks, 48)),
        renderBadge(row.coordStatus)
      ])
    );

    dom.reportValidationTable.innerHTML = renderReportTable('validation',
      ['STATUS', 'MAP', 'CABLE', 'SYSTEM', 'FROM -> TO', 'ISSUES'],
      pack.validationRows.map((row) => [
        renderBadge(row.status),
        renderBadge(row.mapStatus),
        escapeHtml(row.name),
        escapeHtml(row.system),
        escapeHtml(row.fromTo),
        escapeHtml(truncate(row.issues, 140))
      ])
    );

    dom.reportDrumTable.innerHTML = renderReportTable('drum',
      ['SYSTEM', 'TYPE', 'CABLES', 'REQUIRED', 'DRUM LEN', 'DRUMS', 'LAST DRUM', 'STATUS'],
      pack.drumRows.map((row) => [
        escapeHtml(row.system),
        escapeHtml(row.type),
        escapeHtml(formatInt(row.cableCount)),
        escapeHtml(formatNumber(row.requiredLength)),
        escapeHtml(formatNumber(row.drumLength)),
        escapeHtml(formatInt(row.drumCount)),
        escapeHtml(formatNumber(row.lastDrumLength)),
        escapeHtml(row.statusSummary)
      ])
    );

    dom.reportUpgradeGuide.innerHTML = pack.guideRows.map((row) => renderIssueItem(row.severity, row.message)).join('');
  }

  function toReportSystemSheetRows(rows) {
    return rows.map((row) => ({
      SYSTEM: row.system,
      CABLES: row.cableCount,
      REQUIRED_LENGTH: row.requiredLength,
      GRAPH_LENGTH: row.graphLength,
      BASE_LENGTH: row.baseLength,
      PASS: row.passCount,
      WARN: row.warnCount,
      FAIL: row.failCount,
      TYPE_COVERAGE: row.typeCoverage,
      DECK_COVERAGE: row.deckCoverage,
      AVG_OUT_DIA: row.avgOutDia
    }));
  }

  function toReportTypeSheetRows(rows) {
    return rows.map((row) => ({
      TYPE: row.type,
      CABLES: row.cableCount,
      REQUIRED_LENGTH: row.requiredLength,
      GRAPH_LENGTH: row.graphLength,
      SYSTEM_COVERAGE: row.systemCoverage,
      DECK_COVERAGE: row.deckCoverage,
      AVG_OUT_DIA: row.avgOutDia
    }));
  }

  function toReportHotspotSheetRows(rows) {
    return rows.map((row) => ({
      NODE: row.node,
      TRAY_WIDTH: row.trayWidth,
      FILL_RATIO: row.fillRatio,
      CABLES: row.cableCount,
      SYSTEMS: row.systems,
      DECKS: row.decks,
      MAP_STATUS: row.coordStatus
    }));
  }

  function toReportValidationSheetRows(rows) {
    return rows.map((row) => ({
      STATUS: row.status,
      MAP_STATUS: row.mapStatus,
      CABLE: row.name,
      SYSTEM: row.system,
      FROM_TO: row.fromTo,
      ISSUES: row.issues
    }));
  }

  function toReportDrumSheetRows(rows) {
    return rows.map((row) => ({
      SYSTEM: row.system,
      TYPE: row.type,
      CABLES: row.cableCount,
      REQUIRED_LENGTH: row.requiredLength,
      DRUM_LENGTH: row.drumLength,
      DRUMS: row.drumCount,
      LAST_DRUM_LENGTH: row.lastDrumLength,
      STATUS: row.statusSummary
    }));
  }

  function exportReportsWorkbook() {
    if (!window.XLSX) {
      pushToast('XLSX library is not loaded.', 'warn');
      return;
    }

    const pack = buildReportPack();
    const workbook = window.XLSX.utils.book_new();
    appendSheet(workbook, 'SystemHealth', toReportSystemSheetRows(pack.systemRows));
    appendSheet(workbook, 'TypeSummary', toReportTypeSheetRows(pack.typeRows));
    appendSheet(workbook, 'TrayHotspots', toReportHotspotSheetRows(pack.hotspotRows));
    appendSheet(workbook, 'ValidationWatch', toReportValidationSheetRows(pack.validationRows));
    appendSheet(workbook, 'DrumPlan', toReportDrumSheetRows(pack.drumRows));
    appendSheet(workbook, 'UpgradeGuide', pack.guideRows.map((row, index) => ({
      ORDER: index + 1,
      SEVERITY: row.severity,
      MESSAGE: row.message
    })));
    window.XLSX.writeFile(workbook, `seastar-reports-${timestampToken()}.xlsx`);
    pushToast('Reports workbook exported.', 'success');
  }

  function renderVersionComparison() {
    if (!dom.versionCompareTable) return;
    dom.versionCompareTable.innerHTML = VERSION_COMPARISON_ROWS.map((row) => `
      <div class="diag-row compare">
        <div class="diag-key">${escapeHtml(row.version)}</div>
        <div class="diag-value">
          <strong>Strengths</strong>: ${escapeHtml(row.strengths)}<br>
          <strong>Gaps</strong>: ${escapeHtml(row.gaps)}<br>
          <strong>V3 delta</strong>: ${escapeHtml(row.v3Delta)}
        </div>
      </div>
    `).join('');
  }

  function timestampToken() {
    const now = new Date();
    const parts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ];
    return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}`;
  }

  function parsePointCoordinates(value) {
    const text = trimText(value);
    if (!text) return null;
    const matches = text.match(/-?\d+(?:\.\d+)?/g) || [];
    const numbers = matches.map((item) => Number(item)).filter((item) => Number.isFinite(item));
    if (numbers.length >= 6) {
      return {
        x: average([numbers[0], numbers[3]]),
        y: average([numbers[1], numbers[4]]),
        z: average([numbers[2], numbers[5]])
      };
    }
    if (numbers.length >= 3) {
      return {
        x: numbers[0],
        y: numbers[1],
        z: numbers[2]
      };
    }
    return null;
  }

  function buildPointText(node) {
    if (!Number.isFinite(node?.x) || !Number.isFinite(node?.y) || !Number.isFinite(node?.z)) {
      return '';
    }
    return `MID : ${formatNumber(node.x)},${formatNumber(node.y)},${formatNumber(node.z)}`;
  }

  function parseNodeList(value) {
    if (Array.isArray(value)) {
      return unique(value.map(trimText).filter(Boolean));
    }
    return unique(String(value || '')
      .split(/\s*(?:,|;|\r?\n|->)\s*/g)
      .map(trimText)
      .filter(Boolean));
  }

  function parsePathString(value) {
    return parseNodeList(String(value || '').replace(/\s*<->\s*/g, ' -> '));
  }

  function countDrawableSegments(pathNodes) {
    let count = 0;
    for (let index = 0; index < pathNodes.length - 1; index += 1) {
      const a = state.graph.nodeMap[pathNodes[index]];
      const b = state.graph.nodeMap[pathNodes[index + 1]];
      if (a?.hasCoords && b?.hasCoords) count += 1;
    }
    return count;
  }

  function structuredCloneCompatible(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function unique(items) {
    return Array.from(new Set(items));
  }

  function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  }

  function pause() {
    return new Promise((resolve) => window.setTimeout(resolve, 0));
  }

  function debounce(fn, delay) {
    let timer = 0;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }

  function approx(a, b) {
    return Math.abs((a || 0) - (b || 0)) <= EPSILON;
  }

  function formatNumber(value) {
    return Number.isFinite(Number(value)) ? round2(Number(value)).toFixed(2) : '0.00';
  }

  function formatInt(value) {
    return Number(value || 0).toLocaleString('en-US');
  }

  function round2(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function finiteOrNull(value) {
    const number = Number(String(value).replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(number) ? number : null;
  }

  function toNumber(value, fallback = 0) {
    const number = Number(String(value ?? '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(number) ? number : fallback;
  }

  function positiveNumber(value, fallback = 1) {
    const number = toNumber(value, fallback);
    return number > 0 ? number : fallback;
  }

  function trimText(value) {
    return String(value ?? '').trim();
  }

  function arraysEqual(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    return left.every((value, index) => value === right[index]);
  }

  function truncate(text, limit) {
    return text.length > limit ? (text.slice(0, Math.max(limit - 3, 0)) + '...') : text;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function localProviderEnabled() {

// --- END 50-import-export-bom-reports-utils.js ---

// --- BEGIN 60-auth-groupspace-final.js ---
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

// --- END 60-auth-groupspace-final.js ---
