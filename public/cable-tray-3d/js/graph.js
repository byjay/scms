/* ═══════════════════════════════════════════
   Graph — Dijkstra path finding
   ═══════════════════════════════════════════ */
class CableGraph{
  constructor(nodes){this.nodeMap=new Map();this.adjacency=new Map();this.build(nodes)}
  build(nodes){
    this.nodeMap.clear();this.adjacency.clear();
    nodes.forEach(n=>{this.nodeMap.set(n.id,n);this.adjacency.set(n.id,[])});
    const es=new Set();
    nodes.forEach(node=>{if(!node.relations)return;node.relations.forEach(rid=>{if(!this.nodeMap.has(rid))return;
      const ek=`${node.id}|${rid}`;if(es.has(ek))return;es.add(ek);es.add(`${rid}|${node.id}`);
      const w=this.calcEdgeWeight(node,this.nodeMap.get(rid));
      this.adjacency.get(node.id).push({id:rid,weight:w});this.adjacency.get(rid).push({id:node.id,weight:w})})});
    // spatial close
    const eps=[];nodes.forEach(n=>{if(n.start)eps.push({nid:n.id,p:n.start});if(n.end)eps.push({nid:n.id,p:n.end})});
    const C=10,sh=new Map();eps.forEach(e=>{const k=`${Math.round(e.p.x/C)},${Math.round(e.p.y/C)},${Math.round(e.p.z/C)}`;if(!sh.has(k))sh.set(k,[]);sh.get(k).push(e)});
    sh.forEach((list,key)=>{const[cx,cy,cz]=key.split(',').map(Number);
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){
        const nb=sh.get(`${cx+dx},${cy+dy},${cz+dz}`);if(!nb)continue;
        list.forEach(a=>{nb.forEach(b=>{if(a.nid===b.nid)return;
          const d=Math.sqrt((a.p.x-b.p.x)**2+(a.p.y-b.p.y)**2+(a.p.z-b.p.z)**2);
          if(d<5){const ek=`${a.nid}|${b.nid}`;if(!es.has(ek)){es.add(ek);es.add(`${b.nid}|${a.nid}`);
            const w=this.calcEdgeWeight(this.nodeMap.get(a.nid),this.nodeMap.get(b.nid));
            this.adjacency.get(a.nid).push({id:b.nid,weight:w});this.adjacency.get(b.nid).push({id:a.nid,weight:w})}}
        })})}});
  }
  calcEdgeWeight(a,b){const la=a.length||0,lb=b.length||0;if(la>0&&lb>0)return(la+lb)/2;if(la>0)return la;if(lb>0)return lb;return this.minDist(a,b)/1000||0.1}
  minDist(a,b){let m=Infinity;[a.start,a.end].filter(Boolean).forEach(pa=>{[b.start,b.end].filter(Boolean).forEach(pb=>{const d=Math.sqrt((pa.x-pb.x)**2+(pa.y-pb.y)**2+(pa.z-pb.z)**2);if(d<m)m=d})});return m===Infinity?0:m}
  findPath(sId,eId){
    if(!sId||!eId||!this.nodeMap.has(sId)||!this.nodeMap.has(eId))return{path:[],totalLength:0,edgeWeights:[]};
    if(sId===eId)return{path:[this.nodeMap.get(sId)],totalLength:0,edgeWeights:[]};
    const dist=new Map(),prev=new Map(),vis=new Set();
    this.adjacency.forEach((_,id)=>dist.set(id,Infinity));dist.set(sId,0);
    const q=[{id:sId,dist:0}];
    while(q.length>0){let mi=0;for(let i=1;i<q.length;i++)if(q[i].dist<q[mi].dist)mi=i;
      const{id:cur,dist:cd}=q.splice(mi,1)[0];if(vis.has(cur))continue;vis.add(cur);if(cur===eId)break;
      const nb=this.adjacency.get(cur);if(!nb)continue;
      for(const n of nb){if(vis.has(n.id))continue;const alt=cd+n.weight;if(alt<dist.get(n.id)){dist.set(n.id,alt);prev.set(n.id,cur);q.push({id:n.id,dist:alt})}}}
    if(!prev.has(eId)&&sId!==eId)return{path:[],totalLength:0,edgeWeights:[]};
    const pIds=[];let c=eId;while(c!==undefined){pIds.unshift(c);if(c===sId)break;c=prev.get(c)}
    if(pIds[0]!==sId)return{path:[],totalLength:0,edgeWeights:[]};
    const pathNodes=pIds.map(id=>this.nodeMap.get(id)).filter(Boolean);
    const ew=[];for(let i=0;i<pIds.length-1;i++){const nb=this.adjacency.get(pIds[i])||[];const e=nb.find(n=>n.id===pIds[i+1]);ew.push(e?e.weight:0)}
    return{path:pathNodes,totalLength:dist.get(eId)||0,edgeWeights:ew};
  }
  getAllIds(){return[...this.nodeMap.keys()]}
}
