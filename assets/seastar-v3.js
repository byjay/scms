// Built from assets/src-js. Edit the split sources, not this bundle.

// --- BEGIN 00-bootstrap-core.js ---
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


// --- END 00-bootstrap-core.js ---

// --- BEGIN 05-cable-type-db.js ---
  // ============================================================
  // ■ CABLE TYPE MASTER DATABASE
  // Built-in lookup: CABLE_TYPE → { od, halfOd, area, weight, din, voltage, glandSize }
  // ============================================================
  const CABLE_TYPE_DB = {
    'AWM 2PX19AWG': { od: 11.5, halfOd: 5.75, area: 103.87, weight: 142, type: 'AWM 2PX19AWG', din: '2x2x0.75', voltage: 'BUS CAN', gland: '20B' },
    'CAT5': { od: 13, halfOd: 6.5, area: 132.73, weight: 0.43, type: 'CAT5', din: '4 x 2', voltage: 'STP-CAT5', gland: '20B' },
    'CAT5E': { od: 13, halfOd: 6.5, area: 132.73, weight: 0.43, type: 'CAT5E', din: '4 x 2', voltage: 'STP-CAT5E', gland: '20B' },
    'CAT6': { od: 14, halfOd: 7, area: 153.94, weight: 0.525, type: 'CAT6', din: '4 x 2', voltage: 'STP-CAT6', gland: '20C' },
    'CAT6E': { od: 14, halfOd: 7, area: 153.94, weight: 0.63, type: 'CAT6E', din: '4 x 2', voltage: 'STP-CAT6E', gland: '20C' },
    'CAT7': { od: 14, halfOd: 7, area: 153.94, weight: 0.525, type: 'CAT7', din: '4 x 2', voltage: 'STP-CAT7', gland: '20C' },
    'CAT7E': { od: 14, halfOd: 7, area: 153.94, weight: 0.63, type: 'CAT7E', din: '4 x 2', voltage: 'STP-CAT7E', gland: '20C' },
    'D1': { od: 11.7, halfOd: 5.85, area: 107.51, weight: 205, type: 'D1', din: '2 x 1.5', voltage: '0.6/1KV DPYC-1.5', gland: '20B' },
    'D10': { od: 17.1, halfOd: 8.55, area: 229.66, weight: 490, type: 'D10', din: '2 x 10', voltage: '0.6/1KV DPYC-10', gland: '25B' },
    'D120': { od: 42.7, halfOd: 21.35, area: 1432.01, weight: 3600, type: 'D120', din: '2 x 120', voltage: '0.6/1KV DPYC-120', gland: '50B' },
    'D150': { od: 46.9, halfOd: 23.45, area: 1727.57, weight: 4340, type: 'D150', din: '2 x 150', voltage: '0.6/1KV DPYC-150', gland: '55B' },
    'D16': { od: 19.4, halfOd: 9.7, area: 295.59, weight: 660, type: 'D16', din: '2 x 16', voltage: '0.6/1KV DPYC-16', gland: '25C' },
    'D2': { od: 12.8, halfOd: 6.4, area: 128.68, weight: 250, type: 'D2', din: '2 x 2.5', voltage: '0.6/1KV DPYC-2.5', gland: '20B' },
    'D25': { od: 23, halfOd: 11.5, area: 415.48, weight: 945, type: 'D25', din: '2 x 25', voltage: '0.6/1KV DPYC-25', gland: '30B' },
    'D35': { od: 25.5, halfOd: 12.75, area: 510.71, weight: 1200, type: 'D35', din: '2 x 35', voltage: '0.6/1KV DPYC-35', gland: '30C' },
    'D4': { od: 13.9, halfOd: 6.95, area: 151.75, weight: 300, type: 'D4', din: '2 x 4', voltage: '0.6/1KV DPYC-4', gland: '20C' },
    'D50': { od: 29.4, halfOd: 14.7, area: 678.87, weight: 1580, type: 'D50', din: '2 x 50', voltage: '0.6/1KV DPYC-50', gland: '35B' },
    'D6': { od: 15.2, halfOd: 7.6, area: 181.46, weight: 370, type: 'D6', din: '2 x 6', voltage: '0.6/1KV DPYC-6', gland: '25A' },
    'D70': { od: 33.7, halfOd: 16.85, area: 891.97, weight: 2210, type: 'D70', din: '2 x 70', voltage: '0.6/1KV DPYC-70', gland: '40B' },
    'D95': { od: 39.1, halfOd: 19.55, area: 1200.72, weight: 2960, type: 'D95', din: '2 x 95', voltage: '0.6/1KV DPYC-95', gland: '45C' },
    'DS1.5': { od: 12.6, halfOd: 6.3, area: 124.69, weight: 265, type: 'DS1.5', din: '2 x 1.5(S)', voltage: '0.6/1KV DPYCS-1.5', gland: '20B' },
    'DS10': { od: 18.6, halfOd: 9.3, area: 271.72, weight: 670, type: 'DS10', din: '2 x 10(S)', voltage: '0.6/1KV DPYCS-10', gland: '25C' },
    'DS120': { od: 43.8, halfOd: 21.9, area: 1506.74, weight: 4070, type: 'DS120', din: '2 x 120(S)', voltage: '0.6/1KV DPYCS-120', gland: '50B' },
    'DS16': { od: 20.6, halfOd: 10.3, area: 333.29, weight: 855, type: 'DS16', din: '2 x 16(S)', voltage: '0.6/1KV DPYCS-16', gland: '30A' },
    'DS2.5': { od: 13.5, halfOd: 6.75, area: 143.14, weight: 310, type: 'DS2.5', din: '2 x 2.5(S)', voltage: '0.6/1KV DPYCS-2.5', gland: '20C' },
    'DS25': { od: 24.4, halfOd: 12.2, area: 467.59, weight: 1195, type: 'DS25', din: '2 x 25(S)', voltage: '0.6/1KV DPYCS-25', gland: '30C' },
    'DS35': { od: 27, halfOd: 13.5, area: 572.56, weight: 1490, type: 'DS35', din: '2 x 35(S)', voltage: '0.6/1KV DPYCS-35', gland: '35A' },
    'DS4': { od: 14.7, halfOd: 7.35, area: 169.72, weight: 380, type: 'DS4', din: '2 x 4(S)', voltage: '0.6/1KV DPYCS-4', gland: '25A' },
    'DS50': { od: 30.6, halfOd: 15.3, area: 735.42, weight: 1880, type: 'DS50', din: '2 x 50(S)', voltage: '0.6/1KV DPYCS-50', gland: '40A' },
    'DS6': { od: 16.4, halfOd: 8.2, area: 211.24, weight: 515, type: 'DS6', din: '2 x 6(S)', voltage: '0.6/1KV DPYCS-6', gland: '25B' },
    'DS70': { od: 35.8, halfOd: 17.9, area: 1006.60, weight: 2600, type: 'DS70', din: '2 x 70(S)', voltage: '0.6/1KV DPYCS-70', gland: '45A' },
    'DS95': { od: 40.4, halfOd: 20.2, area: 1281.90, weight: 3420, type: 'DS95', din: '2 x 95(S)', voltage: '0.6/1KV DPYCS-95', gland: '50A' },
    'DY1': { od: 13.7, halfOd: 6.85, area: 147.41, weight: 260, type: 'DY1', din: '2 x 1.5', voltage: '0.6/1KV DPYCY-1.5', gland: '20C' },
    'DY10': { od: 19.3, halfOd: 9.65, area: 292.55, weight: 575, type: 'DY10', din: '2 x 10', voltage: '0.6/1KV DPYCY-10', gland: '25C' },
    'DY120': { od: 46.5, halfOd: 23.25, area: 1698.23, weight: 3970, type: 'DY120', din: '2 x 120', voltage: '0.6/1KV DPYCY-120', gland: '55B' },
    'DY150': { od: 50.9, halfOd: 25.45, area: 2034.82, weight: 4760, type: 'DY150', din: '2 x 150', voltage: '0.6/1KV DPYCY-150', gland: '60A' },
    'DY16': { od: 21.8, halfOd: 10.9, area: 373.25, weight: 765, type: 'DY16', din: '2 x 16', voltage: '0.6/1KV DPYCY-16', gland: '30A' },
    'DY2': { od: 14.8, halfOd: 7.4, area: 172.03, weight: 305, type: 'DY2', din: '2 x 2.5', voltage: '0.6/1KV DPYCY-2.5', gland: '25A' },
    'DY25': { od: 25.6, halfOd: 12.8, area: 514.72, weight: 1080, type: 'DY25', din: '2 x 25', voltage: '0.6/1KV DPYCY-25', gland: '30C' },
    'DY35': { od: 28.1, halfOd: 14.05, area: 620.16, weight: 1350, type: 'DY35', din: '2 x 35', voltage: '0.6/1KV DPYCY-35', gland: '35B' },
    'DY4': { od: 15.9, halfOd: 7.95, area: 198.56, weight: 365, type: 'DY4', din: '2 x 4', voltage: '0.6/1KV DPYCY-4', gland: '25A' },
    'DY50': { od: 32.2, halfOd: 16.1, area: 814.33, weight: 1770, type: 'DY50', din: '2 x 50', voltage: '0.6/1KV DPYCY-50', gland: '40B' },
    'DY6': { od: 17.4, halfOd: 8.7, area: 237.79, weight: 445, type: 'DY6', din: '2 x 6', voltage: '0.6/1KV DPYCY-6', gland: '25B' },
    'DY70': { od: 36.7, halfOd: 18.35, area: 1057.84, weight: 2440, type: 'DY70', din: '2 x 70', voltage: '0.6/1KV DPYCY-70', gland: '45B' },
    'DY95': { od: 42.7, halfOd: 21.35, area: 1432.01, weight: 3280, type: 'DY95', din: '2 x 95', voltage: '0.6/1KV DPYCY-95', gland: '50B' },
    'DYS1': { od: 14.6, halfOd: 7.3, area: 167.42, weight: 325, type: 'DYS1', din: '2 x 1.5(S)', voltage: '0.6/1KV DPYCYS-1.5', gland: '25A' },
    'DYS10': { od: 21, halfOd: 10.5, area: 346.36, weight: 780, type: 'DYS10', din: '2 x 10(S)', voltage: '0.6/1KV DPYCYS-10', gland: '30A' },
    'DYS120': { od: 47.4, halfOd: 23.7, area: 1764.60, weight: 4455, type: 'DYS120', din: '2 x 120(S)', voltage: '0.6/1KV DPYCYS-120', gland: '55B' },
    'DYS16': { od: 23, halfOd: 11.5, area: 415.48, weight: 980, type: 'DYS16', din: '2 x 16(S)', voltage: '0.6/1KV DPYCYS-16', gland: '30B' },
    'DYS2': { od: 15.5, halfOd: 7.75, area: 188.69, weight: 375, type: 'DYS2', din: '2 x 2.5(S)', voltage: '0.6/1KV DPYCYS-2.5', gland: '25A' },
    'DYS25': { od: 27, halfOd: 13.5, area: 572.56, weight: 1350, type: 'DYS25', din: '2 x 25(S)', voltage: '0.6/1KV DPYCYS-25', gland: '35A' },
    'DYS35': { od: 29.8, halfOd: 14.9, area: 697.46, weight: 1675, type: 'DYS35', din: '2 x 35(S)', voltage: '0.6/1KV DPYCYS-35', gland: '35B' },
    'DYS4': { od: 16.9, halfOd: 8.45, area: 224.32, weight: 455, type: 'DYS4', din: '2 x 4(S)', voltage: '0.6/1KV DPYCYS-4', gland: '25B' },
    'DYS50': { od: 33.6, halfOd: 16.8, area: 886.68, weight: 2105, type: 'DYS50', din: '2 x 50(S)', voltage: '0.6/1KV DPYCYS-50', gland: '40B' },
    'DYS6': { od: 18.6, halfOd: 9.3, area: 271.72, weight: 605, type: 'DYS6', din: '2 x 6(S)', voltage: '0.6/1KV DPYCYS-6', gland: '25C' },
    'DYS70': { od: 39, halfOd: 19.5, area: 1194.59, weight: 2880, type: 'DYS70', din: '2 x 70(S)', voltage: '0.6/1KV DPYCYS-70', gland: '45C' },
    'DYS95': { od: 43.8, halfOd: 21.9, area: 1506.74, weight: 3755, type: 'DYS95', din: '2 x 95(S)', voltage: '0.6/1KV DPYCYS-95', gland: '50B' },
    'FD1': { od: 14.1, halfOd: 7.05, area: 156.15, weight: 270, type: 'FD1', din: '2 x 1.5(F)', voltage: '0.6/1KV FR-DPYC-1.5', gland: '25A' },
    'FD10': { od: 18.7, halfOd: 9.35, area: 274.65, weight: 575, type: 'FD10', din: '2 x 10(F)', voltage: '0.6/1KV FR-DPYC-10', gland: '25C' },
    'FD2': { od: 15.2, halfOd: 7.6, area: 181.46, weight: 320, type: 'FD2', din: '2 x 2.5(F)', voltage: '0.6/1KV FR-DPYC-2.5', gland: '25A' },
    'FD4': { od: 16.3, halfOd: 8.15, area: 208.67, weight: 375, type: 'FD4', din: '2 x 4(F)', voltage: '0.6/1KV FR-DPYC-4', gland: '25B' },
    'FD6': { od: 17.4, halfOd: 8.7, area: 237.79, weight: 440, type: 'FD6', din: '2 x 6(F)', voltage: '0.6/1KV FR-DPYC-6', gland: '25B' },
    'FDS4': { od: 16.5, halfOd: 8.25, area: 213.82, weight: 425, type: 'FDS4', din: '2 x 4(S)(F)', voltage: '0.6/1KV FR-DPYCS-4', gland: '25B' },
    'FDS6': { od: 17.5, halfOd: 8.75, area: 240.53, weight: 490, type: 'FDS6', din: '2 x 6(S)(F)', voltage: '0.6/1KV FR-DPYCS-6', gland: '25B' },
    'FDY1': { od: 16.3, halfOd: 8.15, area: 208.67, weight: 340, type: 'FDY1', din: '2 x 1.5(F)', voltage: '0.6/1KV FR-DPYCY-1.5', gland: '25B' },
    'FDY10': { od: 24.9, halfOd: 12.45, area: 486.95, weight: 685, type: 'FDY10', din: '2 x 10(F)', voltage: '0.6/1KV FR-DPYCY-10', gland: '30C' },
    'FDY2': { od: 17.4, halfOd: 8.7, area: 237.79, weight: 395, type: 'FDY2', din: '2 x 2.5(F)', voltage: '0.6/1KV FR-DPYCY-2.5', gland: '25B' },
    'FDY4': { od: 18.5, halfOd: 9.25, area: 268.80, weight: 455, type: 'FDY4', din: '2 x 4(F)', voltage: '0.6/1KV FR-DPYCY-4', gland: '25C' },
    'FDY6': { od: 19.36, halfOd: 9.68, area: 294.37, weight: 530, type: 'FDY6', din: '2 x 6(F)', voltage: '0.6/1KV FR-DPYCY-6', gland: '25C' },
    'FDYS1': { od: 16.5, halfOd: 8.25, area: 213.82, weight: 385, type: 'FDYS1', din: '2 x 1.5(S)(F)', voltage: '0.6/1KV FR-DPYCYS-1.5', gland: '25B' },
    'FDYS2': { od: 17.3, halfOd: 8.65, area: 235.06, weight: 430, type: 'FDYS2', din: '2 x 2.5(S)(F)', voltage: '0.6/1KV FR-DPYCYS-2.5', gland: '25B' },
    'FDYS4': { od: 18.7, halfOd: 9.35, area: 274.65, weight: 510, type: 'FDYS4', din: '2 x 4(S)(F)', voltage: '0.6/1KV FR-DPYCYS-4', gland: '25C' },
    'FDYS6': { od: 19.7, halfOd: 9.85, area: 304.81, weight: 580, type: 'FDYS6', din: '2 x 6(S)(F)', voltage: '0.6/1KV FR-DPYCYS-6', gland: '25C' },
    'FM12': { od: 21.8, halfOd: 10.9, area: 373.25, weight: 650, type: 'FM12', din: '12 x 1(F)', voltage: '250V FR-250V MPYC-12', gland: '30A' },
    'FM19': { od: 25.5, halfOd: 12.75, area: 510.71, weight: 900, type: 'FM19', din: '19 x 1(F)', voltage: '250V FR-250V MPYC-19', gland: '30C' },
    'FM2': { od: 12.2, halfOd: 6.1, area: 116.90, weight: 210, type: 'FM2', din: '2 x 1(F)', voltage: '250V FR-250V MPYC-2', gland: '20B' },
    'FMY12': { od: 24.2, halfOd: 12.1, area: 459.96, weight: 765, type: 'FMY12', din: '12 x 1(F)', voltage: '250V FR-250V MPYCY-12', gland: '30C' },
    'FMY2': { od: 14.2, halfOd: 7.1, area: 158.37, weight: 265, type: 'FMY2', din: '2 x 1(F)', voltage: '250V FR-250V MPYCY-2', gland: '25A' },
    'FMY7': { od: 18.9, halfOd: 9.45, area: 280.55, weight: 490, type: 'FMY7', din: '7 x 1(F)', voltage: '250V FR-250V MPYCY-7', gland: '25C' },
    'FMYS7': { od: 19, halfOd: 9.5, area: 283.53, weight: 545, type: 'FMYS7', din: '7 x 1(S)(F)', voltage: '250V FR-250V MPYCYS-7', gland: '25C' },
    'FT1': { od: 14.9, halfOd: 7.45, area: 174.37, weight: 315, type: 'FT1', din: '3 x 1.5(F)', voltage: '0.6/1KV FR-TPYC-1.5', gland: '25A' },
    'FT10': { od: 20.9, halfOd: 10.45, area: 343.07, weight: 730, type: 'FT10', din: '3 x 10(F)', voltage: '0.6/1KV FR-TPYC-10', gland: '30A' },
    'FT120': { od: 48.3, halfOd: 24.15, area: 1832.25, weight: 5090, type: 'FT120', din: '3 x 120(F)', voltage: '0.6/1KV FR-TPYC-120', gland: '55C' },
    'FT150': { od: 52.9, halfOd: 26.45, area: 2197.87, weight: 6130, type: 'FT150', din: '3 x 150(F)', voltage: '0.6/1KV FR-TPYC-150', gland: '60B' },
    'FT16': { od: 23.4, halfOd: 11.7, area: 430.05, weight: 975, type: 'FT16', din: '3 x 16(F)', voltage: '0.6/1KV FR-TPYC-16', gland: '30B' },
    'FT185': { od: 58, halfOd: 29, area: 2642.08, weight: 7510, type: 'FT185', din: '3 x 185(F)', voltage: '0.6/1KV FR-TPYC-185', gland: '65A' },
    'FT2': { od: 16.1, halfOd: 8.05, area: 203.58, weight: 375, type: 'FT2', din: '3 x 2.5(F)', voltage: '0.6/1KV FR-TPYC-2.5', gland: '25B' },
    'FT25': { od: 27.3, halfOd: 13.65, area: 585.35, weight: 1380, type: 'FT25', din: '3 x 25(F)', voltage: '0.6/1KV FR-TPYC-25', gland: '35A' },
    'FT35': { od: 29.9, halfOd: 14.95, area: 702.15, weight: 1740, type: 'FT35', din: '3 x 35(F)', voltage: '0.6/1KV FR-TPYC-35', gland: '35B' },
    'FT4': { od: 17.3, halfOd: 8.65, area: 235.06, weight: 450, type: 'FT4', din: '3 x 4(F)', voltage: '0.6/1KV FR-TPYC-4', gland: '25B' },
    'FT50': { od: 34.6, halfOd: 17.3, area: 940.25, weight: 2380, type: 'FT50', din: '3 x 50(F)', voltage: '0.6/1KV FR-TPYC-50', gland: '45A' },
    'FT6': { od: 18.7, halfOd: 9.35, area: 274.65, weight: 550, type: 'FT6', din: '3 x 6(F)', voltage: '0.6/1KV FR-TPYC-6', gland: '25C' },
    'FT70': { od: 38.7, halfOd: 19.35, area: 1176.28, weight: 3140, type: 'FT70', din: '3 x 70(F)', voltage: '0.6/1KV FR-TPYC-70', gland: '45C' },
    'FT95': { od: 44.5, halfOd: 22.25, area: 1555.28, weight: 4200, type: 'FT95', din: '3 x 95(F)', voltage: '0.6/1KV FR-TPYC-95', gland: '55A' },
    'FTS1': { od: 15.1, halfOd: 7.55, area: 179.08, weight: 360, type: 'FTS1', din: '3 x 1.5(S)(F)', voltage: '0.6/1KV FR-TPYCS-1.5', gland: '25A' },
    'FTS10': { od: 17.5, halfOd: 8.75, area: 240.53, weight: 520, type: 'FTS10', din: '3 x 10(S)(F)', voltage: '0.6/1KV FR-TPYCS-10', gland: '25B' },
    'FTS120': { od: 43.2, halfOd: 21.6, area: 1465.74, weight: 4435, type: 'FTS120', din: '3 x 120(S)(F)', voltage: '0.6/1KV FR-TPYCS-120', gland: '50B' },
    'FTS150': { od: 47.7, halfOd: 23.85, area: 1787.01, weight: 5435, type: 'FTS150', din: '3 x 150(S)(F)', voltage: '0.6/1KV FR-TPYCS-150', gland: '55B' },
    'FTS16': { od: 19.9, halfOd: 9.95, area: 311.03, weight: 730, type: 'FTS16', din: '3 x 16(S)(F)', voltage: '0.6/1KV FR-TPYCS-16', gland: '25C' },
    'FTS2': { od: 16.1, halfOd: 8.05, area: 203.58, weight: 420, type: 'FTS2', din: '3 x 2.5(S)(F)', voltage: '0.6/1KV FR-TPYCS-2.5', gland: '25B' },
    'FTS25': { od: 24, halfOd: 12, area: 452.39, weight: 1115, type: 'FTS25', din: '3 x 25(S)(F)', voltage: '0.6/1KV FR-TPYCS-25', gland: '30B' },
    'FTS35': { od: 26.5, halfOd: 13.25, area: 551.55, weight: 1450, type: 'FTS35', din: '3 x 35(S)(F)', voltage: '0.6/1KV FR-TPYCS-35', gland: '35A' },
    'FTS4': { od: 17.4, halfOd: 8.7, area: 237.79, weight: 505, type: 'FTS4', din: '3 x 4(S)(F)', voltage: '0.6/1KV FR-TPYCS-4', gland: '25B' },
    'FTS50': { od: 31, halfOd: 15.5, area: 754.77, weight: 1940, type: 'FTS50', din: '3 x 50(S)(F)', voltage: '0.6/1KV FR-TPYCS-50', gland: '40A' },
    'FTS6': { od: 18.7, halfOd: 9.35, area: 274.65, weight: 600, type: 'FTS6', din: '3 x 6(S)(F)', voltage: '0.6/1KV FR-TPYCS-6', gland: '25C' },
    'FTS70': { od: 34.7, halfOd: 17.35, area: 945.69, weight: 2665, type: 'FTS70', din: '3 x 70(S)(F)', voltage: '0.6/1KV FR-TPYCS-70', gland: '45A' },
    'FTS95': { od: 39.8, halfOd: 19.9, area: 1244.10, weight: 3620, type: 'FTS95', din: '3 x 95(S)(F)', voltage: '0.6/1KV FR-TPYCS-95', gland: '45C' },
    'M2': { od: 10, halfOd: 5, area: 78.54, weight: 155, type: 'M2', din: '2 x 1', voltage: '250V 250V MPYC-2', gland: '15C' },
    'M4': { od: 11.2, halfOd: 5.6, area: 98.52, weight: 205, type: 'M4', din: '4 x 1', voltage: '250V 250V MPYC-4', gland: '20B' },
    'M7': { od: 13.2, halfOd: 6.6, area: 136.85, weight: 290, type: 'M7', din: '7 x 1', voltage: '250V 250V MPYC-7', gland: '20C' },
    'M12': { od: 16.8, halfOd: 8.4, area: 221.67, weight: 440, type: 'M12', din: '12 x 1', voltage: '250V 250V MPYC-12', gland: '25B' },
    'M19': { od: 19.6, halfOd: 9.8, area: 301.72, weight: 615, type: 'M19', din: '19 x 1', voltage: '250V 250V MPYC-19', gland: '25C' },
    'M27': { od: 23.4, halfOd: 11.7, area: 430.05, weight: 840, type: 'M27', din: '27 x 1', voltage: '250V 250V MPYC-27', gland: '30B' },
    'M37': { od: 26.1, halfOd: 13.05, area: 535.02, weight: 1070, type: 'M37', din: '37 x 1', voltage: '250V 250V MPYC-37', gland: '35A' },
    'M44': { od: 29.3, halfOd: 14.65, area: 674.26, weight: 1290, type: 'M44', din: '44 x 1', voltage: '250V 250V MPYC-44', gland: '35B' },
    'MY2': { od: 12, halfOd: 6, area: 113.10, weight: 205, type: 'MY2', din: '2 x 1', voltage: '250V MPYCY-2', gland: '20B' },
    'MY4': { od: 13.2, halfOd: 6.6, area: 136.85, weight: 260, type: 'MY4', din: '4 x 1', voltage: '250V MPYCY-4', gland: '20C' },
    'MY5': { od: 14.1, halfOd: 7.05, area: 156.15, weight: 300, type: 'MY5', din: '5 x 1', voltage: '250V MPYCY-5', gland: '25A' },
    'MY7': { od: 15.2, halfOd: 7.6, area: 181.46, weight: 350, type: 'MY7', din: '7 x 1', voltage: '250V MPYCY-7', gland: '25A' },
    'MY9': { od: 17.3, halfOd: 8.65, area: 235.06, weight: 440, type: 'MY9', din: '9 x 1', voltage: '250V MPYCY-9', gland: '25B' },
    'MY10': { od: 18.2, halfOd: 9.1, area: 260.16, weight: 490, type: 'MY10', din: '10 x 1', voltage: '250V MPYCY-10', gland: '25C' },
    'MY12': { od: 19, halfOd: 9.5, area: 283.53, weight: 525, type: 'MY12', din: '12 x 1', voltage: '250V MPYCY-12', gland: '25C' },
    'MY14': { od: 19.4, halfOd: 9.7, area: 295.59, weight: 580, type: 'MY14', din: '14 x 1', voltage: '250V MPYCY-14', gland: '25C' },
    'MY16': { od: 21.1, halfOd: 10.55, area: 349.67, weight: 650, type: 'MY16', din: '16 x 1', voltage: '250V MPYCY-16', gland: '30A' },
    'MY19': { od: 22, halfOd: 11, area: 380.13, weight: 720, type: 'MY19', din: '19 x 1', voltage: '250V MPYCY-19', gland: '30A' },
    'MY23': { od: 24.3, halfOd: 12.15, area: 463.77, weight: 920, type: 'MY23', din: '23 x 1', voltage: '250V MPYCY-23', gland: '30C' },
    'MY27': { od: 26, halfOd: 13, area: 530.93, weight: 980, type: 'MY27', din: '27 x 1', voltage: '250V MPYCY-27', gland: '30C' },
    'MY33': { od: 27.8, halfOd: 13.9, area: 606.99, weight: 1130, type: 'MY33', din: '33 x 1', voltage: '250V MPYCY-33', gland: '35A' },
    'MY37': { od: 28.9, halfOd: 14.45, area: 655.97, weight: 1240, type: 'MY37', din: '37 x 1', voltage: '250V MPYCY-37', gland: '35B' },
    'MY44': { od: 32.1, halfOd: 16.05, area: 809.28, weight: 1470, type: 'MY44', din: '44 x 1', voltage: '250V MPYCY-44', gland: '40B' },
    'S1': { od: 7.2, halfOd: 3.6, area: 40.72, weight: 100, type: 'S1', din: '1 x 1.5', voltage: '0.6/1KV SPYC-1.5', gland: '15A' },
    'S2': { od: 7.6, halfOd: 3.8, area: 45.36, weight: 120, type: 'S2', din: '1 x 2.5', voltage: '0.6/1KV SPYC-2.5', gland: '15A' },
    'S4': { od: 8.2, halfOd: 4.1, area: 52.81, weight: 140, type: 'S4', din: '1 x 4', voltage: '0.6/1KV SPYC-4', gland: '15B' },
    'S6': { od: 8.7, halfOd: 4.35, area: 59.45, weight: 170, type: 'S6', din: '1 x 6', voltage: '0.6/1KV SPYC-6', gland: '15B' },
    'S10': { od: 9.9, halfOd: 4.95, area: 76.98, weight: 225, type: 'S10', din: '1 x 10', voltage: '0.6/1KV SPYC-10', gland: '15C' },
    'S16': { od: 10.9, halfOd: 5.45, area: 93.31, weight: 300, type: 'S16', din: '1 x 16', voltage: '0.6/1KV SPYC-16', gland: '20A' },
    'S25': { od: 12.8, halfOd: 6.4, area: 128.68, weight: 425, type: 'S25', din: '1 x 25', voltage: '0.6/1KV SPYC-25', gland: '20B' },
    'S35': { od: 14, halfOd: 7, area: 153.94, weight: 535, type: 'S35', din: '1 x 35', voltage: '0.6/1KV SPYC-35', gland: '20C' },
    'S50': { od: 15.9, halfOd: 7.95, area: 198.56, weight: 700, type: 'S50', din: '1 x 50', voltage: '0.6/1KV SPYC-50', gland: '25A' },
    'S70': { od: 17.9, halfOd: 8.95, area: 251.65, weight: 940, type: 'S70', din: '1 x 70', voltage: '0.6/1KV SPYC-70', gland: '25B' },
    'S95': { od: 20.6, halfOd: 10.3, area: 333.29, weight: 1260, type: 'S95', din: '1 x 95', voltage: '0.6/1KV SPYC-95', gland: '30A' },
    'S120': { od: 22.2, halfOd: 11.1, area: 387.08, weight: 1520, type: 'S120', din: '1 x 120', voltage: '0.6/1KV SPYC-120', gland: '30B' },
    'S150': { od: 24.4, halfOd: 12.2, area: 467.59, weight: 1840, type: 'S150', din: '1 x 150', voltage: '0.6/1KV SPYC-150', gland: '30C' },
    'S185': { od: 26.8, halfOd: 13.4, area: 564.10, weight: 2260, type: 'S185', din: '1 x 185', voltage: '0.6/1KV SPYC-185', gland: '35A' },
    'S240': { od: 30.1, halfOd: 15.05, area: 711.58, weight: 2920, type: 'S240', din: '1 x 240', voltage: '0.6/1KV SPYC-240', gland: '40A' },
    'T1': { od: 12.5, halfOd: 6.25, area: 122.72, weight: 245, type: 'T1', din: '3 x 1.5', voltage: '0.6/1KV TPYC-1.5', gland: '20B' },
    'T2': { od: 13.5, halfOd: 6.75, area: 143.14, weight: 295, type: 'T2', din: '3 x 2.5', voltage: '0.6/1KV TPYC-2.5', gland: '20C' },
    'T4': { od: 14.7, halfOd: 7.35, area: 169.72, weight: 365, type: 'T4', din: '3 x 4', voltage: '0.6/1KV TPYC-4', gland: '25A' },
    'T6': { od: 16.1, halfOd: 8.05, area: 203.58, weight: 455, type: 'T6', din: '3 x 6', voltage: '0.6/1KV TPYC-6', gland: '25B' },
    'T10': { od: 18.3, halfOd: 9.15, area: 263.02, weight: 625, type: 'T10', din: '3 x 10', voltage: '0.6/1KV TPYC-10', gland: '25C' },
    'T16': { od: 20.8, halfOd: 10.4, area: 339.79, weight: 855, type: 'T16', din: '3 x 16', voltage: '0.6/1KV TPYC-16', gland: '30A' },
    'T25': { od: 24.7, halfOd: 12.35, area: 479.16, weight: 1240, type: 'T25', din: '3 x 25', voltage: '0.6/1KV TPYC-25', gland: '30C' },
    'T35': { od: 27.4, halfOd: 13.7, area: 589.65, weight: 1600, type: 'T35', din: '3 x 35', voltage: '0.6/1KV TPYC-35', gland: '35A' },
    'T50': { od: 32, halfOd: 16, area: 804.25, weight: 2200, type: 'T50', din: '3 x 50', voltage: '0.6/1KV TPYC-50', gland: '40A' },
    'T70': { od: 36.1, halfOd: 18.05, area: 1023.54, weight: 2950, type: 'T70', din: '3 x 70', voltage: '0.6/1KV TPYC-70', gland: '45B' },
    'T95': { od: 41.9, halfOd: 20.95, area: 1378.85, weight: 3980, type: 'T95', din: '3 x 95', voltage: '0.6/1KV TPYC-95', gland: '50A' },
    'T120': { od: 45.8, halfOd: 22.9, area: 1647.48, weight: 4860, type: 'T120', din: '3 x 120', voltage: '0.6/1KV TPYC-120', gland: '55A' },
    'T150': { od: 50.3, halfOd: 25.15, area: 1987.13, weight: 5870, type: 'T150', din: '3 x 150', voltage: '0.6/1KV TPYC-150', gland: '60A' },
    'T185': { od: 55.4, halfOd: 27.7, area: 2410.51, weight: 7230, type: 'T185', din: '3 x 185', voltage: '0.6/1KV TPYC-185', gland: '60C' },
    'TT1': { od: 9, halfOd: 4.5, area: 63.62, weight: 130, type: 'TT1', din: '1Pair x 0.75', voltage: '250V TTYC-1', gland: '15B' },
    'TT2': { od: 13.5, halfOd: 6.75, area: 143.14, weight: 235, type: 'TT2', din: '2Pair x 0.75', voltage: '250V TTYC-2', gland: '20C' },
    'TT3': { od: 14.2, halfOd: 7.1, area: 158.37, weight: 270, type: 'TT3', din: '3Pair x 0.75', voltage: '250V TTYC-3', gland: '25A' },
    'TT4': { od: 14.9, halfOd: 7.45, area: 174.37, weight: 305, type: 'TT4', din: '4Pair x 0.75', voltage: '250V TTYC-4', gland: '25A' },
    'TT7': { od: 17.5, halfOd: 8.75, area: 240.53, weight: 420, type: 'TT7', din: '7Pair x 0.75', voltage: '250V TTYC-7', gland: '25B' },
    'TT10': { od: 22.3, halfOd: 11.15, area: 390.57, weight: 620, type: 'TT10', din: '10Pair x 0.75', voltage: '250V TTYC-10', gland: '30B' },
    'TT14': { od: 24.1, halfOd: 12.05, area: 456.17, weight: 750, type: 'TT14', din: '14Pair x 0.75', voltage: '250V TTYC-14', gland: '30C' },
    'TT19': { od: 26.9, halfOd: 13.45, area: 568.32, weight: 935, type: 'TT19', din: '19Pair x 0.75', voltage: '250V TTYC-19', gland: '35A' },
    'TT24': { od: 32.7, halfOd: 16.35, area: 839.82, weight: 1340, type: 'TT24', din: '24Pair x 0.75', voltage: '250V TTYC-24', gland: '40B' },
    'TT30': { od: 34.7, halfOd: 17.35, area: 945.69, weight: 1540, type: 'TT30', din: '30Pair x 0.75', voltage: '250V TTYC-30', gland: '45A' },
    'TT37': { od: 37.6, halfOd: 18.8, area: 1110.36, weight: 1800, type: 'TT37', din: '37Pair x 0.75', voltage: '250V TTYC-37', gland: '45B' },
    'TT48': { od: 43.2, halfOd: 21.6, area: 1465.74, weight: 2300, type: 'TT48', din: '48Pair x 0.75', voltage: '250V TTYC-48', gland: '50B' },
    'TT1Q': { od: 10.3, halfOd: 5.15, area: 83.32, weight: 175, type: 'TT1Q', din: '4Core x 0.75', voltage: '250V TTYC-1Q', gland: '20A' },
    'TT1T': { od: 9.4, halfOd: 4.7, area: 69.40, weight: 150, type: 'TT1T', din: '3core x 0.75', voltage: '250V TTYC-1T', gland: '15C' },
    'SY1': { od: 9, halfOd: 4.5, area: 63.62, weight: 135, type: 'SY1', din: '1 x 1.5', voltage: '0.6/1KV SPYCY-1.5', gland: '15B' },
    'SY2': { od: 9.4, halfOd: 4.7, area: 69.40, weight: 150, type: 'SY2', din: '1 x 2.5', voltage: '0.6/1KV SPYCY-2.5', gland: '15C' },
    'SY4': { od: 10, halfOd: 5, area: 78.54, weight: 175, type: 'SY4', din: '1 x 4', voltage: '0.6/1KV SPYCY-4', gland: '15C' },
    'SY6': { od: 10.5, halfOd: 5.25, area: 86.59, weight: 205, type: 'SY6', din: '1 x 6', voltage: '0.6/1KV SPYCY-6', gland: '20A' },
    'SY10': { od: 11.7, halfOd: 5.85, area: 107.51, weight: 270, type: 'SY10', din: '1 x 10', voltage: '0.6/1KV SPYCY-10', gland: '20B' },
    'SY16': { od: 12.9, halfOd: 6.45, area: 130.70, weight: 350, type: 'SY16', din: '1 x 16', voltage: '0.6/1KV SPYCY-16', gland: '20B' },
    'SY25': { od: 14.8, halfOd: 7.4, area: 172.03, weight: 485, type: 'SY25', din: '1 x 25', voltage: '0.6/1KV SPYCY-25', gland: '25A' },
    'SY35': { od: 16.2, halfOd: 8.1, area: 206.12, weight: 610, type: 'SY35', din: '1 x 35', voltage: '0.6/1KV SPYCY-35', gland: '25B' },
    'SY50': { od: 18.1, halfOd: 9.05, area: 257.30, weight: 780, type: 'SY50', din: '1 x 50', voltage: '0.6/1KV SPYCY-50', gland: '25C' },
    'SY70': { od: 20.1, halfOd: 10.05, area: 317.31, weight: 1030, type: 'SY70', din: '1 x 70', voltage: '0.6/1KV SPYCY-70', gland: '30A' },
    'SY95': { od: 23, halfOd: 11.5, area: 415.48, weight: 1370, type: 'SY95', din: '1 x 95', voltage: '0.6/1KV SPYCY-95', gland: '30B' },
    'SY120': { od: 24.8, halfOd: 12.4, area: 483.05, weight: 1650, type: 'SY120', din: '1 x 120', voltage: '0.6/1KV SPYCY-120', gland: '30C' },
    'SY150': { od: 27, halfOd: 13.5, area: 572.56, weight: 1980, type: 'SY150', din: '1 x 150', voltage: '0.6/1KV SPYCY-150', gland: '35A' },
    'SY185': { od: 29.6, halfOd: 14.8, area: 688.13, weight: 2430, type: 'SY185', din: '1 x 185', voltage: '0.6/1KV SPYCY-185', gland: '35B' },
    'SY240': { od: 33.1, halfOd: 16.55, area: 860.49, weight: 3130, type: 'SY240', din: '1 x 240', voltage: '0.6/1KV SPYCY-240', gland: '40B' },
    'TY1': { od: 14.5, halfOd: 7.25, area: 165.13, weight: 300, type: 'TY1', din: '3 x 1.5', voltage: '0.6/1KV TPYCY-1.5', gland: '25A' },
    'TY2': { od: 15.5, halfOd: 7.75, area: 188.69, weight: 355, type: 'TY2', din: '3 x 2.5', voltage: '0.6/1KV TPYCY-2', gland: '25A' },
    'TY4': { od: 16.9, halfOd: 8.45, area: 224.32, weight: 440, type: 'TY4', din: '3 x 4', voltage: '0.6/1KV TPYCY-4', gland: '25B' },
    'TY6': { od: 18.3, halfOd: 9.15, area: 263.02, weight: 535, type: 'TY6', din: '3 x 6', voltage: '0.6/1KV TPYCY-6', gland: '25C' },
    'TY10': { od: 20.7, halfOd: 10.35, area: 336.54, weight: 725, type: 'TY10', din: '3 x 10', voltage: '0.6/1KV TPYCY-10', gland: '30A' },
    'TY16': { od: 23.2, halfOd: 11.6, area: 422.73, weight: 970, type: 'TY16', din: '3 x 16', voltage: '0.6/1KV TPYCY-16', gland: '30B' },
    'TY25': { od: 27.3, halfOd: 13.65, area: 585.35, weight: 1390, type: 'TY25', din: '3 x 25', voltage: '0.6/1KV TPYCY-25', gland: '35A' },
    'TY35': { od: 30.2, halfOd: 15.1, area: 716.31, weight: 1770, type: 'TY35', din: '3 x 35', voltage: '0.6/1KV TPYCY-35', gland: '40A' },
    'TY50': { od: 35, halfOd: 17.5, area: 962.11, weight: 2420, type: 'TY50', din: '3 x 50', voltage: '0.6/1KV TPYCY-50', gland: '45A' },
    'TY70': { od: 39.5, halfOd: 19.75, area: 1225.42, weight: 3220, type: 'TY70', din: '3 x 70', voltage: '0.6/1KV TPYCY-70', gland: '45C' },
    'TY95': { od: 45.5, halfOd: 22.75, area: 1625.97, weight: 4310, type: 'TY95', din: '3 x 95', voltage: '0.6/1KV TPYCY-95', gland: '55A' },
    'TY120': { od: 49.6, halfOd: 24.8, area: 1932.21, weight: 5250, type: 'TY120', din: '3 x 120', voltage: '0.6/1KV TPYCY-120', gland: '55C' },
    'TY150': { od: 54.5, halfOd: 27.25, area: 2332.83, weight: 6350, type: 'TY150', din: '3 x 150', voltage: '0.6/1KV TPYCY-150', gland: '60B' },
    'H6KTY10': { od: 37.5, halfOd: 18.75, area: 1104.47, weight: 1725, type: 'H6KTY10', din: '3 x 10(H)', voltage: '3.6/6KV (H)TPYCY-10', gland: '45B' },
    'H6KTY16': { od: 39.6, halfOd: 19.8, area: 1231.63, weight: 2035, type: 'H6KTY16', din: '3 x 16(H)', voltage: '3.6/6KV (H)TPYCY-16', gland: '45C' },
    'H6KTY25': { od: 42.8, halfOd: 21.4, area: 1438.72, weight: 2500, type: 'H6KTY25', din: '3 x 25(H)', voltage: '3.6/6KV (H)TPYCY-25', gland: '50B' },
    'H6KTY35': { od: 45.8, halfOd: 22.9, area: 1647.48, weight: 2970, type: 'H6KTY35', din: '3 x 35(H)', voltage: '3.6/6KV (H)TPYCY-35', gland: '55A' },
    'H6KTY50': { od: 48.8, halfOd: 24.4, area: 1870.38, weight: 3515, type: 'H6KTY50', din: '3 x 50(H)', voltage: '3.6/6KV (H)TPYCY-50', gland: '55C' },
    'H6KTY70': { od: 53.2, halfOd: 26.6, area: 2222.87, weight: 4425, type: 'H6KTY70', din: '3 x 70(H)', voltage: '3.6/6KV (H)TPYCY-70', gland: '60B' },
    'H6KTY95': { od: 57.9, halfOd: 28.95, area: 2632.98, weight: 5515, type: 'H6KTY95', din: '3 x 95(H)', voltage: '3.6/6KV (H)TPYCY-95', gland: '65A' },
    'H6KTY120': { od: 61.8, halfOd: 30.9, area: 2999.62, weight: 5515, type: 'H6KTY120', din: '3 x 120(H)', voltage: '3.6/6KV (H)TPYCY-120', gland: '70A' },
    'H6KTY150': { od: 65.6, halfOd: 32.8, area: 3379.85, weight: 6510, type: 'H6KTY150', din: '3 x 150(H)', voltage: '3.6/6KV (H)TPYCY-150', gland: '75A' },
    'RG213U': { od: 10.5, halfOd: 5.25, area: 86.59, weight: 0, type: 'RG213U', din: 'x', voltage: 'RG213U 75OHM', gland: '20A' },
    'RG213UY': { od: 8.4, halfOd: 4.2, area: 55.42, weight: 0, type: 'RG213UY', din: 'x', voltage: 'RG213UY 75OHM', gland: '15B' },
    'RG213UYC': { od: 14.6, halfOd: 7.3, area: 167.42, weight: 310, type: 'RG213UYC', din: 'x', voltage: 'RG213UYC 75OHM', gland: '25A' }
  };

  // Remaining types (TS, TTS, TTY, TTYS, FTTS, FTTYS, MS, MYS, TYS, FTYS, SYS etc.)
  // Added as a secondary block to keep the file manageable
  const CABLE_TYPE_DB_EXT = {
    'TS1': { od: 13.2, halfOd: 6.6, area: 136.85, weight: 305, type: 'TS1', din: '3 x 1.5(S)', voltage: '0.6/1KV TPYCS-1.5', gland: '20C' },
    'TS2': { od: 14.2, halfOd: 7.1, area: 158.37, weight: 360, type: 'TS2', din: '3 x 2.5(S)', voltage: '0.6/1KV TPYCS-2.5', gland: '25A' },
    'TS4': { od: 15.7, halfOd: 7.85, area: 193.59, weight: 455, type: 'TS4', din: '3 x 4(S)', voltage: '0.6/1KV TPYCS-4', gland: '25A' },
    'TS6': { od: 17.2, halfOd: 8.6, area: 232.35, weight: 605, type: 'TS6', din: '3 x 6(S)', voltage: '0.6/1KV TPYCS-6', gland: '25B' },
    'TS10': { od: 19.6, halfOd: 9.8, area: 301.72, weight: 810, type: 'TS10', din: '3 x 10(S)', voltage: '0.6/1KV TPYCS-10', gland: '25C' },
    'TS16': { od: 21.9, halfOd: 10.95, area: 376.68, weight: 1070, type: 'TS16', din: '3 x 16(S)', voltage: '0.6/1KV TPYCS-16', gland: '30A' },
    'TS25': { od: 25.8, halfOd: 12.9, area: 522.79, weight: 1500, type: 'TS25', din: '3 x 25(S)', voltage: '0.6/1KV TPYCS-25', gland: '30C' },
    'TS35': { od: 28.6, halfOd: 14.3, area: 642.42, weight: 1900, type: 'TS35', din: '3 x 35(S)', voltage: '0.6/1KV TPYCS-35', gland: '35B' },
    'TS50': { od: 33, halfOd: 16.5, area: 855.30, weight: 2510, type: 'TS50', din: '3 x 50(S)', voltage: '0.6/1KV TPYCS-50', gland: '40B' },
    'TS70': { od: 386, halfOd: 193, area: 117021.18, weight: 3480, type: 'TS70', din: '3 x 70(S)', voltage: '0.6/1KV TPYCS-70', gland: '100B' },
    'TS95': { od: 43.1, halfOd: 21.55, area: 1458.96, weight: 4485, type: 'TS95', din: '3 x 95(S)', voltage: '0.6/1KV TPYCS-95', gland: '50B' },
    'TS120': { od: 46.7, halfOd: 23.35, area: 1712.87, weight: 5375, type: 'TS120', din: '3 x 120(S)', voltage: '0.6/1KV TPYCS-120', gland: '55B' },
    'TTS1': { od: 10.1, halfOd: 5.05, area: 80.12, weight: 180, type: 'TTS1', din: '1Pair x 0.75(S)', voltage: '250V TTYCS-1', gland: '20A' },
    'TTS2': { od: 14.1, halfOd: 7.05, area: 156.15, weight: 255, type: 'TTS2', din: '2Pair x 0.75(S)', voltage: '250V TTYCS-2', gland: '25A' },
    'TTS3': { od: 14.9, halfOd: 7.45, area: 174.37, weight: 295, type: 'TTS3', din: '3Pair x 0.75(S)', voltage: '250V TTYCS-3', gland: '25A' },
    'TTS4': { od: 16.3, halfOd: 8.15, area: 208.67, weight: 405, type: 'TTS4', din: '4Pair x 0.75(S)', voltage: '250V TTYCS-4', gland: '25B' },
    'TTS7': { od: 19, halfOd: 9.5, area: 283.53, weight: 545, type: 'TTS7', din: '7Pair x 0.75(S)', voltage: '250V TTYCS-7', gland: '25C' },
    'TTS10': { od: 24.1, halfOd: 12.05, area: 456.17, weight: 800, type: 'TTS10', din: '10Pair x 0.75(S)', voltage: '250V TTYCS-10', gland: '30C' },
    'TTS14': { od: 25.7, halfOd: 12.85, area: 518.75, weight: 935, type: 'TTS14', din: '14Pair x 0.75(S)', voltage: '250V TTYCS-14', gland: '30C' },
    'TTS19': { od: 28.8, halfOd: 14.4, area: 651.44, weight: 1160, type: 'TTS19', din: '19Pair x 0.75(S)', voltage: '250V TTYCS-19', gland: '35B' },
    'TTS24': { od: 34.9, halfOd: 17.45, area: 956.62, weight: 1600, type: 'TTS24', din: '24Pair x 0.75(S)', voltage: '250V TTYCS-24', gland: '45A' },
    'TTS30': { od: 37.3, halfOd: 18.65, area: 1092.72, weight: 1950, type: 'TTS30', din: '30Pair x 0.75(S)', voltage: '250V TTYCS-30', gland: '45B' },
    'TTS37': { od: 40.2, halfOd: 20.1, area: 1269.23, weight: 2250, type: 'TTS37', din: '37Pair x 0.75(S)', voltage: '250V TTYCS-37', gland: '50A' },
    'TTS48': { od: 46.1, halfOd: 23.05, area: 1669.14, weight: 2830, type: 'TTS48', din: '48Pair x 0.75(S)', voltage: '250V TTYCS-48', gland: '55B' },
    'TTS1Q': { od: 11.3, halfOd: 5.65, area: 100.29, weight: 230, type: 'TTS1Q', din: '4Core x 0.75(S)', voltage: '250V TTYCS-1Q', gland: '20B' },
    'TTS1T': { od: 10.6, halfOd: 5.3, area: 88.25, weight: 205, type: 'TTS1T', din: '3core x 0.75(S)', voltage: '250V TTYCS-1T', gland: '20A' },
    'TTY1': { od: 10.8, halfOd: 5.4, area: 91.61, weight: 170, type: 'TTY1', din: '1Pair x 0.75', voltage: '250V TTYCY-1', gland: '20A' },
    'TTY2': { od: 15.5, halfOd: 7.75, area: 188.69, weight: 295, type: 'TTY2', din: '2Pair x 0.75', voltage: '250V TTYCY-2', gland: '25A' },
    'TTY3': { od: 16.4, halfOd: 8.2, area: 211.24, weight: 345, type: 'TTY3', din: '3Pair x 0.75', voltage: '250V TTYCY-3', gland: '25B' },
    'TTY4': { od: 17.1, halfOd: 8.55, area: 229.66, weight: 380, type: 'TTY4', din: '4Pair x 0.75', voltage: '250V TTYCY-4', gland: '25B' },
    'TTY7': { od: 19.7, halfOd: 9.85, area: 304.81, weight: 510, type: 'TTY7', din: '7Pair x 0.75', voltage: '250V TTYCY-7', gland: '25C' },
    'TTY10': { od: 24.9, halfOd: 12.45, area: 486.95, weight: 750, type: 'TTY10', din: '10Pair x 0.75', voltage: '250V TTYCY-10', gland: '30C' },
    'TTY14': { od: 26.7, halfOd: 13.35, area: 559.90, weight: 890, type: 'TTY14', din: '14Pair x 0.75', voltage: '250V TTYCY-14', gland: '35A' },
    'TTY19': { od: 29.7, halfOd: 14.85, area: 692.79, weight: 1100, type: 'TTY19', din: '19Pair x 0.75', voltage: '250V TTYCY-19', gland: '35B' },
    'TTY24': { od: 35.7, halfOd: 17.85, area: 1000.98, weight: 1560, type: 'TTY24', din: '24Pair x 0.75', voltage: '250V TTYCY-24', gland: '45A' },
    'TTY30': { od: 38.1, halfOd: 19.05, area: 1140.09, weight: 1800, type: 'TTY30', din: '30Pair x 0.75', voltage: '250V TTYCY-30', gland: '45C' },
    'TTY37': { od: 41, halfOd: 20.5, area: 1320.25, weight: 2090, type: 'TTY37', din: '37Pair x 0.75', voltage: '250V TTYCY-37', gland: '50A' },
    'TTY48': { od: 47, halfOd: 23.5, area: 1734.94, weight: 2670, type: 'TTY48', din: '48Pair x 0.75', voltage: '250V TTYCY-48', gland: '55B' },
    'TTY1Q': { od: 12.3, halfOd: 6.15, area: 118.82, weight: 225, type: 'TTY1Q', din: '4Core x 0.75', voltage: '250V TTYCY-1Q', gland: '20B' },
    'TTY1T': { od: 11.2, halfOd: 5.6, area: 98.52, weight: 190, type: 'TTY1T', din: '3core x 0.75', voltage: '250V TTYCY-1T', gland: '20B' },
    'TTYS1': { od: 11.1, halfOd: 5.55, area: 96.77, weight: 230, type: 'TTYS1', din: '1Pair x 0.75(S)', voltage: '250V TTYCYS-1', gland: '20B' },
    'TTYS2': { od: 15.7, halfOd: 7.85, area: 193.59, weight: 330, type: 'TTYS2', din: '2Pair x 0.75(S)', voltage: '250V TTYCYS-2', gland: '25A' },
    'TTYS3': { od: 17.1, halfOd: 8.55, area: 229.66, weight: 375, type: 'TTYS3', din: '3Pair x 0.75(S)', voltage: '250V TTYCYS-3', gland: '25B' },
    'TTYS4': { od: 18.5, halfOd: 9.25, area: 268.80, weight: 490, type: 'TTYS4', din: '4Pair x 0.75(S)', voltage: '250V TTYCYS-4', gland: '25C' },
    'TTYS7': { od: 21.4, halfOd: 10.7, area: 359.68, weight: 650, type: 'TTYS7', din: '7Pair x 0.75(S)', voltage: '250V TTYCYS-7', gland: '30A' },
    'TTYS10': { od: 26.7, halfOd: 13.35, area: 559.90, weight: 945, type: 'TTYS10', din: '10Pair x 0.75(S)', voltage: '250V TTYCYS-10', gland: '35A' },
    'TTYS14': { od: 28.3, halfOd: 14.15, area: 629.02, weight: 1090, type: 'TTYS14', din: '14Pair x 0.75(S)', voltage: '250V TTYCYS-14', gland: '35B' },
    'TTYS19': { od: 31.6, halfOd: 15.8, area: 784.27, weight: 1340, type: 'TTYS19', din: '19Pair x 0.75(S)', voltage: '250V TTYCYS-19', gland: '40A' },
    'TTYS24': { od: 38.3, halfOd: 19.15, area: 1152.09, weight: 1860, type: 'TTYS24', din: '24Pair x 0.75(S)', voltage: '250V TTYCYS-24', gland: '45C' },
    'TTYS30': { od: 40.7, halfOd: 20.35, area: 1301.00, weight: 2230, type: 'TTYS30', din: '30Pair x 0.75(S)', voltage: '250V TTYCYS-30', gland: '50A' },
    'TTYS37': { od: 43.8, halfOd: 21.9, area: 1506.74, weight: 2570, type: 'TTYS37', din: '37Pair x 0.75(S)', voltage: '250V TTYCYS-37', gland: '50B' },
    'TTYS48': { od: 50.1, halfOd: 25.05, area: 1971.36, weight: 3240, type: 'TTYS48', din: '48Pair x 0.75(S)', voltage: '250V TTYCYS-48', gland: '60A' },
    'TTYS1Q': { od: 13.3, halfOd: 6.65, area: 138.93, weight: 285, type: 'TTYS1Q', din: '4Core x 0.75(S)', voltage: '250V TTYCYS-1Q', gland: '20C' },
    'TTYS1T': { od: 12.6, halfOd: 6.3, area: 124.69, weight: 355, type: 'TTYS1T', din: '3core x 0.75(S)', voltage: '250V TTYCYS-1T', gland: '20B' },
    'MS2': { od: 10.7, halfOd: 5.35, area: 89.92, weight: 205, type: 'MS2', din: '2 x 1(S)', voltage: '250V MPYCS-2', gland: '20A' },
    'MS4': { od: 11.9, halfOd: 5.95, area: 111.22, weight: 260, type: 'MS4', din: '4 x 1(S)', voltage: '250V MPYCS-4', gland: '20B' },
    'MS7': { od: 13.9, halfOd: 6.95, area: 151.75, weight: 355, type: 'MS7', din: '7 x 1(S)', voltage: '250V MPYCS-7', gland: '20C' },
    'MS12': { od: 17.6, halfOd: 8.8, area: 243.28, weight: 540, type: 'MS12', din: '12 x 1(S)', voltage: '250V MPYCS-12', gland: '25B' },
    'MS19': { od: 20.6, halfOd: 10.3, area: 333.29, weight: 735, type: 'MS19', din: '19 x 1(S)', voltage: '250V MPYCS-19', gland: '30A' },
    'MS27': { od: 24.3, halfOd: 12.15, area: 463.77, weight: 995, type: 'MS27', din: '27 x 1(S)', voltage: '250V MPYCS-27', gland: '30C' },
    'MS37': { od: 27, halfOd: 13.5, area: 572.56, weight: 1240, type: 'MS37', din: '37 x 1(S)', voltage: '250V MPYCS-37', gland: '35A' },
    'MS44': { od: 30.2, halfOd: 15.1, area: 716.31, weight: 1480, type: 'MS44', din: '44 x 1(S)', voltage: '250V MPYCS-44', gland: '40A' },
    'MYS2': { od: 12.7, halfOd: 6.35, area: 126.68, weight: 255, type: 'MYS2', din: '2 x 1(S)', voltage: '250V MPYCYS-2', gland: '20B' },
    'MYS4': { od: 13.9, halfOd: 6.95, area: 151.75, weight: 315, type: 'MYS4', din: '4 x 1(S)', voltage: '250V MPYCYS-4', gland: '20C' },
    'MYS7': { od: 15.9, halfOd: 7.95, area: 198.56, weight: 420, type: 'MYS7', din: '7 x 1(S)', voltage: '250V MPYCYS-7', gland: '25A' },
    'MYS12': { od: 19.8, halfOd: 9.9, area: 307.91, weight: 625, type: 'MYS12', din: '12 x 1(S)', voltage: '250V MPYCYS-12', gland: '25C' },
    'MYS19': { od: 23, halfOd: 11.5, area: 415.48, weight: 850, type: 'MYS19', din: '19 x 1(S)', voltage: '250V MPYCYS-19', gland: '30B' },
    'MYS27': { od: 26.9, halfOd: 13.45, area: 568.32, weight: 1140, type: 'MYS27', din: '27 x 1(S)', voltage: '250V MPYCYS-27', gland: '35A' },
    'MYS37': { od: 29.8, halfOd: 14.9, area: 697.46, weight: 1410, type: 'MYS37', din: '37 x 1(S)', voltage: '250V MPYCYS-37', gland: '35B' },
    'MYS44': { od: 32.5, halfOd: 16.25, area: 829.58, weight: 1490, type: 'MYS44', din: '44 x 1(S)', voltage: '250V MPYCYS-44', gland: '40B' },
    'TYS1': { od: 15.2, halfOd: 7.6, area: 181.46, weight: 365, type: 'TYS1', din: '3 x 1.5(S)', voltage: '0.6/1KV TPYCYS-1.5', gland: '25A' },
    'TYS2': { od: 15.7, halfOd: 7.85, area: 193.59, weight: 430, type: 'TYS2', din: '3 x 2.5(S)', voltage: '0.6/1KV TPYCYS-2.5', gland: '25A' },
    'TYS4': { od: 17.9, halfOd: 8.95, area: 251.65, weight: 535, type: 'TYS4', din: '3 x 4(S)', voltage: '0.6/1KV TPYCYS-4', gland: '25B' },
    'TYS6': { od: 19.4, halfOd: 9.7, area: 295.59, weight: 700, type: 'TYS6', din: '3 x 6(S)', voltage: '0.6/1KV TPYCYS-6', gland: '25C' },
    'TYS10': { od: 22, halfOd: 11, area: 380.13, weight: 935, type: 'TYS10', din: '3 x 10(S)', voltage: '0.6/1KV TPYCYS-10', gland: '30A' },
    'TYS16': { od: 24.3, halfOd: 12.15, area: 463.77, weight: 1200, type: 'TYS16', din: '3 x 16(S)', voltage: '0.6/1KV TPYCYS-16', gland: '30C' },
    'TYS25': { od: 28.4, halfOd: 14.2, area: 633.47, weight: 1665, type: 'TYS25', din: '3 x 25(S)', voltage: '0.6/1KV TPYCYS-25', gland: '35B' },
    'TYS35': { od: 31.4, halfOd: 15.7, area: 774.37, weight: 2100, type: 'TYS35', din: '3 x 35(S)', voltage: '0.6/1KV TPYCYS-35', gland: '40A' },
    'TYS50': { od: 36, halfOd: 18, area: 1017.88, weight: 2750, type: 'TYS50', din: '3 x 50(S)', voltage: '0.6/1KV TPYCYS-50', gland: '45A' },
    'TYS70': { od: 42, halfOd: 21, area: 1385.44, weight: 3800, type: 'TYS70', din: '3 x 70(S)', voltage: '0.6/1KV TPYCYS-70', gland: '50A' },
    'TYS95': { od: 46.7, halfOd: 23.35, area: 1712.87, weight: 4860, type: 'TYS95', din: '3 x 95(S)', voltage: '0.6/1KV TPYCYS-95', gland: '55B' },
    'TYS120': { od: 50.5, halfOd: 25.25, area: 2002.96, weight: 5810, type: 'TYS120', din: '3 x 120(S)', voltage: '0.6/1KV TPYCYS-120', gland: '60A' },
    'FTTS1': { od: 10.5, halfOd: 5.25, area: 86.59, weight: 165, type: 'FTTS1', din: '1Pair x 0.75(S)(F)', voltage: '250V FR-TTYCS-1', gland: '20A' },
    'FTTS2': { od: 15, halfOd: 7.5, area: 176.71, weight: 285, type: 'FTTS2', din: '2Pair x 0.75(S)(F)', voltage: '250V FR-TTYCS-2', gland: '25A' },
    'FTTS3': { od: 15.4, halfOd: 7.7, area: 186.27, weight: 235, type: 'FTTS3', din: '3Pair x 0.75(S)(F)', voltage: '250V FR-TTYCS-3', gland: '25A' },
    'FTTS4': { od: 17.4, halfOd: 8.7, area: 237.79, weight: 400, type: 'FTTS4', din: '4Pair x 0.75(S)(F)', voltage: '250V FR-TTYCS-4', gland: '25B' },
    'FTTS7': { od: 20.7, halfOd: 10.35, area: 336.54, weight: 570, type: 'FTTS7', din: '7Pair x 0.75(S)(F)', voltage: '250V FR-TTYCS-7', gland: '30A' },
    'FTTS10': { od: 24.1, halfOd: 12.05, area: 456.17, weight: 790, type: 'FTTS10', din: '10Pair x 0.75(S)(F)', voltage: '250V FR-TTYCS-10', gland: '30C' },
    'FTTS16': { od: 28.8, halfOd: 14.4, area: 651.44, weight: 765, type: 'FTTS16', din: '16Pair x 0.75(S)(F)', voltage: '250V FR-TTYCS-16', gland: '35B' },
    'FTTS20': { od: 48.6, halfOd: 24.3, area: 1855.08, weight: 2080, type: 'FTTS20', din: '20Pair x 0.75(S)(F)', voltage: '250V FR-TTYCS-20', gland: '55C' },
    'FTTS50': { od: 48.6, halfOd: 24.3, area: 1855.08, weight: 2080, type: 'FTTS50', din: '50Pair x 0.75(S)(F)', voltage: '250V FR-TTYCS-50', gland: '55C' },
    'FTTYS1': { od: 12.3, halfOd: 6.15, area: 118.82, weight: 210, type: 'FTTYS1', din: '1Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-1', gland: '20B' },
    'FTTYS2': { od: 17, halfOd: 8.5, area: 226.98, weight: 355, type: 'FTTYS2', din: '2Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-2', gland: '25B' },
    'FTTYS4': { od: 19.4, halfOd: 9.7, area: 295.59, weight: 480, type: 'FTTYS4', din: '4Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-4', gland: '25C' },
    'FTTYS7': { od: 22.9, halfOd: 11.45, area: 411.87, weight: 675, type: 'FTTYS7', din: '7Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-7', gland: '30B' },
    'FTTYS10': { od: 27.5, halfOd: 13.75, area: 593.96, weight: 930, type: 'FTTYS10', din: '10Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-10', gland: '35A' },
    'FTTYS14': { od: 30.7, halfOd: 15.35, area: 740.23, weight: 1180, type: 'FTTYS14', din: '14Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-14', gland: '40A' },
    'FTTYS19': { od: 35.5, halfOd: 17.75, area: 989.80, weight: 1595, type: 'FTTYS19', din: '19Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-19', gland: '45A' },
    'FTTYS24': { od: 39.1, halfOd: 19.55, area: 1200.72, weight: 1920, type: 'FTTYS24', din: '24Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-24', gland: '45C' },
    'FTTYS30': { od: 43, halfOd: 21.5, area: 1452.20, weight: 2305, type: 'FTTYS30', din: '30Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-30', gland: '50B' },
    'FTTYS37': { od: 47.3, halfOd: 23.65, area: 1757.16, weight: 2770, type: 'FTTYS37', din: '37Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-37', gland: '55B' },
    'FTTYS48': { od: 53, halfOd: 26.5, area: 2206.18, weight: 3455, type: 'FTTYS48', din: '48Pair x 0.75(S)(F)', voltage: '250V FR-TTYCYS-48', gland: '60B' },
    'FTYS1': { od: 17.3, halfOd: 8.65, area: 235.06, weight: 440, type: 'FTYS1', din: '3 x 1.5(S)(F)', voltage: '0.6/1KV FR-TPYCYS-1.5', gland: '25B' },
    'FTYS2': { od: 18.3, halfOd: 9.15, area: 263.02, weight: 505, type: 'FTYS2', din: '3 x 2.5(S)(F)', voltage: '0.6/1KV FR-TPYCYS-2.5', gland: '25C' },
    'FTYS4': { od: 19.6, halfOd: 9.8, area: 301.72, weight: 595, type: 'FTYS4', din: '3 x 4(S)(F)', voltage: '0.6/1KV FR-TPYCYS-4', gland: '25C' },
    'FTYS6': { od: 21.1, halfOd: 10.55, area: 349.67, weight: 710, type: 'FTYS6', din: '3 x 6(S)(F)', voltage: '0.6/1KV FR-TPYCYS-6', gland: '30A' },
    'SYS2': { od: 9.4, halfOd: 4.7, area: 69.40, weight: 150, type: 'SYS2', din: '1 x 2.5(S)', voltage: '0.6/1KV SPYCS-2', gland: '15C' },
    'MYS2IS': { od: 12.7, halfOd: 6.35, area: 126.68, weight: 255, type: 'MYS2IS', din: '2 x 1(S)', voltage: '250V MPYCYS-2IS', gland: '20B' },
    'MYS4IS': { od: 13.9, halfOd: 6.95, area: 151.75, weight: 315, type: 'MYS4IS', din: '4 x 1(S)', voltage: '250V MPYCYS-4IS', gland: '20C' },
    'MYS7IS': { od: 15.9, halfOd: 7.95, area: 198.56, weight: 420, type: 'MYS7IS', din: '7 x 1(S)', voltage: '250V MPYCYS-7IS', gland: '25A' },
    'MYS12IS': { od: 19.8, halfOd: 9.9, area: 307.91, weight: 625, type: 'MYS12IS', din: '12 x 1(S)', voltage: '250V MPYCYS-12IS', gland: '25C' },
    'MYS19IS': { od: 23, halfOd: 11.5, area: 415.48, weight: 850, type: 'MYS19IS', din: '19 x 1(S)', voltage: '250V MPYCYS-19IS', gland: '30B' },
    'MYS27IS': { od: 26.9, halfOd: 13.45, area: 568.32, weight: 1140, type: 'MYS27IS', din: '27 x 1(S)', voltage: '250V MPYCYS-27IS', gland: '35A' },
    'MYS37IS': { od: 29.8, halfOd: 14.9, area: 697.46, weight: 1410, type: 'MYS37IS', din: '37 x 1(S)', voltage: '250V MPYCYS-37IS', gland: '35B' },
    'MYS44IS': { od: 32.5, halfOd: 16.25, area: 829.58, weight: 1490, type: 'MYS44IS', din: '44 x 1(S)', voltage: '250V MPYCYS-44IS', gland: '40B' },
    'MC': { od: 0, halfOd: 0, area: 0, weight: 0, type: 'MC', din: 'x', voltage: 'MC', gland: '' },
    'FDS10': { od: 0, halfOd: 0, area: 0, weight: 0, type: 'FDS10', din: '2 x 10(S)(F)', voltage: '0.6/1KV FR-DPYCS-10', gland: '' },
    'FDYS10': { od: 0, halfOd: 0, area: 0, weight: 0, type: 'FDYS10', din: '2 x 10(S)(F)', voltage: '0.6/1KV FR-DPYCYS-10', gland: '' }
  };

  // Merge into single lookup
  Object.assign(CABLE_TYPE_DB, CABLE_TYPE_DB_EXT);

  /**
   * Lookup cable type info from master DB
   * @param {string} typeCode - Cable type code (e.g., 'T4', 'FT25')
   * @returns {object|null} Cable type info or null
   */
  function lookupCableType(typeCode) {
    if (!typeCode) return null;
    const code = String(typeCode).trim().toUpperCase();
    return CABLE_TYPE_DB[code] || CABLE_TYPE_DB[typeCode] || null;
  }

  /**
   * Get cable O.D. (outer diameter) in mm
   */
  function getCableOD(typeCode) {
    const info = lookupCableType(typeCode);
    return info ? info.od : 0;
  }

  /**
   * Get cable weight in g/m
   */
  function getCableWeight(typeCode) {
    const info = lookupCableType(typeCode);
    return info ? info.weight : 0;
  }

  /**
   * Get cable cross-section area in mm²
   */
  function getCableArea(typeCode) {
    const info = lookupCableType(typeCode);
    return info ? info.area : 0;
  }

// --- END 05-cable-type-db.js ---

// --- BEGIN 10-routing-engine.js ---
  async function handleDataFile(event, kind) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    try {
      showBusy(`${kind === 'cable' ? '케이블' : '노드'} 파일을 읽는 중입니다...`);
      const payload = await loadFilePayload(file);
      if (kind === 'cable') {
        state.cables = extractCablesFromPayload(payload);
        if (!state.cables.length) {
          pushToast('케이블 파일에서 유효한 데이터를 찾지 못했습니다.', 'warn');
        } else {
          state.selectedCableId = state.cables[0]?.id || null;
          syncRouteInputsFromSelected();
          pushToast(`케이블 ${state.cables.length}건을 불러왔습니다.`, 'success');
        }
      } else {
        state.uploadedNodes = extractNodesFromPayload(payload);
        pushToast(`노드 ${state.uploadedNodes.length}건을 불러왔습니다.`, 'success');
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

      // Auto-route when both cables and nodes are loaded
      const hasBoth = state.cables.length > 0 && state.uploadedNodes.length > 0;
      if (hasBoth) {
        showBusy('자동 라우팅 실행 중...');
        await recalculateAllCables({ quiet: true });
        runTripleValidation({ quiet: true });
        hideBusy();
        pushToast(`자동 라우팅 완료: ${state.cables.length}개 케이블`, 'success');
      } else {
        await recalculateAllCables({ quiet: true, skipWhenNoCables: true });
      }

      renderAll();
      commitHistory(kind === 'cable' ? 'cable-file-load' : 'node-file-load');
      updateProjectStatus(`${String(kind || 'file').toUpperCase()} LOADED`);
    } catch (error) {
      console.error(error);
      pushToast(`파일 처리 중 오류가 발생했습니다: ${error.message}`, 'error');
    } finally {
      hideBusy();
      input.value = '';
    }
  }


  const _routeCache = new Map();

  function clearRouteCache() {
    _routeCache.clear();
  }

  function refreshGraph() {
    const merged = mergeNodes(state.embeddedNodes, state.uploadedNodes);
    state.mergedNodes = merged;
    state.graph = buildGraph(merged);
    clearRouteCache();
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
        pushToast('먼저 케이블 파일을 불러와 주세요.', 'warn');
      }
      return;
    }

    showBusy(`전체 경로를 계산하는 중입니다... 0 / ${state.cables.length}`);
    for (let index = 0; index < state.cables.length; index += 1) {
      const cable = state.cables[index];
      applyRouteToCable(cable);
      cable.validation = validateCable(cable);
      if (index % 120 === 0) {
        dom.busyText.textContent = `전체 경로를 계산하는 중입니다... ${index + 1} / ${state.cables.length}`;
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
      pushToast(`전체 케이블 ${state.cables.length}건의 경로 계산이 완료됐습니다.`, 'success');
    }
  }

  function applyRouteToCable(cable) {
    const route = computeRouteBreakdown(cable);
    const hasError = route && route.error;
    cable.routeBreakdown = hasError ? null : route;
    cable.routeError = hasError ? route : null;
    cable.calculatedPath = (!hasError && route) ? route.pathNodes.join(' -> ') : '';
    cable.calculatedLength = (!hasError && route) ? route.totalLength : 0;
    return cable;
  }

  function computeRouteBreakdown(sourceCable) {
    const cable = sourceCable || {};
    const from = trimText(cable.fromNode);
    const to = trimText(cable.toNode);
    const checkNodes = parseNodeList(cable.checkNode, false);
    const fromRest = toNumber(cable.fromRest, 0);
    const toRest = toNumber(cable.toRest, 0);

    if (!from || !to) {
      return { error: 'MISSING_ENDPOINTS', from, to, pathNodes: [], totalLength: 0 };
    }
    if (!state.graph.nodeMap[from]) {
      return { error: 'NODE_NOT_FOUND', node: from, pathNodes: [], totalLength: 0 };
    }
    if (!state.graph.nodeMap[to]) {
      return { error: 'NODE_NOT_FOUND', node: to, pathNodes: [], totalLength: 0 };
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
        return { error: 'DISCONNECTED', from: current, to: target, pathNodes: [], totalLength: 0 };
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
        return { error: 'EDGE_MISSING', from: fullPath[index], to: fullPath[index + 1], pathNodes: [], totalLength: 0 };
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

    const cacheKey = `${from}::${to}`;
    if (_routeCache.has(cacheKey)) {
      return _routeCache.get(cacheKey);
    }

    const result = _dijkstraCore(from, to);
    if (result) {
      _routeCache.set(cacheKey, result);
    }
    return result;
  }

  function _dijkstraCore(from, to) {
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

  function _dijkstraCoreExcluding(from, to, excludedEdges, excludedNodes) {
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
      if (excludedNodes.has(node) && node !== from && node !== to) continue;
      settled.add(node);
      if (node === to) break;
      if (distance > distances[node]) continue;
      (state.graph.adjacency[node] || []).forEach((edge) => {
        if (settled.has(edge.to)) return;
        if (excludedNodes.has(edge.to) && edge.to !== to) return;
        const ek = `${node}::${edge.to}`;
        if (excludedEdges.has(ek)) return;
        const next = distance + edge.weight;
        if (next < distances[edge.to]) {
          distances[edge.to] = next;
          previous[edge.to] = node;
          heap.push(next, edge.to);
        }
      });
    }

    if (!Number.isFinite(distances[to])) return null;
    const path = [];
    let current = to;
    const guard = new Set();
    while (current) {
      if (guard.has(current)) return null;
      guard.add(current);
      path.unshift(current);
      current = previous[current];
    }
    return path[0] === from ? { path, length: round2(distances[to]) } : null;
  }

  function kShortestPaths(from, to, k = 3) {
    if (from === to) return [{ path: [from], length: 0 }];
    if (!state.graph.nodeMap[from] || !state.graph.nodeMap[to]) return [];

    const shortest = _dijkstraCore(from, to);
    if (!shortest) return [];

    const A = [shortest];
    const B = [];
    const pathStrings = new Set([shortest.path.join('::')]);

    for (let i = 1; i < k; i++) {
      const prevPath = A[i - 1].path;
      for (let j = 0; j < prevPath.length - 1; j++) {
        const spurNode = prevPath[j];
        const rootPath = prevPath.slice(0, j + 1);
        let rootLength = 0;
        for (let r = 0; r < rootPath.length - 1; r++) {
          const ei = getEdgeInfo(rootPath[r], rootPath[r + 1]);
          rootLength += ei ? ei.weight : 0;
        }

        const excludedEdges = new Set();
        const excludedNodes = new Set();
        for (const existingPath of A) {
          const ep = existingPath.path;
          if (ep.length > j && ep.slice(0, j + 1).join('::') === rootPath.join('::')) {
            excludedEdges.add(`${ep[j]}::${ep[j + 1]}`);
          }
        }
        for (let r = 0; r < j; r++) {
          excludedNodes.add(rootPath[r]);
        }

        const spurResult = _dijkstraCoreExcluding(spurNode, to, excludedEdges, excludedNodes);
        if (spurResult) {
          const fullPath = rootPath.slice(0, -1).concat(spurResult.path);
          const fullLength = round2(rootLength + spurResult.length);
          const key = fullPath.join('::');
          if (!pathStrings.has(key)) {
            B.push({ path: fullPath, length: fullLength });
            pathStrings.add(key);
          }
        }
      }

      if (!B.length) break;
      B.sort((a, b) => a.length - b.length);
      A.push(B.shift());
    }

    return A;
  }

  function computeAlternativeRoutes(cable) {
    const from = trimText(cable.fromNode);
    const to = trimText(cable.toNode);
    if (!from || !to) return [];

    const alternatives = kShortestPaths(from, to, 3);
    return alternatives.map((alt, index) => {
      const fromRest = toNumber(cable.fromRest, 0);
      const toRest = toNumber(cable.toRest, 0);
      const totalLength = round2(alt.length + fromRest + toRest);
      const segments = [];
      for (let i = 0; i < alt.path.length - 1; i++) {
        const ei = getEdgeInfo(alt.path[i], alt.path[i + 1]);
        segments.push({
          from: alt.path[i],
          to: alt.path[i + 1],
          length: ei ? ei.weight : 0
        });
      }
      return {
        rank: index + 1,
        path: alt.path,
        graphLength: alt.length,
        fromRest,
        toRest,
        totalLength,
        segments,
        nodeCount: alt.path.length
      };
    });
  }

  function suggestRoutingOptimization(threshold = 15) {
    const nodeLoad = Object.create(null);
    state.cables.forEach((cable) => {
      const path = parsePathString(cable.calculatedPath);
      path.forEach((nodeName) => {
        nodeLoad[nodeName] = (nodeLoad[nodeName] || 0) + 1;
      });
    });

    const overloaded = Object.entries(nodeLoad)
      .filter(([, count]) => count > threshold)
      .sort((a, b) => b[1] - a[1]);

    const suggestions = [];
    for (const [nodeName, cableCount] of overloaded) {
      const affectedCables = state.cables.filter((cable) => {
        const path = parsePathString(cable.calculatedPath);
        return path.includes(nodeName);
      });

      let potentialSavings = 0;
      let redistributable = 0;
      for (const cable of affectedCables.slice(0, 5)) {
        const alts = computeAlternativeRoutes(cable);
        if (alts.length > 1) {
          const altWithout = alts.find((a) => a.rank > 1 && !a.path.includes(nodeName));
          if (altWithout) {
            redistributable++;
            potentialSavings += round2((cable.calculatedLength || 0) - altWithout.totalLength);
          }
        }
      }

      suggestions.push({
        nodeName,
        cableCount,
        redistributable,
        potentialLengthDelta: round2(potentialSavings)
      });
    }

    return suggestions;
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
    const checkNodes = parseNodeList(cable.checkNode, false);
    const route = cable.routeBreakdown || computeRouteBreakdown(cable);

    if (!trimText(cable.system)) addIssue(issues, 'warn', 'CABLE SYSTEM이 비어 있습니다.');
    if (!trimText(cable.type)) addIssue(issues, 'warn', 'CABLE TYPE이 비어 있습니다.');
    if (toNumber(cable.fromRest, 0) < 0 || toNumber(cable.toRest, 0) < 0) {
      addIssue(issues, 'fail', 'FROM_REST 또는 TO_REST 값이 음수입니다.');
    }
    if (cable.outDia && toNumber(cable.outDia, 0) <= 0) {
      addIssue(issues, 'warn', 'CABLE_OUTDIA 값이 0 이하입니다.');
    }
    if (!from) addIssue(issues, 'fail', 'FROM NODE가 비어 있습니다.');
    if (!to) addIssue(issues, 'fail', 'TO NODE가 비어 있습니다.');
    if (from && !state.graph.nodeMap[from]) addIssue(issues, 'fail', `FROM NODE "${from}"가 그래프에 없습니다.`);
    if (to && !state.graph.nodeMap[to]) addIssue(issues, 'fail', `TO NODE "${to}"가 그래프에 없습니다.`);
    const missingChecks = checkNodes.filter((name) => !state.graph.nodeMap[name]);
    if (missingChecks.length) addIssue(issues, 'fail', `CHECK NODE 누락: ${missingChecks.join(', ')}`);

    let isContinuous = false;
    let allEdgesExist = false;
    let coordsReady = false;
    let declaredPathMatch = null;
    let lengthMatched = false;
    let mapSegmentsMatch = false;
    let waypointOrderMatched = checkNodes.length === 0;
    let mapStatus = 'NO PATH';

    if (!route) {
      const errMsg = cable.routeError
        ? `경로 탐색 실패: ${cable.routeError.error} (${cable.routeError.from || ''} → ${cable.routeError.to || ''})`
        : '경로 탐색에 실패했습니다.';
      addIssue(issues, 'fail', errMsg);
    } else {
      const pairs = route.pathNodes.slice(1).map((node, index) => [route.pathNodes[index], node]);
      allEdgesExist = pairs.every(([a, b]) => Boolean(getEdgeInfo(a, b)));
      isContinuous = route.pathNodes[0] === from && route.pathNodes[route.pathNodes.length - 1] === to && allEdgesExist;
      if (!allEdgesExist) {
        addIssue(issues, 'fail', '계산된 path 안에 실제 relation edge가 없는 구간이 있습니다.');
      }
      const recalculatedGraph = round2(route.segmentLengths.reduce((sum, value) => sum + value, 0));
      if (!approx(recalculatedGraph, route.graphLength)) {
        addIssue(issues, 'fail', 'segment 길이 합과 graphLength가 서로 다릅니다.');
      }
      waypointOrderMatched = pathContainsNodesInOrder(route.pathNodes, checkNodes);
      if (!waypointOrderMatched) {
        addIssue(issues, 'fail', 'CHECK_NODE 순서가 계산 경로에 반영되지 않았습니다.');
      }
      const expectedTotal = round2(route.graphLength + toNumber(cable.fromRest, 0) + toNumber(cable.toRest, 0));
      lengthMatched = approx(expectedTotal, cable.calculatedLength || route.totalLength);
      if (!lengthMatched) {
        addIssue(issues, 'fail', 'TOTAL LENGTH에 FROM_REST / TO_REST 반영이 맞지 않습니다.');
      }
      if (cable.length > 0 && !approx(cable.length, expectedTotal)) {
        addIssue(issues, 'warn', 'POR_LENGTH와 계산된 TOTAL LENGTH가 다릅니다.');
      }

      const coordsMissing = route.pathNodes.filter((name) => !state.graph.nodeMap[name]?.hasCoords);
      coordsReady = coordsMissing.length === 0;
      if (!coordsReady) {
        addIssue(issues, 'warn', `좌표 없는 노드: ${coordsMissing.join(', ')}`);
      }

      const expectedSegments = Math.max(0, route.pathNodes.length - 1);
      const drawableSegments = countDrawableSegments(route.pathNodes);
      mapSegmentsMatch = drawableSegments === expectedSegments;
      mapStatus = !route.pathNodes.length ? 'NO PATH' : coordsReady ? 'READY' : 'COORD MISSING';
      if (!mapSegmentsMatch) {
        addIssue(issues, coordsReady ? 'fail' : 'warn', `맵 렌더 가능 구간 ${drawableSegments}/${expectedSegments}`);
      }

      if (cable.path) {
        declaredPathMatch = arraysEqual(parsePathString(cable.path), route.pathNodes);
        if (!declaredPathMatch) {
          addIssue(issues, 'warn', '원본 PATH와 계산 PATH가 다릅니다.');
        }
      }

      const asymmetricHits = pairs.filter(([a, b]) => {
        const edge = getEdgeInfo(a, b);
        return edge && !edge.symmetric;
      });
      if (asymmetricHits.length) {
        addIssue(issues, 'warn', `비대칭 relation 구간 포함: ${asymmetricHits.map((pair) => pair.join(' <-> ')).join(', ')}`);
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
      pushToast('Graph / Route / Map 3중 검증을 완료했습니다.', 'success');
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

  let activeDeckFilter = 'ALL';

  // renderAll() is defined in 60-auth-groupspace-final.js (final version with all panels)

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
      dom.graphIssueList.innerHTML = renderIssueItem('success', '그래프 이슈가 없습니다.');
      return;
    }
    dom.graphIssueList.innerHTML = items.join('');
  }

  function getFilteredCables() {
    const search = trimText(dom.searchInput.value).toLowerCase();
    const validationFilter = dom.validationFilter.value;
    const systemFilter = dom.systemFilter.value;

    return state.cables.filter((cable) => {
      // Deck tree filter
      if (activeDeckFilter && activeDeckFilter !== 'ALL') {
        const deck = (cable.supplyDeck || cable.fromRoom || 'UNKNOWN').trim().toUpperCase();
        if (deck !== activeDeckFilter) return false;
      }
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
      dom.cableGridInner.innerHTML = '<div class="empty-state">조건에 맞는 케이블이 없습니다.</div>';
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
      row.innerHTML = GRID_COLUMNS.map((column) => renderGridCell(cable, column, index)).join('');
      row.addEventListener('click', () => selectCable(cable.id));
      row.addEventListener('dblclick', () => selectCable(cable.id, { focusEditor: true }));
      dom.cableGridInner.appendChild(row);
    }
  }

  function renderGridCell(cable, column, rowIndex) {
    let content = '';
    let title = '';
    const value = cable[column.key];

    if (column.special === 'rowNum') {
      content = String(rowIndex + 1);
      title = content;
    } else if (column.special === 'validation') {
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
      dom.editorStatus.textContent = '선택된 케이블 없음';
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
    const normalizedCheckNode = parseNodeList(dom.editCheckNode.value, false).join(', ');
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
        cable.path = cable.calculatedPath || [cable.fromNode, ...parseNodeList(cable.checkNode, false), cable.toNode].join(' -> ');
      }

      if (options.validate || options.recalc || options.forceRoute || validationChanged) {
        cable.validation = validateCable(cable);
        refreshDiagnosticsSummary();
      } else if (routeChanged) {
        cable.validation = {
          status: 'PENDING',
          issues: [{ severity: 'warn', message: '경로가 변경되었습니다. 재계산이 필요합니다.' }],
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
        ? '체크노드를 강제 적용한 경로로 저장했습니다.'
        : options.recalc
          ? '케이블을 수정하고 재산출 후 저장했습니다.'
          : '케이블을 수정하고 저장했습니다.', 'success');
    } catch (error) {
      console.error(error);
      Object.assign(cable, before);
      populateEditor();
      renderAll();
      pushToast(error.message || '케이블 저장에 실패했습니다.', 'error');
    }
  }

  function validateSelectedCable(announce) {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('검증할 케이블을 선택해 주세요.', 'warn');
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
      pushToast(`${cable.name} 검증을 완료했습니다.`, 'success');
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
    pushToast('입력기 값을 아래 케이블 값으로 되돌립니다.', 'info');
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
    pushToast('새 케이블을 추가했습니다.', 'success');
  }

  function duplicateSelectedCable() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('복제할 케이블을 선택해 주세요.', 'warn');
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
       issues: [{ severity: 'warn', message: '복제 후 재산출이 필요합니다.' }],
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
    pushToast('선택 케이블을 복제했습니다.', 'success');
  }

  function deleteSelectedCable() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('삭제할 케이블을 선택해 주세요.', 'warn');
      return;
    }
    if (!window.confirm(`${cable.name} 케이블을 삭제할까요?`)) {
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
    pushToast('케이블을 삭제했습니다.', 'success');
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
    pushToast('수동 경로 미리보기를 갱신했습니다.', 'success');
  }

  function clearManualPreview() {
    state.manualPreview = null;
    renderRoutingPanel();
     pushToast('수동 미리보기를 해제했습니다.', 'info');
  }

  function focusSelectedCableOnMap() {
    const cable = getSelectedCable();
    if (!cable) {
      pushToast('먼저 케이블을 선택해 주세요.', 'warn');
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
      renderDashPathTable(null);
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

    if (dom.detailMapCanvas && dom.detailMapCanvas.offsetParent) {
      const mapStats = renderMapCanvas(dom.detailMapCanvas, route, { fitToPath: true });
      dom.detailMapMeta.textContent = route
        ? `노드 ${route.pathNodes.length}개 | 2D drawable segment ${mapStats.drawnSegments}/${Math.max(route.pathNodes.length - 1, 0)}`
        : '계산된 경로가 없습니다.';
    }

    renderDashPathTable(cable);
  }

  function renderDashPathTable(cable) {
    if (!dom.dashPathTable) return;
    if (!cable || !cable.routeBreakdown) {
      dom.dashPathTable.innerHTML = '<div style="padding:6px;color:#64748b;font-size:10px;">더블클릭으로 케이블 선택</div>';
      return;
    }
    const route = cable.routeBreakdown;
    const rows = route.pathNodes.map((nodeName, idx) => {
      const node = state.graph.nodeMap[nodeName];
      const deck = node?.structure || '-';
      const seg = route.edgeSegments[idx] || null;
      const segLen = seg ? formatNumber(seg.length) : '-';
      return `<div class="dash-path-row">
        <div class="dash-path-cell" style="min-width:24px">${idx + 1}</div>
        <div class="dash-path-cell" style="min-width:42px" title="${escapeHtml(deck)}">${escapeHtml(truncate(deck, 8))}</div>
        <div class="dash-path-cell grow" title="${escapeHtml(nodeName)}">${escapeHtml(nodeName)}</div>
        <div class="dash-path-cell" style="min-width:50px;text-align:right">${segLen}</div>
      </div>`;
    });
    dom.dashPathTable.innerHTML = rows.join('');
  }

  function buildLengthBreakdown(cable) {
    const route = cable.routeBreakdown;
    if (!route) {
      return renderIssueItem('warn', '경로가 아직 계산되지 않았습니다.');
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
      return renderIssueItem('warn', '검증이 아직 실행되지 않았습니다.');
    }
    const base = [
      renderIssueItem(validation.status === 'PASS' ? 'success' : validation.status === 'WARN' ? 'warn' : 'fail', `상태: ${validation.status}`),
      renderIssueItem(validation.lengthMatched ? 'success' : 'fail', `길이 검증: ${validation.lengthMatched ? 'OK' : 'NG'}`),
      renderIssueItem(validation.mapSegmentsMatch ? 'success' : 'warn', `맵 검증: ${validation.mapSegmentsMatch ? 'OK' : 'NG'}`),
      renderIssueItem(validation.coordsReady ? 'success' : 'warn', `좌표 상태: ${validation.coordsReady ? 'READY' : 'COORD MISSING'}`)
    ];
    const issues = validation.issues.map((issue) => renderIssueItem(issue.severity, issue.message));
    return [...base, ...issues].join('');
  }

  function renderRoutingPanel() {
    const previewCable = state.manualPreview || getSelectedCable();
    const route = previewCable?.routeBreakdown || null;
    const validation = previewCable?.validation || null;

    if (!route) {
      dom.routePreviewMeta.textContent = '선택된 경로가 없습니다.';
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
      : '경로를 선택하면 2D 검증 맵이 표시됩니다.';

    const threeStats = getActiveTab() === 'routing'
      ? renderThreeScene(route)
      : (disposeThree(), { drawnSegments: countDrawableSegments(route?.pathNodes || []) });
    dom.threeMeta.textContent = route
      ? `3D segment ${threeStats.drawnSegments}/${Math.max(route.pathNodes.length - 1, 0)}`
      : '경로를 선택하면 3D 뷰어 화면이 표시됩니다.';

    renderAlternativeRoutes(previewCable);
  }

  function renderAlternativeRoutes(cable) {
    if (!dom.alternativeRoutesPanel) {
      const panel = document.createElement('div');
      panel.id = 'alternativeRoutesPanel';
      panel.className = 'alt-routes-panel';
      const routePanel = dom.routePreviewMeta?.parentElement;
      if (routePanel) {
        routePanel.appendChild(panel);
      }
      dom.alternativeRoutesPanel = panel;
    }

    if (!cable || !trimText(cable.fromNode) || !trimText(cable.toNode)) {
      dom.alternativeRoutesPanel.innerHTML = '';
      return;
    }

    const alternatives = computeAlternativeRoutes(cable);
    if (alternatives.length <= 1) {
      dom.alternativeRoutesPanel.innerHTML = '<div class="alt-route-empty">대안 경로가 없습니다.</div>';
      return;
    }

    const currentPath = cable.calculatedPath || '';
    let html = '<div class="alt-routes-header">대안 경로 비교 (K-Shortest Paths)</div>';
    html += '<div class="alt-routes-grid">';

    for (const alt of alternatives) {
      const isCurrent = alt.path.join(' > ') === currentPath.replace(/\s*>\s*/g, ' > ');
      const colorClass = alt.rank === 1 ? 'alt-route-best' : alt.rank === 2 ? 'alt-route-second' : 'alt-route-third';

      html += `<div class="alt-route-card ${colorClass}${isCurrent ? ' alt-route-current' : ''}" data-alt-rank="${alt.rank}">`;
      html += `<div class="alt-route-rank">${alt.rank === 1 ? '최단' : alt.rank === 2 ? '2순위' : '3순위'}${isCurrent ? ' (현재)' : ''}</div>`;
      html += `<div class="alt-route-length">TOTAL ${formatNumber(alt.totalLength)} m</div>`;
      html += `<div class="alt-route-detail">GRAPH ${formatNumber(alt.graphLength)} | 노드 ${alt.nodeCount}개 | 구간 ${alt.segments.length}개</div>`;
      html += `<div class="alt-route-path">${alt.path.map((n) => `<span class="path-chip">${escapeHtml(n)}</span>`).join('')}</div>`;
      if (!isCurrent) {
        html += `<button class="alt-route-apply-btn" data-alt-rank="${alt.rank}" onclick="void(0)">이 경로 적용</button>`;
      }
      html += '</div>';
    }

    html += '</div>';

    const optimization = suggestRoutingOptimization(15);
    if (optimization.length) {
      html += '<div class="alt-routes-header" style="margin-top:12px">라우팅 최적화 제안</div>';
      html += '<div class="optimization-suggestions">';
      for (const sug of optimization.slice(0, 5)) {
        html += `<div class="optimization-item">`;
        html += `<span class="opt-node">${escapeHtml(sug.nodeName)}</span>`;
        html += ` 케이블 ${sug.cableCount}개 통과`;
        if (sug.redistributable > 0) {
          html += ` | 재분배 가능 ${sug.redistributable}개`;
          if (sug.potentialLengthDelta !== 0) {
            html += ` | 길이 변화 ${sug.potentialLengthDelta > 0 ? '+' : ''}${formatNumber(sug.potentialLengthDelta)} m`;
          }
        }
        html += '</div>';
      }
      html += '</div>';
    }

    dom.alternativeRoutesPanel.innerHTML = html;

    dom.alternativeRoutesPanel.querySelectorAll('.alt-route-apply-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rank = parseInt(btn.dataset.altRank, 10);
        const selected = alternatives.find((a) => a.rank === rank);
        if (selected && cable) {
          cable.calculatedPath = selected.path.join(' > ');
          cable.calculatedLength = selected.totalLength;
          const edgeSegments = selected.segments.map((seg) => ({
            from: seg.from,
            to: seg.to,
            length: seg.length
          }));
          cable.routeBreakdown = {
            pathNodes: selected.path,
            segmentLengths: edgeSegments.map((seg) => seg.length),
            edgeSegments: edgeSegments,
            waypointSegments: [{ from: cable.fromNode, to: cable.toNode, path: selected.path, length: selected.graphLength }],
            graphLength: selected.graphLength,
            fromRest: selected.fromRest,
            toRest: selected.toRest,
            totalLength: selected.totalLength
          };
          cable.validation = validateCable(cable);
          state.project.dirty = true;
          commitHistory('apply-alt-route');
          renderRoutingPanel();
          renderSelectedCable();
          renderGrid();
          pushToast(`${rank}순위 경로를 적용했습니다. (${formatNumber(selected.totalLength)} m)`, 'success');
        }
      });
    });
  }

  // ============================================================
  // Cable Type Tab
  // ============================================================
  const CT_COLUMNS = [
    { key: 'type', label: 'TYPE', width: '180px' },
    { key: 'od', label: 'O.D.', width: '70px' },
    { key: 'area', label: 'AREA', width: '80px' },
    { key: 'weight', label: 'WEIGHT', width: '80px' },
    { key: 'din', label: 'DIN', width: '140px' },
    { key: 'voltage', label: 'VOLTAGE', width: '200px' },
    { key: 'gland', label: 'GLAND SIZE', width: '90px' }
  ];
  const CT_TEMPLATE = CT_COLUMNS.map((c) => c.width).join(' ');

  function renderCableTypeTab() {
    const header = document.getElementById('cableTypeGridHeader');
    const viewport = document.getElementById('cableTypeGridViewport');
    const inner = document.getElementById('cableTypeGridInner');
    const searchEl = document.getElementById('cableTypeSearch');
    const countEl = document.getElementById('cableTypeCount');
    if (!header || !inner) return;

    const search = (searchEl ? trimText(searchEl.value) : '').toLowerCase();
    const allEntries = Object.values(CABLE_TYPE_DB);
    const filtered = search
      ? allEntries.filter((entry) => {
          const haystack = [entry.type, entry.din, entry.voltage, entry.gland, String(entry.od), String(entry.weight)].join(' ').toLowerCase();
          return haystack.includes(search);
        })
      : allEntries;

    if (countEl) countEl.textContent = `${filtered.length} / ${allEntries.length}`;

    header.style.gridTemplateColumns = CT_TEMPLATE;
    header.innerHTML = CT_COLUMNS.map((c) => `<div class="grid-header-cell">${escapeHtml(c.label)}</div>`).join('');

    inner.style.height = `${Math.max(filtered.length * ROW_HEIGHT, (viewport ? viewport.clientHeight : 420))}px`;
    inner.innerHTML = '';

    if (!filtered.length) {
      inner.style.height = '0px';
      inner.innerHTML = '<div class="empty-state">조건에 맞는 Cable Type이 없습니다.</div>';
      return;
    }

    const viewportHeight = viewport ? viewport.clientHeight : 560;
    const scrollTop = viewport ? viewport.scrollTop : 0;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 6);
    const end = Math.min(filtered.length - 1, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + 8);

    for (let i = start; i <= end; i += 1) {
      const entry = filtered[i];
      const row = document.createElement('div');
      row.className = 'grid-row';
      row.style.top = `${i * ROW_HEIGHT}px`;
      row.style.height = `${ROW_HEIGHT}px`;
      row.style.gridTemplateColumns = CT_TEMPLATE;
      row.innerHTML = CT_COLUMNS.map((col) => {
        const val = entry[col.key];
        const text = val == null || val === '' ? '-' : String(val);
        return `<div class="grid-cell" title="${escapeHtml(text)}">${escapeHtml(text)}</div>`;
      }).join('');
      inner.appendChild(row);
    }
  }

  (function initCableTypeTab() {
    const searchEl = document.getElementById('cableTypeSearch');
    const viewport = document.getElementById('cableTypeGridViewport');
    if (searchEl) {
      searchEl.addEventListener('input', () => renderCableTypeTab());
    }
    if (viewport) {
      viewport.addEventListener('scroll', () => renderCableTypeTab());
    }
  })();

  // ============================================================
  // Deck Tree (Cable Group by Deck)
  // ============================================================

  function buildDeckTree() {
    const listEl = document.getElementById('deckTreeList');
    if (!listEl) return;

    const deckMap = {};
    state.cables.forEach((cable) => {
      const deck = (cable.supplyDeck || cable.fromRoom || 'UNKNOWN').trim().toUpperCase();
      if (!deckMap[deck]) deckMap[deck] = 0;
      deckMap[deck] += 1;
    });

    const decks = Object.keys(deckMap).sort();
    let html = `<div class="deck-tree-item${activeDeckFilter === 'ALL' ? ' active' : ''}" data-deck="ALL">
      <span>ALL</span><span class="deck-count">${state.cables.length}</span></div>`;
    decks.forEach((deck) => {
      html += `<div class="deck-tree-item${activeDeckFilter === deck ? ' active' : ''}" data-deck="${escapeHtml(deck)}">
        <span>${escapeHtml(deck)}</span><span class="deck-count">${deckMap[deck]}</span></div>`;
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.deck-tree-item').forEach((item) => {
      item.addEventListener('click', () => {
        activeDeckFilter = item.dataset.deck;
        buildDeckTree();
        renderGrid();
      });
    });
  }

  // ============================================================
  // Sub-Tab Switching (Schedule / Cable List / Node List)
  // ============================================================

  let activeSubTab = 'schedule';
  let cableListGroupFilter = 'ALL';

  function initSubTabs() {
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subTabPanels = document.querySelectorAll('.sub-tab-panel');
    subTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.subtab;
        activeSubTab = target;
        subTabBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.subtab === target));
        subTabPanels.forEach((p) => p.classList.toggle('is-active', p.dataset.subpanel === target));
        if (target === 'cablelist') renderCableListTab();
        if (target === 'nodelist') renderNodeListTab();
      });
    });
  }

  // ============================================================
  // Cable List Tab (Excel-style full spreadsheet)
  // ============================================================

  const CABLE_LIST_COLUMNS = [
    { key: '_rowNum', label: 'No', width: 38, className: 'mono' },
    { key: 'system', label: 'SYSTEM', width: 90 },
    { key: 'wdPage', label: 'WD_PAGE', width: 56, className: 'mono' },
    { key: 'name', label: 'CABLE_NAME', width: 130 },
    { key: 'compName', label: 'COMP_NAME', width: 90 },
    { key: 'type', label: 'TYPE', width: 70 },
    { key: 'supplyDeck', label: 'DECK', width: 60 },
    { key: 'fromRoom', label: 'FROM_ROOM', width: 100 },
    { key: 'fromEquip', label: 'FROM_EQUIP', width: 120 },
    { key: 'fromNode', label: 'FROM_NODE', width: 80 },
    { key: 'fromRest', label: 'F_REST', width: 55, className: 'mono' },
    { key: 'toRoom', label: 'TO_ROOM', width: 100 },
    { key: 'toEquip', label: 'TO_EQUIP', width: 120 },
    { key: 'toNode', label: 'TO_NODE', width: 80 },
    { key: 'toRest', label: 'T_REST', width: 55, className: 'mono' },
    { key: 'length', label: 'LENGTH', width: 65, className: 'mono' },
    { key: 'outDia', label: 'OD', width: 50, className: 'mono' },
    { key: 'checkNode', label: 'CHECK_NODE', width: 100 },
    { key: 'path', label: 'PATH', width: 160, className: 'path-cell' },
    { key: 'calculatedPath', label: 'CALC_PATH', width: 160, className: 'path-cell' },
    { key: 'calculatedLength', label: 'CALC_LEN', width: 70, className: 'mono' },
    { key: 'porWeight', label: 'WEIGHT', width: 60, className: 'mono' },
    { key: 'cableWeight', label: 'C_WEIGHT', width: 65, className: 'mono' },
    { key: 'remark', label: 'REMARK', width: 120 },
    { key: 'revision', label: 'REV', width: 40, className: 'mono' }
  ];
  const CABLE_LIST_TEMPLATE = CABLE_LIST_COLUMNS.map((c) => c.width + 'px').join(' ');

  function getFilteredCableList() {
    const search = trimText(document.getElementById('cableListSearch')?.value || '').toLowerCase();
    const sysFilter = document.getElementById('cableListSystemFilter')?.value || 'ALL';
    const deckFilter = document.getElementById('cableListDeckFilter')?.value || 'ALL';

    return state.cables.filter((cable) => {
      if (cableListGroupFilter !== 'ALL') {
        const deck = (cable.supplyDeck || cable.fromRoom || 'UNKNOWN').trim().toUpperCase();
        if (deck !== cableListGroupFilter) return false;
      }
      if (sysFilter !== 'ALL' && cable.system !== sysFilter) return false;
      if (deckFilter !== 'ALL') {
        const deck = (cable.supplyDeck || cable.fromRoom || 'UNKNOWN').trim().toUpperCase();
        if (deck !== deckFilter) return false;
      }
      if (!search) return true;
      const hay = [cable.name, cable.type, cable.system, cable.fromNode, cable.toNode,
        cable.fromEquip, cable.toEquip, cable.fromRoom, cable.toRoom, cable.checkNode,
        cable.path, cable.remark].join(' ').toLowerCase();
      return hay.includes(search);
    });
  }

  function renderCableListHeader() {
    const header = document.getElementById('cableListHeader');
    if (!header) return;
    header.style.gridTemplateColumns = CABLE_LIST_TEMPLATE;
    header.className = 'grid-header';
    header.innerHTML = CABLE_LIST_COLUMNS.map((col) =>
      `<div class="grid-head-cell ${col.className || ''}" title="${col.label}">${col.label}</div>`
    ).join('');
  }

  function renderCableListTab() {
    const cables = getFilteredCableList();
    const countEl = document.getElementById('cableListCount');
    if (countEl) countEl.textContent = `${formatInt(cables.length)} / ${formatInt(state.cables.length)}`;

    renderCableListHeader();
    renderCableListSidebar();
    updateCableListFilters();

    const viewport = document.getElementById('cableListViewport');
    const inner = document.getElementById('cableListInner');
    if (!viewport || !inner) return;

    inner.style.height = `${Math.max(cables.length * ROW_HEIGHT, viewport.clientHeight || 400)}px`;
    inner.innerHTML = '';

    if (!cables.length) {
      inner.style.height = '0px';
      inner.innerHTML = '<div class="empty-state">조건에 맞는 케이블이 없습니다.</div>';
      return;
    }

    const vH = viewport.clientHeight || 500;
    const scrollTop = viewport.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 4);
    const end = Math.min(cables.length - 1, Math.ceil((scrollTop + vH) / ROW_HEIGHT) + 6);

    for (let i = start; i <= end; i++) {
      const cable = cables[i];
      const row = document.createElement('div');
      row.className = 'grid-row';
      row.style.top = `${i * ROW_HEIGHT}px`;
      row.style.height = `${ROW_HEIGHT}px`;
      row.style.gridTemplateColumns = CABLE_LIST_TEMPLATE;
      row.innerHTML = CABLE_LIST_COLUMNS.map((col) => {
        let text;
        if (col.key === '_rowNum') {
          text = String(i + 1);
        } else if (col.key === 'calculatedLength') {
          text = formatNumber(cable.calculatedLength || 0);
        } else if (['length', 'fromRest', 'toRest', 'outDia', 'porWeight', 'cableWeight'].includes(col.key)) {
          const v = cable[col.key];
          text = v != null && v !== '' ? formatNumber(v) : '-';
        } else {
          const v = cable[col.key];
          text = v == null || v === '' ? '-' : String(v);
        }
        const cls = ['grid-cell', col.className || ''].filter(Boolean).join(' ');
        return `<div class="${cls}" title="${escapeHtml(text)}">${escapeHtml(text)}</div>`;
      }).join('');
      row.addEventListener('click', () => {
        selectCable(cable.id);
        // Switch to schedule to show editor
        document.querySelector('.sub-tab-btn[data-subtab="schedule"]')?.click();
      });
      inner.appendChild(row);
    }
  }

  function renderCableListSidebar() {
    const listEl = document.getElementById('cableListGroupList');
    if (!listEl) return;

    const deckMap = {};
    state.cables.forEach((cable) => {
      const deck = (cable.supplyDeck || cable.fromRoom || 'UNKNOWN').trim().toUpperCase();
      if (!deckMap[deck]) deckMap[deck] = 0;
      deckMap[deck] += 1;
    });

    const decks = Object.keys(deckMap).sort();
    let html = `<div class="list-tab-sidebar-item${cableListGroupFilter === 'ALL' ? ' is-active' : ''}" data-group="ALL">
      <span>ALL</span><span class="list-tab-sidebar-count">${state.cables.length}</span></div>`;
    decks.forEach((dk) => {
      html += `<div class="list-tab-sidebar-item${cableListGroupFilter === dk ? ' is-active' : ''}" data-group="${escapeHtml(dk)}">
        <span>${escapeHtml(dk)}</span><span class="list-tab-sidebar-count">${deckMap[dk]}</span></div>`;
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.list-tab-sidebar-item').forEach((item) => {
      item.addEventListener('click', () => {
        cableListGroupFilter = item.dataset.group;
        renderCableListTab();
      });
    });
  }

  function updateCableListFilters() {
    const sysFilter = document.getElementById('cableListSystemFilter');
    const deckFilter = document.getElementById('cableListDeckFilter');

    if (sysFilter && sysFilter.options.length <= 1) {
      const systems = [...new Set(state.cables.map((c) => c.system).filter(Boolean))].sort();
      systems.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s; opt.textContent = s;
        sysFilter.appendChild(opt);
      });
    }

    if (deckFilter && deckFilter.options.length <= 1) {
      const decks = [...new Set(state.cables.map((c) =>
        (c.supplyDeck || c.fromRoom || 'UNKNOWN').trim().toUpperCase()
      ).filter(Boolean))].sort();
      decks.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        deckFilter.appendChild(opt);
      });
    }
  }

  // ============================================================
  // Node List Tab (Excel-style full spreadsheet)
  // ============================================================

  const NODE_LIST_TAB_COLUMNS = [
    { key: '_rowNum', label: 'No', width: 38, className: 'mono' },
    { key: 'name', label: 'NODE_RNAME', width: 110 },
    { key: 'structure', label: 'STRUCTURE', width: 100 },
    { key: 'component', label: 'COMPONENT', width: 90 },
    { key: 'type', label: 'NODE_TYPE', width: 75 },
    { key: 'deck', label: 'DECK', width: 55 },
    { key: 'cableCount', label: 'CABLES', width: 55, className: 'mono' },
    { key: 'relationNames', label: 'RELATION', width: 200 },
    { key: 'linkLength', label: 'LINK_LEN', width: 70, className: 'mono' },
    { key: 'nodeAreaSize', label: 'AREA', width: 65, className: 'mono' },
    { key: 'recommendedTrayWidth', label: 'TRAY_W', width: 65, className: 'mono' },
    { key: 'areaFillRatio', label: 'FILL_%', width: 55, className: 'mono' },
    { key: 'pointRaw', label: 'POINT', width: 220 }
  ];
  const NODE_LIST_TAB_TEMPLATE = NODE_LIST_TAB_COLUMNS.map((c) => c.width + 'px').join(' ');

  function getFilteredNodeList() {
    const search = trimText(document.getElementById('nodeListSearch')?.value || '').toLowerCase();
    const deckFilter = document.getElementById('nodeListDeckFilter')?.value || 'ALL';
    const typeFilter = document.getElementById('nodeListTypeFilter')?.value || 'ALL';

    return state.mergedNodes.filter((node) => {
      if (deckFilter !== 'ALL') {
        const deck = (node.name || '').substring(0, 2).toUpperCase();
        if (deck !== deckFilter) return false;
      }
      if (typeFilter !== 'ALL' && node.type !== typeFilter) return false;
      if (!search) return true;
      const hay = [node.name, node.structure, node.component, node.type,
        node.relationNames, node.pointRaw].join(' ').toLowerCase();
      return hay.includes(search);
    });
  }

  function renderNodeListTabHeader() {
    const header = document.getElementById('nodeListTabHeader');
    if (!header) return;
    header.style.gridTemplateColumns = NODE_LIST_TAB_TEMPLATE;
    header.className = 'grid-header';
    header.innerHTML = NODE_LIST_TAB_COLUMNS.map((col) =>
      `<div class="grid-head-cell ${col.className || ''}" title="${col.label}">${col.label}</div>`
    ).join('');
  }

  function renderNodeListTab() {
    const nodes = getFilteredNodeList();
    const countEl = document.getElementById('nodeListTabCount');
    if (countEl) countEl.textContent = `${formatInt(nodes.length)} / ${formatInt(state.mergedNodes.length)}`;

    renderNodeListTabHeader();
    updateNodeListFilters();

    const viewport = document.getElementById('nodeListTabViewport');
    const inner = document.getElementById('nodeListTabInner');
    if (!viewport || !inner) return;

    inner.style.height = `${Math.max(nodes.length * ROW_HEIGHT, viewport.clientHeight || 400)}px`;
    inner.innerHTML = '';

    if (!nodes.length) {
      inner.style.height = '0px';
      inner.innerHTML = '<div class="empty-state">조건에 맞는 노드가 없습니다.</div>';
      return;
    }

    const vH = viewport.clientHeight || 500;
    const scrollTop = viewport.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 4);
    const end = Math.min(nodes.length - 1, Math.ceil((scrollTop + vH) / ROW_HEIGHT) + 6);

    for (let i = start; i <= end; i++) {
      const node = nodes[i];
      const gNode = state.graph.nodeMap[node.name];
      const row = document.createElement('div');
      row.className = 'grid-row';
      row.style.top = `${i * ROW_HEIGHT}px`;
      row.style.height = `${ROW_HEIGHT}px`;
      row.style.gridTemplateColumns = NODE_LIST_TAB_TEMPLATE;

      row.innerHTML = NODE_LIST_TAB_COLUMNS.map((col) => {
        let text;
        if (col.key === '_rowNum') {
          text = String(i + 1);
        } else if (col.key === 'deck') {
          text = (node.name || '').substring(0, 2).toUpperCase() || '-';
        } else if (col.key === 'cableCount') {
          text = String(gNode?.cables?.length || 0);
        } else if (col.key === 'relationNames') {
          const rels = gNode?.relations || node.relations;
          text = Array.isArray(rels) ? rels.map((r) => typeof r === 'string' ? r : r.target).join(', ') : String(rels || '-');
        } else if (col.key === 'linkLength') {
          const rels = gNode?.relations || node.relations || [];
          if (Array.isArray(rels) && rels.length && typeof rels[0] === 'object') {
            text = rels.map((r) => r.length ?? '-').join(', ');
          } else {
            text = node.linkLength || '-';
          }
        } else if (col.key === 'nodeAreaSize') {
          text = gNode?.nodeAreaSize ? formatNumber(gNode.nodeAreaSize) : '-';
        } else if (col.key === 'recommendedTrayWidth') {
          text = gNode?.recommendedTrayWidth ? formatNumber(gNode.recommendedTrayWidth) : '-';
        } else if (col.key === 'areaFillRatio') {
          text = gNode?.areaFillRatio != null ? formatNumber(gNode.areaFillRatio) + '%' : '-';
        } else if (col.key === 'pointRaw') {
          text = node.point || (gNode?.hasCoords ? `${gNode.x},${gNode.y},${gNode.z || 0}` : '-');
        } else {
          const v = node[col.key];
          text = v == null || v === '' ? '-' : String(v);
        }
        const cls = ['grid-cell', col.className || ''].filter(Boolean).join(' ');
        return `<div class="${cls}" title="${escapeHtml(String(text))}">${escapeHtml(String(text))}</div>`;
      }).join('');

      row.addEventListener('click', () => {
        selectNode(node.name);
      });
      inner.appendChild(row);
    }
  }

  function updateNodeListFilters() {
    const deckFilter = document.getElementById('nodeListDeckFilter');
    const typeFilter = document.getElementById('nodeListTypeFilter');

    if (deckFilter && deckFilter.options.length <= 1) {
      const decks = [...new Set(state.mergedNodes.map((n) =>
        (n.name || '').substring(0, 2).toUpperCase()
      ).filter(Boolean))].sort();
      decks.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        deckFilter.appendChild(opt);
      });
    }

    if (typeFilter && typeFilter.options.length <= 1) {
      const types = [...new Set(state.mergedNodes.map((n) => n.type).filter(Boolean))].sort();
      types.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        typeFilter.appendChild(opt);
      });
    }
  }

  // Init sub-tabs and list-tab scroll listeners
  (function initListTabs() {
    initSubTabs();

    const clSearch = document.getElementById('cableListSearch');
    const clSysFilter = document.getElementById('cableListSystemFilter');
    const clDeckFilter = document.getElementById('cableListDeckFilter');
    const clViewport = document.getElementById('cableListViewport');

    if (clSearch) clSearch.addEventListener('input', () => renderCableListTab());
    if (clSysFilter) clSysFilter.addEventListener('change', () => renderCableListTab());
    if (clDeckFilter) clDeckFilter.addEventListener('change', () => renderCableListTab());
    if (clViewport) clViewport.addEventListener('scroll', () => renderCableListTab());

    const nlSearch = document.getElementById('nodeListSearch');
    const nlDeckFilter = document.getElementById('nodeListDeckFilter');
    const nlTypeFilter = document.getElementById('nodeListTypeFilter');
    const nlViewport = document.getElementById('nodeListTabViewport');

    if (nlSearch) nlSearch.addEventListener('input', () => renderNodeListTab());
    if (nlDeckFilter) nlDeckFilter.addEventListener('change', () => renderNodeListTab());
    if (nlTypeFilter) nlTypeFilter.addEventListener('change', () => renderNodeListTab());
    if (nlViewport) nlViewport.addEventListener('scroll', () => renderNodeListTab());
  })();



// --- END 20-cable-dashboard.js ---

// --- BEGIN 30-nodes-and-maps.js ---
  const NODE_GRID_COLUMNS = [
    { key: '_rowNum', label: 'No', width: 42, className: 'mono' },
    { key: 'name', label: 'NODE_RNAME', width: 120 },
    { key: 'structure', label: 'STRUCTURE', width: 110 },
    { key: 'component', label: 'COMPONENT', width: 100 },
    { key: 'type', label: 'NODE_TYPE', width: 80 },
    { key: 'cableCount', label: 'CABLES', width: 65, className: 'mono' },
    { key: 'relationNames', label: 'RELATION', width: 180 },
    { key: 'linkLength', label: 'LINK_LENGTH', width: 90, className: 'mono' },
    { key: 'nodeAreaSize', label: 'AREA_SIZE', width: 90, className: 'mono' },
    { key: 'recommendedTrayWidth', label: 'TRAY_W', width: 75, className: 'mono' },
    { key: 'areaFillRatio', label: 'FILL_%', width: 65, className: 'mono' },
    { key: 'pointRaw', label: 'POINT', width: 260 }
  ];
  const NODE_GRID_TEMPLATE = NODE_GRID_COLUMNS.map((c) => c.width + 'px').join(' ');

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

  function handleNodeTrayControlInput() {
    state.nodeTray.maxHeightLimit = Math.max(50, toNumber(dom.nodeTrayMaxHeight?.value, state.nodeTray.maxHeightLimit || 150));
    state.nodeTray.fillRatioLimit = Math.max(10, Math.min(90, toNumber(dom.nodeTrayFillLimit?.value, state.nodeTray.fillRatioLimit || 40)));
    state.nodeTray.tierCount = Math.max(1, Math.min(6, Math.round(toNumber(dom.nodeTrayTierCount?.value, state.nodeTray.tierCount || 1))));
    state.nodeTray.manualWidthDraft = trimText(dom.nodeTrayManualWidth?.value);
    state.nodeTray.draftNodeName = state.selectedNodeName || state.nodeTray.draftNodeName;
    renderNodesPanel();
  }

  function applyRecommendedNodeTray() {
    const metric = state.nodeMetricMap[state.selectedNodeName];
    if (!metric) {
      pushToast('Select a node first.', 'warn');
      return;
    }
    const model = buildNodeTrayModel(metric);
    state.nodeTray.manualWidthDraft = model.recommended.width ? String(model.recommended.width) : '';
    if (dom.nodeTrayManualWidth) {
      dom.nodeTrayManualWidth.value = state.nodeTray.manualWidthDraft;
    }
    state.nodeTray.tierCount = Math.max(1, model.recommended.tierCount || state.nodeTray.tierCount || 1);
    if (dom.nodeTrayTierCount) {
      dom.nodeTrayTierCount.value = String(state.nodeTray.tierCount);
    }
    state.nodeTray.draftNodeName = metric.name;
    renderNodesPanel();
    pushToast(`Recommended tray loaded for ${metric.name}.`, 'success');
  }

  function saveNodeTrayOverride() {
    const metric = state.nodeMetricMap[state.selectedNodeName];
    if (!metric) {
      pushToast('Select a node first.', 'warn');
      return;
    }
    const width = Math.max(0, toNumber(dom.nodeTrayManualWidth?.value, 0));
    const tierCount = Math.max(1, Math.min(6, Math.round(toNumber(dom.nodeTrayTierCount?.value, state.nodeTray.tierCount || 1))));
    if (width <= 0) {
      pushToast('Enter a tray width or load the recommended value first.', 'warn');
      return;
    }
    state.nodeTray.overrides[metric.name] = {
      width,
      tierCount,
      maxHeightLimit: Math.max(50, toNumber(dom.nodeTrayMaxHeight?.value, state.nodeTray.maxHeightLimit || 150)),
      fillRatioLimit: Math.max(10, Math.min(90, toNumber(dom.nodeTrayFillLimit?.value, state.nodeTray.fillRatioLimit || 40))),
      updatedAt: new Date().toISOString()
    };
    state.nodeTray.manualWidthDraft = String(width);
    state.nodeTray.draftNodeName = metric.name;
    state.project.dirty = true;
    refreshNodeAnalytics();
    renderNodesPanel();
    updateProjectStatus('NODE TRAY OVERRIDE SAVED');
    commitHistory('node-tray-override-save');
    pushToast(`Tray override saved for ${metric.name}.`, 'success');
  }

  function clearNodeTrayOverride() {
    const name = trimText(state.selectedNodeName);
    if (!name) {
      pushToast('Select a node first.', 'warn');
      return;
    }
    delete state.nodeTray.overrides[name];
    state.nodeTray.manualWidthDraft = '';
    state.nodeTray.draftNodeName = name;
    if (dom.nodeTrayManualWidth) {
      dom.nodeTrayManualWidth.value = '';
    }
    state.project.dirty = true;
    refreshNodeAnalytics();
    renderNodesPanel();
    updateProjectStatus('NODE TRAY OVERRIDE CLEARED');
    commitHistory('node-tray-override-clear');
    pushToast(`Tray override cleared for ${name}.`, 'success');
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
        totalCrossSectionArea: 0,
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
      const crossSectionArea = calculateCableArea(outDia);
      const totalLength = round2(cable.calculatedLength || route.totalLength || 0);

      uniqueNodes.forEach((name) => {
        const metric = metricMap[name];
        if (!metric) return;
        metric.cableCount += 1;
        metric.totalOutDia = round2(metric.totalOutDia + outDia);
        metric.totalCrossSectionArea = round2(metric.totalCrossSectionArea + crossSectionArea);
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
          crossSectionArea,
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
      const tray = buildNodeTraySummary(metric, state.graph.nodeMap[metric.name]);
      const systems = Array.from(metric.systems).sort();
      const types = Array.from(metric.types).sort();
      const decks = Array.from(metric.decks).sort();
      const cables = metric.cables
        .sort((left, right) => right.crossSectionArea - left.crossSectionArea || right.outDia - left.outDia || right.totalLength - left.totalLength || left.name.localeCompare(right.name));
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

  function calculateCableArea(outDia) {
    const diameter = Math.max(0, toNumber(outDia, 0));
    const radius = diameter / 2;
    return round2(Math.PI * radius * radius);
  }

  function getNodeTrayOverride(name) {
    const override = state.nodeTray.overrides?.[name];
    return override && typeof override === 'object' ? override : null;
  }

  function buildNodeTraySummary(metric, node) {
    const override = getNodeTrayOverride(metric.name);
    const maxHeightLimit = Math.max(50, toNumber(override?.maxHeightLimit, state.nodeTray.maxHeightLimit || 150));
    const fillRatioLimit = Math.max(10, Math.min(90, toNumber(override?.fillRatioLimit, state.nodeTray.fillRatioLimit || 40)));
    const autoRecommendedTierCount = Math.max(1, Math.min(6, Math.round(toNumber(state.nodeTray.tierCount, 1))));
    const totalCrossSectionArea = round2(metric.totalCrossSectionArea || 0);
    const nodeAreaSize = Math.max(0, toNumber(node?.areaSize, 0));
    const areaFillRatio = nodeAreaSize > 0 ? round2((totalCrossSectionArea / nodeAreaSize) * 100) : 0;
    const theoreticalWidth = totalCrossSectionArea > 0
      ? round2((totalCrossSectionArea * 100) / Math.max(1, maxHeightLimit * autoRecommendedTierCount * fillRatioLimit))
      : 0;
    const autoRecommendedWidth = pickTrayStandardWidth(theoreticalWidth);
    const effectiveWidth = Math.max(0, toNumber(override?.width, autoRecommendedWidth));
    const effectiveTierCount = Math.max(1, Math.min(6, Math.round(toNumber(override?.tierCount, autoRecommendedTierCount))));
    const trayCapacityArea = round2(effectiveWidth * maxHeightLimit * effectiveTierCount);
    const fillRatio = trayCapacityArea > 0 ? round2((totalCrossSectionArea / trayCapacityArea) * 100) : 0;
    const widthDemand = calculateNodeTrayWidth(metric.totalOutDia);
    return {
      occupiedWidth: widthDemand.occupiedWidth,
      designWidth: widthDemand.designWidth,
      widthDemandRatio: widthDemand.fillRatio,
      totalCrossSectionArea,
      nodeAreaSize,
      areaFillRatio,
      autoRecommendedWidth,
      autoRecommendedTierCount,
      recommendedTrayWidth: effectiveWidth,
      effectiveTrayWidth: effectiveWidth,
      effectiveTierCount,
      trayCapacityArea,
      fillRatio,
      overrideApplied: Boolean(override?.width),
      overrideWidth: Math.max(0, toNumber(override?.width, 0)),
      overrideTierCount: Math.max(0, Math.round(toNumber(override?.tierCount, 0))),
      maxHeightLimit,
      fillRatioLimit
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
      if (sort === 'fillDesc') {
        return right.areaFillRatio - left.areaFillRatio || right.fillRatio - left.fillRatio || right.totalCrossSectionArea - left.totalCrossSectionArea || left.name.localeCompare(right.name);
      }
      if (sort === 'areaDesc') {
        return right.totalCrossSectionArea - left.totalCrossSectionArea || right.areaFillRatio - left.areaFillRatio || left.name.localeCompare(right.name);
      }
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
    const totalAreaDemand = metrics.reduce((sum, metric) => sum + metric.totalCrossSectionArea, 0);
    const routedCableCount = state.cables.filter((cable) => cable.routeBreakdown?.pathNodes?.length).length;

    if (dom.nodeListCount) dom.nodeListCount.textContent = `${formatInt(metrics.length)} / ${formatInt(state.nodeMetrics.length)}`;
    if (dom.nodeVisibleCount) dom.nodeVisibleCount.textContent = formatInt(metrics.length);
    if (dom.nodeCoordReadyCount) dom.nodeCoordReadyCount.textContent = formatInt(coordReadyCount);
    if (dom.nodeTrayDemand) dom.nodeTrayDemand.textContent = formatNumber(totalTrayDemand);
    if (dom.nodeAreaDemand) {
      dom.nodeAreaDemand.textContent = formatNumber(totalAreaDemand);
    }
    if (dom.nodeFocusedName) dom.nodeFocusedName.textContent = focusMetric?.name || '-';
    if (dom.nodeAutoMeta) dom.nodeAutoMeta.textContent = `Tray auto width uses routed cable area, tray height ${formatInt(state.nodeTray.maxHeightLimit)} mm, fill limit ${formatInt(state.nodeTray.fillRatioLimit)}%, and ${formatInt(state.nodeTray.tierCount)} tier(s). Routed cables ${formatInt(routedCableCount)} / ${formatInt(state.cables.length)} are reflected.`;

    if (!metrics.length) {
      dom.nodeList.innerHTML = '<div class="empty-state node-list-empty">표시할 노드가 없습니다.</div>';
    } else {
      const headerHtml = '<div class="grid-header" style="grid-template-columns:' + NODE_GRID_TEMPLATE + '">' +
        NODE_GRID_COLUMNS.map((col) => '<div class="grid-header-cell">' + escapeHtml(col.label) + '</div>').join('') + '</div>';
      const rowsHtml = metrics.map((metric, idx) => {
        const isSelected = metric.name === state.selectedNodeName;
        const node = state.mergedNodes.find((n) => n.name === metric.name);
        const cells = NODE_GRID_COLUMNS.map((col) => {
          let val = '';
          if (col.key === '_rowNum') val = String(idx + 1);
          else if (col.key === 'relationNames') val = (metric.relationNames || []).join(',');
          else if (col.key === 'linkLength') val = formatNumber(node ? node.linkLength : 0);
          else if (col.key === 'nodeAreaSize') val = formatNumber(node ? node.areaSize : 0);
          else if (col.key === 'pointRaw') val = node ? (node.pointRaw || node.point || '') : '';
          else if (col.key === 'recommendedTrayWidth') val = formatInt(metric.recommendedTrayWidth);
          else if (col.key === 'areaFillRatio') val = formatNumber(metric.areaFillRatio || metric.fillRatio || 0);
          else if (col.key === 'cableCount') val = formatInt(metric[col.key] || 0);
          else { const v = metric[col.key]; val = v == null || v === '' ? '-' : String(v); }
          const cls = ['grid-cell', col.className || ''].filter(Boolean).join(' ');
          return '<div class="' + cls + '" title="' + escapeHtml(val) + '">' + escapeHtml(val) + '</div>';
        }).join('');
        return '<div class="grid-row' + (isSelected ? ' selected' : '') + '" data-node-name="' + escapeHtml(metric.name) + '" style="grid-template-columns:' + NODE_GRID_TEMPLATE + '">' + cells + '</div>';
      }).join('');
      dom.nodeList.innerHTML = headerHtml + '<div class="node-grid-body">' + rowsHtml + '</div>';
    }

    if (!focusMetric) {
      if (dom.nodeDetailTitle) dom.nodeDetailTitle.textContent = 'Select a node.';
      if (dom.nodeDetailMeta) dom.nodeDetailMeta.textContent = 'Double-click a node in the list to focus it in the 3D map.';
      if (dom.nodeDetailTrayWidth) dom.nodeDetailTrayWidth.textContent = '0';
      if (dom.nodeDetailCableCount) dom.nodeDetailCableCount.textContent = '0';
      if (dom.nodeDetailRelationCount) dom.nodeDetailRelationCount.textContent = '0';
      if (dom.nodeDetailCoordStatus) dom.nodeDetailCoordStatus.textContent = 'LOCKED';
      if (dom.nodeSummaryList) dom.nodeSummaryList.innerHTML = renderIssueItem('warn', 'No node summary is available.');
      if (dom.nodeTrayRule) dom.nodeTrayRule.textContent = 'Tray width rule is unavailable.';
      if (dom.nodeTrayList) dom.nodeTrayList.innerHTML = '';
      renderNodeTrayEngineering(null);
      if (dom.nodeCableList) dom.nodeCableList.innerHTML = '<div class="empty-state">No matching cables were found.</div>';
      if (dom.nodeRelationList) dom.nodeRelationList.innerHTML = '<div class="empty-state">No connected nodes were found.</div>';
      renderNodeMapCanvas(dom.nodeMapCanvas, null);
      if (dom.nodeMapMeta) dom.nodeMapMeta.textContent = 'Select a node to display the 2D map.';
      if (dom.nodeThreeNetworkToggle) {
        dom.nodeThreeNetworkToggle.textContent = state.nodeThreeNetworkMode ? 'Focus View' : 'Network View';
      }
      if (dom.nodeThreeEyebrow) {
        dom.nodeThreeEyebrow.textContent = state.nodeThreeNetworkMode ? '3D Network View' : '3D Node Focus';
      }
      if (state.nodeThreeNetworkMode && state.mergedNodes.length) {
        const networkStats = getActiveTab() === 'nodes'
          ? render3DNetworkView()
          : (disposeNodeThree(), { drawnNodes: state.mergedNodes.length, drawnCables: 0 });
        if (dom.nodeThreeMeta) dom.nodeThreeMeta.textContent = `3D network | nodes ${formatInt(networkStats.drawnNodes)} | cables ${formatInt(networkStats.drawnCables)}`;
      } else {
        disposeNodeThree();
        if (dom.nodeThreeMeta) dom.nodeThreeMeta.textContent = 'Select a node to display the 3D map.';
      }
      return;
    }

    if (dom.nodeDetailTitle) dom.nodeDetailTitle.textContent = focusMetric.name;
    if (dom.nodeDetailMeta) dom.nodeDetailMeta.textContent = `${focusMetric.structure || 'NO STRUCTURE'} | ${focusMetric.component || 'NO COMPONENT'} | ${focusMetric.typesLabel} | ${focusMetric.overrideApplied ? 'OVERRIDE' : 'AUTO'}`;
    if (dom.nodeDetailTrayWidth) dom.nodeDetailTrayWidth.textContent = `${formatInt(focusMetric.recommendedTrayWidth)} mm / ${formatInt(focusMetric.effectiveTierCount)}T`;
    if (dom.nodeDetailCableCount) dom.nodeDetailCableCount.textContent = formatInt(focusMetric.cableCount);
    if (dom.nodeDetailRelationCount) dom.nodeDetailRelationCount.textContent = formatInt(focusMetric.relationCount);
    if (dom.nodeDetailCoordStatus) dom.nodeDetailCoordStatus.textContent = focusMetric.hasCoords ? 'READY' : 'COORD MISS';

    if (dom.nodeSummaryList) dom.nodeSummaryList.innerHTML = [
      `SYSTEMS: ${focusMetric.systemsLabel}`,
      `DECKS: ${focusMetric.decksLabel}`,
      `SEGMENT TOUCHES: ${formatInt(focusMetric.segmentTouches)}`,
      `TOTAL ROUTED LENGTH: ${formatNumber(focusMetric.totalCalculatedLength)}`,
      `TOTAL AREA: ${formatNumber(focusMetric.totalCrossSectionArea)} mm2`,
      `POINT: ${focusMetric.pointRaw || buildPointText(focusMetric) || 'N/A'}`
    ].map((line) => renderIssueItem('info', line)).join('');

    if (dom.nodeTrayRule) dom.nodeTrayRule.textContent = 'Tray = area-based recommendation with optional override. Fill uses cable cross-sectional area against effective tray area.';
    if (dom.nodeTrayList) dom.nodeTrayList.innerHTML = [
      `SUM OUT_DIA: ${formatNumber(focusMetric.totalOutDia)}`,
      `SUM AREA: ${formatNumber(focusMetric.totalCrossSectionArea)} mm2`,
      `NODE AREA_SIZE: ${formatNumber(focusMetric.nodeAreaSize)} mm2`,
      `NODE FILL: ${formatNumber(focusMetric.areaFillRatio)} %`,
      `TRAY: ${formatInt(focusMetric.recommendedTrayWidth)} mm x ${formatInt(focusMetric.maxHeightLimit)} mm x ${formatInt(focusMetric.effectiveTierCount)}T`,
      `TRAY FILL: ${formatNumber(focusMetric.fillRatio)} %`
    ].map((line) => renderIssueItem('info', line)).join('');

    renderNodeTrayEngineering(focusMetric);

    if (dom.nodeCableList) dom.nodeCableList.innerHTML = focusMetric.cables.length
      ? focusMetric.cables.slice(0, 80).map((cable) => `
          <div class="node-cable-row">
            <strong>${escapeHtml(cable.name)}</strong>
            <span>${escapeHtml(cable.system)}</span>
            <span>${escapeHtml(cable.deck)}</span>
            <span>${formatNumber(cable.outDia)} OD / ${formatNumber(cable.crossSectionArea)} A / ${formatNumber(cable.totalLength)} L</span>
          </div>
        `).join('')
      : '<div class="empty-state">이 노드를 지나는 케이블이 없습니다.</div>';

    if (dom.nodeRelationList) dom.nodeRelationList.innerHTML = focusMetric.relationNames.length
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
      : '<div class="empty-state">연결 relation 노드가 없습니다.</div>';

    const nodeMapStats = renderNodeMapCanvas(dom.nodeMapCanvas, focusMetric);
    if (dom.nodeMapMeta) dom.nodeMapMeta.textContent = `2D focus ${focusMetric.name} | relation ${nodeMapStats.drawnRelations}/${focusMetric.relationCount} | routed cables ${focusMetric.cableCount}`;

    if (dom.nodeThreeNetworkToggle) {
      dom.nodeThreeNetworkToggle.textContent = state.nodeThreeNetworkMode ? 'Focus View' : 'Network View';
    }
    if (dom.nodeThreeEyebrow) {
      dom.nodeThreeEyebrow.textContent = state.nodeThreeNetworkMode ? '3D Network View' : '3D Node Focus';
    }
    if (dom.nodeThreeTitle) {
      dom.nodeThreeTitle.textContent = state.nodeThreeNetworkMode
        ? '전체 노드와 케이블 경로를 3D로 표시'
        : '전체 노드 환경에서 선택 노드를 강조';
    }

    if (state.nodeThreeNetworkMode) {
      const networkStats = getActiveTab() === 'nodes'
        ? render3DNetworkView()
        : (disposeNodeThree(), { drawnNodes: state.mergedNodes.length, drawnCables: 0 });
      if (dom.nodeThreeMeta) dom.nodeThreeMeta.textContent = `3D network | nodes ${formatInt(networkStats.drawnNodes)} | cables ${formatInt(networkStats.drawnCables)}`;
    } else {
      const nodeThreeStats = getActiveTab() === 'nodes'
        ? renderNodeThreeScene(focusMetric)
        : (disposeNodeThree(), { drawnRelations: focusMetric.relationCount, drawnNodes: state.mergedNodes.filter((node) => node.hasCoords).length });
      if (dom.nodeThreeMeta) dom.nodeThreeMeta.textContent = `3D nodes ${formatInt(nodeThreeStats.drawnNodes)} | focus links ${formatInt(nodeThreeStats.drawnRelations)}`;
    }
  }

  function handleNodeTrayMatrixClick(event) {
    const button = event.target.closest('[data-tray-width][data-tray-tiers]');
    if (!button) return;
    const width = Math.max(0, toNumber(button.dataset.trayWidth, 0));
    const tierCount = Math.max(1, Math.min(6, Math.round(toNumber(button.dataset.trayTiers, 1))));
    state.nodeTray.manualWidthDraft = width ? String(width) : '';
    state.nodeTray.tierCount = tierCount;
    state.nodeTray.draftNodeName = state.selectedNodeName || state.nodeTray.draftNodeName;
    if (dom.nodeTrayManualWidth) dom.nodeTrayManualWidth.value = state.nodeTray.manualWidthDraft;
    if (dom.nodeTrayTierCount) dom.nodeTrayTierCount.value = String(tierCount);
    renderNodesPanel();
  }

  function renderNodeTrayEngineering(focusMetric) {
    if (!dom.nodeTrayCanvas || !dom.nodeTraySummary || !dom.nodeTrayMatrix) return;
    if (!focusMetric) {
      dom.nodeTrayStatus.textContent = 'NO NODE';
      dom.nodeTraySummary.innerHTML = renderIssueItem('warn', 'Select a node to calculate tray fill and cable layout.');
      dom.nodeTrayMatrix.innerHTML = '<div class="empty-state">No tray candidates are available.</div>';
      renderTrayCanvas(dom.nodeTrayCanvas, null);
      dom.nodeTrayCanvasMeta.textContent = 'Select a node to preview tray layout.';
      return;
    }

    syncNodeTrayInputsForMetric(focusMetric);
    const model = buildNodeTrayModel(focusMetric);
    const statusType = model.current.success ? (model.current.fillRatio > model.fillRatioLimit ? 'warn' : 'success') : 'fail';
    const statusText = model.overrideApplied
      ? `OVERRIDE ${formatInt(model.current.width)}W / ${formatInt(model.current.tierCount)}T`
      : `AUTO ${formatInt(model.recommended.width)}W / ${formatInt(model.recommended.tierCount)}T`;

    dom.nodeTrayStatus.textContent = statusText;
    dom.nodeTraySummary.innerHTML = [
      `NODE AREA_SIZE: ${formatNumber(model.nodeAreaSize)} mm2`,
      `CABLE AREA SUM: ${formatNumber(model.totalArea)} mm2`,
      `NODE FILL: ${formatNumber(model.areaFillRatio)} %`,
      `CURRENT TRAY: ${formatInt(model.current.width)} mm x ${formatInt(model.maxHeightLimit)} mm x ${formatInt(model.current.tierCount)}T`,
      `CURRENT FILL: ${formatNumber(model.current.fillRatio)} %`,
      `MAX STACK HEIGHT: ${formatNumber(model.current.maxStackHeight)} mm`,
      `RECOMMENDED: ${formatInt(model.recommended.width)} mm x ${formatInt(model.recommended.tierCount)}T`
    ].map((line) => renderIssueItem(statusType, line)).join('');

    dom.nodeTrayMatrix.innerHTML = renderNodeTrayMatrix(model);
    renderTrayCanvas(dom.nodeTrayCanvas, model.current);
    dom.nodeTrayCanvasMeta.textContent = `Tray layout ${model.current.success ? 'READY' : 'LIMIT EXCEEDED'} | cables ${formatInt(model.current.cables.length)} | placed ${formatInt(model.current.placed.length)} | fill ${formatNumber(model.current.fillRatio)} %`;
    renderTrayCableIndexList(dom.nodeTrayIndexList, dom.nodeTrayCanvas);
  }

  function syncNodeTrayInputsForMetric(metric) {
    const override = getNodeTrayOverride(metric.name);
    if (state.nodeTray.draftNodeName !== metric.name) {
      state.nodeTray.draftNodeName = metric.name;
      state.nodeTray.manualWidthDraft = override?.width ? String(override.width) : '';
    }
    const viewMaxHeight = override?.maxHeightLimit ? Math.max(50, toNumber(override.maxHeightLimit, state.nodeTray.maxHeightLimit || 150)) : state.nodeTray.maxHeightLimit;
    const viewFillRatio = override?.fillRatioLimit ? Math.max(10, Math.min(90, toNumber(override.fillRatioLimit, state.nodeTray.fillRatioLimit || 40))) : state.nodeTray.fillRatioLimit;
    const viewTierCount = override?.tierCount ? Math.max(1, Math.min(6, Math.round(toNumber(override.tierCount, state.nodeTray.tierCount || 1)))) : state.nodeTray.tierCount;
    if (dom.nodeTrayMaxHeight && document.activeElement !== dom.nodeTrayMaxHeight) {
      dom.nodeTrayMaxHeight.value = String(viewMaxHeight);
    }
    if (dom.nodeTrayFillLimit && document.activeElement !== dom.nodeTrayFillLimit) {
      dom.nodeTrayFillLimit.value = String(viewFillRatio);
    }
    if (dom.nodeTrayTierCount && document.activeElement !== dom.nodeTrayTierCount) {
      dom.nodeTrayTierCount.value = String(viewTierCount);
    }
    if (dom.nodeTrayManualWidth && document.activeElement !== dom.nodeTrayManualWidth) {
      dom.nodeTrayManualWidth.value = state.nodeTray.manualWidthDraft || '';
    }
  }

  function buildNodeTrayModel(metric) {
    const cables = metric.cables
      .map((cable, index) => ({
        id: `${metric.name}-${index}-${cable.name}`,
        name: cable.name,
        od: Math.max(1, toNumber(cable.outDia, 0)),
        system: cable.system,
        fromNode: metric.name
      }))
      .filter((cable) => cable.od > 0);
    const maxHeightLimit = Math.max(50, toNumber(dom.nodeTrayMaxHeight?.value, state.nodeTray.maxHeightLimit || 150));
    const fillRatioLimit = Math.max(10, Math.min(90, toNumber(dom.nodeTrayFillLimit?.value, state.nodeTray.fillRatioLimit || 40)));
    const tierCount = Math.max(1, Math.min(6, Math.round(toNumber(dom.nodeTrayTierCount?.value, state.nodeTray.tierCount || 1))));
    const manualWidth = Math.max(0, toNumber(dom.nodeTrayManualWidth?.value, state.nodeTray.manualWidthDraft || 0));
    const matrix = calculateTrayOptimizationMatrix(cables, maxHeightLimit, fillRatioLimit);
    const recommended = pickRecommendedTrayCandidate(matrix, cables, maxHeightLimit, fillRatioLimit, tierCount);
    const current = solveTraySystem(cables, manualWidth > 0 ? tierCount : recommended.tierCount, maxHeightLimit, fillRatioLimit, manualWidth > 0 ? manualWidth : recommended.width);
    const nodeAreaSize = Math.max(0, toNumber(state.graph.nodeMap[metric.name]?.areaSize, 0));
    const totalArea = round2(metric.totalCrossSectionArea || 0);
    const areaFillRatio = nodeAreaSize > 0 ? round2((totalArea / nodeAreaSize) * 100) : 0;
    return {
      metric,
      cables,
      matrix,
      recommended,
      current,
      overrideApplied: manualWidth > 0 || Boolean(getNodeTrayOverride(metric.name)?.width),
      maxHeightLimit,
      fillRatioLimit,
      nodeAreaSize,
      totalArea,
      areaFillRatio
    };
  }

  function renderNodeTrayMatrix(model) {
    if (!model.matrix.length) {
      return '<div class="empty-state">No tray candidates are available.</div>';
    }
    const headers = ['TIERS', '100', '150', '200', '300', '450', '600', '750', '900', '1050', '1200'];
    const rows = [
      `<div class="tray-matrix-row is-header">${headers.map((label) => `<div class="tray-matrix-cell">${escapeHtml(label)}</div>`).join('')}</div>`
    ];
    model.matrix.forEach((row) => {
      const cells = [
        `<div class="tray-matrix-cell is-label">${formatInt(row.tierCount)}T</div>`
      ];
      row.cells.forEach((cell) => {
        const classes = ['tray-matrix-button'];
        if (cell.width === model.current.width && row.tierCount === model.current.tierCount) classes.push('is-current');
        if (cell.isRecommended) classes.push('is-recommended');
        if (!cell.success) classes.push('is-fail');
        else if (cell.fillRatio > model.fillRatioLimit) classes.push('is-warn');
        else classes.push('is-pass');
        cells.push(`
          <button
            type="button"
            class="${classes.join(' ')}"
            data-tray-width="${cell.width}"
            data-tray-tiers="${row.tierCount}"
            title="Fill ${formatNumber(cell.fillRatio)}% | Height ${formatNumber(cell.maxStackHeight)} mm"
          >
            <strong>${formatNumber(cell.fillRatio)}%</strong>
            <span>${cell.success ? formatNumber(cell.maxStackHeight) : 'FAIL'}</span>
          </button>
        `);
      });
      rows.push(`<div class="tray-matrix-row">${cells.join('')}</div>`);
    });
    return rows.join('');
  }

  function renderTrayCanvas(canvas, trayResult) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(400, Math.round(rect.width || canvas.clientWidth || 720));
    const height = Math.max(260, Math.round(rect.height || canvas.clientHeight || 340));
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!trayResult) {
      drawCanvasMessage(ctx, width, height, 'Select a node to preview tray layout.');
      return;
    }

    const trayWidth = Math.max(100, toNumber(trayResult.width, 100));
    const trayHeight = Math.max(50, toNumber(trayResult.maxHeightLimit, 150));
    const tierCount = Math.max(1, toNumber(trayResult.tierCount, 1));
    const postWidth = 12; // support post width (scaled)
    const dimSpace = 32; // dimension annotation space
    const padding = { top: 16, right: 16, bottom: dimSpace + 8, left: 16 };
    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;
    const tierGap = 6;
    const tierPitch = (usableHeight - tierGap * (tierCount - 1)) / tierCount;
    const innerTrayScale = Math.min((usableWidth - postWidth * 2 - 8) / trayWidth, (tierPitch - 20) / trayHeight);
    const scale = innerTrayScale;
    const trayDrawWidth = trayWidth * scale;
    const trayDrawHeight = trayHeight * scale;

    drawGridBackground(ctx, width, height);

    // Global cable numbering across all tiers
    let globalCableIndex = 0;
    const allPlacedIndexed = [];

    for (let tierIndex = 0; tierIndex < tierCount; tierIndex += 1) {
      const centerX = padding.left + usableWidth / 2;
      const fullTrayWidth = trayDrawWidth + postWidth * 2;
      const trayLeft = centerX - fullTrayWidth / 2;
      const floorY = padding.top + tierPitch * (tierIndex + 1) + tierGap * tierIndex - 4;
      const ceilY = floorY - trayDrawHeight;

      // --- PASS 1: Structure (posts + beam + height limit) ---

      // Left support post
      ctx.fillStyle = '#475569';
      ctx.fillRect(trayLeft, ceilY - 4, postWidth, trayDrawHeight + 8);
      // Right support post
      ctx.fillRect(trayLeft + fullTrayWidth - postWidth, ceilY - 4, postWidth, trayDrawHeight + 8);

      // Floor beam
      const beamHeight = 4;
      ctx.fillStyle = '#334155';
      ctx.fillRect(trayLeft, floorY, fullTrayWidth, beamHeight);

      // Tray interior background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(trayLeft + postWidth, ceilY, trayDrawWidth, trayDrawHeight);

      // Height limit dashed line
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(trayLeft + postWidth, ceilY);
      ctx.lineTo(trayLeft + fullTrayWidth - postWidth, ceilY);
      ctx.stroke();
      ctx.restore();

      // Tier label
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`L${tierIndex + 1}`, trayLeft + 2, ceilY - 6);

      // Tier stats on right
      const tier = trayResult.tiers[tierIndex];
      const tierPlaced = tier?.placed || [];
      const tierArea = round2(tierPlaced.reduce((sum, c) => sum + calculateCableArea(c.od), 0));
      const tierODSum = round2(tierPlaced.reduce((sum, c) => sum + c.od, 0));
      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`\u03A3OD ${formatNumber(tierODSum)} | \u03A3A ${formatNumber(tierArea)} mm\u00B2 | ${tierPlaced.length} cables`, trayLeft + fullTrayWidth, ceilY - 6);

      // --- PASS 2: Cables with numbers ---
      const cableOriginX = trayLeft + postWidth;

      tierPlaced.forEach((cable) => {
        globalCableIndex += 1;
        const cx = cableOriginX + cable.x * scale;
        const cy = floorY - cable.y * scale;
        const r = Math.max(2, (cable.od / 2) * scale);

        // Cable circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = trayCableColor(cable.system);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cable number inside circle
        const fontSize = Math.max(6, Math.min(11, r * 1.1));
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(globalCableIndex), cx, cy);

        allPlacedIndexed.push({ ...cable, displayIndex: globalCableIndex, tierIndex });
      });

      // Actual max stack height line
      if (tier && tier.maxStackHeight > 0) {
        const actualHeightY = floorY - tier.maxStackHeight * scale;
        ctx.save();
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(trayLeft + postWidth, actualHeightY);
        ctx.lineTo(trayLeft + fullTrayWidth - postWidth, actualHeightY);
        ctx.stroke();
        ctx.restore();
        // Height annotation
        ctx.fillStyle = '#fbbf24';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${formatNumber(tier.maxStackHeight)}mm`, trayLeft + fullTrayWidth - postWidth + 4, actualHeightY + 3);
      }
    }

    // --- Dimension annotation at bottom ---
    ctx.textBaseline = 'alphabetic';
    const dimY = height - 10;
    const dimLeft = padding.left + usableWidth / 2 - trayDrawWidth / 2 - postWidth;
    const dimRight = dimLeft + trayDrawWidth + postWidth * 2;

    // Arrow line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dimLeft, dimY);
    ctx.lineTo(dimRight, dimY);
    ctx.stroke();

    // Left arrow
    ctx.beginPath();
    ctx.moveTo(dimLeft, dimY);
    ctx.lineTo(dimLeft + 6, dimY - 3);
    ctx.lineTo(dimLeft + 6, dimY + 3);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    // Right arrow
    ctx.beginPath();
    ctx.moveTo(dimRight, dimY);
    ctx.lineTo(dimRight - 6, dimY - 3);
    ctx.lineTo(dimRight - 6, dimY + 3);
    ctx.closePath();
    ctx.fill();

    // Width label
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`W ${formatInt(trayWidth)} mm`, (dimLeft + dimRight) / 2, dimY - 5);

    // Store indexed cables for cable index list
    canvas._placedIndexed = allPlacedIndexed;
  }

  function trayCableColor(system) {
    const source = trimText(system) || 'UNASSIGNED';
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = source.charCodeAt(index) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 60%, 58%)`;
  }

  function renderTrayCableIndexList(container, canvas) {
    if (!container) return;
    const indexed = canvas?._placedIndexed || [];
    if (!indexed.length) {
      container.innerHTML = '<div class="empty-state">No cables placed.</div>';
      return;
    }
    const rows = indexed.map((cable) => {
      const color = trayCableColor(cable.system);
      const area = round2(calculateCableArea(cable.od));
      return `<div class="tray-index-row" data-cable-index="${cable.displayIndex}">
        <span class="tray-index-badge" style="background:${escapeHtml(color)}">${cable.displayIndex}</span>
        <span class="tray-index-name">${escapeHtml(cable.name || cable.id)}</span>
        <span class="tray-index-detail">OD ${formatNumber(cable.od)} | A ${formatNumber(area)} mm\u00B2</span>
        <span class="tray-index-sys">${escapeHtml(cable.system || '-')}</span>
        <span class="tray-index-tier">L${(cable.tierIndex || 0) + 1}</span>
      </div>`;
    });
    container.innerHTML = `<div class="tray-index-header">CABLE INDEX (${indexed.length})</div>${rows.join('')}`;
  }

  function calculateTrayOptimizationMatrix(cables, maxHeightLimit, fillRatioLimit) {
    if (!cables.length) return [];
    const widths = [100, 150, 200, 300, 450, 600, 750, 900, 1050, 1200];
    const tierCounts = [1, 2, 3, 4];
    return tierCounts.map((tierCount) => ({
      tierCount,
      cells: widths.map((width) => {
        const result = solveTraySystem(cables, tierCount, maxHeightLimit, fillRatioLimit, width);
        return {
          width,
          fillRatio: result.fillRatio,
          success: result.success,
          maxStackHeight: result.maxStackHeight,
          trayArea: width * maxHeightLimit * tierCount,
          isRecommended: false
        };
      })
    }));
  }

  function pickRecommendedTrayCandidate(matrix, cables, maxHeightLimit, fillRatioLimit, fallbackTierCount) {
    let best = null;
    matrix.forEach((row) => {
      row.cells.forEach((cell) => {
        const isOptimal = cell.success && cell.fillRatio <= fillRatioLimit;
        const area = cell.trayArea;
        if (!best && isOptimal) {
          best = { width: cell.width, tierCount: row.tierCount, area, fillRatio: cell.fillRatio };
          return;
        }
        if (isOptimal && best && area < best.area) {
          best = { width: cell.width, tierCount: row.tierCount, area, fillRatio: cell.fillRatio };
        }
      });
    });
    if (!best) {
      const fallback = solveTraySystem(cables, fallbackTierCount, maxHeightLimit, fillRatioLimit, 0);
      best = {
        width: fallback.width,
        tierCount: fallback.tierCount,
        area: fallback.width * maxHeightLimit * fallback.tierCount,
        fillRatio: fallback.fillRatio
      };
    }
    matrix.forEach((row) => {
      row.cells.forEach((cell) => {
        cell.isRecommended = cell.width === best.width && row.tierCount === best.tierCount;
      });
    });
    return best;
  }

  // ===================================================================
  // Gravity-Based Cable Tray Packing Solver
  // Ported from tray-fill/services/solver.ts
  // Physics-based circle packing with gravity simulation
  // ===================================================================

  var TRAY_MARGIN_X = 10;               // mm margin from tray edge (each side)
  var TRAY_COLLISION_EPSILON = 0.05;     // mm overlap tolerance for collision detection
  var TRAY_MAX_PILE_WIDTH = 200;         // mm max width for a single continuous pile
  var TRAY_PILE_GAP = 10;               // mm gap between piles
  var TRAY_PHYSICAL_SIM_HEIGHT = 500;   // mm soft limit for physics simulation stacking
  var TRAY_MIN_WIDTH = 100;             // mm minimum tray width for auto-optimization
  var TRAY_MAX_WIDTH = 1000;            // mm maximum tray width for auto-optimization
  var TRAY_WIDTH_STEP = 100;            // mm step for width search iteration

  /**
   * Euclidean distance between two points.
   */
  function trayDist(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if a circle at (x, y) with given radius collides with any placed cable.
   * Returns true if collision detected.
   */
  function checkCollision(placed, x, y, radius) {
    for (var i = 0; i < placed.length; i++) {
      var c = placed[i];
      var d = trayDist(x, y, c.x, c.y);
      var minDist = (c.od / 2) + radius - TRAY_COLLISION_EPSILON;
      if (d < minDist) return true;
    }
    return false;
  }

  /**
   * Check if a circle at (x, y) with given radius is physically supported.
   * A cable is supported if it rests on the floor or on top of another cable.
   */
  function isSupported(placed, x, y, radius) {
    // Floor support: cable center within 1mm of its radius from floor (y=0)
    if (y <= radius + 1.0) return true;
    // Check support from cables below
    for (var i = 0; i < placed.length; i++) {
      var c = placed[i];
      if (c.y >= y) continue;
      var d = trayDist(x, y, c.x, c.y);
      var contactDist = (c.od / 2) + radius + 1.0;
      if (d <= contactDist) {
        // Ensure cable is roughly above the supporting cable (not hanging off side)
        if (Math.abs(c.x - x) < ((c.od / 2) + radius) * 0.9) return true;
      }
    }
    return false;
  }

  /**
   * Determine the stacking layer number for a cable at position (x, y).
   * Layer 1 = floor level, layer N = stacked on N-1 cables below.
   */
  function determineTrayLayer(y, radius, placed, x) {
    if (y <= radius + 2.0) return 1;
    var below = placed.filter(function (c) {
      return Math.abs(c.x - x) < ((c.od / 2) + radius) && c.y < y;
    });
    if (!below.length) return 1;
    var maxLayer = 1;
    for (var i = 0; i < below.length; i++) {
      var layer = below[i].layer || 1;
      if (layer > maxLayer) maxLayer = layer;
    }
    return maxLayer + 1;
  }

  /**
   * Find the best gravity-settled position for a new cable among already-placed cables.
   * Generates candidate positions (floor, adjacent, stacked) and picks the lowest valid one.
   *
   * @param {object} cable        - Cable with .od property (outer diameter in mm)
   * @param {Array}  placed       - Array of already-placed cables with {x, y, od, layer}
   * @param {number} xMin         - Left boundary (TRAY_MARGIN_X)
   * @param {number} xMax         - Right boundary (trayWidth - TRAY_MARGIN_X)
   * @returns {{ x: number, y: number, layer: number } | null}
   */
  function findGravityPosition(cable, placed, xMin, xMax) {
    var r = Math.max(0.5, cable.od / 2);
    var candidates = [];

    // Candidate 1: leftmost floor position
    candidates.push({ x: xMin + r, y: r });

    // Generate candidates from each placed cable
    for (var i = 0; i < placed.length; i++) {
      var c = placed[i];
      // Floor position immediately to the right of this cable
      candidates.push({ x: c.x + c.od / 2 + r + 0.1, y: r });
      // Arc positions: try placing on/around this cable at 15-degree increments
      for (var angle = 15; angle <= 165; angle += 15) {
        var rad = (angle * Math.PI) / 180;
        candidates.push({
          x: c.x + Math.cos(rad) * (c.od / 2 + r),
          y: c.y + Math.sin(rad) * (c.od / 2 + r)
        });
      }
    }

    // Filter to valid positions
    var valid = [];
    for (var j = 0; j < candidates.length; j++) {
      var p = candidates[j];
      // Boundary check with 0.5mm tolerance
      if (p.x - r < xMin - 0.5) continue;
      if (p.x + r > xMax + 0.5) continue;
      // Physical height limit (hard cap at simulation height)
      if (p.y + r > TRAY_PHYSICAL_SIM_HEIGHT) continue;
      // No overlap with existing cables
      if (checkCollision(placed, p.x, p.y, r)) continue;
      // Must be physically supported (floor or other cable)
      if (!isSupported(placed, p.x, p.y, r)) continue;
      valid.push(p);
    }

    if (!valid.length) return null;

    // Sort: lowest y first (gravity), then leftmost x (compact packing)
    // Use 1.0mm tolerance band for y to prefer left packing at similar heights
    valid.sort(function (a, b) {
      var yDiff = a.y - b.y;
      if (Math.abs(yDiff) > 1.0) return yDiff;
      return a.x - b.x;
    });

    var best = valid[0];
    return {
      x: best.x,
      y: best.y,
      layer: determineTrayLayer(best.y, r, placed, best.x)
    };
  }

  /**
   * Sort cables for optimal packing: system (asc) -> OD desc (large first) -> name (asc).
   * Placing larger cables first generally yields better packing density.
   */
  function sortTrayCables(cables) {
    return cables.slice().sort(function (a, b) {
      var sysA = String(a.system || '');
      var sysB = String(b.system || '');
      if (sysA !== sysB) return sysA.localeCompare(sysB);
      if (b.od !== a.od) return b.od - a.od;
      var nameA = String(a.fromNode || a.name || '');
      var nameB = String(b.fromNode || b.name || '');
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * Attempt to fit all cables into a tray of given width using gravity packing.
   * Returns placement result with success flag and actual max stack height.
   *
   * @param {Array}  cables       - Array of cable objects with .od
   * @param {number} width        - Tray internal width in mm
   * @returns {{ success: boolean, placed: Array, maxStackHeight: number }}
   */
  function attemptTrayFit(cables, width) {
    var sorted = sortTrayCables(cables);
    var placed = [];
    var maxStackHeight = 0;
    var xMin = TRAY_MARGIN_X;
    var xMax = width - TRAY_MARGIN_X;

    for (var i = 0; i < sorted.length; i++) {
      var cable = sorted[i];
      var pos = findGravityPosition(cable, placed, xMin, xMax);
      if (pos) {
        placed.push({
          id: cable.id,
          name: cable.name,
          od: cable.od,
          system: cable.system,
          fromNode: cable.fromNode,
          x: pos.x,
          y: pos.y,
          layer: pos.layer
        });
        maxStackHeight = Math.max(maxStackHeight, pos.y + cable.od / 2);
      } else {
        return { success: false, placed: placed, maxStackHeight: maxStackHeight };
      }
    }
    return { success: true, placed: placed, maxStackHeight: maxStackHeight };
  }

  /**
   * Solve a single tray tier: place all cables using gravity packing at the given width.
   *
   * @param {Array}  cables        - Cables assigned to this tier
   * @param {number} tierIndex     - Zero-based tier index
   * @param {number} width         - Tray width in mm
   * @param {number} maxHeightLimit - User-specified height limit for fill ratio calculation
   * @returns {{ tierIndex, success, placed, maxStackHeight }}
   */
  function solveTrayTier(cables, tierIndex, width, maxHeightLimit) {
    var result = attemptTrayFit(cables, width);
    // Tag each placed cable with its tier index
    for (var i = 0; i < result.placed.length; i++) {
      result.placed[i].tierIndex = tierIndex;
    }
    return {
      tierIndex: tierIndex,
      success: result.success,
      placed: result.placed,
      maxStackHeight: result.maxStackHeight
    };
  }

  /**
   * Solve the full tray system: distribute cables across tiers, find optimal width.
   * Uses tray-fill's iterative width search (100mm steps from theoretical minimum to 1000mm).
   *
   * @param {Array}  cables         - All cables for this node
   * @param {number} tierCount      - Number of tray tiers
   * @param {number} maxHeightLimit - Height limit per tier in mm
   * @param {number} fillRatioLimit - Target fill ratio percentage (e.g., 40)
   * @param {number} [fixedWidth=0] - If > 0, use this width instead of auto-optimizing
   * @returns {{ width, tierCount, maxHeightLimit, tiers, cables, placed, maxStackHeight, fillRatio, success }}
   */
  function solveTraySystem(cables, tierCount, maxHeightLimit, fillRatioLimit, fixedWidth) {
    if (fixedWidth === undefined) fixedWidth = 0;
    var safeTierCount = Math.max(1, Math.min(6, Math.round(toNumber(tierCount, 1))));
    var buckets = Array.from({ length: safeTierCount }, function () { return []; });
    // Round-robin distribution of sorted cables across tiers
    sortTrayCables(cables).forEach(function (cable, index) {
      buckets[index % safeTierCount].push(cable);
    });

    var width = Math.max(0, toNumber(fixedWidth, 0));

    if (width <= 0) {
      // Auto-optimize: start from theoretical minimum, step up until all tiers fit
      var totalArea = cables.reduce(function (sum, cable) {
        return sum + calculateCableArea(cable.od);
      }, 0);
      var minTheoreticalWidth = totalArea > 0
        ? (totalArea * 100) / Math.max(1, maxHeightLimit * safeTierCount * fillRatioLimit)
        : TRAY_MIN_WIDTH;

      // First try standard widths (for common tray sizes)
      var standardWidths = [50, 100, 150, 200, 300, 450, 600, 750, 900, 1050, 1200];
      var startStd = pickTrayStandardWidth(minTheoreticalWidth);
      var startIdx = standardWidths.findIndex(function (w) { return w >= startStd; });
      var foundWidth = 0;

      for (var i = Math.max(0, startIdx); i < standardWidths.length; i++) {
        var cw = standardWidths[i];
        var allFit = true;
        for (var t = 0; t < buckets.length; t++) {
          var testResult = attemptTrayFit(buckets[t], cw);
          if (!testResult.success) { allFit = false; break; }
        }
        if (allFit) { foundWidth = cw; break; }
      }

      // If standard widths failed, try 100mm step search up to max
      if (!foundWidth) {
        var stepStart = Math.max(TRAY_MIN_WIDTH, Math.ceil(minTheoreticalWidth / TRAY_WIDTH_STEP) * TRAY_WIDTH_STEP);
        for (var w = stepStart; w <= TRAY_MAX_WIDTH; w += TRAY_WIDTH_STEP) {
          var allFit2 = true;
          for (var t2 = 0; t2 < buckets.length; t2++) {
            var testResult2 = attemptTrayFit(buckets[t2], w);
            if (!testResult2.success) { allFit2 = false; break; }
          }
          if (allFit2) { foundWidth = w; break; }
        }
      }

      width = foundWidth || standardWidths[standardWidths.length - 1];
    }

    var tiers = buckets.map(function (bucket, index) {
      return solveTrayTier(bucket, index, width, maxHeightLimit);
    });
    var maxStackHeight = Math.max(0, Math.max.apply(null, tiers.map(function (tier) { return tier.maxStackHeight; })));
    var totalArea2 = round2(cables.reduce(function (sum, cable) { return sum + calculateCableArea(cable.od); }, 0));
    var trayArea = round2(width * maxHeightLimit * safeTierCount);
    return {
      width: width,
      tierCount: safeTierCount,
      maxHeightLimit: maxHeightLimit,
      tiers: tiers,
      cables: cables,
      placed: tiers.reduce(function (all, tier) { return all.concat(tier.placed); }, []),
      maxStackHeight: maxStackHeight,
      fillRatio: trayArea > 0 ? round2((totalArea2 / trayArea) * 100) : 0,
      success: tiers.every(function (tier) { return tier.success; })
    };
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
      drawCanvasMessage(ctx, width, height, '좌표가 있는 노드가 없습니다.');
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
      drawCanvasMessage(ctx, width, height, '선택 노드의 좌표가 없어 2D 다이어그램을 표시할 수 없습니다.');
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
      return placeholder('Three.js가 없어 노드 3D 맵을 사용할 수 없습니다.');
    }

    const allDrawableNodes = state.mergedNodes.filter((node) => node.hasCoords);
    if (!allDrawableNodes.length) {
      return placeholder('좌표가 있는 노드가 없어 3D 맵을 그릴 수 없습니다.');
    }

    if (!focusMetric) {
       return placeholder('노드를 선택하면 3D 맵이 표시됩니다.');
    }

    const focusNode = state.graph.nodeMap[focusMetric.name];
    if (!focusNode?.hasCoords) {
      return placeholder('선택 노드의 좌표가 없어 3D 다이어그램을 표시할 수 없습니다.');
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
      return placeholder('노드 3D 렌더링 초기화 중 오류가 발생했습니다.');
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

  function render3DNetworkView() {
    const container = dom.nodeThreeContainer;
    const placeholder = (message) => {
      disposeNodeThree();
      container.innerHTML = `<div class="three-placeholder">${escapeHtml(message)}</div>`;
      return { drawnNodes: 0, drawnCables: 0 };
    };

    if (!window.THREE) {
      return placeholder('Three.js가 없어 네트워크 3D 뷰를 사용할 수 없습니다.');
    }

    const allNodes = state.mergedNodes;
    if (!allNodes.length) {
      return placeholder('표시할 노드가 없습니다.');
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

      const camera = new window.THREE.PerspectiveCamera(42, width / height, 0.1, 3000);
      camera.position.set(0, 120, 300);

      const ambient = new window.THREE.AmbientLight(0xffffff, 0.62);
      const directional = new window.THREE.DirectionalLight(0x88e2ff, 1.08);
      directional.position.set(40, 80, 120);
      scene.add(ambient, directional);

      const group = new window.THREE.Group();
      scene.add(group);
      group.add(new window.THREE.GridHelper(280, 18, 0x28445d, 0x123149));

      const nodeConnectionCount = Object.create(null);
      state.cables.forEach((cable) => {
        const route = cable.routeBreakdown;
        if (!route?.pathNodes?.length) return;
        const uniquePathNodes = unique(route.pathNodes.filter(Boolean));
        uniquePathNodes.forEach((name) => {
          nodeConnectionCount[name] = (nodeConnectionCount[name] || 0) + 1;
        });
      });

      const drawableWithCoords = allNodes.filter((node) => node.hasCoords);
      const drawableWithoutCoords = allNodes.filter((node) => !node.hasCoords);

      let center = { x: 0, y: 0, z: 0 };
      let scale = 1;
      if (drawableWithCoords.length) {
        center = {
          x: average(drawableWithCoords.map((node) => node.x)),
          y: average(drawableWithCoords.map((node) => node.y)),
          z: average(drawableWithCoords.map((node) => node.z ?? 0))
        };
        const maxDelta = Math.max(...drawableWithCoords.flatMap((node) => [
          Math.abs((node.x ?? 0) - center.x),
          Math.abs((node.y ?? 0) - center.y),
          Math.abs((node.z ?? 0) - center.z)
        ]), 1);
        scale = 110 / maxDelta;
      }

      const nodePositionMap = Object.create(null);

      drawableWithCoords.forEach((node) => {
        nodePositionMap[node.name] = new window.THREE.Vector3(
          ((node.x ?? 0) - center.x) * scale,
          ((node.z ?? 0) - center.z) * scale,
          ((node.y ?? 0) - center.y) * scale
        );
      });

      const circleRadius = drawableWithCoords.length ? 130 : 80;
      drawableWithoutCoords.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / Math.max(drawableWithoutCoords.length, 1);
        nodePositionMap[node.name] = new window.THREE.Vector3(
          Math.cos(angle) * circleRadius,
          -10,
          Math.sin(angle) * circleRadius
        );
      });

      const selectedName = state.selectedNodeName;
      allNodes.forEach((node) => {
        const position = nodePositionMap[node.name];
        if (!position) return;
        const connectedCables = nodeConnectionCount[node.name] || 0;
        const radius = Math.max(0.5, Math.min(2, connectedCables * 0.2));
        const isSelected = node.name === selectedName;
        const sphere = new window.THREE.Mesh(
          new window.THREE.SphereGeometry(isSelected ? radius * 1.8 : radius, 16, 16),
          new window.THREE.MeshStandardMaterial({
            color: isSelected ? 0xef4444 : 0x3b82f6,
            emissive: isSelected ? 0x3a1919 : 0x0f2744
          })
        );
        sphere.position.copy(position);
        group.add(sphere);
      });

      let drawnCables = 0;
      state.cables.forEach((cable) => {
        const route = cable.routeBreakdown;
        if (!route?.pathNodes?.length || route.pathNodes.length < 2) return;

        const linePoints = [];
        for (let i = 0; i < route.pathNodes.length; i += 1) {
          const nodeName = route.pathNodes[i];
          const pos = nodePositionMap[nodeName];
          if (!pos) continue;

          if (linePoints.length > 0 && i < route.pathNodes.length) {
            const prev = linePoints[linePoints.length - 1];
            const midY = (prev.y + pos.y) / 2;
            linePoints.push(new window.THREE.Vector3(prev.x, midY, prev.z));
            linePoints.push(new window.THREE.Vector3(pos.x, midY, pos.z));
          }
          linePoints.push(pos.clone());
        }

        if (linePoints.length >= 2) {
          drawnCables += 1;
          group.add(new window.THREE.Line(
            new window.THREE.BufferGeometry().setFromPoints(linePoints),
            new window.THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.55 })
          ));
        }
      });

      const animate = () => {
        group.rotation.y += 0.0018;
        renderer.render(scene, camera);
        state.nodeThree.frameId = window.requestAnimationFrame(animate);
      };

      state.nodeThree.renderer = renderer;
      state.nodeThree.frameId = window.requestAnimationFrame(animate);
      return { drawnNodes: allNodes.length, drawnCables };
    } catch (error) {
      console.error(error);
      return placeholder('네트워크 3D 렌더링 초기화 중 오류가 발생했습니다.');
    }
  }

  function toggle3DNetworkView() {
    state.nodeThreeNetworkMode = !state.nodeThreeNetworkMode;
    renderNodesPanel();
  }
  window.__toggle3DNetworkView = toggle3DNetworkView;

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
      drawCanvasMessage(ctx, width, height, '좌표가 있는 노드가 없습니다.');
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
      return placeholder('Three.js가 없어 3D 뷰어를 사용할 수 없습니다.');
    }

    if (!route?.pathNodes?.length) {
      return placeholder('경로를 선택하면 3D 뷰어가 표시됩니다.');
    }

    const nodes = route.pathNodes
      .map((name) => state.graph.nodeMap[name])
      .filter((node) => node?.hasCoords);

    if (nodes.length < 2) {
      return placeholder('좌표가 충분하지 않아 3D 경로를 그릴 수 없습니다.');
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
      return placeholder('3D 렌더링 초기화 중 오류가 발생했습니다.');
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
         (cable.validation?.issues || []).map((issue) => escapeHtml(issue.message)).join('<br>') || '상세 내용'
      ));

    dom.diagnosticCableTable.innerHTML = failingCables.length
      ? failingCables.join('')
      : '<div class="empty-state">현재 FAIL/WARN 케이블이 없습니다.</div>';
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
    const selected = dom.systemFilter.value || 'ALL';
    const systems = unique(state.cables.map((cable) => cable.system).filter(Boolean)).sort();
    dom.systemFilter.innerHTML = ['<option value="ALL">전체</option>']
      .concat(systems.map((system) => `<option value="${escapeHtml(system)}">${escapeHtml(system)}</option>`))
      .join('');
    dom.systemFilter.value = systems.includes(selected) ? selected : 'ALL';
  }

// --- END 30-nodes-and-maps.js ---

// --- BEGIN 40-auth-project-foundation.js ---
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

async function startNaverLogin() {
  if (!state.auth.backendAvailable) {
     updateAuthStatus('warn', 'Naver 로그인을 사용하려면 auth worker가 필요합니다.');
    return;
  }
  window.location.href = `${state.apiBase}/naver/start`;
}

function renderGoogleButtonWithRetry(attempt = 0) {
  updateDependencyPills();
  const googleConfig = state.auth.providers.google || { enabled: false, clientId: '' };
  if (!state.auth.backendAvailable || !googleConfig.enabled || !googleConfig.clientId) {
    dom.googleButtonHost.innerHTML = '';
    const message = state.auth.backendAvailable
       ? 'Google Client ID가 설정되지 않았습니다.'
       : '백엔드 연결 후 Google 로그인을 사용할 수 있습니다.';
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

// --- END 40-auth-project-foundation.js ---

// --- BEGIN 50-import-export-bom-reports-utils.js ---
  // renderAll() is defined in 60-auth-groupspace-final.js (complete version)

  async function handleProjectImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      showBusy('프로젝트 파일을 가져오는 중입니다...');
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
      pushToast('프로젝트 파일을 가져왔습니다.', 'success');
    } catch (error) {
      console.error(error);
      pushToast(`프로젝트 가져오기 실패: ${error.message}`, 'error');
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
      throw new Error('XLSX 라이브러리가 로드되지 않았습니다.');
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
    const nodeTrayRows = resolveWorkbookRows(rawSheets, ['NodeTray', 'TrayOverrides', 'Tray_Overrides'], looksLikeNodeTrayRows, false);
    const projectMeta = rowsToKeyValue(metaRows);

    return {
      workbook: true,
      sheetNames: workbook.SheetNames.slice(),
      sheets: {
        ...rawSheets,
        Cables: cableRows,
        Nodes: nodeRows,
        NodeTray: nodeTrayRows
      },
      projectMeta,
      nodeTray: {
        maxHeightLimit: Math.max(50, toNumber(projectMeta.nodeTrayMaxHeight, 150)),
        fillRatioLimit: Math.max(10, Math.min(90, toNumber(projectMeta.nodeTrayFillRatioLimit, 40))),
        tierCount: Math.max(1, Math.min(6, Math.round(toNumber(projectMeta.nodeTrayTierCount, 1)))),
        overrides: nodeTrayRows.reduce((map, row) => {
          const name = trimText(row.NODE_NAME || row.NodeName || row.node_name || row.nodeName);
          if (!name) return map;
          map[name] = {
            width: Math.max(0, toNumber(row.TRAY_WIDTH || row.tray_width, 0)),
            tierCount: Math.max(1, Math.min(6, Math.round(toNumber(row.TIER_COUNT || row.tier_count, 1)))),
            maxHeightLimit: Math.max(50, toNumber(row.MAX_HEIGHT || row.max_height, Math.max(50, toNumber(projectMeta.nodeTrayMaxHeight, 150)))),
            fillRatioLimit: Math.max(10, Math.min(90, toNumber(row.FILL_LIMIT || row.fill_limit, Math.max(10, Math.min(90, toNumber(projectMeta.nodeTrayFillRatioLimit, 40)))))),
            updatedAt: trimText(row.UPDATED_AT || row.updated_at || '')
          };
          return map;
        }, {})
      },
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

  function looksLikeNodeTrayRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return false;
    const keys = Object.keys(rows[0] || {}).map((key) => normalizeKey(key));
    return keys.includes('nodename') || (keys.includes('traywidth') && keys.includes('tiercount'));
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
      { KEY: 'bomMarginPct', VALUE: state.bom.marginPct },
      { KEY: 'nodeTrayMaxHeight', VALUE: state.nodeTray.maxHeightLimit },
      { KEY: 'nodeTrayFillRatioLimit', VALUE: state.nodeTray.fillRatioLimit },
      { KEY: 'nodeTrayTierCount', VALUE: state.nodeTray.tierCount }
    ];
    const comparisonRows = VERSION_COMPARISON_ROWS.map((row) => ({
      VERSION: row.version,
      STRENGTHS: row.strengths,
      LIMITATIONS: row.gaps,
      V3_RESOLUTION: row.v3Delta
    }));
    const nodeTrayRows = Object.entries(state.nodeTray.overrides || {}).map(([name, override]) => ({
      NODE_NAME: name,
      TRAY_WIDTH: override?.width || 0,
      TIER_COUNT: override?.tierCount || 1,
      MAX_HEIGHT: override?.maxHeightLimit || state.nodeTray.maxHeightLimit,
      FILL_LIMIT: override?.fillRatioLimit || state.nodeTray.fillRatioLimit,
      UPDATED_AT: override?.updatedAt || ''
    }));

    const workbook = window.XLSX.utils.book_new();
    appendSheet(workbook, 'ProjectMeta', metaRows);
    appendSheet(workbook, 'Cables', allCableRows);
    appendSheet(workbook, 'Nodes', nodeRows);
    appendSheet(workbook, 'NodeTray', nodeTrayRows);
    appendSheet(workbook, 'GraphNodes', graphRows);
    appendSheet(workbook, 'ValidationDetails', validationRows);
    appendSheet(workbook, 'BOM', bomRows);

    // ■ PATH 포함 Cable List (aa.xls 형식: 케이블행 + PATH행 + 다중 Deck 행)
    const pathIncludedRows = buildCableWithPathRows();
    appendSheet(workbook, 'CablesWithPath', pathIncludedRows);

    // ■ POS (Cable 소요량 - Cable abbreviation list)
    const posRows = buildPosRows();
    appendSheet(workbook, 'POS', posRows);

    appendSheet(workbook, 'ReportSystems', toReportSystemSheetRows(reportPack.systemRows));
    appendSheet(workbook, 'ReportTypes', toReportTypeSheetRows(reportPack.typeRows));
    appendSheet(workbook, 'ReportHotspots', toReportHotspotSheetRows(reportPack.hotspotRows));
    appendSheet(workbook, 'ReportValidation', toReportValidationSheetRows(reportPack.validationRows));
    appendSheet(workbook, 'ReportDrums', toReportDrumSheetRows(reportPack.drumRows));
    appendSheet(workbook, 'VersionComparison', comparisonRows);

    if (isVipUser && isVipUser()) {
      const routingDetailRows = buildRoutingDetailRows();
      appendSheet(workbook, 'RoutingDetail', routingDetailRows);
    }

    window.XLSX.writeFile(workbook, `seastar-cms-v3-${timestampToken()}.xlsx`);
    pushToast('Project workbook exported.', 'success');
  }

  function buildRoutingDetailRows() {
    return state.cables.map((cable) => {
      const alts = typeof computeAlternativeRoutes === 'function' ? computeAlternativeRoutes(cable) : [];
      const best = alts[0] || {};
      const second = alts[1] || {};
      const third = alts[2] || {};
      return {
        CABLE_NAME: cable.name || '',
        SYSTEM: cable.system || '',
        TYPE: cable.type || '',
        FROM_NODE: cable.fromNode || '',
        TO_NODE: cable.toNode || '',
        CURRENT_PATH: cable.calculatedPath || '',
        CURRENT_LENGTH: cable.calculatedLength || 0,
        BEST_PATH: (best.path || []).join(' > '),
        BEST_LENGTH: best.totalLength || 0,
        BEST_NODES: best.nodeCount || 0,
        ALT2_PATH: (second.path || []).join(' > '),
        ALT2_LENGTH: second.totalLength || 0,
        ALT2_NODES: second.nodeCount || 0,
        ALT3_PATH: (third.path || []).join(' > '),
        ALT3_LENGTH: third.totalLength || 0,
        ALT3_NODES: third.nodeCount || 0,
        DIFF_VS_BEST: round2((cable.calculatedLength || 0) - (best.totalLength || 0)),
        VALIDATION: cable.validation?.status || 'PENDING'
      };
    });
  }

  function appendSheet(workbook, sheetName, rows) {
    const safeRows = Array.isArray(rows) && rows.length ? rows : [{ EMPTY: '' }];
    window.XLSX.utils.book_append_sheet(workbook, window.XLSX.utils.json_to_sheet(safeRows), sheetName);
  }

  /**
   * Build Cable List with PATH rows (aa.xls format)
   * Each cable gets 1 main row + 1..N PATH rows (per deck segment)
   */
  function buildCableWithPathRows() {
    const rows = [];
    state.cables.forEach((cable, idx) => {
      const typeInfo = typeof lookupCableType === 'function' ? lookupCableType(cable.type) : null;
      const outDia = cable.outDia || (typeInfo ? typeInfo.od : '');

      // Main cable row
      rows.push({
        NO: idx + 1,
        CABLE_SYSTEM: cable.system || '',
        CABLE_NAME: cable.name || '',
        WD_PAGE: cable.wdPage || '',
        CABLE_TYPE: cable.type || '',
        FROM_ROOM: cable.fromRoom || '',
        FROM_EQUIP: cable.fromEquip || '',
        FROM_NODE: cable.fromNode || '',
        FROM_REST: cable.fromRest || '',
        TO_ROOM: cable.toRoom || '',
        TO_EQUIP: cable.toEquip || '',
        TO_NODE: cable.toNode || '',
        TO_REST: cable.toRest || '',
        CABLE_OUTDIA: outDia,
        POR_LENGTH: cable.length || '',
        REMARK1: cable.remark1 || cable.remark || '',
        REMARK2: cable.remark2 || '',
        REMARK3: cable.remark3 || ''
      });

      // PATH rows: split by deck segments from routeBreakdown
      const breakdown = cable.routeBreakdown;
      if (breakdown && breakdown.waypointSegments && breakdown.waypointSegments.length > 0) {
        // Group path nodes by deck
        const pathNodes = breakdown.pathNodes || [];
        const segLengths = breakdown.segmentLengths || [];
        const deckSegments = [];
        let currentDeck = '';
        let currentNodes = [];
        let currentLength = 0;

        pathNodes.forEach((nodeName, ni) => {
          const node = state.nodeMap ? state.nodeMap[nodeName] : null;
          const deck = node?.deck || node?.deckCode || '';
          if (ni === 0) {
            currentDeck = deck;
            currentNodes.push(nodeName);
          } else {
            if (deck && deck !== currentDeck && currentDeck) {
              deckSegments.push({ deck: currentDeck, nodes: [...currentNodes], length: currentLength });
              currentDeck = deck;
              currentNodes = [nodeName];
              currentLength = 0;
            } else {
              currentNodes.push(nodeName);
            }
            if (ni > 0 && segLengths[ni - 1] != null) {
              currentLength += segLengths[ni - 1];
            }
          }
        });
        if (currentNodes.length > 0) {
          deckSegments.push({ deck: currentDeck, nodes: currentNodes, length: currentLength });
        }

        // If no deck segmentation worked, output single PATH row
        if (deckSegments.length === 0) {
          rows.push({
            NO: '', CABLE_SYSTEM: '', CABLE_NAME: '',
            WD_PAGE: 'PATH',
            CABLE_TYPE: cable.supplyDeck || '',
            FROM_ROOM: cable.calculatedPath || cable.path || '',
            FROM_EQUIP: '', FROM_NODE: '', FROM_REST: '',
            TO_ROOM: '', TO_EQUIP: '', TO_NODE: '', TO_REST: '',
            CABLE_OUTDIA: '',
            POR_LENGTH: cable.routeBreakdown?.totalLength || cable.length || '',
            REMARK1: '', REMARK2: '', REMARK3: ''
          });
        } else {
          deckSegments.forEach((seg, si) => {
            rows.push({
              NO: '', CABLE_SYSTEM: '', CABLE_NAME: '',
              WD_PAGE: si === 0 ? 'PATH' : '',
              CABLE_TYPE: seg.deck || '',
              FROM_ROOM: seg.nodes.join(','),
              FROM_EQUIP: '', FROM_NODE: '', FROM_REST: '',
              TO_ROOM: '', TO_EQUIP: '', TO_NODE: '', TO_REST: '',
              CABLE_OUTDIA: '',
              POR_LENGTH: seg.length ? Number(seg.length.toFixed(1)) : '',
              REMARK1: '', REMARK2: '', REMARK3: ''
            });
          });
        }
      } else if (cable.calculatedPath || cable.path) {
        // Simple single PATH row
        rows.push({
          NO: '', CABLE_SYSTEM: '', CABLE_NAME: '',
          WD_PAGE: 'PATH',
          CABLE_TYPE: cable.supplyDeck || '',
          FROM_ROOM: cable.calculatedPath || cable.path || '',
          FROM_EQUIP: '', FROM_NODE: '', FROM_REST: '',
          TO_ROOM: '', TO_EQUIP: '', TO_NODE: '', TO_REST: '',
          CABLE_OUTDIA: '',
          POR_LENGTH: cable.routeBreakdown?.totalLength || cable.length || '',
          REMARK1: '', REMARK2: '', REMARK3: ''
        });
      }
    });
    return rows;
  }

  /**
   * Build POS rows (Cable abbreviation list / 소요량)
   * Groups cables by type, sums lengths
   */
  function buildPosRows() {
    const typeMap = {};
    state.cables.forEach(cable => {
      const t = cable.type || 'UNKNOWN';
      if (!typeMap[t]) {
        typeMap[t] = { type: t, totalLength: 0, count: 0 };
      }
      typeMap[t].totalLength += Number(cable.length) || 0;
      typeMap[t].count += 1;
    });

    const sorted = Object.values(typeMap).sort((a, b) => a.type.localeCompare(b.type));
    const rows = [];
    let grandTotal = 0;

    sorted.forEach((entry, idx) => {
      const typeInfo = typeof lookupCableType === 'function' ? lookupCableType(entry.type) : null;
      const voltage = typeInfo ? typeInfo.voltage : '';
      const roundedLen = Math.round(entry.totalLength);
      grandTotal += roundedLen;
      rows.push({
        NO: idx + 1,
        CABLE_TYPE: entry.type,
        DESCRIPTION: voltage,
        LENGTH: roundedLen,
        COUNT: entry.count,
        REMARK: ''
      });
    });

    rows.push({
      NO: '',
      CABLE_TYPE: 'TOTAL',
      DESCRIPTION: '',
      LENGTH: grandTotal,
      COUNT: state.cables.length,
      REMARK: ''
    });

    return rows;
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
      TOTAL_AREA: metric?.totalCrossSectionArea || 0,
      AREA_FILL_PCT: metric?.areaFillRatio || 0,
      TRAY_WIDTH: metric?.recommendedTrayWidth || 0,
      TRAY_FILL_RATIO: metric?.fillRatio || 0,
      TRAY_TIERS: metric?.effectiveTierCount || 1,
      TRAY_OVERRIDE_WIDTH: metric?.overrideWidth || 0,
      TRAY_OVERRIDE_TIERS: metric?.overrideTierCount || 0,
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
    if (typeof scheduleAutoSave === 'function') scheduleAutoSave();
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

  function parseNodeList(value, dedupe = true) {
    const nodes = Array.isArray(value)
      ? value.map(trimText).filter(Boolean)
      : String(value || '')
        .split(/\s*(?:,|;|\r?\n|->)\s*/g)
        .map(trimText)
        .filter(Boolean);
    return dedupe ? unique(nodes) : nodes;
  }

  function parsePathString(value) {
    return parseNodeList(String(value || '').replace(/\s*<->\s*/g, ' -> '), false);
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
    return Boolean(state.auth.backendAvailable && state.auth.providers?.local?.enabled);
  }

// --- END 50-import-export-bom-reports-utils.js ---

// --- BEGIN 60-auth-groupspace-final.js ---
﻿// ============================================================
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
          '<button id="settingsCloseBtn" class="toolbar-btn subtle" type="button">✕</button>' +
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

// --- END 60-auth-groupspace-final.js ---
