# SCMS V3 — AI Handoff Document
> 작성일: 2026-03-27 | 이관 목적: 다른 AI에게 작업 인계

---

## 1. 프로젝트 개요

| 항목 | 값 |
|------|-----|
| **프로젝트명** | SEASTAR CMS V3 (Cable Management System) |
| **로컬 경로** | `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v99` |
| **배포 URL** | https://scms.seastar.work |
| **백업 URL** | https://scms.designssir.workers.dev |
| **호스팅** | Cloudflare Workers + Assets |
| **관리자** | designsir@gmail.com / (see Cloudflare Secrets) |
| **개발자 연락처** | designsir@naver.com (모든 화면 하단 각인) |

---

## 2. 아키텍처

### 파일 구조
```
seastar-cms-v99/
├── seastar-cms-v3.html          # 메인 HTML (단일 페이지)
├── index.html                   # 리다이렉트
├── wrangler.toml                # Cloudflare Workers 설정
├── backend/
│   └── auth-worker.js           # 인증 백엔드 (네이버 OAuth + 관리자 로그인)
├── assets/
│   ├── seastar-v3.css           # 메인 CSS (라이트 테마)
│   ├── seastar-v3-extra.css     # Cable Type 탭 + Deck 트리 CSS
│   ├── seastar-v3.js            # ★ 번들 JS (8개 소스 연결)
│   ├── embedded-nodes.js        # 내장 노드 데이터
│   ├── logo.jpg                 # SEASTAR 로고
│   ├── scms.mp4                 # 로그인 화면 동영상
│   └── src-js/                  # ★ 소스 JS (편집은 여기서)
│       ├── 00-bootstrap-core.js     # 초기화, 상태, DOM, CABLE_ALIASES
│       ├── 05-cable-type-db.js      # Cable Type 마스터 DB (331타입)
│       ├── 10-routing-engine.js     # Dijkstra, 라우팅, 검증, handleDataFile
│       ├── 20-cable-dashboard.js    # 그리드 렌더링, 케이블 편집기, Cable Type 탭
│       ├── 30-nodes-and-maps.js     # 노드 패널, Tray Fill 중력 패킹, 3D
│       ├── 40-auth-project-foundation.js  # IndexedDB 자동저장, 프로젝트 관리
│       ├── 50-import-export-bom-reports-utils.js  # 내보내기, BOM, POS, PATH포함엑셀
│       └── 60-auth-groupspace-final.js  # 인증, 그룹공간, Ship Select
└── tools/
    └── build-seastar-v3.ps1     # 빌드 스크립트 (src-js → seastar-v3.js)
```

### 빌드 방법
```powershell
# PowerShell에서 실행 (인코딩 주의!)
cd C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v99

# 방법 1: 빌드 스크립트 (한글 깨짐 주의)
powershell -ExecutionPolicy Bypass -File tools/build-seastar-v3.ps1

# 방법 2: UTF-8 강제 빌드 (권장)
powershell -Command "
$sourceDir = 'assets\src-js'
$bundlePath = 'assets\seastar-v3.js'
$parts = Get-ChildItem -Path $sourceDir -Filter '*.js' -File | Sort-Object Name
$bundleParts = [System.Collections.Generic.List[string]]::new()
$bundleParts.Add('// Built from assets/src-js.')
$bundleParts.Add('')
foreach ($part in $parts) {
    $bundleParts.Add(\"// --- BEGIN $($part.Name) ---\")
    $content = [System.IO.File]::ReadAllText($part.FullName, [System.Text.Encoding]::UTF8)
    $bundleParts.Add($content)
    $bundleParts.Add(\"// --- END $($part.Name) ---\")
    $bundleParts.Add('')
}
$bundleText = ($bundleParts -join [char]10).TrimEnd() + [char]10
[System.IO.File]::WriteAllText($bundlePath, $bundleText, [System.Text.UTF8Encoding]::new($false))
"

# 배포
npx wrangler deploy
```

### ⚠️ 빌드 주의사항
- `build-seastar-v3.ps1`이 한글을 깨트릴 수 있음 → **UTF-8 강제 빌드** 사용 권장
- 캐시 버스팅: `seastar-cms-v3.html`의 `?v=20260327-v4` 값을 배포마다 변경
- 8개 JS 파일이 이름순 정렬되어 하나의 IIFE로 연결됨 → **파일 순서가 중요**

---

## 3. ★ 치명적 버그 (즉시 수정 필요)

### BUG #1: IndexedDB 함수가 잘못된 스코프에 갇힘 [CRITICAL]
**파일**: `40-auth-project-foundation.js` lines 1-99

**문제**: `30-nodes-and-maps.js`의 마지막 함수 `updateSystemFilterOptions()`가 닫히지 않은 채 끝남 → `40-auth-project-foundation.js` 시작부에 삽입된 IndexedDB 코드가 `updateSystemFilterOptions()` **내부**에 중첩 정의됨

**영향**:
- `autoSaveCurrentShip()` — IIFE 스코프에서 접근 불가 → 자동 저장 안 됨
- `autoRestoreCurrentShip()` — 접근 불가 → 자동 복원 안 됨
- `scheduleAutoSave()` — 접근 불가 → commitHistory 후 저장 안 됨

**수정 방법**:
```
옵션 A: 30-nodes-and-maps.js 끝에 updateSystemFilterOptions() 닫는 } 추가
        → 40-auth-project-foundation.js의 lines 105-111 (기존 닫기 코드) 제거

옵션 B: IndexedDB 코드를 별도 파일 (예: 35-indexeddb-storage.js)로 분리

옵션 C: IndexedDB 코드를 40-auth-project-foundation.js에서
        updateSystemFilterOptions() 닫힌 후 위치로 이동
```

**검증**: 빌드 후 `seastar-v3.js`에서 `autoSaveCurrentShip` 검색 → 함수가 최상위 IIFE 스코프에 있는지 확인

### BUG #2: 대량 함수 중복 정의 [HIGH]
파일 40, 60에서 동일 함수가 2~3회 정의됨. 마지막 정의가 유효하므로 **기능은 작동**하지만 죽은 코드가 혼란 유발.

**중복 함수 목록**:
| 함수 | 정의 횟수 | 유효 위치 |
|------|----------|----------|
| renderAll() | 3회 | 60-auth:718 |
| initAuth() | 3회 | 60-auth:267 |
| handleLocalLogin() | 3회 | 60-auth:309 |
| applyAuthState() | 3회 | 60-auth:360 |
| setActiveTab() | 2회 | 60-auth:681 |
| exportProjectJson() | 2회 | 50-import:190 |
| exportProjectWorkbook() | 2회 | 50-import:197 |

**수정**: 40-auth-project-foundation.js의 죽은 스텁 제거

### BUG #3: 파일 경계에서 함수 분할 [HIGH]
`30-nodes-and-maps.js` → `40-auth-project-foundation.js` 경계에서 함수가 쪼개져 있음.
각 파일이 독립적으로 유효한 JS가 아님.

**수정**: 각 파일이 완전한 함수만 포함하도록 리팩터링

---

## 4. 완료된 기능

| # | 기능 | 파일 | 상태 |
|---|------|------|------|
| 1 | 엑셀 스타일 케이블 그리드 (24px, 행번호, 교차색상) | 20-cable-dashboard.js, CSS | ✅ |
| 2 | 엑셀 스타일 노드 그리드 | 30-nodes-and-maps.js | ✅ |
| 3 | Cable Type DB 331타입 내장 | 05-cable-type-db.js | ✅ |
| 4 | Cable Type 별도 탭 (검색 가능) | 20-cable-dashboard.js, HTML | ✅ |
| 5 | Deck 그룹 트리 (좌측 사이드바) | 20-cable-dashboard.js, HTML, extra CSS | ✅ |
| 6 | 로그인 동영상 + 로고 | HTML | ✅ |
| 7 | 관리자 이메일 로그인 | auth-worker.js, Cloudflare Secrets | ✅ |
| 8 | 네이버 OAuth 인증 | auth-worker.js, 60-auth | ✅ |
| 9 | Ship Select 호선 선택 + 그룹 공유 | 60-auth, HTML, CSS | ✅ |
| 10 | 개발자 각인 (designsir@naver.com) | HTML 2곳 | ✅ |
| 11 | PATH 포함 엑셀 내보내기 (aa.xls 형식) | 50-import: buildCableWithPathRows() | ✅ |
| 12 | POS 소요량 내보내기 | 50-import: buildPosRows() | ✅ |
| 13 | 라이트 테마 (흰 배경 + 가독성) | CSS :root 변수 | ✅ |
| 14 | Tray Fill 중력 패킹 알고리즘 | 30-nodes: findGravityPosition 등 | ✅ |
| 15 | 파일 로드 후 자동 라우팅 | 10-routing: handleDataFile | ✅ |
| 16 | IndexedDB 자동 저장/복원 코드 | 40-auth (코드 존재하나 BUG #1로 미작동) | ⚠️ |

---

## 5. 미완료 / 수정 필요 작업

### 즉시 수정 (CRITICAL)
| # | 작업 | 설명 |
|---|------|------|
| 1 | **IndexedDB 스코프 수정** | BUG #1 — autoSave/autoRestore가 동작하지 않음 |
| 2 | **로그인 후 Ship Select 강제** | 호선 없으면 반드시 호선 생성/선택 → 케이블 로드 순서 |
| 3 | **죽은 코드 정리** | 40-auth의 중복 함수 스텁 제거 |

### 기능 보완 (HIGH)
| # | 작업 | 참조 |
|---|------|------|
| 4 | **프로젝트 생성 플로우** | V1 참조: 로그인→호선선택→케이블로드→프로젝트명 입력 |
| 5 | **호선별 프로젝트 목록** | 같은 호선에 여러 프로젝트 가능해야 함 |
| 6 | **그룹 관리 ADMIN 패널** | V1에 있던 사용자/그룹/호선 관리 UI |

### 기능 개선 (MEDIUM)
| # | 작업 | 참조 |
|---|------|------|
| 7 | **Tray Fill 30번 크로스 검증** | tray-fill 앱(C:\Users\FREE\Desktop\tray-fill)과 결과 비교 |
| 8 | **좌측 Cable Group 트리** Deck 코드 자동 추출 개선 | 현재 supplyDeck/fromRoom 기반 |
| 9 | **엑셀 내보내기 셀 병합** | aa.xls 형식에서 NO, CABLE_NAME 등 셀 병합 필요 |
| 10 | **POS 양식 PDF 생성** | POS-E-101 형태의 발주서 자동 생성 |

---

## 6. Cloudflare Workers 환경변수 (Secrets)

```
ADMIN_USERNAME = designsir@gmail.com
ADMIN_PASSWORD = (see Cloudflare Secrets)
ADMIN_NAME = KBJ
ADMIN_EMAIL = designsir@gmail.com
NAVER_CLIENT_ID = (설정됨)
NAVER_CLIENT_SECRET = (설정됨)
NAVER_CALLBACK_URL = (설정 필요 확인)
SESSION_SECRET = (설정됨)
```

확인: `npx wrangler secret list`

---

## 7. 테스트 파일

| 파일 | 경로 | 용도 |
|------|------|------|
| 케이블 데이터 | `C:\Users\FREE\Desktop\cabel_0310\35k sch.xlsx` | 2,470행 × 25열 |
| 노드 데이터 | `C:\Users\FREE\Desktop\cabel_0310\35k node.xlsx` | 1,095행 × 10열 |
| PATH 포함 엑셀 예시 | `C:\Users\FREE\Desktop\cabel_0310\aa.xls` | 254행 (셀 병합 포함) |
| V1 참조 | `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v1-restart.html` | 전체 플로우 참조 |
| Tray Fill 참조 | `C:\Users\FREE\Desktop\tray-fill/` | 중력 패킹 알고리즘 원본 |
| POS 양식 | `L:\씨스타공용폴더\...\POS-E-101-R1_MV PANOPI_ELECTRIC CABLE (POS)_230110.pdf` | 발주서 양식 |

---

## 8. 핵심 함수 매핑

### 케이블 로드 플로우
```
사용자 클릭 "케이블" 버튼
→ cableFileInput.click() (00-bootstrap:552)
→ handleDataFile(event, 'cable') (10-routing:1)
  → loadFilePayload(file) (50-import:43) — XLSX/JSON 파싱
  → extractCablesFromPayload(payload) (50-import:162)
  → normalizeCableRecord(raw, index) (00-bootstrap:802) — CABLE_ALIASES 매핑
  → refreshGraph() (10-routing:54)
  → [자동 라우팅 체크] (10-routing:36-45)
  → recalculateAllCables() (10-routing:194)
  → renderAll() (60-auth:718)
  → commitHistory('cable-file-load') (50-import:880)
  → [scheduleAutoSave()] (현재 BUG로 미작동)
```

### 라우팅 플로우
```
recalculateAllCables() (10-routing:194)
  → 각 케이블에 대해:
    → applyRouteToCable(cable) → computeRouteBreakdown(cable)
      → dijkstra(from, to) (10-routing:316)
        → _dijkstraCore(from, to) (10-routing:336) — MinHeap 사용
    → validateCable(cable) (10-routing:578)
```

### 그리드 렌더링
```
renderGrid(cables) (20-cable-dashboard:91)
  → getFilteredCables() (20-cable-dashboard:45) — 검색/필터/Deck 적용
  → 가상 스크롤 (ROW_HEIGHT=24px, viewport 기반)
  → 행 클릭 → renderSelectedCable(cable) (20-cable-dashboard:173)
```

---

## 9. 사용자 요구사항 (KBJ 총괄)

1. **엑셀처럼 보여야 함** — CABLE MEASUREMENT v2.653 앱 스크린샷 참조
2. **흰 배경 + 회색 레이어 + 가독성 극대화** — 글자 안 보이면 안됨
3. **모든 화면 하단에 개발자 각인** — `Developer(System Inquiry): designsir@naver.com`
4. **호선 선택 필수** — 로그인 후 반드시 호선/프로젝트 선택
5. **그룹별 공유** — 같은 그룹만 같은 호선 접근
6. **자동 저장/복원** — 새로고침해도 데이터 유지
7. **자동 라우팅** — 케이블+노드 로드 시 즉시 전체경로
8. **PATH 포함 엑셀** — aa.xls 형식 (케이블행+PATH행+다중Deck)
9. **POS 소요량** — 타입별 길이 합산
10. **Cable Type 마스터 탭** — 331타입 검색

---

## 10. 빠른 시작 가이드 (새 AI용)

```
1. 소스 코드 위치: C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v99\assets\src-js\
2. 편집은 반드시 src-js/ 폴더의 개별 파일에서
3. 편집 후: 빌드 (UTF-8 강제) → seastar-cms-v3.html 캐시 버스트 값 변경 → npx wrangler deploy
4. 가장 먼저 수정할 것: BUG #1 (IndexedDB 스코프 문제)
5. V1 참조: C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v1-restart.html (프로젝트 플로우)
6. 테스트: 35k sch.xlsx + 35k node.xlsx 로드 후 전체경로 실행
```
