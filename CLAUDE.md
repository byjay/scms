# SCMS_V0 — AI 인계 문서 (반드시 먼저 읽을 것)

> 이 파일은 모든 작업 내역, 파일 구조, 버그/픽스, 미완성 항목을 기록한다.
> **새로운 AI 세션이 시작되면 이 파일부터 읽고 작업을 이어받아야 한다.**

---

## 📁 프로젝트 개요

**SCMS (Ship Cable Management System)** — 선박 케이블 관리 시스템
- 케이블 라우팅 (Dijkstra 최단경로), 노드 그래프, BOM, 보고서 생성
- Cloudflare Workers 기반 인증 (Kakao/Naver OAuth + Local Login)
- 프론트엔드 순수 JS (no framework), IndexedDB v2, Virtual Scroll

**프로젝트 경로**: `E:\code-project\calble\SCMS_V0\`

---

## 📂 핵심 파일 구조

```
index.html                              ← 메인 HTML (단일 페이지)
assets/
  seastar-v0.css                        ← 기본 CSS (다크 글라스모픽 테마)
  seastar-v0-extra.css                  ← 추가/수정 CSS (오버라이드는 여기에)
  seastar-v0.js                         ← 레거시 통합 JS (읽기 전용 참고)
  src-js/                               ← 모듈화된 JS 파일들 (실제 편집 대상)
    00-bootstrap-core.js                ← DOM 바인딩, 드롭다운 메뉴, 이벤트
    10-routing-engine.js                ← Dijkstra 라우팅, handleDataFile
    20-cable-dashboard.js               ← 케이블 그리드/리스트 렌더링, virtual scroll
    30-nodes-and-maps.js                ← 노드 패널, 3D 지도
    35-version-history.js               ← 버전 히스토리, diff, updateUploadPanelStatus
    40-auth-project-foundation.js       ← IndexedDB v2, autoRestoreCurrentShip
    50-import-export-bom-reports-utils.js ← 엑셀 파싱, BOM, 내보내기
    60-auth-groupspace-final.js         ← 인증, 호선 관리, renderAll (최종 오버라이드)
backend/
  auth-worker.js                        ← Cloudflare Workers (OAuth, KV Store)
  wrangler.toml                         ← Cloudflare 배포 설정
CLAUDE.md                               ← 이 파일 (AI 인계 문서)
```

---

## ⚙️ 기술 스택 & 아키텍처

| 항목 | 내용 |
|------|------|
| 프론트 | 순수 JS ES6+, 모듈 없음, 브라우저 직접 로드 |
| 저장소 | IndexedDB v2 (`ship_projects` + `ship_versions` 스토어) |
| 라우팅 | Dijkstra + MinHeap, 캐시, checkNode 지원 |
| 렌더링 | Virtual Scroll (ROW_HEIGHT=24px, position:absolute) |
| 인증 | Cloudflare Workers KV + Kakao/Naver OAuth + Local |
| 배포 | `npx wrangler deploy` (백엔드), 정적 서빙 (프론트) |

---

## ✅ 완료된 작업 이력

### [2026-03-30] 라우팅 엔진 수정
**문제**: `recalculateAllCables()`가 케이블 2401번에서 항상 멈춤 (hideBusy 미실행)
**원인**: try/catch 없어 예외 발생 시 finally 없이 종료
**수정 파일**: `10-routing-engine.js`
```javascript
// try/finally로 hideBusy 보장 + 케이블별 try/catch
try {
  for (let index = 0; index < state.cables.length; index++) {
    try { applyRouteToCable(cable); }
    catch (cableErr) { /* 오류 케이블 건너뜀 */ }
    if (index % 50 === 0) await pause();
  }
} finally { hideBusy(); }
```

### [2026-03-30] 드롭다운 메뉴 수정
**문제**: 파일▾, 서버▾, 편집▾, 실행▾ 버튼이 눌리지 않음
**원인**: `.topbar-cmdbar { overflow-y: hidden }` 이 `position: absolute` 패널을 클리핑
**수정**:
- `.mb-panel { position: fixed; z-index: 9200 }` + JS에서 `getBoundingClientRect()` 좌표 계산
- `.topbar { z-index: 8900 !important }`
- **파일**: `00-bootstrap-core.js`, `seastar-v0-extra.css`

### [2026-03-30] 업로드 패널 → 드롭다운 통합
**문제**: 케이블/노드 업로드 패널이 메인 화면 상단을 차지해 공간 낭비
**수정**:
- `<div class="upload-panel">` 제거 (index.html)
- 파일▾ 메뉴에 케이블/노드 상태 (`#cableUploadStatus`, `#nodeUploadStatus`) 추가
- 버전 히스토리 버튼 → 파일▾ 메뉴로 이동
- 토바에 `#topbarDataStatus` 배지 추가 (케이블N/노드N 표시)
- `updateUploadPanelStatus()` → 드롭다운 + 토바 배지 업데이트 (35-version-history.js)
- 실행▾ > `⚡ 전체 라우팅 실행` (mb-action-primary 파란 강조 버튼)

### [2026-03-30] 호선 변경 시 데이터 초기화
**문제**: 호선 변경 시 이전 호선 케이블 데이터가 남아있음
**수정**: `confirmShipSelect()` in `60-auth-groupspace-final.js`
```javascript
state.cables = [];
state.uploadedNodes = [];
state.selectedCableId = null;
refreshGraph(); renderAll(); updateUploadPanelStatus();
autoRestoreCurrentShip(); // 새 호선 데이터 복원 시도
```

### [2026-03-30] 버전 히스토리 (Git-like)
**파일**: `35-version-history.js` (신규 생성)
- IndexedDB `ship_versions` 스토어 (autoIncrement keyPath)
- `saveShipVersion(shipId, label, snapshot)` — 최대 30버전 유지
- `diffCables(old, new)` / `diffNodes(old, new)` — Map 기반 O(n) diff
- `showDiffModal(diff, fileName, kind)` — Promise 기반 (save-and-load/load/cancel)
- `openVersionHistoryModal()` — 버전 목록, 복원, 삭제

### [2026-03-30] IndexedDB v2 통합
**파일**: `40-auth-project-foundation.js`
- `openScmsDB()` v1→v2 업그레이드 (ship_projects + ship_versions 동시 생성)
- `onblocked` 핸들러 추가 (브라우저 탭 충돌 방지)

### [2026-03-30] Kakao 로그인 이름 수정
**문제**: `kakao_4820795161` 형식으로 표시됨
**수정**: `backend/auth-worker.js` — OAuth scope에 `profile_nickname` 추가

### [2026-03-30] 성능 최적화
- `history.limit: 50 → 10` (메모리 187MB→37MB)
- BUG-006: `state.nodeMap` → `state.graph?.nodeMap?.[nodeName]`
- BUG-018: diff 필드명 `cableName→name`, `cableType→type`
- `renderAll()` 중복 호출 제거

---

### [2026-03-30] 🔤 Cable List 헤더 타이틀 표시 수정
**문제**: Cable List 탭 상단 헤더 셀이 화면에 보이지 않음
**원인**: `renderCableListHeader()`에서 `class="grid-head-cell"` 사용하는데
CSS에는 `.grid-header-cell`만 정의되어 있어 스타일이 적용되지 않음
**수정 파일**: `seastar-v0-extra.css`
```css
/* 신규 추가 */
.grid-head-cell {
  position: relative;
  color: #94a3b8; font-size: 9.5px; font-weight: 700;
  display: flex; align-items: center;
  background: rgba(15,23,42,0.6);
  border-right: 1px solid rgba(148,163,184,0.15);
  user-select: none;
}
```

### [2026-03-30] 🔗 PATH + CALC_PATH → CABLE_PATH 단일 컬럼 통합
**문제**: Cable List에 PATH(업로드 원본)와 CALC_PATH(계산값) 두 컬럼이 분리되어 혼란
**요구**: 업로드 양식 컬럼명 `CABLE_PATH`와 동일하게 통일
**수정 파일**: `20-cable-dashboard.js`
```javascript
// CABLE_LIST_COLUMNS 변경
// 제거: { key: 'path', label: 'PATH' }, { key: 'calculatedPath', label: 'CALC_PATH' }
// 추가: { key: '_cablePath', label: 'CABLE_PATH', width: 200, className: 'path-cell' }

// 행 렌더링 — 계산값 우선, 없으면 원본 업로드값
if (col.key === '_cablePath') {
  const v = cable.calculatedPath || cable.path;
  text = v == null || v === '' ? '-' : String(v);
}
```

### [2026-03-30] ↔️ 컬럼 드래그 리사이즈 기능 추가
**수정 파일**: `20-cable-dashboard.js`, `seastar-v0-extra.css`
**구현**:
- `cableListColWidths[]` — CABLE_LIST_COLUMNS 너비 가변 배열
- `getCableListTemplate()` — 현재 너비로 CSS grid template 생성
- `initCableListResizeHandles(header)` — 마우스 드래그로 컬럼 너비 조절
- 드래그 중 헤더 + 모든 가시 행 즉시 업데이트
- `.cl-resize-handle` — 각 헤더 우측 6px 드래그 영역 (hover시 파란색)
- `body.cl-resizing *` — 드래그 중 전역 커서/선택 잠금
```
컬럼 헤더 우측 끝을 마우스로 드래그 → 너비 실시간 조절
```

---

## ✅ 이전 세션 완료 항목 [2026-03-30 세션 2]

### Cable List + Schedule 통합 ✅
- **Cable List 서브탭 제거** → Schedule + Node List 2개 탭으로 단순화
- GRID_COLUMNS에서 `path`+`calculatedPath` → `_cablePath` 단일 컬럼 통합
- `graphLength` 제거, `drumNo` 추가
- Schedule 그리드 헤더에 **컬럼 리사이즈 핸들** 추가 (드래그로 너비 조절)
- `gridColWidths[]` 동적 배열 + `getGridTemplate()` 함수

### 라우팅 에러 처리 ✅
- `recalculateAllCables()` — try/catch/finally 추가 (UI 프리즈 방지)
- 케이블별 개별 try/catch → 에러 시 해당 케이블 건너뛰고 상세 로그 출력
- 에러 건수 toast 알림 표시

### renderAll() → Node List 자동 렌더 ✅
- Node List 서브탭 활성 시 `renderNodeListTab()` 자동 호출

### 엑셀 내보내기 트레이 데이터 보강 ✅
- Node 시트에 AUTO_TRAY_WIDTH, AUTO_TRAY_TIERS, TRAY_MAX_HEIGHT, TRAY_FILL_LIMIT,
  TRAY_CAPACITY_AREA, DESIGN_WIDTH, OCCUPIED_WIDTH, OVERRIDE_APPLIED 추가

### Naver OAuth 등록 플로우 ✅ (이전 세션에서 이미 완료)
- 모달/백엔드/CSS 모두 구현 완료 확인
- 모달 텍스트 이미 "소셜 로그인" 범용으로 되어있음

---

## ✅ [2026-03-31] 버그 일괄 수정 + 카카오 로그인 연동

### BUG-002 fix: `consumeAuthQueryParams` 중복 제거 ✅
- 00-bootstrap-core.js, 40-auth-project-foundation.js → 주석 대체
- 60-auth-groupspace-final.js 내부 2중 정의 → 첫 번째 제거, 942줄 최종본만 유지
- 메시지: '소셜 로그인이 완료되었습니다.' (범용)

### BUG-003 fix: `initLoginNetworkCanvas` 중복 제거 ✅
- 00-bootstrap-core.js (170줄 캔버스 애니메이션 코드) 제거
- 60-auth-groupspace-final.js 최종본만 유지

### BUG-014 fix: 단일구간 케이블 PATH 누락 ✅
- `computeRouteBreakdown()` — edge 없을 때 에러 반환 대신 length=0으로 대체
- `pathNodes`가 유지되어 `calculatedPath`에 정상 표시

### 중복 함수 일괄 정리 ✅
- `startNaverLogin` (40번 → 제거, 60번 최종)
- `renderGoogleButtonWithRetry` (40번 → 제거, 60번 최종)

### 카카오 로그인 완전 연동 ✅
- 원인: Cloudflare Secret `KAKAO_REST_API_KEY` ↔ 코드 `KAKAO_CLIENT_ID` 변수명 불일치
- 수정: `backend/auth-worker.js` 전체 → `env.KAKAO_REST_API_KEY`로 통일
- HTML 카카오 버튼 + CSS + 이벤트 리스너 + 에러 메시지 추가
- 확인: `/api/auth/session` → `kakao.enabled: true` ✅

### URL 정리 ✅
- `index.html` → `seastar-cms-v3.html` 복사 (리다이렉트 → 직접 서빙)
- `APP_REDIRECT_URL` → `https://scms.seastar.work/` (OAuth 콜백 루트 복귀)

---

## 🔴 미완성 / 남은 이슈

없음

---

## 🎨 CSS 아키텍처 주의사항

```
중요 원칙:
1. 다크 글라스모픽 테마 — body에 기본 적용, !important 광범위 사용
2. 드롭다운: position:fixed + getBoundingClientRect() (overflow:hidden 우회)
3. Virtual Scroll: grid-row { position:absolute }, grid-inner { position:relative }
4. ROW_HEIGHT = 24px (CSS --grid-row-h: 18px와 별개)
5. 새 CSS는 항상 seastar-v0-extra.css에 추가 (seastar-v0.css 수정 금지)
```

---

## 🔧 개발/배포 명령어

```bash
# 백엔드 로컬 실행
cd E:\code-project\calble\SCMS_V0
npx wrangler dev

# 백엔드 배포
npx wrangler deploy

# 프론트는 브라우저에서 index.html 직접 열기
```

---

## 📋 작업 규칙 (AI 준수 사항)

1. **seastar-v0.css 직접 수정 금지** → seastar-v0-extra.css에 오버라이드
2. **60-auth-groupspace-final.js가 최우선** — 같은 함수가 여러 파일에 있으면 60번 파일이 최종
3. **작업 완료 후 이 파일(CLAUDE.md) 업데이트 필수**
4. **DOM 요소 접근 전 null 체크**: `if (dom.xxx)` 또는 `dom.xxx?.method()`
5. **비동기 라우팅**: `await pause()` 매 50개마다 (UI 업데이트 허용)
