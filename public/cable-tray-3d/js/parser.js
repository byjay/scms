/* ═══════════════════════════════════════════
   Excel Parser
   ═══════════════════════════════════════════ */
const ExcelParser={
  parsePoint(str){if(str==null)return null;const c=String(str).trim();if(!c)return null;const p=c.split(',').map(s=>parseFloat(s.trim()));if(p.length>=3&&p.every(n=>isFinite(n)))return{x:p[0],y:p[1],z:p[2]};return null},
  parsePointField(v){if(v==null)return{start:null,end:null};const s=String(v).trim();if(!s)return{start:null,end:null};
    if(s.includes('S :')&&s.includes('E :')){const p=s.split('E :');return{start:this.parsePoint(p[0].replace('S :','').trim()),end:this.parsePoint(p[1].trim())}}
    return{start:this.parsePoint(s),end:null}},
  parseRelations(v){if(!v)return[];return String(v).split(',').map(s=>s.trim()).filter(s=>s.length>0)},
  parseWorkbook(ab){
    const wb=XLSX.read(ab);const sn=wb.SheetNames[0];const sh=wb.Sheets[sn];const rows=XLSX.utils.sheet_to_json(sh);
    if(rows.length===0)return{nodes:[],stats:{total:0,trays:0,holes:0,edges:0}};
    const fr=rows[0];const gc=cs=>{for(const c of cs)if(fr.hasOwnProperty(c))return c;return null};
    const cId=gc(['NODE_RNAME','Name','name','ID','id']),cTy=gc(['NODE_TYPE','Type','type']),cRel=gc(['RELATION','Relation','relation','CONNECTIONS']),
      cLen=gc(['LINK_LENGTH','Length','length']),cPt=gc(['POINT','Point','point']),cArea=gc(['AREA_SIZE','Area','area']),
      cComp=gc(['COMPONENT','Component','component']),cMax=gc(['MAX_CABLE','Max_Cable','max_cable']);
    const nodes=[];const idSet=new Set();
    rows.forEach((row,idx)=>{
      const id=cId?String(row[cId]||'').trim():`Node_${idx}`;if(!id||idSet.has(id))return;idSet.add(id);
      const tr=cTy?String(row[cTy]||'').toUpperCase():'OTHER';let type='OTHER';if(tr.includes('TRAY'))type='TRAY';else if(tr.includes('HOLE'))type='HOLE';
      const{start,end}=this.parsePointField(cPt?row[cPt]:null);const relations=this.parseRelations(cRel?row[cRel]:null);
      const length=cLen?parseFloat(row[cLen])||0:0;const area=cArea?parseFloat(row[cArea])||0:0;
      const component=cComp?String(row[cComp]||''):'';const maxCable=cMax?parseInt(row[cMax])||100:100;
      if(!start)return;
      nodes.push({id,type,start,end,relations,length,area,component,maxCable});
    });
    let edgeCount=0;const ns=new Set(nodes.map(n=>n.id));nodes.forEach(n=>n.relations.forEach(r=>{if(ns.has(r))edgeCount++}));
    return{nodes,stats:{total:nodes.length,trays:nodes.filter(n=>n.type==='TRAY').length,holes:nodes.filter(n=>n.type==='HOLE').length,edges:edgeCount}};
  }
};
