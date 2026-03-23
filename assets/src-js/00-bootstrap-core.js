(() => {
  'use strict';

  const ROW_HEIGHT = 40;
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
    nodeTray: {
      maxHeightLimit: 150,
      fillRatioLimit: 40,
      tierCount: 1,
      draftNodeName: '',
      manualWidthDraft: '',
      overrides: {}
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
      'openManualBtn',
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
      'nodeAreaDemand',
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
      'nodeTrayMaxHeight',
      'nodeTrayFillLimit',
      'nodeTrayTierCount',
      'nodeTrayManualWidth',
      'applyRecommendedTrayBtn',
      'saveNodeTrayOverrideBtn',
      'clearNodeTrayOverrideBtn',
      'nodeTrayStatus',
      'nodeTraySummary',
      'nodeTrayMatrix',
      'nodeTrayCanvas',
      'nodeTrayCanvasMeta',
      'nodeTrayIndexList',
      'dashPathTable',
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
    if (dom.openManualBtn) {
      dom.openManualBtn.addEventListener('click', () => setActiveTab('manual'));
    }
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
    dom.nodeTrayMaxHeight.addEventListener('input', handleNodeTrayControlInput);
    dom.nodeTrayFillLimit.addEventListener('input', handleNodeTrayControlInput);
    dom.nodeTrayTierCount.addEventListener('input', handleNodeTrayControlInput);
    dom.nodeTrayManualWidth.addEventListener('input', handleNodeTrayControlInput);
    dom.applyRecommendedTrayBtn.addEventListener('click', applyRecommendedNodeTray);
    dom.saveNodeTrayOverrideBtn.addEventListener('click', saveNodeTrayOverride);
    dom.clearNodeTrayOverrideBtn.addEventListener('click', clearNodeTrayOverride);
    dom.nodeTrayMatrix.addEventListener('click', handleNodeTrayMatrixClick);
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
      relations: parseNodeList(relationsRaw, true),
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

