// ============================================================
// SEASTAR CMS V6 — React-Compatible Single-File Application
// Full Cable Management System with Auth, Node Map, Tray Physics, BOM
// ============================================================

// ---- STATE ----
let cableData=[], nodeData=[], filteredCableData=[], filteredNodeData=[];
let charts={}, _nodeMap=null, _3d=null;
let selectedCables=new Set(), selectedRoutes=new Set();
let filterConditions=[];
let cableSort={col:null,dir:1}, nodeSort={col:null,dir:1};
let editingCell=null, projectCreated=null;
let currentUser=null, currentGroup=null, currentShip=null;
let undoStack=[], redoStack=[];

// ---- 작업 로그 시스템 ----
let operationLog=[]; // 작업 이력 저장 배열

// ---- 작업 로그 시스템 ----
let undoStack=[], redoStack=[];

// ---- 작업 로그 시스템 ----
let operationLog=[]; // 작업 이력 저장 배열

// 작업 로그 기록 함수
function logOperation(action, details, isBatch=false){
  const timestamp=new Date().toISOString();
  const entry={
    timestamp,
    action,
    details,
    isBatch,
    currentUser:currentUser?.username||'anonymous'
  };
  operationLog.push(entry);
  console.log('[WORKLOG]', entry);
}

// 작업 로그 파일로 내보내기
function exportOperationLog(){
  if(operationLog.length===0){
    notify('작업 로그가 없습니다.','warning');
    return;
  }
  
  const csvContent='timestamp,action,details,isBatch,user\n'+
    operationLog.map(log=>
      `${log.timestamp},${log.action},${log.details||''},${log.isBatch},${log.currentUser}`
    ).join('\n');
  
  const blob=new Blob([csvContent],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`operation_log_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  notify(`작업 로그 내보내기 완료: ${operationLog.length}개 기록`,'success');
}

// 배치 작업 시작/종료 기록
function logBatchStart(action){
  logOperation(action+'(배치 시작)',true,true);
}

function logBatchEnd(action, count){
  logOperation(action+'(배치 완료) - '+count+'개 항목',true,true);
}
const API = '';

// ---- EMBEDDED NODE DATA (subset for graph structure) ----
const EMBEDDED_NODES=[];

// ---- COLUMN DEFINITIONS ----
const CABLE_COLS=[
  {key:'_idx',label:'#',w:44},{key:'name',label:'CABLE NAME',w:160,edit:1},
  {key:'type',label:'TYPE',w:90,edit:1},{key:'system',label:'SYSTEM',w:100,edit:1},
  {key:'fromNode',label:'FROM',w:110,edit:1},{key:'toNode',label:'TO',w:110,edit:1},
  {key:'outDia',label:'DIA(mm)',w:70,edit:1},{key:'checkNode',label:'CHECK NODE',w:120,edit:1},
  {key:'calcLen',label:'LENGTH(m)',w:80},{key:'calculatedPath',label:'PATH',w:240}
];
const NODE_COLS=[
  {key:'_idx',label:'#',w:44},{key:'name',label:'NODE NAME',w:140},
  {key:'structure',label:'STRUCTURE',w:110},{key:'type',label:'TYPE',w:80},
  {key:'relation',label:'RELATIONS',w:180},{key:'linkLength',label:'LINK(m)',w:70},
  {key:'areaSize',label:'AREA(mm2)',w:80},{key:'connectedCables',label:'CABLES',w:60},
  {key:'fillPct',label:'FILL %',w:70}
];

// ---- DECK CONFIG ----
let deckConfig=[
  {prefix:'SF',deck:0,label:'Main Deck',color:'#00c8f0'},
  {prefix:'TW',deck:1,label:'Tween Deck',color:'#00e5a0'},
  {prefix:'PA',deck:2,label:'Upper Deck',color:'#ffc107'},
  {prefix:'PR',deck:3,label:'Platform',color:'#b06af5'},
  {prefix:'BC',deck:4,label:'Bridge',color:'#ff4d4d'},
  {prefix:'TO',deck:0,label:'Main Deck',color:'#00c8f0'},
  {prefix:'SC',deck:1,label:'SCR Area',color:'#00c8f0'},
  {prefix:'ER',deck:0,label:'Engine Room',color:'#00e5a0'},
];

function getDeckForNode(n){
  if(!n) return {deck:0,color:'#607d8b',label:''};
  const p=n.slice(0,2).toUpperCase();
  return deckConfig.find(r=>r.prefix===p)||{deck:0,color:'#607d8b',label:p};
}

// ---- UTILITIES ----
function safePF(v){const p=parseFloat(String(v||'').replace(/[^0-9.-]/g,''));return isNaN(p)?0:p}
function fmt(n,d=1){return n!=null?Number(n).toFixed(d):'-'}
function fmtNum(n){return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n)}
function now(){return new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
function getColIdx(h,names){const lh=h.map(x=>String(x||'').toLowerCase().trim());for(const n of names){const i=lh.indexOf(n.toLowerCase());if(i!==-1)return i}return -1}

// COLUMN MAPPING
const CABLE_MAP={name:['CABLE_NAME','NAME','Cable Name'],type:['CABLE_TYPE','TYPE','Type'],system:['CABLE_SYSTEM','SYSTEM','System'],fromNode:['FROM_NODE','From Node','FROM'],toNode:['TO_NODE','To Node','TO'],fromRoom:['FROM_ROOM'],toRoom:['TO_ROOM'],fromEquip:['FROM_EQUIP'],toEquip:['TO_EQUIP'],fromRest:['FROM_REST','FROM REST'],toRest:['TO_REST','TO REST'],length:['POR_LENGTH','LENGTH','Length'],path:['CABLE_PATH','PATH','Path'],outDia:['CABLE_OUTDIA','OUT_DIA','Diameter','OUTDIA'],checkNode:['CHECK_NODE','Check Node','Check']};
const NODE_MAP_COLS={name:['NODE_RNAME','NODE_NAME','NAME','Node'],structure:['STRUCTURE_NAME','STRUCTURE','Structure'],component:['COMPONENT','Component'],type:['NODE_TYPE','TYPE','Type'],relation:['RELATION','Relation'],linkLength:['LINK_LENGTH','Link Length'],areaSize:['AREA_SIZE','Area Size','Area'],nx:['POS_X','X','x','NODE_X','COORD_X'],ny:['POS_Y','Y','y','NODE_Y','COORD_Y'],nz:['POS_Z','Z','z','NODE_Z','COORD_Z']};

// ---- NOTIFICATIONS ----
function notify(msg,type='info'){
  const s=document.getElementById('notifStack');if(!s)return;
  const icons={info:'ℹ',success:'✓',warning:'⚠',error:'✕'};
  const el=document.createElement('div');
  el.className=`notif ${type}`;
  el.innerHTML=`<span>${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  s.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),400)},3500);
  const sb=document.getElementById('sbAction');if(sb)sb.textContent=msg;
}
function showLoader(t='PROCESSING...'){const l=document.getElementById('loader');if(l){l.classList.add('on');const lt=document.getElementById('loaderText');if(lt)lt.textContent=t}}
function hideLoader(){const l=document.getElementById('loader');if(l)l.classList.remove('on')}

// ---- UNDO/REDO ----
function pushHistory(a){undoStack.push(a);if(undoStack.length>100)undoStack.shift();redoStack=[]}
function undoAction(){if(!undoStack.length)return;const a=undoStack.pop();a.undo();redoStack.push(a);notify('실행 취소','info')}
function redoAction(){if(!redoStack.length)return;const a=redoStack.pop();a.redo();undoStack.push(a);notify('재실행','info')}

// ---- AUTHENTICATION ----
async function doLogin(){
  const id=document.getElementById('loginId').value.trim();
  const pw=document.getElementById('loginPw').value;
  const err=document.getElementById('loginError');
  if(!id||!pw){err.textContent='아이디와 비밀번호를 입력하세요';err.style.display='block';return}
  try{
    const r=await fetch(API+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:id,password:pw})});
    const d=await r.json();
    if(!r.ok){err.textContent=d.error||'로그인 실패';err.style.display='block';return}
    err.style.display='none';
    currentUser=d.user;
    localStorage.setItem('seastar_session',JSON.stringify({userId:d.user.id,token:d.token,ts:Date.now()}));
    document.getElementById('loginOverlay').style.display='none';
    afterLogin();
  }catch(e){err.textContent='서버 연결 실패';err.style.display='block'}
}

function doLogout(){
  if(!confirm('로그아웃하시겠습니까?'))return;
  currentUser=null;currentGroup=null;currentShip=null;
  localStorage.removeItem('seastar_session');
  document.getElementById('loginOverlay').style.display='flex';
  document.getElementById('hdrUserBox').style.display='none';
  const at=document.getElementById('adminTabBtn');if(at)at.style.display='none';
}

async function afterLogin(){
  // Load groups
  try{
    const gr=await fetch(API+'/api/admin/groups').then(r=>r.json());
    const groups=gr.groups||[];
    currentGroup=groups.find(g=>g.id===currentUser.groupId)||groups[0]||null;
  }catch(e){}
  // Update header
  const ub=document.getElementById('hdrUserBox');if(ub)ub.style.display='flex';
  const un=document.getElementById('hdrUserName');if(un)un.textContent=currentUser.name||currentUser.username;
  const ur=document.getElementById('hdrUserRole');
  if(ur){
    if(currentUser.role==='admin'){ur.textContent='ADMIN';ur.style.color='var(--amber)';document.getElementById('adminTabBtn').style.display='flex'}
    else if(currentUser.role==='manager'){ur.textContent='MGR';ur.style.color='var(--purple)'}
    else{ur.textContent='USER';ur.style.color='var(--cyan)'}
  }
  showShipSelectModal();
}

async function checkSession(){
  const s=localStorage.getItem('seastar_session');
  if(!s)return;
  try{
    const sess=JSON.parse(s);
    if(Date.now()-sess.ts>8*3600*1000){localStorage.removeItem('seastar_session');return}
    const r=await fetch(API+'/api/auth/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:sess.userId})});
    if(r.ok){
      const d=await r.json();
      currentUser=d.user;
      document.getElementById('loginOverlay').style.display='none';
      afterLogin();
    }
  }catch(e){}
}

// ---- SHIP SELECT ----
async function showShipSelectModal(){
  const ov=document.getElementById('shipSelectOverlay');ov.style.display='flex';
  const list=document.getElementById('shipSelectList');
  list.innerHTML='<div style="color:var(--t3);font-size:11px;padding:10px">로딩 중...</div>';
  try{
    const r=await fetch(API+`/api/projects/ships?groupId=${currentUser?.groupId||''}&role=${currentUser?.role||''}`);
    const d=await r.json();
    const ships=d.ships||[];
    if(!ships.length){
      list.innerHTML='<div style="color:var(--t3);font-size:11px;padding:10px">등록된 호선이 없습니다. 아래에서 새 호선을 생성하세요.</div>';
    }else{
      list.innerHTML=ships.map(s=>`<div class="tray-node-item ${currentShip?.id===s.id?'active':''}" onclick="selectShip('${s.id}','${s.name}','${s.ship_no||''}','${s.group_id||''}')">
        <span>🚢 ${s.name} <span style="color:var(--t3);font-size:9px">${s.ship_no||''}</span></span>
        <button class="btn btn-r" style="font-size:8px;padding:2px 5px" onclick="event.stopPropagation();deleteShip('${s.id}')">✕</button>
      </div>`).join('');
    }
    // Load groups into new ship form
    const gr=await fetch(API+'/api/admin/groups').then(r=>r.json());
    const sel=document.getElementById('newShipGroup');
    if(sel)sel.innerHTML=(gr.groups||[]).map(g=>`<option value="${g.id}">${g.name}</option>`).join('');
  }catch(e){list.innerHTML='<div style="color:var(--red);font-size:11px">서버 연결 실패</div>'}
}

async function selectShip(id,name,no,gid){
  currentShip={id,name,no:no||'',groupId:gid||''};
  document.getElementById('shipSelectOverlay').style.display='none';
  document.getElementById('hdrShipBadge').style.display='flex';
  document.getElementById('hdrShipName').textContent=name;
  notify(`🚢 호선 선택: ${name}`,'success');
  // Load project
  try{
    const r=await fetch(API+`/api/projects/load/${id}`);
    const d=await r.json();
    if(d.data){
      if(d.data.cables){cableData=d.data.cables;filteredCableData=[...cableData]}
      if(d.data.nodes){nodeData=d.data.nodes;filteredNodeData=[...nodeData]}
      _nodeMap=null;
      if(nodeData.length)buildNodeMap();
      updateAll();
      notify(`프로젝트 로드: 케이블 ${cableData.length}개, 노드 ${nodeData.length}개`,'success');
    }
  }catch(e){}
}

async function createNewShip(){
  const name=document.getElementById('newShipName').value.trim();
  const no=document.getElementById('newShipNo').value.trim();
  const gid=document.getElementById('newShipGroup').value;
  if(!name){notify('호선명을 입력하세요','warning');return}
  try{
    const r=await fetch(API+'/api/projects/ships',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,shipNo:no,groupId:gid,ownerId:currentUser?.id})});
    const d=await r.json();
    if(r.ok){notify(`호선 생성: ${name}`,'success');showShipSelectModal();document.getElementById('newShipName').value='';document.getElementById('newShipNo').value=''}
    else notify(d.error||'생성 실패','error');
  }catch(e){notify('서버 오류','error')}
}

async function deleteShip(id){
  if(!confirm('이 호선과 프로젝트 데이터를 삭제하시겠습니까?'))return;
  try{await fetch(API+`/api/projects/ships/${id}`,{method:'DELETE'});notify('호선 삭제됨','warning');showShipSelectModal()}catch(e){}
}

async function saveShipProject(){
  if(!currentShip){notify('호선을 먼저 선택하세요','warning');return}
  showLoader('프로젝트 저장 중...');
  
  // 작업 로그 기록 (배치 작업 제외)
  logOperation('프로젝트 저장', `호선: ${currentShip.name}, 케이블: ${cableData.length}개, 노드: ${nodeData.length}개`, false);
  
  try{
    const data={cables:cableData.map(c=>({name:c.name,type:c.type,system:c.system,fromNode:c.fromNode,toNode:c.toNode,fromRoom:c.fromRoom||'',toRoom:c.toRoom||'',fromEquip:c.fromEquip||'',toEquip:c.toEquip||'',fromRest:c.fromRest||0,toRest:c.toRest||0,length:c.length,outDia:c.outDia,checkNode:c.checkNode||'',calculatedPath:c.calculatedPath||'',calculatedLength:c.calculatedLength||0})),nodes:nodeData.map(n=>({name:n.name,structure:n.structure||'',type:n.type||'',relation:n.relation||'',linkLength:n.linkLength,areaSize:n.areaSize,x:n.x,y:n.y,z:n.z,relations:n.relations||[]})),meta:{ship:currentShip.name,savedAt:new Date().toISOString()}};
    await fetch(API+'/api/projects/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shipId:currentShip.id,data,userId:currentUser?.id})});
    notify(`프로젝트 저장 완료 (${currentShip.name})`,'success');
  }catch(e){notify('저장 실패','error')}
  hideLoader();
}
  if(!currentShip){notify('호선을 먼저 선택하세요','warning');return}
  showLoader('프로젝트 저장 중...');
  try{
    const data={cables:cableData.map(c=>({name:c.name,type:c.type,system:c.system,fromNode:c.fromNode,toNode:c.toNode,fromRoom:c.fromRoom||'',toRoom:c.toRoom||'',fromEquip:c.fromEquip||'',toEquip:c.toEquip||'',fromRest:c.fromRest||0,toRest:c.toRest||0,length:c.length,outDia:c.outDia,checkNode:c.checkNode||'',calculatedPath:c.calculatedPath||'',calculatedLength:c.calculatedLength||0})),nodes:nodeData.map(n=>({name:n.name,structure:n.structure||'',type:n.type||'',relation:n.relation||'',linkLength:n.linkLength,areaSize:n.areaSize,x:n.x,y:n.y,z:n.z,relations:n.relations||[]})),meta:{ship:currentShip.name,savedAt:new Date().toISOString()}};
    await fetch(API+'/api/projects/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shipId:currentShip.id,data,userId:currentUser?.id})});
    notify(`프로젝트 저장 완료 (${currentShip.name})`,'success');
  }catch(e){notify('저장 실패','error')}
  hideLoader();
}

// ---- TAB MANAGEMENT ----
function showTab(id){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const panel=document.getElementById('panel-'+id);if(panel)panel.classList.add('active');
  const tabMap={overview:0,cables:1,nodes:2,viz3d:3,routing:4,analysis:5,tray:6,bom:7,project:8};
  const btns=[...document.querySelectorAll('.tab-btn')];
  if(tabMap[id]!==undefined)btns[tabMap[id]]?.classList.add('active');
  else if(id==='admin')document.getElementById('adminTabBtn')?.classList.add('active');
  if(id==='viz3d')setTimeout(()=>init3DMap(),50);
  if(id==='bom')setTimeout(()=>renderBOM(),50);
  if(id==='analysis')runAnalysisUpdate();
  if(id==='project')updateProjectPanel();
  if(id==='admin')renderAdminPanels();
  if(id==='tray'){renderTrayNodeList();if(!fillState.cableData.length)initFillPanel()}
}

// ---- FILE LOADING ----
function onFileSelected(type,input){
  const file=input.files[0];if(!file)return;
  const elId=type==='cable'?'cableFileName':'nodeFileName';
  const zoneId=type==='cable'?'cableZone':'nodeZone';
  document.getElementById(elId).textContent='📄 '+file.name;
  document.getElementById(elId).classList.add('loaded');
  document.getElementById(zoneId).classList.add('loaded');
}

async function loadFiles(){
  if(typeof XLSX==='undefined'){notify('XLSX 라이브러리 로드 실패','error');return}
  const cf=document.getElementById('cableFile').files[0];
  const nf=document.getElementById('nodeFile').files[0];
  if(!cf&&!nf){notify('파일을 선택해주세요','warning');return}
  cableData=[];nodeData=[];filteredCableData=[];filteredNodeData=[];_nodeMap=null;selectedCables.clear();selectedRoutes.clear();
  showLoader('파일 로드 중...');
  try{
    if(cf)await loadExcel(cf,'cable');
    if(nf)await loadExcel(nf,'node');
    projectCreated=new Date();
    notify(`로드 완료: 케이블 ${cableData.length}개, 노드 ${nodeData.length}개`,'success');
    updateAll();
    if(currentShip){saveShipProject();notify(`프로젝트 자동저장 (${currentShip.name})`,'success')}
  }catch(e){notify('파일 읽기 오류: '+e.message,'error')}
  hideLoader();
}

function loadExcel(file,type){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=e=>{try{const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});const sheet=wb.Sheets[wb.SheetNames[0]];const data=XLSX.utils.sheet_to_json(sheet,{header:1,blankrows:false});if(type==='cable')processCable(data);else processNode(data);res()}catch(err){rej(err)}};
    r.onerror=()=>rej(new Error('파일 읽기 실패'));
    r.readAsArrayBuffer(file);
  });
}

function processCable(raw){
  if(raw.length<2)return;
  const h=raw[0],idx={};
  for(const k in CABLE_MAP)idx[k]=getColIdx(h,CABLE_MAP[k]);
  _nodeMap=null;
  cableData=raw.slice(1).map((r,i)=>({
    id:i,name:idx.name>=0?String(r[idx.name]||''):'',type:idx.type>=0?String(r[idx.type]||''):'',system:idx.system>=0?String(r[idx.system]||''):'',fromNode:idx.fromNode>=0?String(r[idx.fromNode]||''):'',toNode:idx.toNode>=0?String(r[idx.toNode]||''):'',fromRoom:idx.fromRoom>=0?String(r[idx.fromRoom]||''):'',toRoom:idx.toRoom>=0?String(r[idx.toRoom]||''):'',fromEquip:idx.fromEquip>=0?String(r[idx.fromEquip]||''):'',toEquip:idx.toEquip>=0?String(r[idx.toEquip]||''):'',fromRest:idx.fromRest>=0?safePF(r[idx.fromRest]):0,toRest:idx.toRest>=0?safePF(r[idx.toRest]):0,length:idx.length>=0?safePF(r[idx.length]):0,path:idx.path>=0?String(r[idx.path]||''):'',outDia:idx.outDia>=0?safePF(r[idx.outDia]):0,checkNode:idx.checkNode>=0?String(r[idx.checkNode]||''):'',calculatedPath:'',calculatedLength:0
  })).filter(c=>c.name);
  filteredCableData=[...cableData];
}

function processNode(raw){
  if(raw.length<2)return;
  const h=raw[0],idx={};
  for(const k in NODE_MAP_COLS)idx[k]=getColIdx(h,NODE_MAP_COLS[k]);
  _nodeMap=null;
  nodeData=raw.slice(1).map((r,i)=>({
    id:i,name:idx.name>=0?String(r[idx.name]||''):'',structure:idx.structure>=0?String(r[idx.structure]||''):'',component:idx.component>=0?String(r[idx.component]||''):'',type:idx.type>=0?String(r[idx.type]||''):'',relation:idx.relation>=0?String(r[idx.relation]||''):'',linkLength:idx.linkLength>=0?safePF(r[idx.linkLength]):1,areaSize:idx.areaSize>=0?safePF(r[idx.areaSize]):0,x:idx.nx>=0?safePF(r[idx.nx]):null,y:idx.ny>=0?safePF(r[idx.ny]):null,z:idx.nz>=0?safePF(r[idx.nz]):null,relations:idx.relation>=0?String(r[idx.relation]||'').split(',').map(s=>s.trim()).filter(Boolean):[],connectedCables:0,fillPct:0
  })).filter(n=>n.name);
  filteredNodeData=[...nodeData];
}

// ---- PATH CALCULATION (Dijkstra) ----
class PQ{constructor(){this.h=[]}push(d,n){this.h.push([d,n]);this._up(this.h.length-1)}pop(){const t=this.h[0];const l=this.h.pop();if(this.h.length){this.h[0]=l;this._dn(0)}return t}get size(){return this.h.length}_up(i){while(i>0){const p=(i-1)>>1;if(this.h[p][0]<=this.h[i][0])break;[this.h[p],this.h[i]]=[this.h[i],this.h[p]];i=p}}_dn(i){const n=this.h.length;for(;;){let m=i,l=2*i+1,r=2*i+2;if(l<n&&this.h[l][0]<this.h[m][0])m=l;if(r<n&&this.h[r][0]<this.h[m][0])m=r;if(m===i)break;[this.h[m],this.h[i]]=[this.h[i],this.h[m]];i=m}}}

function buildNodeMap(){
  _nodeMap={};
  nodeData.forEach(n=>{_nodeMap[n.name]={edges:{},w:Math.max(0.001,n.linkLength||1)}});
  nodeData.forEach(n=>{
    const rels=n.relation?n.relation.split(',').map(s=>s.trim()).filter(Boolean):[];
    rels.forEach(nb=>{
      if(!nb)return;
      if(!_nodeMap[nb])_nodeMap[nb]={edges:{},w:1};
      const w=Math.max(0.001,n.linkLength||1);
      _nodeMap[n.name].edges[nb]=w;
      if(_nodeMap[nb].edges[n.name]==null)_nodeMap[nb].edges[n.name]=Math.max(0.001,_nodeMap[nb].w||1);
    });
  });
}

function dijkstra(from,to){
  if(!_nodeMap)buildNodeMap();
  if(!_nodeMap[from]||!_nodeMap[to])return null;
  if(from===to)return{path:[from],length:0};
  const dist=Object.create(null),prev=Object.create(null),settled=new Set();
  Object.keys(_nodeMap).forEach(n=>{dist[n]=Infinity;prev[n]=null});
  dist[from]=0;
  const pq=new PQ();pq.push(0,from);
  while(pq.size>0){
    const[d,cur]=pq.pop();
    if(settled.has(cur))continue;settled.add(cur);
    if(cur===to)break;
    if(d>dist[cur])continue;
    const edges=_nodeMap[cur]?.edges||{};
    for(const[nb,w]of Object.entries(edges)){
      if(settled.has(nb))continue;
      const alt=dist[cur]+w;
      if(alt<(dist[nb]??Infinity)){dist[nb]=alt;prev[nb]=cur;pq.push(alt,nb)}
    }
  }
  if(dist[to]===Infinity)return null;
  const path=[];let c=to;const guard=new Set();
  while(c!=null){if(guard.has(c))return null;guard.add(c);path.unshift(c);c=prev[c]}
  if(path[0]!==from)return null;
  return{path,length:Math.round(dist[to]*100)/100};
}

function calcCableLength(cable){
  const from=cable.fromNode?.trim(),to=cable.toNode?.trim(),check=cable.checkNode||'';
  const fromRest=cable.fromRest||0,toRest=cable.toRest||0;
  if(!from||!to)return null;
  if(!_nodeMap&&nodeData.length)buildNodeMap();
  if(!_nodeMap)return null;
  if(from===to){const nw=(_nodeMap[from]?.w)||0;return{path:[from],length:Math.round((nw+fromRest+toRest)*100)/100}}
  const wps=check.split(',').map(s=>s.trim()).filter(Boolean);
  const targets=[...wps,to];
  const fullPath=[from];let totalLen=0,curr=from;
  for(let target of targets){
    const res=dijkstra(curr,target);if(!res)return null;
    fullPath.push(...res.path.slice(1));totalLen+=res.length;curr=target;
  }
  const finalLen=Math.round((totalLen+fromRest+toRest)*100)/100;
  const uniquePath=fullPath.filter((item,pos,arr)=>pos===0||item!==arr[pos-1]);
  return{path:uniquePath,length:finalLen};
}

async function calculateAllPaths(){
  if(!nodeData.length){notify('노드 파일을 먼저 로드해주세요','warning');return}
  if(!cableData.length){notify('케이블 파일을 먼저 로드해주세요','warning');return}
  showLoader('노드 맵 구축 중...');
  await new Promise(r=>setTimeout(r,40));
  buildNodeMap();
  let cnt=0,fail=0,skip=0;const BATCH=80,total=cableData.length;
  for(let i=0;i<total;i+=BATCH){
    const end=Math.min(i+BATCH,total);
    for(let j=i;j<end;j++){
      const cable=cableData[j];
      try{
        if(!cable.fromNode||!cable.toNode){skip++;continue}
        if(!_nodeMap[cable.fromNode]||!_nodeMap[cable.toNode]){fail++;continue}
        const res=calcCableLength(cable);
        if(res){cable.calculatedPath=res.path.join(', ');cable.calculatedLength=res.length;cnt++}
        else fail++;
      }catch(e){fail++}
    }
    const lt=document.getElementById('loaderText');if(lt)lt.textContent=`경로 산출 중... ${end}/${total} (${Math.round(end/total*100)}%)`;
    await new Promise(r=>setTimeout(r,0));
  }
  filteredCableData=[...cableData];applyFilters();updateAll();hideLoader();
  notify(`✓ ${cnt}개 완료${fail>0?' | ✗ '+fail+'개 실패':''}${skip>0?' | '+skip+'개 스킵':''}`,(fail>0?'warning':'success'));
}

// ---- UPDATE ALL ----
function updateAll(){
  calcConnectedCables();updateKPIs();updateFiltersDropdowns();
  renderCableTable();renderNodeTable();updateCharts();updateStatusBar();
}
function refreshAll(){updateAll();notify('새로고침 완료','info')}

function calcConnectedCables(){
  const cnt={};
  cableData.forEach(c=>{if(c.fromNode)cnt[c.fromNode]=(cnt[c.fromNode]||0)+1;if(c.toNode&&c.toNode!==c.fromNode)cnt[c.toNode]=(cnt[c.toNode]||0)+1});
  nodeData.forEach(n=>{n.connectedCables=cnt[n.name]||0});
  const cableArea={};
  cableData.forEach(c=>{
    if(c.outDia>0){const a=Math.PI*(c.outDia/2)**2;const pn=c.calculatedPath?c.calculatedPath.split(/\s*[,→]\s*/).filter(Boolean):[c.fromNode,c.toNode].filter(Boolean);pn.forEach(n=>{cableArea[n]=(cableArea[n]||0)+a})}
  });
  nodeData.forEach(n=>{n.fillPct=n.areaSize>0?Math.min(999,Math.round((cableArea[n.name]||0)/n.areaSize*100)):0});
}

function updateKPIs(){
  const tc=cableData.length,tn=nodeData.length,cp=cableData.filter(c=>c.calculatedPath).length;
  const tl=cableData.reduce((s,c)=>s+(c.calculatedLength||c.length||0),0);
  const cov=tc>0?Math.round(cp/tc*100):0;
  const setT=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  setT('kpiCables',fmtNum(tc));setT('kpiNodes',fmtNum(tn));setT('kpiPaths',fmtNum(cp));setT('kpiLength',fmtNum(Math.round(tl)));
  setT('dkCables',fmtNum(tc));setT('dkNodes',fmtNum(tn));setT('dkPaths',fmtNum(cp));setT('dkLength',fmtNum(Math.round(tl)));setT('dkCoverage',cov+'%');
  setT('hdrCableCount',fmtNum(tc));setT('hdrNodeCount',fmtNum(tn));setT('hdrPathCount',fmtNum(cp));
  setT('sbCables',tc);setT('sbNodes',tn);
}

// ---- CABLE TABLE ----
function renderCableTable(){
  const tbody=document.getElementById('cableTbody');if(!tbody)return;
  const data=filteredCableData;
  // Show max 500 rows for performance
  const show=data.slice(0,500);
  tbody.innerHTML=show.map((c,i)=>{
    const cl=c.calculatedLength>0?c.calculatedLength:(c.length||0);
    const haspath=!!c.calculatedPath;
    const pathText=haspath?c.calculatedPath.split(/\s*[,→]\s*/).filter(Boolean).join(' → '):'<span style="color:var(--t3);font-style:italic">미산출</span>';
    return `<tr class="${selectedCables.has(c.id)?'sel':''}" onclick="selectCableRow(${c.id},event)">
      <td style="color:var(--t3);font-size:10px">${i+1}</td>
      <td title="${c.name}">${c.name}</td>
      <td>${c.type||'-'}</td><td>${c.system||'-'}</td>
      <td>${c.fromNode||'-'}</td><td>${c.toNode||'-'}</td>
      <td>${c.outDia||'-'}</td><td>${c.checkNode||'-'}</td>
      <td class="data">${cl>0?cl.toFixed(1):'-'}</td>
      <td title="${c.calculatedPath||''}">${haspath?'<span style="color:var(--green)">✓</span> ':''}<span style="font-size:10px">${pathText}</span></td>
    </tr>`}).join('');
  const fc=document.getElementById('filterCount');
  if(fc)fc.textContent=filteredCableData.length!==cableData.length?`${filteredCableData.length}/${cableData.length}개`:'';
}

function selectCableRow(id,e){
  if(e?.ctrlKey||e?.metaKey){if(selectedCables.has(id))selectedCables.delete(id);else selectedCables.add(id)}
  else{selectedCables.clear();selectedCables.add(id)}
  renderCableTable();
}
function selectAllCables(){cableData.forEach(c=>selectedCables.add(c.id));renderCableTable()}
function deselectAllCables(){selectedCables.clear();renderCableTable()}

// ---- NODE TABLE ----
function renderNodeTable(){
  const tbody=document.getElementById('nodeTbody');if(!tbody)return;
  const data=filteredNodeData.slice(0,500);
  tbody.innerHTML=data.map((n,i)=>{
    const fc=n.fillPct>100?'var(--red)':n.fillPct>70?'var(--amber)':'var(--green)';
    return `<tr>
      <td style="color:var(--t3);font-size:10px">${i+1}</td>
      <td>${n.name}</td><td>${n.structure||'-'}</td><td>${n.type||'-'}</td>
      <td title="${n.relation||''}">${n.relation||'-'}</td>
      <td class="data">${n.linkLength>0?n.linkLength.toFixed(1):'-'}</td>
      <td class="data">${n.areaSize>0?n.areaSize:'-'}</td>
      <td class="data">${n.connectedCables||0}</td>
      <td><span style="color:${fc};font-family:'Orbitron',sans-serif;font-size:10px">${n.fillPct>0?n.fillPct+'%':'-'}</span></td>
    </tr>`}).join('');
}

function filterNodes(){
  const q=(document.getElementById('nodeSearch')?.value||'').toLowerCase();
  filteredNodeData=q?nodeData.filter(n=>n.name.toLowerCase().includes(q)||n.structure.toLowerCase().includes(q)||(n.type||'').toLowerCase().includes(q)):[...nodeData];
  renderNodeTable();
}

// ---- FILTERS ----
function updateFiltersDropdowns(){
  const sf=document.getElementById('systemFilter'),tf=document.getElementById('typeFilter');
  if(!sf||!tf)return;
  const sys=[...new Set(cableData.map(c=>c.system).filter(s=>s))].sort();
  const types=[...new Set(cableData.map(c=>c.type).filter(t=>t))].sort();
  const cs=sf.value,ct=tf.value;
  sf.innerHTML='<option value="">모든 시스템</option>'+sys.map(s=>`<option value="${s}"${s===cs?' selected':''}>${s}</option>`).join('');
  tf.innerHTML='<option value="">모든 타입</option>'+types.map(t=>`<option value="${t}"${t===ct?' selected':''}>${t}</option>`).join('');
  // BOM filters
  const bs=document.getElementById('bomSystemFilter'),bt=document.getElementById('bomTypeFilter');
  if(bs)bs.innerHTML='<option value="">모든 시스템</option>'+sys.map(s=>`<option value="${s}">${s}</option>`).join('');
  if(bt)bt.innerHTML='<option value="">모든 타입</option>'+types.map(t=>`<option value="${t}">${t}</option>`).join('');
}

function applyFilters(){
  const q=(document.getElementById('cableSearch')?.value||'').toLowerCase();
  const sys=document.getElementById('systemFilter')?.value||'';
  const typ=document.getElementById('typeFilter')?.value||'';
  const pth=document.getElementById('pathFilter')?.value||'';
  filteredCableData=cableData.filter(c=>{
    if(q&&!c.name.toLowerCase().includes(q)&&!c.type.toLowerCase().includes(q)&&!c.system.toLowerCase().includes(q)&&!c.fromNode.toLowerCase().includes(q)&&!c.toNode.toLowerCase().includes(q))return false;
    if(sys&&c.system!==sys)return false;
    if(typ&&c.type!==typ)return false;
    if(pth==='calc'&&!c.calculatedPath)return false;
    if(pth==='none'&&c.calculatedPath)return false;
    return true;
  });
  renderCableTable();
}
function clearFilters(){
  document.getElementById('cableSearch').value='';
  document.getElementById('systemFilter').value='';
  document.getElementById('typeFilter').value='';
  document.getElementById('pathFilter').value='';
  applyFilters();
}

// ---- CHARTS ----
const COLORS=['#00b4d8','#06d6a0','#ffb703','#a855f7','#ef4444','#f97316','#22d3ee','#84cc16','#ec4899','#14b8a6'];
function updateCharts(){
  if(typeof Chart==='undefined'){setTimeout(updateCharts,500);return}
  updateSystemChart();updateTypeChart();updateNodeChart();
}
function mkChart(id,type,labels,datasets,opts={}){
  if(typeof Chart==='undefined')return;
  const ctx=document.getElementById(id);if(!ctx)return;
  if(charts[id])try{charts[id].destroy()}catch(e){}
  try{charts[id]=new Chart(ctx,{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,animation:{duration:400},plugins:{legend:{position:'bottom',labels:{color:'#85bedd',font:{size:10},padding:8}}},scales:type==='bar'||type==='line'?{x:{ticks:{color:'#4d7fa0',font:{size:9}},grid:{color:'rgba(26,66,112,.3)'}},y:{ticks:{color:'#4d7fa0',font:{size:9}},grid:{color:'rgba(26,66,112,.3)'},beginAtZero:true}}:undefined,...opts}})}catch(e){}
}
function updateSystemChart(){const cnt={};cableData.forEach(c=>{const s=c.system||'Unknown';cnt[s]=(cnt[s]||0)+1});if(!Object.keys(cnt).length)return;mkChart('chartSystem','doughnut',Object.keys(cnt),[{data:Object.values(cnt),backgroundColor:COLORS,borderWidth:2,borderColor:'#020c1b'}])}
function updateTypeChart(){const cnt={};cableData.forEach(c=>{const t=c.type||'Unknown';cnt[t]=(cnt[t]||0)+1});const sorted=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,10);mkChart('chartType','bar',sorted.map(t=>t[0]),[{label:'케이블 수',data:sorted.map(t=>t[1]),backgroundColor:'#00b4d8',borderRadius:2}])}
function updateNodeChart(){const top=nodeData.slice().sort((a,b)=>b.connectedCables-a.connectedCables).slice(0,10);if(!top.length)return;mkChart('chartNode','bar',top.map(n=>n.name),[{label:'연결 케이블',data:top.map(n=>n.connectedCables),backgroundColor:'#06d6a0',borderRadius:2}],{indexAxis:'y'})}

// ---- 3D VIEW (Three.js with Hexagonal Nodes) ----
function init3DMap(){
  const wrap=document.getElementById('map3DWrap'),canvas=document.getElementById('map3DCanvas');
  if(!wrap||!canvas||typeof THREE==='undefined'){
    const info=document.getElementById('map3DInfo');if(info)info.textContent='⚠ THREE.js 로딩 실패';return}
  if(_3d&&_3d.animFrame)cancelAnimationFrame(_3d.animFrame);
  if(_3d&&_3d.renderer)_3d.renderer.dispose();
  const W=wrap.clientWidth,H=wrap.clientHeight;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x010b18);scene.fog=new THREE.Fog(0x010b18,800,2000);
  const camera=new THREE.PerspectiveCamera(45,W/H,0.1,5000);camera.position.set(300,300,300);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setSize(W,H);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  scene.add(new THREE.AmbientLight(0x334466,0.8));
  const dl=new THREE.DirectionalLight(0x88ccff,0.6);dl.position.set(1,2,1);scene.add(dl);
  const pl=new THREE.PointLight(0x00c8f0,1.5,1200);pl.position.set(0,200,0);scene.add(pl);
  scene.add(new THREE.GridHelper(600,30,0x0d2a44,0x081a2e));
  _3d={scene,camera,renderer,autoRotate:false,animFrame:null,mouseState:{down:false,btn:0,lx:0,ly:0,theta:45,phi:45,dist:600,tx:0,ty:0}};
  setup3DEvents(canvas);
  render3D();
}

function render3D(){
  if(!_3d||typeof THREE==='undefined')return;
  const{scene,camera,renderer,mouseState}=_3d;
  // Clear dynamic objects
  scene.children.filter(c=>c.userData.dynamic).forEach(c=>scene.remove(c));
  const nodes=nodeData.length?nodeData:[];
  if(!nodes.length){renderer.render(scene,camera);return}
  // Normalize
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
  const validNodes=nodes.filter(n=>n.x!=null&&n.y!=null);
  if(!validNodes.length){
    // Force-directed layout from connections
    layoutFromConnections(nodes);
  }
  const displayNodes=nodes.filter(n=>n.x!=null&&n.y!=null);
  displayNodes.forEach(n=>{minX=Math.min(minX,n.x);maxX=Math.max(maxX,n.x);minY=Math.min(minY,n.y);maxY=Math.max(maxY,n.y);minZ=Math.min(minZ,n.z||0);maxZ=Math.max(maxZ,n.z||0)});
  const scale=400/Math.max(maxX-minX||1,maxY-minY||1,maxZ-minZ||1);
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2,cz=(minZ+maxZ)/2;
  const posMap={};
  displayNodes.forEach(n=>{posMap[n.name]=new THREE.Vector3((n.x-cx)*scale,((n.z||0)-cz)*scale,(n.y-cy)*scale)});
  const search=(document.getElementById('map3DNodeSearch')?.value||'').toLowerCase();
  let shown=0;
  // Create hexagonal prism nodes
  displayNodes.forEach(n=>{
    if(search&&!n.name.toLowerCase().includes(search))return;
    const pos=posMap[n.name];if(!pos)return;shown++;
    const dk=getDeckForNode(n.name);
    const geo=new THREE.CylinderGeometry(4,4,2,6);
    const mat=new THREE.MeshPhongMaterial({color:new THREE.Color(dk.color),emissive:new THREE.Color(dk.color),emissiveIntensity:0.3});
    const mesh=new THREE.Mesh(geo,mat);mesh.position.copy(pos);mesh.userData={dynamic:true,nodeName:n.name};
    scene.add(mesh);
  });
  // Edges as lines
  const showEdges=document.getElementById('show3DEdges')?.checked!==false;
  if(showEdges){
    const edgeMat=new THREE.LineBasicMaterial({color:0x1a4270,transparent:true,opacity:0.6});
    displayNodes.forEach(n=>{
      if(search&&!n.name.toLowerCase().includes(search))return;
      const pa=posMap[n.name];if(!pa)return;
      (n.relations||[]).forEach(rel=>{
        const pb=posMap[typeof rel==='string'?rel:rel.to];if(!pb)return;
        const geo=new THREE.BufferGeometry().setFromPoints([pa,pb]);
        const line=new THREE.Line(geo,edgeMat);line.userData.dynamic=true;scene.add(line);
      });
    });
  }
  const info=document.getElementById('map3DInfo');if(info)info.textContent=`노드 ${shown}개 표시`;
  // Camera
  const ms=mouseState,theta=ms.theta*Math.PI/180,phi=Math.max(5,Math.min(175,ms.phi))*Math.PI/180;
  camera.position.set(ms.dist*Math.sin(phi)*Math.sin(theta)+ms.tx,ms.dist*Math.cos(phi)+ms.ty,ms.dist*Math.sin(phi)*Math.cos(theta));
  camera.lookAt(ms.tx,ms.ty,0);
  renderer.render(scene,camera);
}

function layoutFromConnections(nodes){
  // Orthogonal grid layout: arrange nodes in a rectangular grid grouped by prefix
  const nm={};nodes.forEach(n=>{nm[n.name]=n});
  const prefixGroups={};
  nodes.forEach(n=>{
    const p=n.name.slice(0,2).toUpperCase();
    if(!prefixGroups[p])prefixGroups[p]=[];
    prefixGroups[p].push(n);
  });
  const prefixes=Object.keys(prefixGroups);
  const GRID_SPACE_X=60,GRID_SPACE_Y=60;
  // Arrange groups in rows, nodes within groups in columns
  let gy=0;
  prefixes.forEach(prefix=>{
    const group=prefixGroups[prefix];
    const cols=Math.ceil(Math.sqrt(group.length));
    group.forEach((n,i)=>{
      const col=i%cols, row=Math.floor(i/cols);
      if(n.x==null){
        n.x=col*GRID_SPACE_X;
        n.y=gy+row*GRID_SPACE_Y;
        n.z=getDeckForNode(n.name).deck*30;
      }
    });
    gy+=(Math.ceil(group.length/cols)+1)*GRID_SPACE_Y;
  });
}

function setup3DEvents(canvas){
  const ms=_3d.mouseState;
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('mousedown',e=>{ms.down=true;ms.btn=e.button;ms.lx=e.clientX;ms.ly=e.clientY});
  canvas.addEventListener('mouseup',()=>{ms.down=false});
  canvas.addEventListener('mouseleave',()=>{ms.down=false});
  canvas.addEventListener('mousemove',e=>{
    if(!ms.down)return;
    const dx=e.clientX-ms.lx,dy=e.clientY-ms.ly;ms.lx=e.clientX;ms.ly=e.clientY;
    if(ms.btn===0){ms.theta-=dx*0.4;ms.phi-=dy*0.4}
    else if(ms.btn===2){ms.tx-=dx*ms.dist/800;ms.ty+=dy*ms.dist/800}
    render3D();
  });
  canvas.addEventListener('wheel',e=>{ms.dist=Math.max(50,Math.min(2000,ms.dist+e.deltaY*0.5));render3D()},{passive:true});
}
function reset3DCamera(){if(!_3d)return;Object.assign(_3d.mouseState,{theta:45,phi:45,dist:600,tx:0,ty:0});render3D()}
function toggle3DView(m){if(!_3d)return;const ms=_3d.mouseState;if(m==='iso'){ms.theta=45;ms.phi=45;ms.dist=600}else if(m==='top'){ms.theta=0;ms.phi=1;ms.dist=600}else if(m==='side'){ms.theta=90;ms.phi=90;ms.dist=600}ms.tx=0;ms.ty=0;render3D()}

// ---- ROUTING ----
function calcSingleRoute(){
  const from=document.getElementById('rtFrom')?.value.trim(),to=document.getElementById('rtTo')?.value.trim(),check=document.getElementById('rtCheck')?.value.trim()||'';
  if(!from||!to){notify('FROM/TO 노드를 입력해주세요','warning');return}
  if(!_nodeMap)buildNodeMap();
  if(!_nodeMap[from]){document.getElementById('routeResult').innerHTML=`<span style="color:var(--red)">✕ FROM 노드 "${from}" 없음</span>`;return}
  if(!_nodeMap[to]){document.getElementById('routeResult').innerHTML=`<span style="color:var(--red)">✕ TO 노드 "${to}" 없음</span>`;return}
  const wps=check.split(',').map(s=>s.trim()).filter(Boolean);
  const targets=[...wps,to];let cur=from,total=0;const full=[from];
  for(const t of targets){const r=dijkstra(cur,t);if(!r){document.getElementById('routeResult').innerHTML=`<span style="color:var(--red)">✕ 경로 없음</span>`;return}full.push(...r.path.slice(1));total+=r.length;cur=t}
  const uniquePath=full.filter((item,pos,arr)=>pos===0||item!==arr[pos-1]);
  total=Math.round(total*100)/100;
  document.getElementById('routeResult').innerHTML=uniquePath.map((n,i)=>`<span class="path-node">${n}</span>${i<uniquePath.length-1?'<span class="path-arrow">→</span>':''}`).join('');
  document.getElementById('routeMeta').innerHTML=`노드: <span style="color:var(--cyan)">${uniquePath.length}</span> | 길이: <span style="color:var(--amber)">${total} m</span>`;
  notify(`경로 산출: ${uniquePath.length}노드 / ${total}m`,'success');
}

// ---- FILL SOLVER (Advanced Tray Physics) ----
const FILL_MARGIN_X=10, FILL_LARGE_CABLE_THRESHOLD=20, FILL_TARGET_FILL_RATE=60, FILL_LOW_FILL_THRESHOLD=35;
let fillState={cableData:[],systemResult:null,fillRatioLimit:40,maxHeightLimit:60,numberOfTiers:1,manualWidth:null,isCalculating:false,inputText:'',parsedCount:0,dupCount:0,selectedSizeIdx:-1,sizeResults:[]};

function fillDist(p1,p2){return Math.sqrt((p1.x-p2.x)**2+(p1.y-p2.y)**2)}
function fillCheckCollision(cables,x,y,r){for(const c of cables){if(fillDist({x,y},{x:c.x,y:c.y})<c.od/2+r-0.05)return true}return false}
function fillIsSupported(placed,x,y,r){if(y<=r+0.5)return true;for(const c of placed){if(Math.abs(fillDist({x,y},{x:c.x,y:c.y})-(r+c.od/2))<1.0&&y>c.y)return true}return false}
function fillTangentPoints(c1,c2,r){
  const r1=c1.od/2+r,r2=c2.od/2+r,d=fillDist({x:c1.x,y:c1.y},{x:c2.x,y:c2.y});
  if(d>r1+r2||d<Math.abs(r1-r2)||d===0)return[];
  const a=(r1*r1-r2*r2+d*d)/(2*d),h=Math.sqrt(Math.max(0,r1*r1-a*a));
  const x2=c1.x+a*(c2.x-c1.x)/d,y2=c1.y+a*(c2.y-c1.y)/d;
  return[{x:x2+h*(c2.y-c1.y)/d,y:y2-h*(c2.x-c1.x)/d},{x:x2-h*(c2.y-c1.y)/d,y:y2+h*(c2.x-c1.x)/d}];
}
function fillDetermineLayer(y,r,placed,x){
  if(y<=r+0.5)return 1;
  const below=placed.filter(c=>Math.abs(c.x-x)<(c.od/2+r)&&c.y<y);
  return below.length===0?1:Math.max(...below.map(c=>c.layer))+1;
}
function fillFindPosition(cable,placed,xMin,xMax,maxH,maxLayers,preferStack){
  const r=cable.od/2;const cands=[];
  let lastFloorX=xMin;
  const floorCables=placed.filter(c=>c.y<=c.od/2+0.5).sort((a,b)=>b.x-a.x);
  if(floorCables.length>0)lastFloorX=floorCables[0].x+floorCables[0].od/2;
  cands.push({p:{x:lastFloorX+r,y:r},layer:1,score:preferStack?100:1});
  if(maxLayers>1&&cable.od<FILL_LARGE_CABLE_THRESHOLD){
    for(let i=0;i<placed.length;i++){
      const topY=placed[i].y+placed[i].od/2+r;
      if(topY+r<=maxH){const layer=fillDetermineLayer(topY,r,placed,placed[i].x);if(layer<=maxLayers)cands.push({p:{x:placed[i].x,y:topY},layer,score:preferStack?layer*-10:layer*10})}
      for(let j=i+1;j<placed.length;j++){
        fillTangentPoints(placed[i],placed[j],r).forEach(tp=>{const layer=fillDetermineLayer(tp.y,r,placed,tp.x);cands.push({p:tp,layer,score:preferStack?layer*-10:layer*10})});
      }
    }
  }
  const valid=cands.filter(c=>{
    if(isNaN(c.p.x)||isNaN(c.p.y))return false;
    if(c.p.x-r<xMin-0.1||c.p.x+r>xMax+0.1)return false;
    if(c.p.y<r-0.1||c.p.y+r>maxH+0.1)return false;
    if(c.layer>maxLayers)return false;
    if(cable.od>=FILL_LARGE_CABLE_THRESHOLD&&c.layer>1)return false;
    if(fillCheckCollision(placed,c.p.x,c.p.y,r))return false;
    if(c.layer>1&&!fillIsSupported(placed,c.p.x,c.p.y,r))return false;
    return true;
  });
  if(!valid.length)return null;
  if(preferStack)valid.sort((a,b)=>a.layer!==b.layer?b.layer-a.layer:a.p.x-b.p.x);
  else valid.sort((a,b)=>Math.abs(a.p.x-b.p.x)>5?a.p.x-b.p.x:a.p.y-b.p.y);
  return{point:valid[0].p,layer:valid[0].layer};
}
function fillTryPlaceAtWidth(cables,width,maxH,stackLimit){
  const sorted=[...cables].sort((a,b)=>b.od-a.od);
  const totalArea=cables.reduce((a,c)=>a+Math.PI*(c.od/2)**2,0);
  let placed=[],allFit=true;
  const large=sorted.filter(c=>c.od>=FILL_LARGE_CABLE_THRESHOLD),small=sorted.filter(c=>c.od<FILL_LARGE_CABLE_THRESHOLD);
  for(const cable of large){
    const res=fillFindPosition(cable,placed,FILL_MARGIN_X,width-FILL_MARGIN_X,maxH,1,false);
    if(res)placed.push({...cable,x:res.point.x,y:res.point.y,layer:res.layer});else{allFit=false;break}
  }
  if(allFit)for(const cable of small){
    const res=fillFindPosition(cable,placed,FILL_MARGIN_X,width-FILL_MARGIN_X,maxH,stackLimit,false);
    if(res)placed.push({...cable,x:res.point.x,y:res.point.y,layer:res.layer});else{allFit=false;break}
  }
  return{placed,success:allFit,fillRatio:(totalArea/(width*maxH))*100,totalArea};
}
function fillGetStdWidth(w){return w<=0?100:Math.ceil(w/100)*100}
function fillSolveSingleTier(cables,tierIdx,maxH,targetFill,stackLimit){
  if(!cables.length)return{tierIndex:tierIdx,width:100,cables:[],success:true,fillRatio:0,totalODSum:0,totalCableArea:0};
  const totalArea=cables.reduce((a,c)=>a+Math.PI*(c.od/2)**2,0);
  const startWidth=fillGetStdWidth(Math.max((totalArea/maxH)*(100/FILL_TARGET_FILL_RATE),100));
  let best=null,bestDiff=Infinity;
  for(let w=startWidth;w<=4000;w+=100){
    const res=fillTryPlaceAtWidth(cables,w,maxH,stackLimit);
    if(res.success){const diff=Math.abs(res.fillRatio-FILL_TARGET_FILL_RATE);if(diff<bestDiff){bestDiff=diff;best={width:w,placed:res.placed,fillRatio:res.fillRatio}}if(res.fillRatio<30)break}
  }
  if(!best)for(let w=100;w<=4000;w+=100){const res=fillTryPlaceAtWidth(cables,w,maxH,stackLimit);if(res.success){best={width:w,placed:res.placed,fillRatio:res.fillRatio};break}}
  if(!best)return{tierIndex:tierIdx,width:4000,cables:[],success:false,fillRatio:0,totalODSum:cables.reduce((a,c)=>a+c.od,0),totalCableArea:totalArea};
  if(best.fillRatio<FILL_LOW_FILL_THRESHOLD){const slr=fillTryPlaceAtWidth(cables,best.width,maxH,1);if(slr.success)best.placed=slr.placed}
  return{tierIndex:tierIdx,width:best.width,cables:best.placed,success:true,fillRatio:best.fillRatio,totalODSum:cables.reduce((a,c)=>a+c.od,0),totalCableArea:totalArea};
}
function fillSolveSystem(allCables,tiers,maxH,targetFill){
  const buckets=Array.from({length:tiers},()=>[]);
  [...allCables].sort((a,b)=>b.od-a.od).forEach((c,i)=>buckets[i%tiers].push(c));
  const init=buckets.map((b,i)=>fillSolveSingleTier(b,i,maxH,targetFill,3));
  const maxW=Math.max(...init.map(r=>r.width));
  const final=buckets.map((b,i)=>{const res=fillTryPlaceAtWidth(b,maxW,maxH,3);return{tierIndex:i,width:maxW,cables:res.placed,success:res.success,fillRatio:res.fillRatio,totalODSum:b.reduce((a,c)=>a+c.od,0),totalCableArea:res.totalArea}});
  return{systemWidth:maxW,tiers:final,success:final.every(r=>r.success),maxHeightPerTier:maxH};
}
function fillSolveAtWidth(allCables,tiers,width,maxH,targetFill){
  const buckets=Array.from({length:tiers},()=>[]);
  [...allCables].sort((a,b)=>b.od-a.od).forEach((c,i)=>buckets[i%tiers].push(c));
  const final=buckets.map((b,i)=>{const res=fillTryPlaceAtWidth(b,width,maxH,3);return{tierIndex:i,width,cables:res.placed,success:res.success,fillRatio:res.fillRatio,totalODSum:b.reduce((a,c)=>a+c.od,0),totalCableArea:res.totalArea}});
  return{systemWidth:width,tiers:final,success:final.every(r=>r.success),maxHeightPerTier:maxH};
  return{systemWidth:width,tiers:final,success:final.every(r=>r.success),maxHeightPerTier:maxH};
};

function fillCalculateOptimizationMatrix(allCables, maxHeight, targetFill){

const FILL_MARGIN_X=10, FILL_LARGE_CABLE_THRESHOLD=20, FILL_TARGET_FILL_RATE=60, FILL_LOW_FILL_THRESHOLD=35;
let fillState={cableData:[],systemResult:null,fillRatioLimit:40,maxHeightLimit:60,numberOfTiers:1,manualWidth:null,isCalculating:false,inputText:'',parsedCount:0,dupCount:0,selectedSizeIdx:-1,sizeResults:[],optimizationMatrix:[]};
function fillCalculateOptimizationMatrix(allCables, maxHeight, targetFill){
  const widths = [200, 300, 400, 500, 600, 700, 800, 900];
  const tierCounts = [1, 2, 3, 4, 5];
  const matrix = [];
  const totalCableArea = allCables.reduce((acc, c) => acc + Math.PI * Math.pow(c.od/2, 2), 0);
  const sortedAll = [...allCables].sort((a, b) => b.od - a.od);
  
  for(const t of tierCounts){
    const row = [];
    const tierBuckets = Array.from({length: t}, () => []);
    
    // Round Robin 분배
    sortedAll.forEach((c, i) => tierBuckets[i % t].push(c));
    
    // 최악 케이스 티어 찾기 (가장 많은 OD 합)
    const worstTierCables = tierBuckets.reduce((prev, curr) => 
      curr.reduce((a,c) => a + c.od, 0) > prev.reduce((a,c) => a + c.od, 0) ? curr : prev
    );
    
    for(const w of widths){
      const area = w * maxHeight * t;
      const systemFill = (totalCableArea / area) * 100;
      
      // 해당 너비에서 최악 티어 시뮬레이션
      const res = fillTryPlaceAtWidth(worstTierCables, w, maxHeight, 3);
      
      const isOptimal = systemFill <= targetFill && res.success;
      
      row.push({
        tiers: t,
        width: w,
        area: area,
        fillRatio: systemFill,
        success: res.success,
        isOptimal: isOptimal
      });
    }
    matrix.push(row);
  }
  return matrix;
}

// Fill calculate with standard sizes + Matrix
function fillCalculateAllSizes(){
  if(!fillState.cableData.length)return;
  const stdWidths=[100,200,300,400,500,600,700,800,900,1000,1200,1500,2000];
  const results=[];
  for(const w of stdWidths){
    const res=fillSolveAtWidth(fillState.cableData,fillState.numberOfTiers,w,fillState.maxHeightLimit,fillState.fillRatioLimit);
    results.push({width:w,...res});
  }
  fillState.sizeResults=results;
  
  // 메트릭스 계산 (tray-fill 스타일)
  fillState.optimizationMatrix = fillCalculateOptimizationMatrix(fillState.cableData, fillState.maxHeightLimit, fillState.fillRatioLimit);
}
function fillCalculateAllSizes(){
  if(!fillState.cableData.length)return;
  const stdWidths=[100,200,300,400,500,600,700,800,900,1000,1200,1500,2000];
  const results=[];
  for(const w of stdWidths){
    const res=fillSolveAtWidth(fillState.cableData,fillState.numberOfTiers,w,fillState.maxHeightLimit,fillState.fillRatioLimit);
    results.push({width:w,...res});
  }
  fillState.sizeResults=results;
}

function fillCalculate(overrideWidth){
  if(!fillState.cableData.length)return;
  fillState.isCalculating=true;
  setTimeout(()=>{
    let sol;
    if(overrideWidth!=null)sol=fillSolveAtWidth(fillState.cableData,fillState.numberOfTiers,overrideWidth,fillState.maxHeightLimit,fillState.fillRatioLimit);
    else sol=fillSolveSystem(fillState.cableData,fillState.numberOfTiers,fillState.maxHeightLimit,fillState.fillRatioLimit);
    fillState.systemResult=sol;
    fillState.systemResult=sol;
    fillState.isCalculating=false;
    fillCalculateAllSizes();
    fillRenderSizeSelector();
    fillRenderOptimizationMatrix();
    fillRenderViz();
    fillRenderCableList();
    fillUpdateInfoBar();
    let wv=document.getElementById('fillWVal');if(wv)wv.textContent=sol.systemWidth||0;
  }, 10);
    fillState.isCalculating=false;
    fillCalculateAllSizes();
    fillRenderSizeSelector();
    fillRenderOptimizationMatrix();
    fillRenderViz();
    fillRenderCableList();
    fillUpdateInfoBar();
    let wv=document.getElementById('fillWVal');if(wv)wv.textContent=sol.systemWidth||0;
    fillRenderSizeSelector();
    fillRenderViz();
    fillRenderCableList();
    fillUpdateInfoBar();
  }, 10);
    const wv=document.getElementById('fillWVal');if(wv)wv.textContent=sol.systemWidth||0;
  },10);
}

function fillParseTextData(text){
  const lines=text.trim().split('\n');const data=[];const seen=new Set();let dups=0;
  lines.forEach((line,i)=>{
    const parts=line.split(/[\t,]+/).map(s=>s.trim()).filter(Boolean);
    if(parts.length>=3){
      const name=parts[0],type=parts[1],od=parseFloat(parts[2]);
      if(!isNaN(od)){if(seen.has(name)){dups++;return}seen.add(name);data.push({id:'fc-'+i,name,type,od})}
    }
  });
  fillState.parsedCount=data.length;fillState.dupCount=dups;fillState.cableData=data;
  fillUpdateDataInfo();
  if(data.length>0){fillState.manualWidth=null;fillCalculate(null)}else{fillState.systemResult=null;fillState.sizeResults=[];fillRenderViz();fillRenderCableList();fillRenderSizeSelector();fillUpdateInfoBar()}
}

function fillLoadFromNode(nodeName){
  // 완벽한 노드별 케이블 매칭 - calculatedPath 배열 처리
  const cablesInNode = cableData.filter(c => {
    if (!c.calculatedPath) return false;
    // calculatedPath가 배열이거나 콤마로 구분된 문자열인 경우 모두 처리
    const path = Array.isArray(c.calculatedPath) ? c.calculatedPath : c.calculatedPath.split(',').map(n=>n.trim());
    return path.includes(nodeName);
  });
  if (!cablesInNode.length) { notify(`"${nodeName}" 노드를 지나는 케이블이 없습니다.`,'warning'); return }
  
  // 케이블 정보 완벽 추출: Name, Type, OD
  const text = cablesInNode.map(c => `${c.name}\t${c.type || '?'}\t${c.outDia || 20}`).join('\n');
  fillState.inputText = text;
  const ta = document.getElementById('fillTextArea');
  if (ta) ta.value = text;
  fillParseTextData(text);
  notify(`"${nodeName}" 노드: ${cablesInNode.length}개 케이블 로드`,'success');
}
  const cablesInNode=cableData.filter(c=>{if(!c.calculatedPath)return false;return c.calculatedPath.split(',').map(n=>n.trim()).includes(nodeName)});
  if(!cablesInNode.length){notify(`"${nodeName}" 노드를 지나는 케이블이 없습니다.`,'warning');return}
  const text=cablesInNode.map(c=>`${c.name}\t${c.type||'?'}\t${c.outDia||20}`).join('\n');
  fillState.inputText=text;
  const ta=document.getElementById('fillTextArea');if(ta)ta.value=text;
  fillParseTextData(text);
  notify(`"${nodeName}" 노드: ${cablesInNode.length}개 케이블 로드`,'success');
}

function fillHandleFileUpload(e){
  const file=e.target.files?.[0];if(!file||typeof XLSX==='undefined')return;
  const reader=new FileReader();
  reader.onload=evt=>{
    const wb=XLSX.read(evt.target.result,{type:'binary'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_json(ws,{header:1});
    let out='';
    data.forEach(row=>{if(row.length>=3&&!isNaN(parseFloat(row[2])))out+=`${row[0]||''}\t${row[1]||''}\t${row[2]}\n`});
    fillState.inputText=out;
    const ta=document.getElementById('fillTextArea');if(ta)ta.value=out;
    fillParseTextData(out);
    e.target.value='';
  };
  reader.readAsBinaryString(file);
}

function fillUpdateDataInfo(){
  const el=document.getElementById('fillDataInfo');if(!el)return;
  let html=`<span class="fill-data-badge blue">${fillState.parsedCount} cables</span>`;
  if(fillState.dupCount>0)html+=`<span class="fill-data-badge yellow">${fillState.dupCount} dups removed</span>`;
  el.innerHTML=html;
}

function fillGetTypeColor(type){let h=0;for(let i=0;i<type.length;i++)h=type.charCodeAt(i)+((h<<5)-h);return`hsl(${Math.abs(h)%360},65%,60%)`}

function fillRenderSizeSelector(){
  const el=document.getElementById('fillSizeChips');if(!el)return;
  if(!fillState.sizeResults.length){el.innerHTML='';return}
  const autoW=fillState.systemResult?.systemWidth||0;
  el.innerHTML=fillState.sizeResults.map((sr,i)=>{
    let cls='';
    if(sr.success){
      const maxFill=Math.max(...sr.tiers.map(t=>t.fillRatio));
      if(maxFill>fillState.fillRatioLimit)cls='tight';else cls='fit';
    }else cls='over';
    const isActive=(fillState.manualWidth===sr.width)||(fillState.manualWidth==null&&sr.width===autoW);
    return`<button class="fill-size-chip ${cls}${isActive?' active':''}" onclick="fillSelectSize(${sr.width},${i})" title="Fill: ${sr.tiers.map(t=>t.fillRatio.toFixed(0)+'%').join(', ')}">${sr.width}</button>`;
  }).join('');
}

function fillSelectSize(w,idx){
  fillState.manualWidth=w;
  fillState.selectedSizeIdx=idx;
  fillCalculate(w);
}

// 자동 최적화 기능 (tray-fill 스타일)
function fillAutoOptimize(){
  if (!fillState.cableData.length) {
    notify('데이터가 없습니다.', 'warning');
    return;
  }
  
  // 임시로 1단으로 최적 솔루션 계산
  const tempRes = fillSolveSystem(fillState.cableData, 1, fillState.maxHeightLimit, fillState.fillRatioLimit);
  
  if (tempRes.optimizationMatrix) {
    const candidates = tempRes.optimizationMatrix.flat().filter(c => c.isOptimal);
    if (candidates.length > 0) {
      // 최소 면적으로 정렬
      candidates.sort((a,b) => a.area - b.area);
      const best = candidates[0];
      
      // 최적 티어와 너비 자동 선택
      fillSetTiers(best.tiers);
      fillState.manualWidth = best.width;
      
      setTimeout(() => {
        fillCalculate(best.width, best.tiers);
      }, 50);
      
      notify(`✅ 최적화 완료: L${best.tiers}단, W${best.width}mm (Fill: ${best.fillRatio.toFixed(0)}%)`, 'success');
    } else {
      // 최적 솔루션 없음
      fillCalculate(null);
    }
  } else {
    fillCalculate(null);
  }
}
  fillState.manualWidth=w;
  fillState.selectedSizeIdx=idx;
  fillCalculate(w);
  fillCalculate(w);
}

// ---- MATRIX VISUALIZATION (tray-fill 스타일) ----
function fillRenderOptimizationMatrix(){
  const el = document.getElementById('fillOptimizationMatrix');
  if (!el) return;
  if (!fillState.optimizationMatrix.length) { el.innerHTML = ''; return; }
  
  const matrix = fillState.optimizationMatrix;
  const widths = [200, 300, 400, 500, 600, 700, 800, 900];
  const tierCounts = matrix.map(row => row[0].tiers);
  
  let html = '<div style="background:#020c1b;border:1px solid #1a4270;border-radius:4px;padding:8px;">';
  html += '<div style="font-size:10px;font-weight:bold;color:#d4eeff;margin-bottom:8px;">최적화 매트릭스 (Tiers × Width)</div>';
  
  // Header row
  html += '<div style="display:flex;gap:4px;margin-bottom:4px;">';
  html += '<div style="width:60px;font-size:9px;color:#85bedd;">Tiers</div>';
  widths.forEach(w => {
    html += `<div style="flex:1;text-align:center;font-size:9px;color:#85bedd;">${w}mm</div>`;
  });
  html += '</div>';
  
  // Data rows
  matrix.forEach((row, i) => {
    const t = row[0].tiers;
    html += '<div style="display:flex;gap:4px;margin-bottom:2px;">';
    html += `<div style="width:60px;font-size:9px;font-weight:bold;color:#d4eeff;display:flex;align-items:center;">${t}단</div>`;
    
    row.forEach(cell => {
      let bgColor = '#122d4a';
      let textColor = '#85bedd';
      
      if (cell.isOptimal) {
        bgColor = '#00c8f020';
        textColor = '#00e5a0';
      } else if (!cell.success) {
        bgColor = '#ff4d4d20';
        textColor = '#ff4d4d';
      } else if (cell.fillRatio > fillState.fillRatioLimit) {
        bgColor = '#ffc10720';
        textColor = '#ffc107';
      }
      
      const isSelected = fillState.manualWidth === cell.width && fillState.numberOfTiers === t;
      const borderStyle = isSelected ? 'border:2px solid #00c8f0;' : 'border:1px solid #1a4270;';
      
      html += `<div style="flex:1;${borderStyle}border-radius:3px;padding:6px 4px;background:${bgColor};cursor:pointer;text-align:center;" 
        onclick="fillSetMatrixSelection(${t}, ${cell.width})" 
        title="Fill: ${cell.fillRatio.toFixed(0)}% | Area: ${cell.area}">
        <div style="font-size:10px;font-weight:bold;color:${textColor};">${cell.fillRatio.toFixed(0)}%</div>
      </div>`;
    });
    
    html += '</div>';
  });
  
  // Legend
  html += '<div style="display:flex;gap:10px;margin-top:8px;font-size:9px;color:#4d7fa0;">';
  html += '<div><span style="display:inline-block;width:12px;height:12px;background:#00e5a040;border:1px solid #1a4270;border-radius:2px;margin-right:4px;"></span>최적 (Fill ≤ ' + fillState.fillRatioLimit + '%)</div>';
  html += '<div><span style="display:inline-block;width:12px;height:12px;background:#ffc10740;border:1px solid #1a4270;border-radius:2px;margin-right:4px;"></span>초과 (Fill > ' + fillState.fillRatioLimit + '%)</div>';
  html += '<div><span style="display:inline-block;width:12px;height:12px;background:#ff4d4d40;border:1px solid #1a4270;border-radius:2px;margin-right:4px;"></span>불가</div>';
  html += '</div>';
  
  html += '</div>';
  el.innerHTML = html;
}

function fillSetMatrixSelection(tiers, width){
  fillState.numberOfTiers = tiers;
  fillState.manualWidth = width;
  document.querySelectorAll('.fill-tier-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.fill-tier-btn[data-t="${tiers}"]`);
  if (btn) btn.classList.add('active');
  fillCalculate(width);
}

function fillRenderViz(){
  const wrap=document.getElementById('fillVizWrap');if(!wrap)return;
  const sr=fillState.systemResult;
  if(!sr||!sr.tiers.length){wrap.innerHTML='<div class="no-data"><div class="icon">📦</div><h3>데이터를 입력하세요</h3><p style="font-size:10px">왼쪽 패널에서 Excel 업로드 또는 직접 입력</p></div>';return}
  // Assign global display index
  let gIdx=1;
  const tiers=sr.tiers.map(t=>({...t,cables:t.cables.map(c=>({...c,displayIndex:gIdx++}))}));
  const W=sr.systemWidth,H=sr.maxHeightPerTier,TC=tiers.length;
  const BEAM=10,MARGIN=40,GAP=30;
  const STW=W+60,STH=H+BEAM+50;
  const isVert=TC>1;
  const vbW=isVert?STW+MARGIN*2:STW*TC+GAP*(TC-1)+MARGIN*2;
  const vbH=isVert?STH*TC+GAP*(TC-1)+MARGIN*2:STH+MARGIN*2;
  const getPos=(idx)=>isVert?{x:MARGIN,y:MARGIN+idx*(STH+GAP)}:{x:MARGIN+idx*(STW+GAP),y:MARGIN};

  let svg=`<svg viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;background:#020c1b;border-radius:4px">`;
  tiers.forEach((tier,idx)=>{
    const pos=getPos(idx);const beamY=pos.y+H;
    // Label
    svg+=`<text x="${pos.x+W/2}" y="${pos.y-8}" text-anchor="middle" font-size="12" font-weight="900" fill="#334155" font-family="Orbitron,sans-serif">T${idx+1} (${tier.cables.length}개, ${tier.fillRatio.toFixed(0)}%)</text>`;
    // Tray beam
    svg+=`<rect x="${pos.x}" y="${beamY}" width="${W}" height="${BEAM}" fill="#475569" stroke="#1e293b" stroke-width="1"/>`;
    // Side walls
    svg+=`<rect x="${pos.x-5}" y="${pos.y-5}" width="5" height="${H+BEAM+10}" fill="#64748b"/>`;
    svg+=`<rect x="${pos.x+W}" y="${pos.y-5}" width="5" height="${H+BEAM+10}" fill="#64748b"/>`;
    // Height limit line
    svg+=`<line x1="${pos.x}" y1="${pos.y}" x2="${pos.x+W}" y2="${pos.y}" stroke="#ef4444" stroke-width="1" stroke-dasharray="3,2"/>`;
    // Cables
    tier.cables.forEach(c=>{
      const r=c.od/2,cx=pos.x+c.x,cy=beamY-c.y;
      const col=fillGetTypeColor(c.type);
      svg+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}" stroke="#1e293b" stroke-width="0.5"/>`;
      const fs=Math.max(Math.min(c.od*0.35,8),4);
      svg+=`<text x="${cx}" y="${cy}" font-size="${fs}" text-anchor="middle" dominant-baseline="middle" fill="#000" font-weight="900">${c.displayIndex}</text>`;
    });
    // Width label
    svg+=`<text x="${pos.x+W/2}" y="${beamY+BEAM+18}" text-anchor="middle" font-size="10" font-weight="bold" fill="#d4eeff">${W}mm</text>`;
  });
  svg+='</svg>';
  wrap.innerHTML=svg;
}

function fillRenderCableList(){
  const el=document.getElementById('fillCableList');if(!el)return;
  const sr=fillState.systemResult;
  if(!sr){el.innerHTML='';return}
  const allCables=[];
  let gIdx=1;
  sr.tiers.forEach(tier=>tier.cables.forEach(c=>allCables.push({...c,displayIndex:gIdx++})));
  el.innerHTML=allCables.map(c=>{
    const col=fillGetTypeColor(c.type);
    return`<div class="fill-cable-chip" style="background:${col}20"><span class="chip-idx">${c.displayIndex}</span><span class="chip-name">${c.name}</span><span class="chip-od">Ø${c.od}</span></div>`;
  }).join('');
}

function fillUpdateInfoBar(){
  const el=document.getElementById('fillInfoBar');if(!el)return;
  const sr=fillState.systemResult;
  if(!sr){el.innerHTML='<span class="fi-stat" style="color:var(--t3)">데이터 없음</span>';return}
  const totalCount=sr.tiers.reduce((s,t)=>s+t.cables.length,0);
  const totalOD=sr.tiers.reduce((s,t)=>s+t.cables.reduce((s2,c)=>s2+c.od,0),0);
  el.innerHTML=`
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <span class="fi-stat">W <span class="fiv">${sr.systemWidth}</span></span>
      <span class="fi-stat">H <span class="fiv">${sr.maxHeightPerTier}</span></span>
      <span class="fi-stat">${sr.tiers.length}단</span>
      <span class="fi-stat">${totalCount}개</span>
      <span class="fi-stat">Σ <span class="fiv">${totalOD.toFixed(0)}</span></span>
    </div>
    <span class="fi-badge ${sr.success?'ok':'fail'}">${sr.success?'✓ OK':'✕ FAIL'}</span>`;
}

function fillAdjustWidth(delta){
  const curW=fillState.systemResult?.systemWidth||100;
  const nextW=Math.max(100,curW+delta);
  fillState.manualWidth=nextW;
  fillCalculate(nextW);
}

function fillResetWidth(){
  fillState.manualWidth=null;
  fillCalculate(null);
}

function fillSetTiers(n){
  fillState.numberOfTiers=n;
  document.querySelectorAll('.fill-tier-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`.fill-tier-btn[data-t="${n}"]`)?.classList.add('active');
  fillState.manualWidth=null;
  fillCalculate(null);
}

function renderTrayNodeList(){
  const el=document.getElementById('trayNodeList');if(!el)return;
  const nodeCableCnt={};
  cableData.forEach(c=>{if(!c.calculatedPath)return;c.calculatedPath.split(/\s*[,→]\s*/).filter(Boolean).forEach(n=>{nodeCableCnt[n]=(nodeCableCnt[n]||0)+1})});
  nodeData.forEach(n=>{if(!nodeCableCnt[n.name])nodeCableCnt[n.name]=n.connectedCables||0});
  const entries=Object.entries(nodeCableCnt).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  el.innerHTML=entries.length?entries.map(([name,cnt])=>`<div class="tray-node-item" onclick="fillLoadFromNode('${name}')">${name} <span class="cnt">${cnt}</span></div>`).join(''):'<div style="color:var(--t3);font-size:11px;padding:8px">경로를 먼저 산출해주세요</div>';
}

// Default data for FILL
const FILL_DEFAULT_TEXT=`P-UV-01\tMY4\t13.2
P-UPS-03\tMY4\t13.2
P-UPS-02\tDY4\t15.9
P-UPS-01\tDY4\t15.9
P-TW-04J\tMYS7\t15.4
P-TW-04H\tMYS4\t13.4
P-TW-04G\tMY12\t19
P-TW-04F\tMY12\t19
P-TW-04E\tMY4\t13.2
P-TW-04D\tMY4\t13.2
P-TW-04C\tMY12\t19
P-TW-04B\tDY1\t13.7
P-TW-04A\tDY1\t13.7
P-TW-04\tTY50\t35
P-TW-03J\tMYS7\t15.4
P-TW-03H\tMYS4\t13.4
P-TW-03G\tMY12\t19
P-TW-03F\tMY12\t19
P-TW-03E\tMY4\t13.2
P-TW-03D\tMY4\t13.2
P-TW-03C\tMY12\t19
P-TW-03B\tDY1\t13.7
P-TW-03A\tDY1\t13.7
P-TW-03\tTY50\t35
P-TW-02K\tMY12\t19
P-TW-02J\tMYS7\t15.4
P-TW-02H\tMYS4\t13.4
P-TW-02G\tMY12\t19
P-TW-02F\tMY12\t19
P-TW-02E\tMY4\t13.2
P-TW-02D\tMY4\t13.2
P-TW-02C\tMY12\t19
P-TW-02B\tDY1\t13.7
P-TW-02A\tDY1\t13.7
P-TW-02\tTY50\t35
P-TW-01K\tMY12\t19
P-TW-01J\tMYS7\t15.4`;

function initFillPanel(){
  fillState.inputText=FILL_DEFAULT_TEXT;
  const ta=document.getElementById('fillTextArea');if(ta)ta.value=FILL_DEFAULT_TEXT;
  fillParseTextData(FILL_DEFAULT_TEXT);
}

// ---- BOM ----
function renderBOM(){
  const wrap=document.getElementById('bomTableWrap');if(!wrap)return;
  if(!cableData.length){wrap.innerHTML='<div style="color:var(--t3);font-size:11px">데이터를 로드하세요</div>';return}
  const sysF=document.getElementById('bomSystemFilter')?.value||'';
  const typF=document.getElementById('bomTypeFilter')?.value||'';
  const margin=parseFloat(document.getElementById('bomMargin')?.value||10)/100;
  const search=(document.getElementById('bomSearch')?.value||'').toLowerCase();
  
  // Aggregate by cable type
  const typeAgg={};
  cableData.forEach(c=>{
    if(sysF&&c.system!==sysF)return;
    if(typF&&c.type!==typF)return;
    if(search&&!c.name.toLowerCase().includes(search)&&!c.type.toLowerCase().includes(search)&&!c.system.toLowerCase().includes(search))return;
    const key=c.type||'Unknown';
    if(!typeAgg[key])typeAgg[key]={type:key,count:0,totalLength:0,systems:new Set()};
    typeAgg[key].count++;
    typeAgg[key].totalLength+=(c.calculatedLength||c.length||0);
    if(c.system)typeAgg[key].systems.add(c.system);
  });
  
  const rows=Object.values(typeAgg).sort((a,b)=>b.totalLength-a.totalLength);
  let totalCnt=0,totalLen=0;
  
  // KPIs
  const kpis=document.getElementById('bomKpis');
  if(kpis){
    rows.forEach(r=>{totalCnt+=r.count;totalLen+=r.totalLength});
    const marLen=totalLen*(1+margin);
    kpis.innerHTML=`
      <div class="kpi" style="min-width:120px"><div class="kpi-v" style="font-size:18px;color:var(--amber)">${rows.length}</div><div class="kpi-l">케이블 타입</div></div>
      <div class="kpi" style="min-width:120px"><div class="kpi-v" style="font-size:18px;color:var(--cyan)">${fmtNum(totalCnt)}</div><div class="kpi-l">총 케이블</div></div>
      <div class="kpi" style="min-width:120px"><div class="kpi-v" style="font-size:18px;color:var(--green)">${fmtNum(Math.round(totalLen))}m</div><div class="kpi-l">총 길이</div></div>
      <div class="kpi" style="min-width:120px"><div class="kpi-v" style="font-size:18px;color:var(--purple)">${fmtNum(Math.round(marLen))}m</div><div class="kpi-l">마진포함 (${Math.round(margin*100)}%)</div></div>
    `;
  }
  
  // Table
  wrap.innerHTML=`<table class="bom-table">
    <thead><tr><th>#</th><th>CABLE TYPE</th><th>COUNT</th><th>TOTAL LENGTH(m)</th><th>MARGIN LENGTH(m)</th><th>AVG LENGTH(m)</th><th>SYSTEMS</th></tr></thead>
    <tbody>${rows.map((r,i)=>`<tr>
      <td style="color:var(--t3)">${i+1}</td>
      <td><span style="color:var(--cyan)">${r.type}</span></td>
      <td class="num">${r.count}</td>
      <td class="num">${Math.round(r.totalLength)}</td>
      <td class="num" style="color:var(--amber)">${Math.round(r.totalLength*(1+margin))}</td>
      <td class="num">${r.count>0?(r.totalLength/r.count).toFixed(1):'-'}</td>
      <td style="font-size:10px">${[...r.systems].join(', ')}</td>
    </tr>`).join('')}
    <tr class="bom-total"><td></td><td>TOTAL</td><td class="num">${totalCnt}</td><td class="num">${Math.round(totalLen)}</td><td class="num">${Math.round(totalLen*(1+margin))}</td><td></td><td></td></tr>
    </tbody></table>`;
}

function exportBOMExcel(){
  if(typeof XLSX==='undefined')return;
  const sysF=document.getElementById('bomSystemFilter')?.value||'';
  const typF=document.getElementById('bomTypeFilter')?.value||'';
  const margin=parseFloat(document.getElementById('bomMargin')?.value||10)/100;
  const typeAgg={};
  cableData.forEach(c=>{
    if(sysF&&c.system!==sysF)return;if(typF&&c.type!==typF)return;
    const key=c.type||'Unknown';
    if(!typeAgg[key])typeAgg[key]={type:key,count:0,totalLength:0};
    typeAgg[key].count++;typeAgg[key].totalLength+=(c.calculatedLength||c.length||0);
  });
  const rows=[['Cable Type','Count','Total Length (m)','Margin Length (m)','Avg Length (m)']];
  Object.values(typeAgg).sort((a,b)=>b.totalLength-a.totalLength).forEach(r=>{
    rows.push([r.type,r.count,Math.round(r.totalLength),Math.round(r.totalLength*(1+margin)),r.count>0?(r.totalLength/r.count).toFixed(1):0]);
  });
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'BOM');
  XLSX.writeFile(wb,`SEASTAR_BOM_${new Date().toISOString().slice(0,10)}.xlsx`);
  notify('BOM Excel 다운로드','success');
}

// ---- EXPORT ----
function exportExcel(){
  if(!cableData.length||typeof XLSX==='undefined')return;
  const ws=[['CABLE_NAME','TYPE','SYSTEM','FROM_NODE','TO_NODE','CALC_LENGTH','PATH','CHECK_NODE','DIA']];
  cableData.forEach(c=>ws.push([c.name,c.type,c.system,c.fromNode,c.toNode,c.calculatedLength||c.length||0,c.calculatedPath||'',c.checkNode||'',c.outDia||'']));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ws),'Cables');
  XLSX.writeFile(wb,`SEASTAR_CableList_${new Date().toISOString().slice(0,10)}.xlsx`);notify('Excel 다운로드','success');
}
}// ---- EXPORT (ref.html 완전 기능 복원) ----
function exportExcel(){
  if (!cableData.length || typeof XLSX==='undefined') { notify('내보낼 데이터가 없습니다.', 'warning'); return; }
  
  const ws_data = [['CABLE_NAME', 'CABLE_TYPE', 'CABLE_SYSTEM', 'FROM_NODE', 'TO_NODE', 'CALC_LENGTH', 'CABLE_PATH', 'CHECK_NODE', 'OUT_DIA']];
  cableData.forEach(c => {
    ws_data.push([c.name, c.type, c.system, c.fromNode, c.toNode,
      c.calculatedLength > 0 ? c.calculatedLength : (c.length || 0),
      c.calculatedPath || c.path || '', c.checkNode || '', c.outDia || '']);
  });
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 50 }, { wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Cable List');
  XLSX.writeFile(wb, `SEASTAR_CableList_${new Date().toISOString().slice(0, 10)}.xlsx`);
  notify('케이블 리스트 Excel 다운로드', 'success');
}

function exportNodeExcel(){
  if (!nodeData.length || typeof XLSX==='undefined') { notify('내보낼 노드 데이터가 없습니다.', 'warning'); return; }
  
  const ws_data = [['NODE_NAME', 'STRUCTURE', 'TYPE', 'RELATION', 'LINK_LENGTH', 'AREA_SIZE', 'CONNECTED_CABLES', 'FILL_PCT']];
  nodeData.forEach(n => {
    ws_data.push([n.name, n.structure, n.type, n.relation || '', n.linkLength, n.areaSize, n.connectedCables, n.fillPct || 0]);
  });
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, 'Node Info');
  XLSX.writeFile(wb, `SEASTAR_NodeInfo_${new Date().toISOString().slice(0, 10)}.xlsx`);
  notify('노드 정보 Excel 다운로드', 'success');
}

function exportFullReport(){
  if (!cableData.length && !nodeData.length || typeof XLSX==='undefined') { notify('데이터가 없습니다.', 'warning'); return; }
  
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Cables
  const cableRows = [['CABLE_NAME', 'TYPE', 'SYSTEM', 'FROM_NODE', 'TO_NODE', 'CALC_LENGTH', 'PATH', 'CHECK_NODE', 'DIA']];
  cableData.forEach(c => cableRows.push([c.name, c.type, c.system, c.fromNode, c.toNode, c.calculatedLength || c.length || 0, c.calculatedPath || c.path || '', c.checkNode || '', c.outDia || '']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cableRows), 'Cables');
  
  // Sheet 2: Nodes
  const nodeRows = [['NODE', 'STRUCTURE', 'TYPE', 'RELATIONS', 'LINK_LENGTH', 'AREA_SIZE', 'CABLES', 'FILL_PCT']];
  nodeData.forEach(n => nodeRows.push([n.name, n.structure, n.type, n.relation || '', n.linkLength, n.areaSize, n.connectedCables, n.fillPct || 0]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(nodeRows), 'Nodes');
  
  // Sheet 3: Summary
  const sys = {};
  cableData.forEach(c => { const s = c.system || 'Unknown'; if (!sys[s]) sys[s] = { cnt: 0, len: 0 }; sys[s].cnt++; sys[s].len += c.calculatedLength || c.length || 0; });
  const sumRows = [['System', 'Count', 'Total Length (m)'], ...Object.entries(sys).map(([s, d]) => [s, d.cnt, Math.round(d.len)])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sumRows), 'Summary');
  
  XLSX.writeFile(wb, `SEASTAR_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  notify('전체 보고서 Excel 다운로드', 'success');
}

function exportCSV(){
  if (!cableData.length) { notify('데이터가 없습니다.', 'warning'); return; }
  
  const csvContent = "data:text/csv;charset=utf-8," + 
    ['CABLE_NAME,TYPE,SYSTEM,FROM_NODE,TO_NODE,CALC_LENGTH,PATH,CHECK_NODE,DIA'].join(',') + '\n' +
    cableData.map(c => `${c.name},${c.type},${c.system},${c.fromNode},${c.toNode},${c.calculatedLength||c.length||0},${c.calculatedPath||c.path||''},${c.checkNode||''},${c.outDia||''}`).join('\n');
  
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `SEASTAR_Cables_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  notify('CSV 다운로드', 'success');
}

function exportJSON(){
  if (!cableData.length && !nodeData.length) { notify('데이터가 없습니다.', 'warning'); return; }
  
  const data = { cables: cableData, nodes: nodeData, exportDate: new Date().toISOString() };
  const jsonContent = JSON.stringify(data, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SEASTAR_Data_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  notify('JSON 다운로드', 'success');
}
// ---- ANALYSIS ----
function runAnalysisUpdate(){runCapacityAnalysis();updateSystemSummary();updateLengthStats();updateTopNodes()}
function runCapacityAnalysis(){
  const el=document.getElementById('capacityList');if(!el)return;
  if(!nodeData.length){el.innerHTML='<div style="color:var(--t3);font-size:11px">노드 데이터를 로드하세요</div>';return}
  calcConnectedCables();
  const nodesWithArea=nodeData.filter(n=>n.areaSize>0).sort((a,b)=>b.fillPct-a.fillPct).slice(0,30);
  el.innerHTML=nodesWithArea.map(n=>{
    const col=n.fillPct>100?'var(--red)':n.fillPct>70?'var(--amber)':'var(--green)';
    return `<div class="cap-row"><div class="cap-name">${n.name}</div><div class="cap-bar"><div class="cap-fill ${n.fillPct>100?'cap-over':n.fillPct>70?'cap-warn':'cap-ok'}" style="width:${Math.min(100,n.fillPct)}%"></div></div><div class="cap-pct" style="color:${col}">${n.fillPct}%</div></div>`;
  }).join('')||'<div style="color:var(--t3);font-size:11px">AREA_SIZE 데이터 없음</div>';
}
function updateSystemSummary(){
  const el=document.getElementById('systemSummary');if(!el||!cableData.length)return;
  const sys={};cableData.forEach(c=>{const s=c.system||'Unknown';if(!sys[s])sys[s]={count:0,length:0,calc:0};sys[s].count++;sys[s].length+=c.calculatedLength||c.length||0;if(c.calculatedPath)sys[s].calc++});
  el.innerHTML=Object.entries(sys).sort((a,b)=>b[1].count-a[1].count).map(([s,d])=>`<div class="stat-row"><div class="srl">${s}</div><div style="display:flex;gap:6px"><span class="badge bc">${d.count}</span><span class="badge bg-badge">${Math.round(d.length)}m</span><span class="badge ${d.calc===d.count?'bg-badge':'ba'}">${d.calc}/${d.count}</span></div></div>`).join('');
}
function updateLengthStats(){
  const el=document.getElementById('lengthStats');if(!el||!cableData.length)return;
  const lens=cableData.map(c=>c.calculatedLength||c.length||0).filter(l=>l>0).sort((a,b)=>a-b);
  if(!lens.length){el.innerHTML='<div style="color:var(--t3);font-size:11px">길이 데이터 없음</div>';return}
  const total=lens.reduce((s,l)=>s+l,0),avg=total/lens.length,med=lens[Math.floor(lens.length/2)];
  el.innerHTML=[['총 길이',Math.round(total)+'m'],['평균',avg.toFixed(1)+'m'],['중간값',med.toFixed(1)+'m'],['최소',lens[0].toFixed(1)+'m'],['최대',lens[lens.length-1].toFixed(1)+'m'],['산출',cableData.filter(c=>c.calculatedPath).length+'/'+cableData.length]].map(([k,v])=>`<div class="stat-row"><div class="srl">${k}</div><div class="srr">${v}</div></div>`).join('');
}
function updateTopNodes(){
  const el=document.getElementById('topNodes');if(!el||!nodeData.length)return;
  const top=nodeData.slice().sort((a,b)=>b.connectedCables-a.connectedCables).slice(0,15);
  el.innerHTML=top.map((n,i)=>`<div class="cap-row"><div class="cap-name"><span style="color:var(--t3);margin-right:4px">${i+1}</span>${n.name}</div><div class="cap-bar"><div class="cap-fill cap-ok" style="width:${top[0].connectedCables>0?n.connectedCables/top[0].connectedCables*100:0}%"></div></div><div class="cap-pct" style="color:var(--cyan)">${n.connectedCables}</div></div>`).join('');
}

// ---- PROJECT PANEL ----
function updateProjectPanel(){
  updateKPIs();
  const el=document.getElementById('projCurrentShip');
  if(el)el.textContent=currentShip?`${currentShip.name} (${currentShip.no||'-'})`:'선택 안됨';
}

// ---- ADMIN PANEL ----
async function renderAdminPanels(){
  try{
    const[ur,gr]=await Promise.all([fetch(API+'/api/admin/users').then(r=>r.json()),fetch(API+'/api/admin/groups').then(r=>r.json())]);
    const users=ur.users||[],groups=gr.groups||[];
    const ul=document.getElementById('adminUserList');
    if(ul)ul.innerHTML=`<table class="dt" style="font-size:11px"><thead><tr><th>ID</th><th>이름</th><th>역할</th><th>그룹</th><th>작업</th></tr></thead><tbody>${users.map(u=>`<tr>
      <td>${u.username}</td><td>${u.name}</td>
      <td><span class="badge ${u.role==='admin'?'ba':u.role==='manager'?'bc':'bg-badge'}">${u.role}</span></td>
      <td>${groups.find(g=>g.id===u.group_id)?.name||'-'}</td>
      <td>${u.id!=='admin'?`<button class="btn btn-r" style="font-size:8px;padding:2px 5px" onclick="deleteUser('${u.id}')">삭제</button>`:''}</td>
    </tr>`).join('')}</tbody></table>`;
    const gl=document.getElementById('adminGroupList');
    if(gl)gl.innerHTML=`<table class="dt" style="font-size:11px"><thead><tr><th>ID</th><th>이름</th><th>작업</th></tr></thead><tbody>${groups.map(g=>`<tr>
      <td>${g.id}</td><td>${g.name}</td>
      <td>${g.id!=='grp_default'?`<button class="btn btn-r" style="font-size:8px;padding:2px 5px" onclick="deleteGroup('${g.id}')">삭제</button>`:''}</td>
    </tr>`).join('')}</tbody></table>`;
    // Populate group selects
    document.querySelectorAll('.admin-group-select').forEach(sel=>{
      sel.innerHTML=groups.map(g=>`<option value="${g.id}">${g.name}</option>`).join('');
    });
  }catch(e){notify('관리자 데이터 로드 실패','error')}
}

async function addUser(){
  const username=document.getElementById('nuId').value.trim();
  const password=document.getElementById('nuPw').value;
  const name=document.getElementById('nuName').value.trim();
  const role=document.getElementById('nuRole').value;
  const groupId=document.getElementById('nuGroup').value;
  if(!username||!password||!name){notify('모든 항목을 입력하세요','warning');return}
  try{
    const r=await fetch(API+'/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password,name,role,groupId})});
    const d=await r.json();
    if(r.ok){notify(`사용자 추가: ${name}`,'success');renderAdminPanels();document.getElementById('addUserOverlay').style.display='none'}
    else notify(d.error||'추가 실패','error');
  }catch(e){notify('서버 오류','error')}
}

async function deleteUser(id){if(!confirm('사용자를 삭제하시겠습니까?'))return;await fetch(API+`/api/admin/users/${id}`,{method:'DELETE'});renderAdminPanels()}
async function addGroup(){
  const name=document.getElementById('ngName').value.trim();
  if(!name){notify('그룹명을 입력하세요','warning');return}
  await fetch(API+'/api/admin/groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
  notify(`그룹 추가: ${name}`,'success');renderAdminPanels();document.getElementById('addGroupOverlay').style.display='none';
}
async function deleteGroup(id){if(!confirm('그룹을 삭제하시겠습니까?'))return;await fetch(API+`/api/admin/groups/${id}`,{method:'DELETE'});renderAdminPanels()}

// ---- STATUS BAR ----
function updateStatusBar(){
  const setT=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  setT('sbCables',cableData.length);setT('sbNodes',nodeData.length);
  setT('sbFiltered',`${filteredCableData.length}/${cableData.length}`);
  setT('sbTime',now());
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded',()=>{
  buildAppHTML();
  setInterval(()=>{const e=document.getElementById('sbTime');if(e)e.textContent=now()},1000);
  checkSession();
  setTimeout(()=>{
    if(typeof XLSX!=='undefined'&&typeof Chart!=='undefined')notify('SEASTAR CMS V6 준비 완료','success');
    else if(typeof XLSX!=='undefined')notify('SEASTAR CMS V6 준비 완료 (차트 로드 중...)','info');
    else notify('XLSX 라이브러리 로드 실패','error');
  },800);
});

function buildAppHTML(){
  document.getElementById('app').innerHTML=`
<div class="app">
  <header class="hdr">
    <div class="logo"><div class="logo-icon">🚢</div><h1>SEASTAR</h1><div class="ver">CMS V6</div>
      <div class="hdr-stat" style="margin-left:12px"><div class="dot"></div><span>ONLINE</span></div>
    </div>
    <div class="hdr-right">
      <div class="hdr-stat">📌 Cables: <span id="hdrCableCount" style="color:var(--cyan)">0</span></div>
      <div class="hdr-stat">🗂 Nodes: <span id="hdrNodeCount" style="color:var(--green)">0</span></div>
      <div class="hdr-stat">🗺 Paths: <span id="hdrPathCount" style="color:var(--amber)">0</span></div>
      <div class="hdr-actions">
        <button class="btn btn-gh" onclick="undoAction()" title="Ctrl+Z">↩</button>
        <button class="btn btn-gh" onclick="redoAction()" title="Ctrl+Y">↪</button>
      </div>
      <div id="hdrShipBadge" style="display:none;align-items:center;gap:6px;font-size:10px;padding:4px 10px;border:1px solid var(--amber);border-radius:4px;color:var(--amber)">🚢 <span id="hdrShipName"></span>
        <button class="btn btn-gh" style="font-size:8px;padding:2px 6px" onclick="showShipSelectModal()">변경</button>
      </div>
      <div id="hdrUserBox" style="display:none;align-items:center;gap:8px">
        <span id="hdrUserName" style="font-size:11px;color:var(--t2)"></span>
        <span id="hdrUserRole" style="font-size:9px;padding:2px 6px;border:1px solid var(--border);border-radius:3px;font-family:'Orbitron',sans-serif;letter-spacing:1px"></span>
        <button class="btn btn-r" style="font-size:9px;padding:3px 8px" onclick="doLogout()">⏏</button>
      </div>
    </div>
  </header>
  <div class="body-wrap">
    <aside class="sidebar"><div class="sb-scroll">
      <div class="sb-sec"><div class="sb-lbl">📁 File Upload</div>
        <div class="upload-zone" id="cableZone" onclick="document.getElementById('cableFile').click()">
          <div class="upload-label">Cable List (Excel/CSV)</div><div class="upload-name" id="cableFileName">📂 파일 선택...</div>
          <input type="file" id="cableFile" accept=".xlsx,.xls,.csv" onchange="onFileSelected('cable',this)">
        </div>
        <div class="upload-zone" id="nodeZone" onclick="document.getElementById('nodeFile').click()">
          <div class="upload-label">Node Info (Excel/CSV)</div><div class="upload-name" id="nodeFileName">📂 파일 선택...</div>
          <input type="file" id="nodeFile" accept=".xlsx,.xls,.csv" onchange="onFileSelected('node',this)">
        </div>
        <button class="sb-btn g" onclick="loadFiles()" style="margin-top:6px">⚡ 파일 로드 & 분석</button>
      </div>
      <div class="sb-sec"><div class="sb-lbl">📊 Statistics</div>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-v" id="kpiCables">0</div><div class="kpi-l">케이블</div></div>
          <div class="kpi"><div class="kpi-v" id="kpiNodes">0</div><div class="kpi-l">노드</div></div>
          <div class="kpi"><div class="kpi-v" id="kpiPaths">0</div><div class="kpi-l">경로</div></div>
          <div class="kpi"><div class="kpi-v" id="kpiLength">0</div><div class="kpi-l">길이(m)</div></div>
        </div>
      </div>
      <div class="sb-sec"><div class="sb-lbl">⚡ Operations</div>
        <button class="sb-btn g" onclick="calculateAllPaths()">🗺 전체 경로 산출</button>
        <button class="sb-btn" onclick="refreshAll()">🔄 새로고침</button>
      </div>
      <div class="sb-sec"><div class="sb-lbl">💾 Project</div>
        <button class="sb-btn g" onclick="saveShipProject()">💾 프로젝트 저장</button>
        <button class="sb-btn" onclick="showShipSelectModal()">📂 프로젝트 열기</button>
      </div>
      <div class="sb-sec"><div class="sb-lbl">📤 Export</div>
        <button class="sb-btn g" onclick="exportExcel()">📋 Excel 내보내기</button>
      </div>
    </div></aside>
    <main class="main">
      <nav class="tab-bar">
        <button class="tab-btn active" onclick="showTab('overview')">📊 OVERVIEW</button>
        <button class="tab-btn" onclick="showTab('cables')">📌 CABLES</button>
        <button class="tab-btn" onclick="showTab('nodes')">🗂 NODES</button>
        <button class="tab-btn" onclick="showTab('viz3d')">🌐 3D VIEW</button>
        <button class="tab-btn" onclick="showTab('routing')">🗺 ROUTING</button>
        <button class="tab-btn" onclick="showTab('analysis')">📈 ANALYSIS</button>
        <button class="tab-btn" onclick="showTab('tray')">🔧 TRAY</button>
        <button class="tab-btn" onclick="showTab('bom')">📦 BOM</button>
        <button class="tab-btn" onclick="showTab('project')">💾 PROJECT</button>
        <button class="tab-btn" id="adminTabBtn" style="display:none;color:var(--amber)" onclick="showTab('admin')">👑 ADMIN</button>
      </nav>
      <div class="panels">
        <!-- OVERVIEW -->
        <div class="panel active" id="panel-overview" style="overflow:auto">
          <div class="dash-kpi">
            <div class="dash-kpi-card c"><div class="dkpi-v" style="color:var(--cyan)" id="dkCables">0</div><div class="dkpi-l">CABLES</div></div>
            <div class="dash-kpi-card g"><div class="dkpi-v" style="color:var(--green)" id="dkNodes">0</div><div class="dkpi-l">NODES</div></div>
            <div class="dash-kpi-card a"><div class="dkpi-v" style="color:var(--amber)" id="dkPaths">0</div><div class="dkpi-l">PATHS</div></div>
            <div class="dash-kpi-card p"><div class="dkpi-v" style="color:var(--purple)" id="dkLength">0</div><div class="dkpi-l">LENGTH(m)</div></div>
            <div class="dash-kpi-card r"><div class="dkpi-v" style="color:var(--red)" id="dkCoverage">0%</div><div class="dkpi-l">COVERAGE</div></div>
          </div>
          <div class="chart-grid"><div class="chart-box"><h3>SYSTEM DISTRIBUTION</h3><div style="height:200px"><canvas id="chartSystem"></canvas></div></div><div class="chart-box"><h3>CABLE TYPE TOP 10</h3><div style="height:200px"><canvas id="chartType"></canvas></div></div><div class="chart-box"><h3>TOP CONNECTED NODES</h3><div style="height:200px"><canvas id="chartNode"></canvas></div></div></div>
        </div>
        <!-- CABLES -->
        <div class="panel" id="panel-cables">
          <div class="card" style="flex-shrink:0"><div class="card-hdr"><div class="card-title">📌 CABLE LIST</div>
            <div class="toolbar">
              <button class="btn btn-c" onclick="calculateAllPaths()">⚡ 경로 산출</button>
              <button class="btn btn-g" onclick="exportExcel()">📋 케이블 리스트 (Excel)</button>
              <button class="btn btn-a" onclick="exportFullReport()">📄 전체 보고서 (Excel)</button>
              <button class="btn btn-gh" style="background:var(--purple)" onclick="exportOperationLog()">📊 작업 로그 (CSV)</button>
              <button class="btn btn-a" onclick="exportFullReport()">📄 전체 보고서 (Excel)</button>
              <button class="btn btn-gh" onclick="selectAllCables()">☑ 전체</button>
              <button class="btn btn-gh" onclick="deselectAllCables()">☐ 해제</button>
              <div style="margin-left:auto;display:flex;align-items:center;gap:4px;">
                <button class="btn btn-gh" onclick="changeFontSize(-1)" style="font-size:10px;padding:4px 8px;">A-</button>
                <span style="font-size:10px;color:var(--t2)" id="cableFontSize">12px</span>
                <button class="btn btn-gh" onclick="changeFontSize(1)" style="font-size:10px;padding:4px 8px;">A+</button>
              </div>
            </div>
            <div class="toolbar">
              <button class="btn btn-c" onclick="calculateAllPaths()">⚡ 경로 산출</button>
              <button class="btn btn-g" onclick="exportExcel()">📋 케이블 리스트 (Excel)</button>
              <button class="btn btn-a" onclick="exportFullReport()">📄 전체 보고서 (Excel)</button>
              <button class="btn btn-gh" onclick="selectAllCables()">☑ 전체</button>
              <button class="btn btn-gh" onclick="deselectAllCables()">☐ 해제</button>
            </div>
          </div>
            <div class="toolbar">
              <button class="btn btn-c" onclick="calculateAllPaths()">⚡ 경로 산출</button>
              <button class="btn btn-g" onclick="exportExcel()">📋 Excel</button>
              <button class="btn btn-gh" onclick="selectAllCables()">☑ 전체</button>
              <button class="btn btn-gh" onclick="deselectAllCables()">☐ 해제</button>
            </div>
          </div>
          <div class="card-body" style="padding-bottom:6px">
            <div class="row" style="gap:6px;flex-wrap:wrap">
              <div class="fg" style="max-width:200px"><input class="fi" id="cableSearch" placeholder="🔍 검색..." oninput="applyFilters()"></div>
              <select class="fi" id="systemFilter" onchange="applyFilters()" style="max-width:140px"><option value="">모든 시스템</option></select>
              <select class="fi" id="typeFilter" onchange="applyFilters()" style="max-width:120px"><option value="">모든 타입</option></select>
              <select class="fi" id="pathFilter" onchange="applyFilters()" style="max-width:110px"><option value="">경로 상태</option><option value="calc">산출됨</option><option value="none">미산출</option></select>
              <button class="btn btn-r" onclick="clearFilters()">✕ 초기화</button>
              <span id="filterCount" style="font-size:10px;color:var(--t3)"></span>
            </div>
          </div></div>
          <div style="flex:1;overflow:auto"><table class="dt"><thead><tr>${CABLE_COLS.map(c=>`<th style="min-width:${c.w}px">${c.label}</th>`).join('')}</tr></thead><tbody id="cableTbody"></tbody></table></div>
        </div>
        <!-- NODES -->
          <div class="card"><div class="card-hdr"><div class="card-title">🗂 NODE INFORMATION</div>
            <div class="toolbar">
              <input class="fi" id="nodeSearch" placeholder="🔍 검색..." oninput="filterNodes()" style="max-width:200px">
              <button class="btn btn-g" onclick="exportNodeExcel()">📋 노드 정보 (Excel)</button>
            </div>
          </div>
          <div class="card"><div class="card-hdr"><div class="card-title">🗂 NODE INFORMATION</div>
            <div class="toolbar"><input class="fi" id="nodeSearch" placeholder="🔍 검색..." oninput="filterNodes()" style="max-width:200px"></div>
          </div></div>
          <div style="flex:1;overflow:auto"><table class="dt"><thead><tr>${NODE_COLS.map(c=>`<th style="min-width:${c.w}px">${c.label}</th>`).join('')}</tr></thead><tbody id="nodeTbody"></tbody></table></div>
        </div>
        <!-- 3D VIEW -->
        <div class="panel" id="panel-viz3d" style="padding:0;overflow:hidden;flex-direction:column">
          <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg1);border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap">
            <span style="font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:2px;color:var(--cyan)">🌐 3D NODE MAP</span>
            <button class="btn btn-c" onclick="init3DMap()" style="font-size:9px;padding:4px 10px">⚡ 렌더</button>
            <button class="btn btn-gh" onclick="reset3DCamera()" style="font-size:9px;padding:4px 10px">🎯 리셋</button>
            <button class="btn btn-a" onclick="toggle3DView('iso')" style="font-size:9px;padding:4px 10px">📐 ISO</button>
            <button class="btn btn-gh" onclick="toggle3DView('top')" style="font-size:9px;padding:4px 10px">⬆ TOP</button>
            <button class="btn btn-gh" onclick="toggle3DView('side')" style="font-size:9px;padding:4px 10px">➡ SIDE</button>
            <label style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--t2)"><input type="checkbox" id="show3DEdges" checked onchange="render3D()"> 연결선</label>
            <input class="fi" id="map3DNodeSearch" placeholder="노드 검색..." oninput="render3D()" style="font-size:10px;padding:3px 6px;width:120px">
            <span id="map3DInfo" style="font-size:10px;color:var(--t3);margin-left:auto">노드 0개</span>
          </div>
          <div style="position:relative;flex:1;overflow:hidden" id="map3DWrap">
            <canvas id="map3DCanvas" style="display:block;width:100%;height:100%;background:#010b18"></canvas>
            <div style="position:absolute;bottom:12px;left:12px;font-size:9px;color:var(--t3);font-family:'Orbitron',sans-serif">🖱 드래그: 회전 | 휠: 줌 | 우클릭: 이동</div>
            <div style="position:absolute;top:10px;right:12px;background:rgba(7,24,40,.9);border:1px solid var(--border);border-radius:4px;padding:6px 8px;font-size:9px">
              ${deckConfig.map(d=>`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px"><span style="width:8px;height:8px;display:inline-block;background:${d.color}"></span>${d.prefix} ${d.label}</div>`).join('')}
            </div>
          </div>
        </div>
        <!-- ROUTING -->
        <div class="panel" id="panel-routing">
          <div class="card"><div class="card-hdr"><div class="card-title">🗺 ROUTE CALCULATOR</div></div>
          <div class="card-body"><div class="row" style="margin-bottom:10px">
            <div class="fg"><div class="fl">FROM NODE</div><input class="fi" id="rtFrom" placeholder="출발 노드"></div>
            <div class="fg"><div class="fl">TO NODE</div><input class="fi" id="rtTo" placeholder="도착 노드"></div>
            <div class="fg" style="flex:2"><div class="fl">CHECK NODE (쉼표)</div><input class="fi" id="rtCheck" placeholder="경유 노드"></div>
            <button class="btn btn-c" onclick="calcSingleRoute()" style="align-self:flex-end">⚡ 산출</button>
          </div>
          <div id="routeResult" style="min-height:40px;background:var(--bg0);border:1px solid var(--border);border-radius:4px;padding:10px;color:var(--t3);font-size:11px;display:flex;align-items:center;flex-wrap:wrap;gap:4px">경로를 산출하면 여기에 표시됩니다</div>
          <div style="margin-top:6px;font-size:10px;color:var(--t3)" id="routeMeta"></div>
          </div></div>
        </div>
        <!-- ANALYSIS -->
        <div class="panel" id="panel-analysis">
          <div class="analysis-grid">
            <div class="card" style="display:flex;flex-direction:column"><div class="card-hdr"><div class="card-title">📊 TRAY CAPACITY</div><button class="btn btn-c" onclick="runCapacityAnalysis()" style="font-size:8px">분석</button></div><div class="card-body" style="flex:1;overflow:auto;max-height:300px" id="capacityList"><div style="color:var(--t3);font-size:11px">분석 실행</div></div></div>
            <div class="card"><div class="card-hdr"><div class="card-title">📋 SYSTEM SUMMARY</div></div><div class="card-body" style="overflow:auto;max-height:300px" id="systemSummary"><div style="color:var(--t3);font-size:11px">데이터 로드 필요</div></div></div>
          </div>
          <div class="analysis-grid">
            <div class="card"><div class="card-hdr"><div class="card-title">📏 LENGTH STATISTICS</div></div><div class="card-body" id="lengthStats"><div style="color:var(--t3);font-size:11px">데이터 로드 필요</div></div></div>
            <div class="card"><div class="card-hdr"><div class="card-title">🔗 TOP CONNECTED NODES</div></div><div class="card-body" style="overflow:auto;max-height:300px" id="topNodes"><div style="color:var(--t3);font-size:11px">데이터 로드 필요</div></div></div>
          </div>
        </div>
        <!-- TRAY PHYSICS (FILL) -->
        <div class="panel" id="panel-tray" style="padding:0;overflow:hidden">
          <div class="fill-wrap">
            <!-- FILL Header -->
            <div class="fill-header">
              <div class="fill-logo"><img src="./static/logo.jpg" alt="FILL" style="height:24px;width:auto;object-fit:contain;" /><span style="margin-left:8px;font-weight:900;font-size:14px;color:var(--cyan)">TRAY OPTIMIZER</span></div>
              <div class="fill-controls">
                <!-- Tier -->
                <div class="fill-tier-btns">
                  <button class="fill-tier-btn active" data-t="1" onclick="fillSetTiers(1)">1단</button>
                  <button class="fill-tier-btn" data-t="2" onclick="fillSetTiers(2)">2단</button>
                  <button class="fill-tier-btn" data-t="3" onclick="fillSetTiers(3)">3단</button>
                </div>
                <!-- Auto Optimize -->
                <button onclick="fillAutoOptimize()" class="fill-auto-opt-btn" style="background:#00e5a0;color:#020c1b;border:none;padding:6px 12px;border-radius:4px;font-weight:900;font-size:10px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:4px;" title="메트릭스에서 최적 조합을 자동으로 선택합니다">✨ Auto-Opt</button>
                <!-- Height -->
                <!-- Height -->
                <div class="fill-ctrl-grp"><label>H</label><input type="range" min="40" max="100" step="5" value="60" oninput="fillState.maxHeightLimit=+this.value;document.getElementById('fillHVal').textContent=this.value;fillState.manualWidth=null;fillCalculate(null)"><span class="val" id="fillHVal">60</span></div>
                <!-- Fill -->
                <div class="fill-ctrl-grp"><label>F</label><input type="range" min="10" max="60" step="5" value="40" oninput="fillState.fillRatioLimit=+this.value;document.getElementById('fillFVal').textContent=this.value+'%';fillState.manualWidth=null;fillCalculate(null)"><span class="val" id="fillFVal">40%</span></div>
                <!-- Width adjust -->
                <div class="fill-width-ctrl">
                  <button onclick="fillAdjustWidth(-100)">◀</button>
                  <span class="wval" id="fillWVal">${fillState.systemResult?.systemWidth||0}</span>
                  <button onclick="fillAdjustWidth(100)">▶</button>
                  <button onclick="fillResetWidth()" title="Auto" style="font-size:10px;color:var(--amber)">↻</button>
                </div>
                <!-- Calc -->
                <button class="fill-calc-btn" onclick="fillCalculate(fillState.manualWidth)">▶ 계산</button>
              </div>
            </div>

            <!-- Size Selector -->
            <div class="fill-size-selector">
              <span class="ssl">TRAY SIZE:</span>
              <div class="fill-size-chips" id="fillSizeChips"></div>
            </div>

            <!-- Body: Sidebar + Visualization -->
            <div class="fill-body">
              <!-- Sidebar: Data Input -->
              <div class="fill-sidebar">
                <div class="fill-sidebar-hdr">
                  <h3>📋 Data Source</h3>
                  <div class="fill-sidebar-btns">
                    <button class="fill-upload-btn" onclick="document.getElementById('fillFileInput').click()">📄 Excel</button>
                    <input type="file" id="fillFileInput" accept=".xlsx,.xls,.csv" onchange="fillHandleFileUpload(event)" style="display:none">
                  </div>
                </div>
                <div class="fill-data-info" id="fillDataInfo"><span class="fill-data-badge blue">0 cables</span></div>
                <div style="padding:6px 12px;border-bottom:1px solid var(--border);flex-shrink:0">
                  <div class="sb-lbl" style="margin-bottom:4px">📋 NODE → FILL (클릭)</div>
                  <div id="trayNodeList" class="tray-node-list" style="max-height:120px"><div style="color:var(--t3);font-size:11px;padding:8px">경로 산출 후 표시됩니다</div></div>
                </div>
                <div style="padding:4px 12px;font-size:9px;color:var(--t3);border-bottom:1px solid var(--border);flex-shrink:0">Format: <strong>Name | Type | OD</strong> (Tab/Comma separated)</div>
                <div class="fill-textarea">
                  <textarea id="fillTextArea" spellcheck="false" placeholder="데이터를 붙여넣으세요..." oninput="fillState.inputText=this.value;fillParseTextData(this.value)"></textarea>
                </div>
                <div class="fill-textarea-btns">
                  <button class="fill-txt-btn rst" onclick="fillState.inputText=FILL_DEFAULT_TEXT;document.getElementById('fillTextArea').value=FILL_DEFAULT_TEXT;fillParseTextData(FILL_DEFAULT_TEXT)">↺ Reset</button>
                  <button class="fill-txt-btn clr" onclick="fillState.inputText='';document.getElementById('fillTextArea').value='';fillParseTextData('')">✕ Clear</button>
                </div>
              </div>

              <!-- Visualization -->
              <div class="fill-main">
                <div class="fill-viz" id="fillVizWrap">
                  <div class="no-data"><div class="icon">📦</div><h3>데이터를 입력하세요</h3><p style="font-size:10px">왼쪽 패널에서 Excel 업로드 또는 직접 입력</p></div>
                </div>
                <div class="fill-info-bar" id="fillInfoBar"><span class="fi-stat" style="color:var(--t3)">데이터 없음</span></div>
                <div class="fill-cable-list" id="fillCableList"></div>
              </div>
            </div>
          </div>
        </div>
        <!-- BOM -->
        <div class="panel" id="panel-bom" style="flex-direction:column;gap:0;padding:0;overflow:hidden">
          <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--bg1);border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap">
            <span style="font-family:'Orbitron',sans-serif;font-size:11px;letter-spacing:2px;color:var(--amber)">📦 BOM — BILL OF MATERIALS</span>
            <select class="fi" id="bomSystemFilter" onchange="renderBOM()" style="font-size:10px;width:130px"><option value="">모든 시스템</option></select>
            <select class="fi" id="bomTypeFilter" onchange="renderBOM()" style="font-size:10px;width:120px"><option value="">모든 타입</option></select>
            <input class="fi" id="bomSearch" placeholder="🔍 검색..." oninput="renderBOM()" style="font-size:10px;width:140px">
            <label style="font-size:10px;color:var(--t2);display:flex;align-items:center;gap:4px;margin-left:auto">마진(%):<input type="number" id="bomMargin" value="10" min="0" max="100" step="1" oninput="renderBOM()" style="width:55px;font-size:10px;padding:3px 5px;background:var(--bg2);border:1px solid var(--border);color:var(--t1);border-radius:3px"></label>
            <button class="btn btn-g" onclick="exportBOMExcel()">📋 Excel</button>
          </div>
          <div id="bomKpis" style="display:flex;gap:10px;padding:8px 14px;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap"></div>
          <div style="flex:1;overflow:auto;padding:10px 14px"><div id="bomTableWrap" style="min-width:600px"></div></div>
        </div>
        <!-- PROJECT -->
        <div class="panel" id="panel-project">
          <div class="card"><div class="card-hdr"><div class="card-title">💾 PROJECT</div></div>
          <div class="card-body">
            <div style="font-size:11px;color:var(--t2);margin-bottom:10px;padding:8px;background:var(--bg2);border-radius:4px;border:1px solid var(--border)">현재 호선: <span id="projCurrentShip" style="color:var(--cyan);font-weight:600">선택 안됨</span></div>
            <div class="row"><button class="btn btn-g" onclick="saveShipProject()">💾 호선 저장</button><button class="btn btn-c" onclick="showShipSelectModal()">📂 호선 불러오기</button><button class="btn btn-g" onclick="exportExcel()">📋 Excel</button></div>
          </div></div>
        </div>
        <!-- ADMIN -->
        <div class="panel" id="panel-admin">
          <div class="card"><div class="card-hdr"><div class="card-title">👑 사용자 관리</div><div class="toolbar"><button class="btn btn-g" onclick="document.getElementById('addUserOverlay').style.display='flex'">➕ 추가</button></div></div><div class="card-body" style="overflow:auto;max-height:260px" id="adminUserList"></div></div>
          <div class="card"><div class="card-hdr"><div class="card-title">🏢 그룹 관리</div><div class="toolbar"><button class="btn btn-g" onclick="document.getElementById('addGroupOverlay').style.display='flex'">➕ 추가</button></div></div><div class="card-body" style="overflow:auto;max-height:200px" id="adminGroupList"></div></div>
        </div>
      </div>
    </main>
  </div>
  <div class="status-bar">
    <div class="si">SEASTAR CMS V6</div>
    <div class="si">케이블: <span id="sbCables">0</span></div>
    <div class="si">노드: <span id="sbNodes">0</span></div>
    <div class="si">필터: <span id="sbFiltered">-</span></div>
    <div class="si" style="margin-left:auto" id="sbAction">준비</div>
    <div class="si" id="sbTime"></div>
  </div>
</div>
<!-- LOGIN -->
<div id="loginOverlay" class="modal-overlay" style="z-index:10000">
  <div class="modal-box" style="min-width:380px;text-align:center">
    <div style="font-size:36px;margin-bottom:8px">🚢</div>
    <div style="font-family:'Orbitron',sans-serif;font-size:22px;font-weight:900;color:var(--cyan);letter-spacing:5px;text-shadow:0 0 24px rgba(0,200,240,.6)">SEASTAR</div>
    <div style="font-family:'Orbitron',sans-serif;font-size:10px;color:var(--t3);letter-spacing:3px;margin:4px 0 28px">CABLE MANAGEMENT SYSTEM V6</div>
    <div style="text-align:left;margin-bottom:14px"><div class="fl" style="margin-bottom:4px">사용자 ID</div><input class="fi" id="loginId" placeholder="아이디" autocomplete="username" onkeydown="if(event.key==='Enter')document.getElementById('loginPw').focus()"></div>
    <div style="text-align:left;margin-bottom:22px"><div class="fl" style="margin-bottom:4px">비밀번호</div><input class="fi" type="password" id="loginPw" placeholder="비밀번호" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()"></div>
    <button class="btn btn-c" style="width:100%;justify-content:center;font-size:13px;padding:11px" onclick="doLogin()">⚡ 로그인</button>
    <div id="loginError" style="color:var(--red);font-size:11px;text-align:center;margin-top:10px;display:none"></div>
    <div style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px;font-size:10px;color:var(--t3)">초기 관리자: <span style="color:var(--amber)">admin</span> / <span style="color:var(--amber)">admin123</span></div>
  </div>
</div>
<!-- SHIP SELECT -->
<div id="shipSelectOverlay" style="position:fixed;inset:0;z-index:9900;background:rgba(1,11,24,.95);display:none;align-items:center;justify-content:center">
  <div class="modal-box" style="min-width:480px">
    <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:var(--cyan);letter-spacing:3px;margin-bottom:16px">🚢 호선 선택</div>
    <div id="shipSelectList" style="max-height:280px;overflow-y:auto;margin-bottom:18px"></div>
    <div style="border-top:1px solid var(--border);padding-top:14px">
      <div style="font-family:'Orbitron',sans-serif;font-size:10px;color:var(--t3);letter-spacing:2px;margin-bottom:10px">새 호선 생성</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div class="fg" style="min-width:140px"><div class="fl">호선명</div><input class="fi" id="newShipName" placeholder="Hull No."></div>
        <div class="fg" style="min-width:100px"><div class="fl">번호</div><input class="fi" id="newShipNo" placeholder="H-2101"></div>
        <div class="fg" style="min-width:100px"><div class="fl">그룹</div><select class="fi" id="newShipGroup"></select></div>
        <button class="btn btn-g" style="align-self:flex-end" onclick="createNewShip()">➕</button>
      </div>
    </div>
    <button class="btn btn-gh" style="margin-top:12px;width:100%;justify-content:center" onclick="document.getElementById('shipSelectOverlay').style.display='none'">닫기</button>
  </div>
</div>
<!-- ADD USER -->
<div id="addUserOverlay" style="position:fixed;inset:0;z-index:9800;background:rgba(1,11,24,.88);display:none;align-items:center;justify-content:center">
  <div class="modal-box" style="min-width:360px">
    <div style="font-family:'Orbitron',sans-serif;font-size:12px;color:var(--cyan);margin-bottom:18px;letter-spacing:2px">👤 사용자 추가</div>
    <div class="fg" style="margin-bottom:10px"><div class="fl">아이디</div><input class="fi" id="nuId" placeholder="아이디"></div>
    <div class="fg" style="margin-bottom:10px"><div class="fl">비밀번호</div><input class="fi" type="password" id="nuPw" placeholder="비밀번호"></div>
    <div class="fg" style="margin-bottom:10px"><div class="fl">이름</div><input class="fi" id="nuName" placeholder="실명"></div>
    <div class="fg" style="margin-bottom:10px"><div class="fl">역할</div><select class="fi" id="nuRole"><option value="user">사용자</option><option value="manager">매니저</option><option value="admin">관리자</option></select></div>
    <div class="fg" style="margin-bottom:10px"><div class="fl">그룹</div><select class="fi admin-group-select" id="nuGroup"></select></div>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-gh" onclick="document.getElementById('addUserOverlay').style.display='none'">취소</button><button class="btn btn-g" onclick="addUser()">저장</button></div>
  </div>
</div>
<!-- ADD GROUP -->
<div id="addGroupOverlay" style="position:fixed;inset:0;z-index:9800;background:rgba(1,11,24,.88);display:none;align-items:center;justify-content:center">
  <div class="modal-box" style="min-width:320px">
    <div style="font-family:'Orbitron',sans-serif;font-size:12px;color:var(--cyan);margin-bottom:18px;letter-spacing:2px">🏢 그룹 추가</div>
    <div class="fg" style="margin-bottom:14px"><div class="fl">그룹명</div><input class="fi" id="ngName" placeholder="그룹명"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-gh" onclick="document.getElementById('addGroupOverlay').style.display='none'">취소</button><button class="btn btn-g" onclick="addGroup()">저장</button></div>
  </div>
</div>
<div class="notif-stack" id="notifStack"></div>
<div class="loader" id="loader"><div class="spin"></div><div class="load-txt" id="loaderText">PROCESSING...</div></div>
`;
}

// Keyboard shortcuts
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undoAction()}
  if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();redoAction()}
});
