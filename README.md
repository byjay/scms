# SCMS — SEASTAR Cable Management System V6

## Project Overview
- **Name**: SEASTAR CMS V6 (SCMS)
- **Goal**: 선박 전기 케이블 관리 시스템 (Shipboard Electrical Cable Management System)
- **Tech Stack**: Hono + TypeScript + React + Cloudflare Pages + D1 Database + Three.js + Vite
- **Features**: 사용자 인증(5-tier RBAC), 멀티테넌시, 케이블 경로 산출(Dijkstra), 3D 노드맵, Tray Physics, BOM, 보안 시스템, CAD 동기화

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Cloudflare Pages                    │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Hono     │  │  React SPA   │  │  Legacy      │  │
│  │  Server   │──│  (Login/UI)  │──│  Dashboard   │  │
│  │  (API)    │  │  main.tsx    │  │  app.js      │  │
│  └─────┬─────┘  └──────────────┘  └──────────────┘  │
│        │                                             │
│  ┌─────┴─────┐                                       │
│  │  D1 SQLite│                                       │
│  │  Database │                                       │
│  └───────────┘                                       │
└─────────────────────────────────────────────────────┘
```

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Hono (TypeScript) | ^4.12.6 |
| Frontend | React + TypeScript (hono/jsx) | Latest |
| Build | Vite | ^6.3.5 |
| Platform | Cloudflare Pages + D1 | Wrangler ^4.4.0 |
| Database | SQLite (D1) | — |
| Styling | Tailwind CSS | CDN |
| 3D Engine | Three.js | r128 (CDN) |
| Spreadsheet | XLSX.js | 0.18.5 (CDN) |
| Animation | Framer Motion | — |
| Icons | Lucide React | — |
| Font | Pretendard (Google Fonts) | — |

---

## Features

### 1. 사용자 인증 시스템 (Authentication)
- D1 데이터베이스 기반 서버사이드 인증
- SHA-256 패스워드 해싱 (Web Crypto API)
- 환경변수 기반 Super Admin 오버라이드
- 레거시 해시 마이그레이션 지원
- UUID 기반 세션 토큰
- localStorage 세션 유지 (`SEASTAR_TOKEN`, `SEASTAR_USER`)
- Google OAuth 프레임워크 (토큰 교환 구현 예정)

### 2. 역할 기반 접근 제어 (RBAC — 5-Tier)

| Role | Scope | 설명 |
|------|-------|------|
| `super_admin` | 시스템 전체 | 모든 회사/사용자/프로젝트 관리 |
| `admin` | 회사 단위 | 소속 회사 내 전체 관리 |
| `manager` | 그룹/회사 | 그룹 프로젝트 관리 및 공유 |
| `user` | 개인/그룹 | 개인 프로젝트 + 그룹 공유 프로젝트 |
| `viewer` | 읽기 전용 | 프로젝트 열람만 가능 |

**Permission Codes** (정의됨):
- `cable.view`, `cable.edit`, `cable.delete`
- `node.view`, `node.edit`, `node.delete`
- `project.create`, `project.view`, `project.delete`, `project.export`
- `admin.users`, `admin.groups`, `admin.projects`, `admin.companies`

### 3. 멀티테넌시 (Multi-Tenancy)
- 서브도메인 기반 테넌트 라우팅 (예: `samsung.seastar.com`)
- 회사별 사용자/호선/프로젝트 격리
- Super Admin 전용 회사 생성/관리
- 회사 상태 관리 (active, suspended, cancelled)
- Soft delete (회사 삭제 시 status 변경)
- 회사별 통계 (사용자 수, 호선 수, 프로젝트 수)

### 4. 보안 시스템 (Security)

#### 비밀번호 정책
- 최소 8자, 최대 128자
- 대문자, 소문자, 숫자, 특수문자 각 1개 이상 필수
- 일반 비밀번호 차단 목록 (password, 123456, qwerty 등)

#### 레이트 리미팅
- IP 기반: 분당 100 요청 제한
- IP 감지: `CF-Connecting-IP`, `X-Forwarded-For`, `X-Real-IP`

#### 로그인 시도 제한
- IP:username 조합당 15분 이내 5회 실패 시 차단
- 성공 로그인 시 카운터 리셋
- 남은 시도 횟수 클라이언트에 반환

### 5. 호선/프로젝트 관리
- 호선(Ship) CRUD (이름, 호선번호, 그룹, 소유자)
- 프로젝트 데이터 JSON 저장/로드 (케이블, 노드, CAD 메타데이터)
- Upsert 패턴: 기존 데이터 삭제 후 재저장
- 역할 기반 접근 제어 (super_admin → admin → manager → user → viewer)
- 그룹 내 프로젝트 공유
- `canEdit` 플래그로 편집 권한 구분

### 6. CAD 동기화 (CAD Sync)
- DXF 파일 업로드를 통한 CAD 토폴로지 데이터 동기화
- 기존 프로젝트 데이터와 병합
- CAD 메타데이터 저장 (lastSync, syncBy, nodeCount, edgeCount)
- Framer Motion 애니메이션 모달 UI

### 7. 관리자 패널 (Admin)
- 사용자 목록 조회/추가/삭제/수정
- 비밀번호 강제 리셋
- 그룹 관리 (생성/삭제)
- 역할 변경 (admin, manager, user, viewer)

### 8. 레거시 대시보드 (Legacy Dashboard — app.js)

#### OVERVIEW (대시보드)
- 케이블 수, 노드 수, 경로 수, 총 길이, Coverage KPI
- System 분포 도넛 차트
- Cable Type Top 10 막대 차트
- Top Connected Nodes 차트

#### CABLES (케이블 목록)
- Excel/CSV 파일 업로드 및 파싱 (XLSX.js)
- 시스템/타입/경로상태 필터링
- 검색, 정렬, 페이지네이션
- 전체 선택/해제
- 인라인 셀 편집
- Undo/Redo 지원

#### NODES (노드 정보)
- 노드 목록 자동 번호 산출
- 구조, 타입, Relations, Link Length, Area Size, 연결 케이블 수, Fill % 표시
- 검색 및 필터링

#### 3D VIEW (Three.js)
- 육각형(Hexagonal) 노드 표시
- 노드 앞글자 2개로 Deck 분류 (색상 구분)
- 연결선 표시 (on/off 토글)
- 좌표 없는 노드: 연결 정보와 prefix 기반 자동 레이아웃
- ISO / TOP / SIDE 뷰 전환
- 마우스 드래그 회전, 휠 줌, 우클릭 이동

#### ROUTING (경로 산출)
- FROM / TO / CHECK NODE 입력
- Dijkstra 최단 경로 알고리즘 (Priority Queue)
- 경유지(CHECK NODE) 지원
- 전체 케이블 배치 경로 산출 (비동기 배치 처리)
- 경로별 길이 계산

#### ANALYSIS (분석)
- Tray Capacity 분석 (Fill %)
- System Summary (시스템별 케이블 수/길이)
- Length Statistics (총/평균/중간값/최소/최대)
- Top Connected Nodes

#### TRAY PHYSICS (트레이 물리 시뮬레이션)
- 전체 노드 리스트 클릭으로 Fill 시뮬레이션
- 노드별 통과 케이블 수 표시
- 물리 기반 케이블 적층 시뮬레이션
- 자동 Tray 크기 결정
- Canvas 시각화 (케이블 단면)
- Fill Ratio 계산
- 충돌 감지, 레이어 결정, 멀티 티어 최적화

#### BOM (Bill of Materials)
- 케이블 타입별 합산 (수량, 총 길이, 마진 포함 길이, 평균 길이)
- 시스템 필터, 타입 필터, 검색
- 마진(%) 입력
- KPI 카드 (타입 수, 총 케이블, 총 길이, 마진 포함)
- Excel 내보내기

#### PROJECT (프로젝트)
- 현재 호선 정보 표시
- 서버 저장/불러오기
- Excel 내보내기
- 작업 로그 (CSV 내보내기)

### 9. 로그인 UI
- Glass-morphism 카드 디자인 (backdrop blur, gradient border)
- 2단계 흐름: 로그인 → 호선 선택
- 비밀번호 표시/숨김 토글
- 동적 배경 비디오 (모바일에서 비활성화)
- 호선 카드 그리드 (hover 애니메이션, 선택 링 표시)
- 새 호선 추가 모달

---

## API Reference

### Auth API (`/api/auth`)

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| POST | `/api/auth/login` | 사용자 로그인 (username/password) | Complete |
| POST | `/api/auth/verify` | 세션 검증 (userId) | Complete |
| POST | `/api/auth/change-password` | 비밀번호 변경 | Complete |
| GET | `/api/auth/google` | Google OAuth URL 생성 | Partial |
| GET | `/api/auth/google/callback` | Google OAuth 콜백 | Partial |

### Projects API (`/api/projects`)

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| GET | `/api/projects/ships` | 호선 목록 (역할 기반 필터링) | Complete |
| POST | `/api/projects/ships` | 호선 생성 | Complete |
| DELETE | `/api/projects/ships/:id` | 호선 삭제 (프로젝트 연쇄 삭제) | Complete |
| POST | `/api/projects/save` | 프로젝트 데이터 저장 | Complete |
| GET | `/api/projects/load/:shipId` | 프로젝트 로드 (접근 제어) | Complete |
| POST | `/api/projects/share/:projectId` | 프로젝트 그룹 공유 | Complete |
| GET | `/api/projects/shared` | 공유 프로젝트 목록 | Complete |

### Admin API (`/api/admin`) — admin/super_admin 전용

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| GET | `/api/admin/users` | 사용자 목록 | Complete |
| POST | `/api/admin/users` | 사용자 생성 | Complete |
| PUT | `/api/admin/users/:id` | 사용자 수정 (역할/그룹/회사) | Complete |
| DELETE | `/api/admin/users/:id` | 사용자 삭제 | Complete |
| POST | `/api/admin/users/:id/reset-password` | 비밀번호 강제 리셋 | Complete |
| GET | `/api/admin/groups` | 그룹 목록 | Complete |
| POST | `/api/admin/groups` | 그룹 생성 | Complete |
| DELETE | `/api/admin/groups/:id` | 그룹 삭제 | Complete |

### Companies API (`/api/companies`) — super_admin 전용

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| GET | `/api/companies` | 회사 목록 (통계 포함) | Complete |
| GET | `/api/companies/:id` | 회사 상세 정보 | Complete |
| POST | `/api/companies` | 회사 생성 | Complete |
| PUT | `/api/companies/:id` | 회사 수정 | Complete |
| PATCH | `/api/companies/:id/status` | 회사 상태 변경 (active/suspended/cancelled) | Complete |
| DELETE | `/api/companies/:id` | 회사 소프트 삭제 | Complete |
| GET | `/api/companies/:id/users` | 회사 소속 사용자 목록 | Complete |
| POST | `/api/companies/:id/users` | 회사에 사용자 추가 | Complete |
| GET | `/api/companies/:id/stats` | 회사 통계 | Complete |

### Security API (`/api/security`)

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| POST | `/api/security/login-enhanced` | 강화 로그인 (레이트 리미팅 적용) | Complete |
| GET | `/api/security/password-policy` | 비밀번호 정책 조회 | Complete |
| POST | `/api/security/change-password-enhanced` | 강화 비밀번호 변경 (정책 검증) | Complete |
| POST | `/api/security/lock-account` | 계정 잠금 | Partial |
| GET | `/api/security/security-stats` | 보안 대시보드 통계 | Partial |
| GET | `/api/security/rate-limit-status` | 레이트 리미트 상태 조회 | Complete |
| POST | `/api/security/reset-login-attempts` | 로그인 시도 카운터 리셋 | Complete |

### CAD API (`/api/cad`)

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| POST | `/api/cad/sync` | CAD 토폴로지 데이터 동기화 | Complete |

---

## Database Schema

### Tables

```sql
-- 사용자
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pw_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',        -- super_admin, admin, manager, user, viewer
  group_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 그룹
CREATE TABLE groups_tbl (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME
);

-- 호선 (Ships)
CREATE TABLE ships (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ship_no TEXT,
  group_id TEXT,
  owner_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 프로젝트 데이터
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  ship_id TEXT NOT NULL,
  data_json TEXT NOT NULL,          -- JSON: {cables:[], nodes:[], cadMetadata:{}}
  saved_by TEXT,
  saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ship_id) REFERENCES ships(id)
);
```

### Indexes
- `idx_projects_ship` on projects(ship_id)
- `idx_users_username` on users(username)
- `idx_ships_group` on ships(group_id)

### Auto-Initialization
첫 API 요청 시 테이블이 없으면 자동 생성 (D1 middleware)

---

## Development

### Prerequisites
- Node.js (LTS)
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare 계정 (D1 접근)

### Local Setup
```bash
# 의존성 설치
npm install

# 로컬 D1 마이그레이션 적용
npm run db:migrate:local

# 초기 데이터 시딩
npm run db:seed

# 개발 서버 실행 (Vite)
npm run dev

# D1 샌드박스 모드 (port 3000)
npm run dev:sandbox
```

### Scripts

| Script | 설명 |
|--------|------|
| `npm run dev` | Vite 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | Wrangler Pages 로컬 프리뷰 |
| `npm run deploy` | 빌드 + Cloudflare Pages 배포 |
| `npm run dev:sandbox` | 로컬 D1 샌드박스 (port 3000) |
| `npm run db:migrate:local` | 로컬 D1 마이그레이션 |
| `npm run db:migrate:prod` | 프로덕션 D1 마이그레이션 |
| `npm run db:seed` | 초기 데이터 시딩 |
| `npm run db:reset` | DB 초기화 (drop + migrate + seed) |

---

## Deployment

- **Platform**: Cloudflare Pages + D1
- **Build Output**: `./dist`
- **Environment Detection**: Host 헤더 기반 (localhost = dev, else = prod)
- **D1 Binding**: `DB` → `seastar-cms-db`
- **Compatibility**: `nodejs_compat` flag 활성화

```bash
# 프로덕션 배포
npm run deploy
```

---

## Project Structure

```
src/
├── api/
│   ├── admin.ts         # 관리자 API (사용자/그룹 CRUD)
│   ├── auth.ts          # 인증 API (로그인/세션/OAuth/RBAC)
│   ├── cad.ts           # CAD 동기화 API
│   ├── companies.ts     # 멀티테넌시 회사 관리 API
│   ├── projects.ts      # 호선/프로젝트 관리 API
│   └── security.ts      # 보안 API (비밀번호 정책/레이트 리미팅)
├── components/
│   ├── Dashboard/
│   │   └── CADSyncModal.tsx    # CAD 동기화 모달
│   └── Login/
│       ├── CableNetworkBackground.tsx  # 파티클 애니메이션 배경
│       └── LandingPage.tsx     # 로그인 + 호선 선택 UI
├── utils/
│   └── authUtils.ts     # SHA-256 패스워드 해싱 유틸리티
├── index.tsx            # Hono 서버 엔트리 (라우팅, 미들웨어, HTML 템플릿)
└── main.tsx             # React 프론트엔드 엔트리 (세션 관리)
migrations/
└── 0001_initial.sql     # 초기 DB 스키마
public/
├── static/
│   ├── app.js           # 레거시 대시보드 (2,143 lines)
│   └── app.css          # 대시보드 스타일
├── video/               # 배경 비디오 파일
└── logo.jpg             # SEASTAR 로고
```

---

## Known Limitations

- Google OAuth 토큰 교환 미구현 (프레임워크만 구성)
- `companies` 테이블이 마이그레이션에 미포함 (코드에서 참조하지만 auto-init으로 생성)
- 패스워드 해싱에 salt 미적용 (SHA-256 only)
- 세션 토큰이 단순 UUID (JWT 미적용, 만료 없음)
- 레이트 리미팅 인메모리 (서버 재시작 시 리셋)
- 이메일/웹훅 알림 미구현
- 감사 로그(audit log) 미구현

---

**Last Updated**: 2026-04-14
