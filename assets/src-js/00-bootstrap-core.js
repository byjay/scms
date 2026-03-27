(() => {
  'use strict';

  const ROW_HEIGHT = 24;
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
  const FALLBACK_VIP_USER = {
    id: 'local:vip-kwonwook',
    name: '권욱',
    email: '',
    provider: 'local',
    role: 'vip',
    status: 'active',
    groupCode: 'VIP',
    groupName: 'VIP'
  };
  const FALLBACK_VIP_CREDENTIALS = {
    id: '권욱',
    password: '0953'
  };
  const DEFAULT_API_BASE = window.SEASTAR_API_BASE ||
    (window.location.protocol === 'file:' ? 'http://127.0.0.1:8787/api/auth' : '/api/auth');

  const CABLE_ALIASES = {
    id: ['ID', 'CABLE_ID'],
    name: ['CABLE_NAME', 'NAME', 'Cable Name', '케이블명'],
    type: ['CABLE_TYPE', 'TYPE', 'Type', '케이블종류', '종류'],
    system: ['CABLE_SYSTEM', 'SYSTEM', 'System', '시스템'],
    wdPage: ['WD_PAGE', 'DRAWING_PAGE', 'PAGE', '도면'],
    fromNode: ['FROM_NODE', 'FROM', 'From Node', '출발노드', '시작노드'],
    fromRoom: ['FROM_ROOM', 'From Room', '출발구역'],
    fromEquip: ['FROM_EQUIP', 'From Equip', '출발장비'],
    fromRest: ['FROM_REST', 'FROM REST', 'FROMREST', '출발마진'],
    toNode: ['TO_NODE', 'TO', 'To Node', '도착노드', '종착노드'],
    toRoom: ['TO_ROOM', 'To Room', '도착구역'],
    toEquip: ['TO_EQUIP', 'To Equip', '도착장비'],
    toRest: ['TO_REST', 'TO REST', 'TOREST', '도착마진'],
    length: ['POR_LENGTH', 'LENGTH', 'BASE_LENGTH', 'Length', '길이'],
    outDia: ['CABLE_OUTDIA', 'OUT_DIA', 'OUTDIA', 'Diameter', 'OD', '외경'],
    checkNode: ['CHECK_NODE', 'Check Node', 'Check', '경유노드', '중간노드'],
    path: ['CABLE_PATH', 'PATH', 'Path', '경로'],
    calculatedPath: ['CALCULATED_PATH', 'ROUTED_PATH', '산출경로'],
    calculatedLength: ['CALCULATED_LENGTH', 'CALC_LENGTH', 'TOTAL_LENGTH', '산출길이'],
    supplyDeck: ['SUPPLY_DECK', 'SUPPLY_DK', 'DECK', '데크', '공급데크'],
    porWeight: ['POR_WEIGHT', 'WEIGHT', '중량'],
    interference: ['INTERFERENCE', '간섭'],
    remark: ['REMARK', '비고'],
    remark1: ['REMARK1', '비고1'],
    remark2: ['REMARK2', '비고2'],
    remark3: ['REMARK3', '비고3'],
    revision: ['REVISION', 'REV', '개정'],
    cableWeight: ['CABLE_WEIGHT', '케이블중량'],
    compName: ['COMP_NAME', 'COMPONENT_NAME', 'Component Name', 'Comp Name', '구성품명'],
    permission: ['PERMISSION', '허가']
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
    { key: '_rowNum', label: 'No', width: 42, special: 'rowNum', className: 'mono' },
    { key: 'system', label: 'CABLE_SYSTEM', width: 110 },
    { key: 'wdPage', label: 'WD_PAGE', width: 64, className: 'mono' },
    { key: 'name', label: 'CABLE_NAME', width: 140 },
    { key: 'compName', label: 'COMP_NAME', width: 100 },
    { key: 'type', label: 'CABLE_TYPE', width: 80 },
    { key: 'fromRoom', label: 'FROM_ROOM', width: 140 },
    { key: 'fromEquip', label: 'FROM_EQUIP', width: 160 },
    { key: 'fromNode', label: 'FROM_NODE', width: 90 },
    { key: 'fromRest', label: 'FROM_REST', width: 70, className: 'mono' },
    { key: 'toRoom', label: 'TO_ROOM', width: 140 },
    { key: 'toEquip', label: 'TO_EQUIP', width: 160 },
    { key: 'toNode', label: 'TO_NODE', width: 90 },
    { key: 'toRest', label: 'TO_REST', width: 70, className: 'mono' },
    { key: 'length', label: 'POR_LENGTH', width: 86, className: 'mono' },
    { key: 'outDia', label: 'CABLE_DIA', width: 76, className: 'mono' },
    { key: 'path', label: 'CABLE_PATH', width: 200, className: 'path-cell' },
    { key: 'checkNode', label: 'CHECK_NODE', width: 120 },
    { key: 'supplyDeck', label: 'SUPPLY_DECK', width: 90 },
    { key: 'porWeight', label: 'POR_WEIGHT', width: 86, className: 'mono' },
    { key: 'graphLength', label: 'GRAPH_LENGTH', width: 96, className: 'mono' },
    { key: 'calculatedLength', label: 'TOTAL_LENGTH', width: 96, className: 'mono' },
    { key: 'calculatedPath', label: 'CALCULATED_PATH', width: 200, className: 'path-cell' },
    { key: 'validation', label: 'VALIDATION', width: 80, special: 'validation' },
    { key: 'mapStatus', label: 'MAP', width: 60, special: 'mapStatus' },
    { key: 'remark', label: 'REMARK', width: 140 },
    { key: 'remark1', label: 'REMARK1', width: 140 },
    { key: 'revision', label: 'REV', width: 50, className: 'mono' },
    { key: 'cableWeight', label: 'C_WEIGHT', width: 80, className: 'mono' }
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
    },
    nodeThreeNetworkMode: false
  };

  const dom = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheDom();
    initLoginNetworkCanvas();
    if (dom.loginHint) {
      dom.loginHint.textContent = state.auth.backendAvailable
        ? '관리자 계정은 서버 환경설정에서만 관리됩니다.'
        : '운영 배포에서는 auth worker와 ADMIN_* 환경설정이 필요합니다.';
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

    // Auto-restore ship data from IndexedDB
    if (typeof autoRestoreCurrentShip === 'function') {
      const restored = await autoRestoreCurrentShip();
      if (restored) {
        commitHistory('auto-restore');
        updateHistoryControls();
      }
    }

    if (!state.cables.length) {
      pushToast('케이블 파일을 불러오면 경로 탐색과 3중 검증이 시작됩니다.', 'info');
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
      'nodeThreeEyebrow',
      'nodeThreeTitle',
      'nodeThreeNetworkToggle',
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
      'toastStack',
      'loginNetworkCanvas'
    ].forEach((id) => {
      dom[id] = document.getElementById(id);
    });

    dom.tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    dom.tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
  }

  function initLoginNetworkCanvas() {
    const canvas = dom.loginNetworkCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GRID = 60;
    const PACKET_COUNT = 30;
    const SPEED = 2;
    const TRAIL_LENGTH = 20;
    const NODE_PROB = 0.3;
    const BG = '#0f172a';
    const GRID_COLOR = '#1e293b';
    const NODE_COLOR = '#334155';
    const PACKET_COLORS = ['#3b82f6', '#22d3ee'];

    let nodes = [];
    let packets = [];
    let cols = 0;
    let rows = 0;
    let frameId = 0;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      buildGrid();
    }

    function buildGrid() {
      cols = Math.floor(canvas.width / GRID) + 1;
      rows = Math.floor(canvas.height / GRID) + 1;
      nodes = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() < NODE_PROB) {
            nodes.push({ x: c * GRID, y: r * GRID });
          }
        }
      }
      initPackets();
    }

    function pickNode() {
      return nodes.length ? nodes[Math.floor(Math.random() * nodes.length)] : { x: 0, y: 0 };
    }

    function createPacket() {
      const from = pickNode();
      const to = pickNode();
      const xFirst = Math.random() < 0.5;
      const color = PACKET_COLORS[Math.floor(Math.random() * PACKET_COLORS.length)];
      return { from, to, xFirst, color, progress: 0, trail: [] };
    }

    function initPackets() {
      packets = [];
      for (let i = 0; i < PACKET_COUNT; i++) {
        const p = createPacket();
        p.progress = Math.random();
        packets.push(p);
      }
    }

    function lerpPacket(p) {
      const dx = p.to.x - p.from.x;
      const dy = p.to.y - p.from.y;
      const totalDist = Math.abs(dx) + Math.abs(dy);
      if (totalDist === 0) return { x: p.from.x, y: p.from.y };
      const traveled = p.progress * totalDist;
      if (p.xFirst) {
        if (traveled <= Math.abs(dx)) {
          return { x: p.from.x + Math.sign(dx) * traveled, y: p.from.y };
        }
        const remaining = traveled - Math.abs(dx);
        return { x: p.to.x, y: p.from.y + Math.sign(dy) * remaining };
      }
      if (traveled <= Math.abs(dy)) {
        return { x: p.from.x, y: p.from.y + Math.sign(dy) * traveled };
      }
      const remaining = traveled - Math.abs(dy);
      return { x: p.from.x + Math.sign(dx) * remaining, y: p.to.y };
    }

    function draw() {
      if (dom.loginOverlay && dom.loginOverlay.classList.contains('hidden')) {
        cancelAnimationFrame(frameId);
        frameId = 0;
        return;
      }

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      for (let c = 0; c <= cols; c++) {
        const x = c * GRID;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        const y = r * GRID;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Nodes
      ctx.fillStyle = NODE_COLOR;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Packets
      for (const p of packets) {
        const totalDist = Math.abs(p.to.x - p.from.x) + Math.abs(p.to.y - p.from.y);
        const step = totalDist > 0 ? SPEED / totalDist : 1;
        p.progress += step;
        const pos = lerpPacket(p);
        p.trail.push({ x: pos.x, y: pos.y });
        if (p.trail.length > TRAIL_LENGTH) p.trail.shift();

        // Trail with gradient
        if (p.trail.length > 1) {
          for (let i = 1; i < p.trail.length; i++) {
            const alpha = (i / p.trail.length) * 0.6;
            ctx.strokeStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
            ctx.stroke();
          }
        }

        // Packet head
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.progress >= 1) {
          const np = createPacket();
          p.from = np.from;
          p.to = np.to;
          p.xFirst = np.xFirst;
          p.color = np.color;
          p.progress = 0;
          p.trail = [];
        }
      }

      frameId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    frameId = requestAnimationFrame(draw);
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
      const shipJson = localStorage.getItem('seastar_v3_current_ship');
      const ship = shipJson ? JSON.parse(shipJson) : null;
      if (ship && ship.id && state.auth.backendAvailable) {
        const gc = typeof getProjectGroupCode === 'function' ? getProjectGroupCode() : '';
        loadDataFromServer(gc, ship.id).then((data) => {
          if (data) {
            pushToast('Ship "' + (ship.name || ship.id) + '" loaded from server — ' + (data.cables || []).length + ' cables', 'success');
          } else {
            // Fall back to project-level load
            return loadProjectFromServer({ force: true });
          }
        }).catch((error) => {
          console.error(error);
          // Fall back to project-level load
          loadProjectFromServer({ force: true }).catch((err2) => {
            console.error(err2);
            pushToast(err2.message || 'Server load failed.', 'error');
          });
        });
      } else {
        loadProjectFromServer({ force: true }).catch((error) => {
          console.error(error);
          pushToast(error.message || 'Server project load failed.', 'error');
        });
      }
    });
    dom.saveServerProjectBtn.addEventListener('click', () => {
      const shipJson = localStorage.getItem('seastar_v3_current_ship');
      const ship = shipJson ? JSON.parse(shipJson) : null;
      if (ship && ship.id && state.auth.backendAvailable) {
        const gc = typeof getProjectGroupCode === 'function' ? getProjectGroupCode() : '';
        saveDataToServer(gc, ship.id).then(() => {
          pushToast('Ship "' + (ship.name || ship.id) + '" saved to server.', 'success');
          // Also persist project state as before
          return persistProjectState({ announce: false, reason: 'manual-save' });
        }).catch((error) => {
          console.error(error);
          // Fall back to project-only save
          persistProjectState({ announce: true, reason: 'manual-save' }).catch((err2) => {
            console.error(err2);
            pushToast(err2.message || 'Server save failed.', 'error');
          });
        });
      } else {
        persistProjectState({ announce: true, reason: 'manual-save' }).catch((error) => {
          console.error(error);
          pushToast(error.message || 'Server project save failed.', 'error');
        });
      }
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
      pushToast('3중 프로젝트 검증을 다시 실행했습니다.', 'success');
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

  // initAuth() is defined in 60-auth-groupspace-final.js (final version)

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
      message: '네이버 로그인이 완료되었습니다.'
    };
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
      pushToast('임베디드 노드 데이터를 찾지 못했습니다. 노드 파일을 직접 불러와 주세요.', 'warn');
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
      compName: trimText(raw.compName || readAliasValue(lookup, CABLE_ALIASES.compName)),
      permission: trimText(raw.permission || readAliasValue(lookup, CABLE_ALIASES.permission)),
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

