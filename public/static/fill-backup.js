// ---- FILL SOLVER BACKUP (2026-03-10) ----
// 기존 Fill 기능 백업 - 문제 발생 시 복원용

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
}

// ---- 백업 종료 ----
