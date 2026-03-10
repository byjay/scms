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
  if(id==='tray')renderTrayNodeList();
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
  // Simple force-directed layout for nodes without coordinates
  const nm={};nodes.forEach(n=>{nm[n.name]=n});
  // Assign initial positions using prefix grouping
  const prefixGroups={};
  nodes.forEach(n=>{
    const p=n.name.slice(0,2).toUpperCase();
    if(!prefixGroups[p])prefixGroups[p]=[];
    prefixGroups[p].push(n);
  });
  let gx=0;
  Object.entries(prefixGroups).forEach(([prefix,group])=>{
    group.forEach((n,i)=>{
      if(n.x==null){n.x=gx+Math.cos(i*0.5)*50*(1+i*0.3);n.y=Math.sin(i*0.5)*50*(1+i*0.3);n.z=getDeckForNode(n.name).deck*30}
    });
    gx+=150;
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

// ---- TRAY PHYSICS ----
function renderTrayNodeList(){
  const el=document.getElementById('trayNodeList');if(!el)return;
  // Count cables per node from calculated paths
  const nodeCableCnt={};
  cableData.forEach(c=>{
    if(!c.calculatedPath)return;
    c.calculatedPath.split(/\s*[,→]\s*/).filter(Boolean).forEach(n=>{nodeCableCnt[n]=(nodeCableCnt[n]||0)+1});
  });
  // Also add from nodeData
  nodeData.forEach(n=>{if(!nodeCableCnt[n.name])nodeCableCnt[n.name]=n.connectedCables||0});
  const entries=Object.entries(nodeCableCnt).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  el.innerHTML=entries.length?entries.map(([name,cnt])=>`<div class="tray-node-item" onclick="runTrayForNode('${name}')">${name} <span class="cnt">${cnt}</span></div>`).join(''):'<div style="color:var(--t3);font-size:11px;padding:8px">경로를 먼저 산출해주세요</div>';
}

function runTrayForNode(nodeName){
  document.getElementById('trayTargetNode').value=nodeName;
  runTrayOptimization();
}

function runTrayOptimization(){
  const targetNode=document.getElementById('trayTargetNode').value.trim();
  const maxHeight=parseInt(document.getElementById('trayMaxHeight').value)||150;
  const targetFill=parseInt(document.getElementById('trayTargetFill').value)||40;
  if(!targetNode){notify('Target Node를 입력해주세요','warning');return}
  const cablesInNode=cableData.filter(c=>{
    if(!c.calculatedPath)return false;
    return c.calculatedPath.split(',').map(n=>n.trim()).includes(targetNode);
  }).map(c=>({id:c.id,name:c.name,od:parseFloat(c.outDia)||20,system:c.system||'',fromNode:c.fromNode||'',type:c.type||''}));
  if(!cablesInNode.length){
    document.getElementById('trayResultWrap').innerHTML=`<span style="color:var(--red)">"${targetNode}" 노드를 지나는 산출된 케이블이 없습니다.</span>`;
    const canvas=document.getElementById('trayCanvas');if(canvas){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height)}
    return;
  }
  // Determine tray type from node prefix
  const dk=getDeckForNode(targetNode);
  const nodeInfo=nodeData.find(n=>n.name===targetNode);
  
  // Solve
  const sorted=[...cablesInNode].sort((a,b)=>b.od-a.od);
  const totalArea=sorted.reduce((acc,c)=>acc+Math.PI*Math.pow(c.od/2,2),0);
  const mWidth=(totalArea*100)/(maxHeight*targetFill);
  let bestWidth=Math.max(100,Math.ceil(mWidth/100)*100);
  if(bestWidth>1000)bestWidth=1000;
  
  // Place cables with gravity physics
  const placed=[];
  for(const cable of sorted){
    const r=cable.od/2;
    let bestPos=null,bestY=Infinity;
    // Try positions
    const candidates=[{x:5+r,y:r}];
    for(const p of placed){
      candidates.push({x:p.x+p.od/2+r+0.1,y:r});
      for(let angle=15;angle<=165;angle+=15){
        const rad=angle*Math.PI/180;
        candidates.push({x:p.x+Math.cos(rad)*(p.od/2+r),y:p.y+Math.sin(rad)*(p.od/2+r)});
      }
    }
    for(const c of candidates){
      if(c.x-r<4.9||c.x+r>bestWidth-4.9)continue;
      if(c.y+r>maxHeight)continue;
      let collide=false;
      for(const p of placed){if(Math.sqrt((c.x-p.x)**2+(c.y-p.y)**2)<(p.od/2+r-0.05)){collide=true;break}}
      if(collide)continue;
      // Check support
      let supported=c.y<=r+1;
      if(!supported)for(const p of placed){if(Math.sqrt((c.x-p.x)**2+(c.y-p.y)**2)<=(p.od/2+r)+1&&p.y<c.y){supported=true;break}}
      if(!supported)continue;
      if(c.y<bestY){bestY=c.y;bestPos=c}
    }
    if(bestPos)placed.push({...cable,x:bestPos.x,y:bestPos.y});
  }
  
  const maxStackH=placed.length?Math.max(...placed.map(p=>p.y+p.od/2)):0;
  const fillRatio=(totalArea/(bestWidth*maxHeight))*100;
  
  document.getElementById('trayResultWrap').innerHTML=`
    <span style="color:var(--green)">✓ 시뮬레이션 성공</span> | 
    노드: <span style="color:var(--cyan)">${targetNode}</span> (${dk.label}) | 
    Tray Type: <span style="color:var(--amber)">${nodeInfo?.type||dk.label}</span><br>
    통과 케이블: <span style="color:var(--cyan)">${cablesInNode.length}</span>가닥 | 
    Tray Width: <span style="color:var(--amber)">${bestWidth}mm</span> | 
    Stack Height: <span style="color:var(--data)">${Math.round(maxStackH)}mm</span> | 
    Fill: <span style="color:var(--cyan)">${fillRatio.toFixed(1)}%</span>
  `;
  
  // Render canvas
  renderTrayCanvas(placed,bestWidth,maxHeight);
  notify(`Tray 최적화 완료: ${cablesInNode.length}가닥, ${bestWidth}mm`,'success');
}

function renderTrayCanvas(placed,trayWidth,maxHeight){
  const canvas=document.getElementById('trayCanvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const rect=canvas.parentElement.getBoundingClientRect();
  const dpr=window.devicePixelRatio||1;
  canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;ctx.scale(dpr,dpr);
  const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);
  const PAD=30;
  const scale=Math.min((w-PAD*2)/trayWidth,(h-PAD*2)/(maxHeight+20));
  const ox=w/2-(trayWidth*scale)/2,oy=h-PAD;
  // Tray outline
  ctx.strokeStyle='#2960a0';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(ox,oy-maxHeight*scale);ctx.lineTo(ox,oy);ctx.lineTo(ox+trayWidth*scale,oy);ctx.lineTo(ox+trayWidth*scale,oy-maxHeight*scale);ctx.stroke();
  // Cables
  for(const c of placed){
    const cx=ox+c.x*scale,cy=oy-c.y*scale,r=Math.max(1,(c.od/2)*scale);
    const hash=(c.system||'').split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fillStyle=`hsl(${Math.abs(hash)%360},70%,50%)`;ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=0.5;ctx.stroke();
    if(r>8){ctx.fillStyle='#fff';ctx.font=`${Math.max(6,r*0.6)}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.od+'',cx,cy)}
  }
  // Info
  ctx.fillStyle='rgba(7,24,40,.8)';ctx.fillRect(ox,oy+4,200,20);
  ctx.font='10px Orbitron,monospace';ctx.fillStyle='#85bedd';ctx.textAlign='left';
  ctx.fillText(`${placed.length} cables | W:${trayWidth}mm | H:${maxHeight}mm`,ox+4,oy+16);
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
        <div class="panel" id="panel-nodes">
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
        <!-- TRAY PHYSICS -->
        <div class="panel" id="panel-tray">
          <div class="card"><div class="card-hdr"><div class="card-title">🔧 TRAY PHYSICS SOLVER</div>
            <div class="toolbar"><button class="btn btn-c" onclick="runTrayOptimization()">⚡ 최적화</button></div></div>
          <div class="card-body">
            <div class="sb-lbl" style="margin-bottom:6px">📋 전체 노드 리스트 (클릭하여 Fill 시뮬레이션)</div>
            <div id="trayNodeList" class="tray-node-list"><div style="color:var(--t3);font-size:11px;padding:8px">경로 산출 후 표시됩니다</div></div>
            <div class="row" style="margin-top:10px;margin-bottom:10px">
              <div class="fg"><div class="fl">Target Node</div><input class="fi" id="trayTargetNode" placeholder="노드 이름"></div>
              <div class="fg" style="max-width:100px"><div class="fl">Max H(mm)</div><input type="number" class="fi" id="trayMaxHeight" value="150"></div>
              <div class="fg" style="max-width:100px"><div class="fl">Fill(%)</div><input type="number" class="fi" id="trayTargetFill" value="40"></div>
            </div>
            <div id="trayResultWrap" style="background:var(--bg0);border:1px solid var(--border);border-radius:4px;padding:10px;color:var(--t3);font-size:11px">노드를 선택하거나 입력하세요</div>
            <div style="margin-top:10px;width:100%;border:1px solid var(--border);background:#0c131b;height:300px"><canvas id="trayCanvas" style="width:100%;height:100%;display:block"></canvas></div>
          </div></div>
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
