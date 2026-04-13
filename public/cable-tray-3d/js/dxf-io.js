/* ═══════════════════════════════════════════
   DXF Import / Export — Enhanced V2
   
   Import: LINE, POLYLINE, LWPOLYLINE, CIRCLE, ARC, TEXT, INSERT
   Export: 
     ★ Hexagonal node blocks (DECK_CODE top + NODE_NUM bottom)
     ★ Diamond junction markers
     ★ Proper layers: CABLE_TRAY, CONNECTION, NODE_LABELS, JUNCTIONS, NODE_HEXAGON
     ★ AutoCAD R12 compatible DXF with BLOCKS section
   ═══════════════════════════════════════════ */
const DxfIO = {
  // ─── PARSE DXF TEXT → lines array ───
  parse(text) {
    const lines = [];
    const texts = []; // {x,y,z,text,height}
    const circles = []; // {cx,cy,cz,r}
    const dxfLines = text.split(/\r?\n/);
    let i = 0;
    const next = () => i < dxfLines.length ? dxfLines[i++].trim() : null;
    const peek = () => i < dxfLines.length ? dxfLines[i].trim() : null;

    // Find ENTITIES section
    while (i < dxfLines.length) {
      const code = next();
      const val = next();
      if (code === '2' && val === 'ENTITIES') break;
    }

    // Parse entities
    while (i < dxfLines.length) {
      const code = next();
      const val = next();
      if (code === '0' && val === 'ENDSEC') break;

      if (code === '0' && val === 'LINE') {
        let x1 = 0, y1 = 0, z1 = 0, x2 = 0, y2 = 0, z2 = 0, color = '#8888ff';
        while (i < dxfLines.length) {
          if (peek() === '0') break;
          const c = next(), v = next();
          if (c === '10') x1 = parseFloat(v);
          else if (c === '20') y1 = parseFloat(v);
          else if (c === '30') z1 = parseFloat(v);
          else if (c === '11') x2 = parseFloat(v);
          else if (c === '21') y2 = parseFloat(v);
          else if (c === '31') z2 = parseFloat(v);
          else if (c === '62') color = this._aciColor(parseInt(v));
        }
        lines.push({ start: { x: x1, y: z1, z: y1 }, end: { x: x2, y: z2, z: y2 }, color });
      }
      else if (code === '0' && (val === 'LWPOLYLINE' || val === 'POLYLINE')) {
        const pts = [];
        let color = '#8888ff', elevation = 0, closed = false;
        while (i < dxfLines.length) {
          if (peek() === '0') {
            const nextVal = dxfLines[i + 1]?.trim();
            if (nextVal === 'VERTEX') { next(); next(); continue; }
            if (nextVal !== 'VERTEX') break;
          }
          const c = next(), v = next();
          if (c === '10') { pts.push({ x: parseFloat(v), y: 0, z: 0 }); }
          else if (c === '20' && pts.length > 0) pts[pts.length - 1].z = parseFloat(v);
          else if (c === '30' && pts.length > 0) pts[pts.length - 1].y = parseFloat(v);
          else if (c === '38') elevation = parseFloat(v);
          else if (c === '62') color = this._aciColor(parseInt(v));
          else if (c === '70') closed = (parseInt(v) & 1) === 1;
        }
        pts.forEach(p => { if (p.y === 0) p.y = elevation; });
        for (let j = 0; j < pts.length - 1; j++) {
          lines.push({ start: pts[j], end: pts[j + 1], color });
        }
        if (closed && pts.length > 2) {
          lines.push({ start: pts[pts.length - 1], end: pts[0], color });
        }
        if (peek() === '0') { const cn = next(); const vn = next(); }
      }
      else if (code === '0' && val === 'CIRCLE') {
        let cx = 0, cy = 0, cz = 0, r = 0, color = '#8888ff';
        while (i < dxfLines.length) {
          if (peek() === '0') break;
          const c = next(), v = next();
          if (c === '10') cx = parseFloat(v);
          else if (c === '20') cy = parseFloat(v);
          else if (c === '30') cz = parseFloat(v);
          else if (c === '40') r = parseFloat(v);
          else if (c === '62') color = this._aciColor(parseInt(v));
        }
        // Approximate circle as 16-segment polygon
        const segs = 16;
        for (let s = 0; s < segs; s++) {
          const a1 = (Math.PI * 2 / segs) * s;
          const a2 = (Math.PI * 2 / segs) * (s + 1);
          lines.push({
            start: { x: cx + r * Math.cos(a1), y: cz, z: cy + r * Math.sin(a1) },
            end: { x: cx + r * Math.cos(a2), y: cz, z: cy + r * Math.sin(a2) },
            color
          });
        }
      }
      else if (code === '0' && val === 'ARC') {
        let cx = 0, cy = 0, cz = 0, r = 0, sa = 0, ea = 360, color = '#8888ff';
        while (i < dxfLines.length) {
          if (peek() === '0') break;
          const c = next(), v = next();
          if (c === '10') cx = parseFloat(v);
          else if (c === '20') cy = parseFloat(v);
          else if (c === '30') cz = parseFloat(v);
          else if (c === '40') r = parseFloat(v);
          else if (c === '50') sa = parseFloat(v);
          else if (c === '51') ea = parseFloat(v);
          else if (c === '62') color = this._aciColor(parseInt(v));
        }
        const segs = 16;
        const saRad = sa * Math.PI / 180;
        let eaRad = ea * Math.PI / 180;
        if (eaRad <= saRad) eaRad += Math.PI * 2;
        const step = (eaRad - saRad) / segs;
        for (let s = 0; s < segs; s++) {
          const a1 = saRad + step * s;
          const a2 = saRad + step * (s + 1);
          lines.push({
            start: { x: cx + r * Math.cos(a1), y: cz, z: cy + r * Math.sin(a1) },
            end: { x: cx + r * Math.cos(a2), y: cz, z: cy + r * Math.sin(a2) },
            color
          });
        }
      }
      else if (code === '0' && val === 'TEXT') {
        let x = 0, y = 0, z = 0, height = 100, txt = '';
        while (i < dxfLines.length) {
          if (peek() === '0') break;
          const c = next(), v = next();
          if (c === '10') x = parseFloat(v);
          else if (c === '20') y = parseFloat(v);
          else if (c === '30') z = parseFloat(v);
          else if (c === '40') height = parseFloat(v);
          else if (c === '1') txt = v;
        }
        texts.push({ x, y: z, z: y, text: txt, height });
      }
    }
    console.log(`[DXF] Parsed ${lines.length} line segments, ${texts.length} texts`);
    return lines;
  },

  _aciColor(aci) {
    const colors = { 1: '#ff0000', 2: '#ffff00', 3: '#00ff00', 4: '#00ffff', 5: '#0000ff', 6: '#ff00ff', 7: '#ffffff', 8: '#808080', 9: '#c0c0c0', 10: '#ff7f00', 30: '#ff7f3f', 40: '#ff9f00', 50: '#ffcf00', 140: '#007f00', 150: '#009f00', 170: '#007fff', 200: '#9f00ff', 250: '#3f3f3f' };
    return colors[aci] || '#8888ff';
  },

  // ═══ EXPORT nodes → DXF text (Enhanced with BLOCKS) ═══
  // Generates proper AutoCAD R12 DXF with:
  // - BLOCKS section defining HEX_NODE and DIAMOND_JUNCTION block templates
  // - Layer definitions: CABLE_TRAY, CONNECTION, NODE_HEXAGON, NODE_LABELS, JUNCTIONS
  // - Hexagonal node symbols with DECK CODE / NODE NUMBER text
  // - Diamond markers at junction points
  exportDxf(nodes, edges) {
    let dxf = '';
    
    // ─── HEADER ───
    dxf += '0\nSECTION\n2\nHEADER\n';
    dxf += '9\n$ACADVER\n1\nAC1009\n'; // AutoCAD R12
    dxf += '9\n$INSBASE\n10\n0.0\n20\n0.0\n30\n0.0\n';
    dxf += '9\n$EXTMIN\n10\n-100000.0\n20\n-100000.0\n30\n-100000.0\n';
    dxf += '9\n$EXTMAX\n10\n100000.0\n20\n100000.0\n30\n100000.0\n';
    dxf += '0\nENDSEC\n';

    // ─── TABLES ───
    dxf += '0\nSECTION\n2\nTABLES\n';
    
    // Layer table
    dxf += '0\nTABLE\n2\nLAYER\n70\n6\n';
    const layers = [
      { name: 'CABLE_TRAY', color: 3 },     // green
      { name: 'CONNECTION', color: 5 },       // blue
      { name: 'NODE_HEXAGON', color: 2 },     // yellow
      { name: 'NODE_LABELS', color: 7 },      // white
      { name: 'JUNCTIONS', color: 40 },       // orange
      { name: 'FILL_INFO', color: 4 },        // cyan
    ];
    layers.forEach(l => {
      dxf += `0\nLAYER\n2\n${l.name}\n70\n0\n62\n${l.color}\n6\nCONTINUOUS\n`;
    });
    dxf += '0\nENDTAB\n';
    dxf += '0\nENDSEC\n';

    // ─── BLOCKS ───
    dxf += '0\nSECTION\n2\nBLOCKS\n';
    
    // HEX_NODE block: 6-sided polygon for node markers
    dxf += '0\nBLOCK\n8\n0\n2\nHEX_NODE\n70\n0\n10\n0.0\n20\n0.0\n30\n0.0\n';
    const hexR = 150; // 150mm radius in world coords
    for (let seg = 0; seg < 6; seg++) {
      const a1 = Math.PI / 6 + (Math.PI / 3) * seg;
      const a2 = Math.PI / 6 + (Math.PI / 3) * ((seg + 1) % 6);
      dxf += '0\nLINE\n8\nNODE_HEXAGON\n62\n2\n';
      dxf += `10\n${(hexR * Math.cos(a1)).toFixed(2)}\n20\n${(hexR * Math.sin(a1)).toFixed(2)}\n30\n0.0\n`;
      dxf += `11\n${(hexR * Math.cos(a2)).toFixed(2)}\n21\n${(hexR * Math.sin(a2)).toFixed(2)}\n31\n0.0\n`;
    }
    // Middle divider line
    const midLx = -hexR * Math.cos(Math.PI / 6);
    const midRx = hexR * Math.cos(Math.PI / 6);
    dxf += '0\nLINE\n8\nNODE_HEXAGON\n62\n2\n';
    dxf += `10\n${midLx.toFixed(2)}\n20\n0.0\n30\n0.0\n`;
    dxf += `11\n${midRx.toFixed(2)}\n21\n0.0\n30\n0.0\n`;
    dxf += '0\nENDBLK\n';

    // DIAMOND_JUNCTION block
    dxf += '0\nBLOCK\n8\n0\n2\nDIAMOND_JUNCTION\n70\n0\n10\n0.0\n20\n0.0\n30\n0.0\n';
    const diaR = 80;
    const diaVerts = [[0, -diaR], [diaR, 0], [0, diaR], [-diaR, 0]];
    for (let d = 0; d < 4; d++) {
      const d2 = (d + 1) % 4;
      dxf += '0\nLINE\n8\nJUNCTIONS\n62\n40\n';
      dxf += `10\n${diaVerts[d][0].toFixed(2)}\n20\n${diaVerts[d][1].toFixed(2)}\n30\n0.0\n`;
      dxf += `11\n${diaVerts[d2][0].toFixed(2)}\n21\n${diaVerts[d2][1].toFixed(2)}\n31\n0.0\n`;
    }
    dxf += '0\nENDBLK\n';

    dxf += '0\nENDSEC\n';

    // ─── ENTITIES ───
    dxf += '0\nSECTION\n2\nENTITIES\n';

    // Draw tray segments as LINEs on CABLE_TRAY layer
    nodes.forEach(n => {
      if (n.start && n.end) {
        dxf += '0\nLINE\n8\nCABLE_TRAY\n';
        dxf += `62\n${n.type === 'HOLE' ? 1 : 3}\n`;
        dxf += `10\n${n.start.x.toFixed(2)}\n20\n${n.start.z.toFixed(2)}\n30\n${n.start.y.toFixed(2)}\n`;
        dxf += `11\n${n.end.x.toFixed(2)}\n21\n${n.end.z.toFixed(2)}\n31\n${n.end.y.toFixed(2)}\n`;
      }
    });

    // Draw connection edges on CONNECTION layer
    edges.forEach(e => {
      const nA = nodes.find(n => n.id === e.fromId);
      const nB = nodes.find(n => n.id === e.toId);
      if (!nA || !nB) return;
      const pA = nA.end || nA.start, pB = nB.start;
      if (!pA || !pB) return;
      dxf += '0\nLINE\n8\nCONNECTION\n62\n5\n';
      dxf += `10\n${pA.x.toFixed(2)}\n20\n${pA.z.toFixed(2)}\n30\n${pA.y.toFixed(2)}\n`;
      dxf += `11\n${pB.x.toFixed(2)}\n21\n${pB.z.toFixed(2)}\n31\n${pB.y.toFixed(2)}\n`;
    });

    // Draw hexagonal node markers as INSERT (block references) + labels
    const idParts = (id) => {
      const m = id.match(/^([A-Za-z]+)(.*)$/);
      return m ? { deck: m[1], num: m[2] || '?' } : { deck: id.substring(0, 2), num: id.substring(2) };
    };

    nodes.forEach(n => {
      if (!n.start) return;
      const sx = n.start.x, sy = n.start.z, sz = n.start.y;

      // Insert HEX_NODE block (or draw hexagon inline for better compatibility)
      // Drawing inline hexagon for maximum compatibility
      const hr = 150;
      for (let seg = 0; seg < 6; seg++) {
        const a1 = Math.PI / 6 + (Math.PI / 3) * seg;
        const a2 = Math.PI / 6 + (Math.PI / 3) * ((seg + 1) % 6);
        dxf += '0\nLINE\n8\nNODE_HEXAGON\n62\n2\n';
        dxf += `10\n${(sx + hr * Math.cos(a1)).toFixed(2)}\n20\n${(sy + hr * Math.sin(a1)).toFixed(2)}\n30\n${sz.toFixed(2)}\n`;
        dxf += `11\n${(sx + hr * Math.cos(a2)).toFixed(2)}\n21\n${(sy + hr * Math.sin(a2)).toFixed(2)}\n31\n${sz.toFixed(2)}\n`;
      }
      // Middle divider
      const mlx = -hr * Math.cos(Math.PI / 6);
      const mrx = hr * Math.cos(Math.PI / 6);
      dxf += '0\nLINE\n8\nNODE_HEXAGON\n62\n2\n';
      dxf += `10\n${(sx + mlx).toFixed(2)}\n20\n${sy.toFixed(2)}\n30\n${sz.toFixed(2)}\n`;
      dxf += `11\n${(sx + mrx).toFixed(2)}\n21\n${sy.toFixed(2)}\n30\n${sz.toFixed(2)}\n`;

      // DECK CODE text (upper half)
      const parts = idParts(n.id);
      dxf += '0\nTEXT\n8\nNODE_LABELS\n62\n2\n';
      dxf += `10\n${sx.toFixed(2)}\n20\n${(sy + 40).toFixed(2)}\n30\n${(sz + 1).toFixed(2)}\n`;
      dxf += `40\n80\n72\n1\n11\n${sx.toFixed(2)}\n21\n${(sy + 40).toFixed(2)}\n31\n${(sz + 1).toFixed(2)}\n`;
      dxf += `1\n${parts.deck}\n`;

      // NODE NUMBER text (lower half)
      dxf += '0\nTEXT\n8\nNODE_LABELS\n62\n7\n';
      dxf += `10\n${sx.toFixed(2)}\n20\n${(sy - 40).toFixed(2)}\n30\n${(sz + 1).toFixed(2)}\n`;
      dxf += `40\n70\n72\n1\n11\n${sx.toFixed(2)}\n21\n${(sy - 40).toFixed(2)}\n31\n${(sz + 1).toFixed(2)}\n`;
      dxf += `1\n${parts.num}\n`;
    });

    // Draw junction diamond markers
    // Calculate junctions
    const pointMap = new Map();
    const pointCoords = new Map();
    nodes.forEach(n => {
      for (const pt of [n.start, n.end]) {
        if (!pt) continue;
        const key = `${Math.round(pt.x)},${Math.round(pt.y)},${Math.round(pt.z)}`;
        pointMap.set(key, (pointMap.get(key) || 0) + 1);
        pointCoords.set(key, pt);
      }
    });

    pointMap.forEach((count, key) => {
      if (count >= 2) {
        const pt = pointCoords.get(key);
        if (!pt) return;
        const jx = pt.x, jy = pt.z, jz = pt.y;
        const dr = 80;
        const dverts = [[0, -dr], [dr, 0], [0, dr], [-dr, 0]];
        for (let d = 0; d < 4; d++) {
          const d2 = (d + 1) % 4;
          dxf += '0\nLINE\n8\nJUNCTIONS\n62\n40\n';
          dxf += `10\n${(jx + dverts[d][0]).toFixed(2)}\n20\n${(jy + dverts[d][1]).toFixed(2)}\n30\n${jz.toFixed(2)}\n`;
          dxf += `11\n${(jx + dverts[d2][0]).toFixed(2)}\n21\n${(jy + dverts[d2][1]).toFixed(2)}\n31\n${jz.toFixed(2)}\n`;
        }
      }
    });

    dxf += '0\nENDSEC\n0\nEOF\n';
    return dxf;
  },

  // ─── EXPORT nodes → Excel XLSX (ArrayBuffer) ───
  exportExcel(nodes, edges) {
    const relMap = new Map();
    nodes.forEach(n => relMap.set(n.id, new Set()));
    edges.forEach(e => {
      if (relMap.has(e.fromId)) relMap.get(e.fromId).add(e.toId);
      if (relMap.has(e.toId)) relMap.get(e.toId).add(e.fromId);
    });
    nodes.forEach(n => { if (n.relations) n.relations.forEach(r => { if (relMap.has(n.id)) relMap.get(n.id).add(r); }); });

    const rows = nodes.map(n => {
      let pointStr = '';
      if (n.start && n.end) {
        pointStr = `S : ${n.start.x.toFixed(1)},${n.start.y.toFixed(1)},${n.start.z.toFixed(1)} E : ${n.end.x.toFixed(1)},${n.end.y.toFixed(1)},${n.end.z.toFixed(1)}`;
      } else if (n.start) {
        pointStr = `${n.start.x.toFixed(1)},${n.start.y.toFixed(1)},${n.start.z.toFixed(1)}`;
      }
      return {
        NODE_RNAME: n.id,
        COMPONENT: n.component || '',
        NODE_TYPE: n.type === 'TRAY' ? 'Tray' : n.type === 'HOLE' ? 'Hole' : 'Other',
        RELATION: [...(relMap.get(n.id) || [])].join(','),
        LINK_LENGTH: n.length || 0,
        AREA_SIZE: n.area || 0,
        MAX_CABLE: n.maxCable || 100,
        POINT: pointStr
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  }
};
