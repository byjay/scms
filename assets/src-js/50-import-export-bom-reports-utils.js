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
      AUTO_TRAY_WIDTH: metric?.autoRecommendedWidth || 0,
      TRAY_FILL_RATIO: metric?.fillRatio || 0,
      TRAY_TIERS: metric?.effectiveTierCount || 1,
      AUTO_TRAY_TIERS: metric?.autoRecommendedTierCount || 1,
      TRAY_MAX_HEIGHT: metric?.maxHeightLimit || 0,
      TRAY_FILL_LIMIT: metric?.fillRatioLimit || 0,
      TRAY_CAPACITY_AREA: metric?.trayCapacityArea || 0,
      DESIGN_WIDTH: metric?.designWidth || 0,
      OCCUPIED_WIDTH: metric?.occupiedWidth || 0,
      TRAY_OVERRIDE_WIDTH: metric?.overrideWidth || 0,
      TRAY_OVERRIDE_TIERS: metric?.overrideTierCount || 0,
      OVERRIDE_APPLIED: metric?.overrideApplied ? 'Y' : 'N',
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
