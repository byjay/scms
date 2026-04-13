/* ═══════════════════════════════════════════════════
   i18n — Multi-language Support
   ═══════════════════════════════════════════════════ */

const I18N = {
  ko: {
    'lbl-subtitle': 'Network Path Finder',
    'lbl-upload': 'Excel 파일 업로드',
    'lbl-upload-hint': '(.xlsx / .xls 지원)',
    'lbl-total': '총 노드',
    'lbl-trays': '트레이',
    'lbl-holes': '홀',
    'lbl-edges': '연결',
    'lbl-view': '뷰 모드',
    'lbl-labels': '라벨 표시',
    'lbl-reset': '뷰 초기화',
    'lbl-pathfinder': '경로 탐색',
    'lbl-start-node': '<i class="fas fa-circle" style="color:#22c55e"></i> 시작 노드',
    'lbl-end-node': '<i class="fas fa-circle" style="color:#ef4444"></i> 끝 노드',
    'lbl-find': '경로 찾기',
    'lbl-clear': '경로 초기화',
    'lbl-search': '노드 검색',
    'lbl-legend': '범례',
    'lbl-leg-path': '경로',
    'lbl-leg-start': '시작점',
    'lbl-leg-end': '끝점',
    'lbl-leg-hole': '홀',
    'lbl-leg-tray': '트레이',
    'lbl-leg-fire': '불꽃 경로',
    'lbl-hint-drag': '드래그',
    'lbl-hint-rotate': '회전',
    'lbl-hint-shift': '드래그',
    'lbl-hint-pan': '이동',
    'lbl-hint-scroll': '스크롤',
    'lbl-hint-zoom': '줌',
    'lbl-hint-click': '클릭',
    'lbl-hint-select': '노드 선택',
    'lbl-empty-title': 'Excel 파일을 업로드하세요',
    'lbl-empty-desc': '좌측에서 파일을 업로드하거나<br>데모 파일을 선택하면 3D 네트워크가 표시됩니다',
    'lbl-loading': '로딩 중...',
    'placeholder-input': '클릭하거나 입력...',
    'placeholder-search': 'ID 입력...',
    'msg-no-path': '경로를 찾을 수 없습니다.',
    'msg-no-path-detail': '가능한 원인:\n- 노드 ID가 정확하지 않음\n- 두 노드가 연결되어 있지 않음\n- 노드가 네트워크에 존재하지 않음',
    'msg-path-found': '✓ 경로 발견',
    'msg-nodes': '개 노드',
    'msg-length': '총 길이',
    'msg-fire-on': '불꽃 ON',
    'msg-fire-off': '불꽃 OFF',
    'msg-edge-length': '구간',
    'msg-accumulated': '누적'
  },
  en: {
    'lbl-subtitle': 'Network Path Finder',
    'lbl-upload': 'Upload Excel File',
    'lbl-upload-hint': '(.xlsx / .xls supported)',
    'lbl-total': 'Total',
    'lbl-trays': 'Trays',
    'lbl-holes': 'Holes',
    'lbl-edges': 'Edges',
    'lbl-view': 'View Mode',
    'lbl-labels': 'Show Labels',
    'lbl-reset': 'Reset View',
    'lbl-pathfinder': 'Path Finder',
    'lbl-start-node': '<i class="fas fa-circle" style="color:#22c55e"></i> Start Node',
    'lbl-end-node': '<i class="fas fa-circle" style="color:#ef4444"></i> End Node',
    'lbl-find': 'Find Path',
    'lbl-clear': 'Clear Path',
    'lbl-search': 'Search Nodes',
    'lbl-legend': 'Legend',
    'lbl-leg-path': 'Path',
    'lbl-leg-start': 'Start',
    'lbl-leg-end': 'End',
    'lbl-leg-hole': 'Hole',
    'lbl-leg-tray': 'Tray',
    'lbl-leg-fire': 'Fire Path',
    'lbl-hint-drag': 'Drag',
    'lbl-hint-rotate': 'Rotate',
    'lbl-hint-shift': 'Drag',
    'lbl-hint-pan': 'Pan',
    'lbl-hint-scroll': 'Scroll',
    'lbl-hint-zoom': 'Zoom',
    'lbl-hint-click': 'Click',
    'lbl-hint-select': 'Select Node',
    'lbl-empty-title': 'Upload an Excel File',
    'lbl-empty-desc': 'Upload a file from the sidebar or<br>select a demo file to display the 3D network',
    'lbl-loading': 'Loading...',
    'placeholder-input': 'Click or type...',
    'placeholder-search': 'Enter ID...',
    'msg-no-path': 'No path found.',
    'msg-no-path-detail': 'Possible reasons:\n- Node ID is incorrect\n- Two nodes are not connected\n- Node does not exist in the network',
    'msg-path-found': '✓ Path Found',
    'msg-nodes': ' nodes',
    'msg-length': 'Total length',
    'msg-fire-on': 'Fire ON',
    'msg-fire-off': 'Fire OFF',
    'msg-edge-length': 'Segment',
    'msg-accumulated': 'Accum.'
  },
  ja: {
    'lbl-subtitle': 'ネットワーク経路探索',
    'lbl-upload': 'Excelファイルをアップロード',
    'lbl-upload-hint': '(.xlsx / .xls 対応)',
    'lbl-total': '合計',
    'lbl-trays': 'トレイ',
    'lbl-holes': 'ホール',
    'lbl-edges': '接続',
    'lbl-view': 'ビューモード',
    'lbl-labels': 'ラベル表示',
    'lbl-reset': 'ビューリセット',
    'lbl-pathfinder': '経路探索',
    'lbl-start-node': '<i class="fas fa-circle" style="color:#22c55e"></i> 開始ノード',
    'lbl-end-node': '<i class="fas fa-circle" style="color:#ef4444"></i> 終了ノード',
    'lbl-find': '経路検索',
    'lbl-clear': '経路クリア',
    'lbl-search': 'ノード検索',
    'lbl-legend': '凡例',
    'lbl-leg-path': '経路',
    'lbl-leg-start': '開始点',
    'lbl-leg-end': '終了点',
    'lbl-leg-hole': 'ホール',
    'lbl-leg-tray': 'トレイ',
    'lbl-leg-fire': '炎の経路',
    'lbl-hint-drag': 'ドラッグ',
    'lbl-hint-rotate': '回転',
    'lbl-hint-shift': 'ドラッグ',
    'lbl-hint-pan': '移動',
    'lbl-hint-scroll': 'スクロール',
    'lbl-hint-zoom': 'ズーム',
    'lbl-hint-click': 'クリック',
    'lbl-hint-select': 'ノード選択',
    'lbl-empty-title': 'Excelファイルをアップロードしてください',
    'lbl-empty-desc': 'サイドバーからファイルをアップロードするか<br>デモファイルを選択すると3Dネットワークが表示されます',
    'lbl-loading': '読み込み中...',
    'placeholder-input': 'クリックまたは入力...',
    'placeholder-search': 'IDを入力...',
    'msg-no-path': '経路が見つかりません。',
    'msg-no-path-detail': '考えられる原因:\n- ノードIDが正しくない\n- 2つのノードが接続されていない\n- ノードがネットワークに存在しない',
    'msg-path-found': '✓ 経路発見',
    'msg-nodes': ' ノード',
    'msg-length': '総距離',
    'msg-fire-on': '炎 ON',
    'msg-fire-off': '炎 OFF',
    'msg-edge-length': '区間',
    'msg-accumulated': '累積'
  },
  zh: {
    'lbl-subtitle': '网络路径查找器',
    'lbl-upload': '上传Excel文件',
    'lbl-upload-hint': '(.xlsx / .xls 支持)',
    'lbl-total': '总节点',
    'lbl-trays': '线槽',
    'lbl-holes': '孔洞',
    'lbl-edges': '连接',
    'lbl-view': '视图模式',
    'lbl-labels': '显示标签',
    'lbl-reset': '重置视图',
    'lbl-pathfinder': '路径搜索',
    'lbl-start-node': '<i class="fas fa-circle" style="color:#22c55e"></i> 起始节点',
    'lbl-end-node': '<i class="fas fa-circle" style="color:#ef4444"></i> 结束节点',
    'lbl-find': '查找路径',
    'lbl-clear': '清除路径',
    'lbl-search': '搜索节点',
    'lbl-legend': '图例',
    'lbl-leg-path': '路径',
    'lbl-leg-start': '起点',
    'lbl-leg-end': '终点',
    'lbl-leg-hole': '孔洞',
    'lbl-leg-tray': '线槽',
    'lbl-leg-fire': '火焰路径',
    'lbl-hint-drag': '拖拽',
    'lbl-hint-rotate': '旋转',
    'lbl-hint-shift': '拖拽',
    'lbl-hint-pan': '平移',
    'lbl-hint-scroll': '滚轮',
    'lbl-hint-zoom': '缩放',
    'lbl-hint-click': '点击',
    'lbl-hint-select': '选择节点',
    'lbl-empty-title': '请上传Excel文件',
    'lbl-empty-desc': '从侧边栏上传文件或<br>选择演示文件以显示3D网络',
    'lbl-loading': '加载中...',
    'placeholder-input': '点击或输入...',
    'placeholder-search': '输入ID...',
    'msg-no-path': '未找到路径。',
    'msg-no-path-detail': '可能的原因:\n- 节点ID不正确\n- 两个节点未连接\n- 节点不存在于网络中',
    'msg-path-found': '✓ 找到路径',
    'msg-nodes': ' 个节点',
    'msg-length': '总长度',
    'msg-fire-on': '火焰 ON',
    'msg-fire-off': '火焰 OFF',
    'msg-edge-length': '区间',
    'msg-accumulated': '累计'
  }
};

let currentLang = 'ko';

function setLanguage(lang) {
  currentLang = lang;
  const dict = I18N[lang] || I18N.ko;

  // Update all elements with matching IDs
  Object.keys(dict).forEach(key => {
    if (key.startsWith('placeholder-') || key.startsWith('msg-')) return;
    const el = document.getElementById(key);
    if (el) {
      el.innerHTML = dict[key];
    }
  });

  // Update placeholders
  const inputStart = document.getElementById('input-start');
  const inputEnd = document.getElementById('input-end');
  const inputSearch = document.getElementById('input-search');
  if (inputStart) inputStart.placeholder = dict['placeholder-input'] || '';
  if (inputEnd) inputEnd.placeholder = dict['placeholder-input'] || '';
  if (inputSearch) inputSearch.placeholder = dict['placeholder-search'] || '';

  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function t(key) {
  return (I18N[currentLang] || I18N.ko)[key] || key;
}
