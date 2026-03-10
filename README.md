# SCMS — SEASTAR Cable Management System V6

## Project Overview
- **Name**: SEASTAR CMS V6
- **Goal**: 선박 케이블 관리 시스템 (Cable Management System) - 보안 강화 React 프로젝트
- **Tech Stack**: Hono + TypeScript + Cloudflare Pages + D1 Database + Three.js
- **Features**: 사용자 인증, 케이블 경로 산출(Dijkstra), 3D 노드맵, Tray Physics, BOM, 프로젝트 저장


## 현재 완성된 기능

### 1. 사용자 인증 시스템
- D1 데이터베이스 기반 서버사이드 인증
- 관리자(admin), 매니저(manager), 사용자(user) 3단계 권한
- 사전등록된 사용자만 로그인 가능
- 세션 관리 (8시간 타임아웃)

### 2. 관리자 패널 (ADMIN)
- 사용자 목록 조회 / 추가 / 삭제
- 그룹 관리 (사용자 그룹별 호선 접근 제어)
- 호선(프로젝트) 관리

### 3. 호선 등록 & 프로젝트 저장
- 사용자별 호선 등록 가능
- 프로젝트 데이터(케이블/노드) 서버에 저장
- 호선 선택 시 자동 프로젝트 로드

### 4. OVERVIEW (대시보드)
- 케이블 수, 노드 수, 경로 수, 총 길이, Coverage KPI
- System 분포 도넛 차트
- Cable Type Top 10 막대 차트
- Top Connected Nodes 차트

### 5. CABLES (케이블 목록)
- Excel/CSV 파일 업로드 및 파싱
- 시스템/타입/경로상태 필터링
- 검색 기능
- 전체 선택 / 해제
- Cable List 리스트 최대 표시

### 6. NODES (노드 정보)
- 노드 목록 자동 번호 산출
- 구조, 타입, Relations, Link Length, Area Size, 연결 케이블 수, Fill % 표시
- 검색 기능

### 7. 3D VIEW (Three.js)
- 육각형(Hexagonal) 노드 표시
- 노드 앞글자 2개로 Deck 분류 (색상 구분)
- 연결선 표시 (on/off)
- 좌표 없는 노드: 연결 정보와 prefix 기반 자동 레이아웃
- ISO / TOP / SIDE 뷰 전환
- 마우스 드래그 회전, 휠 줌, 우클릭 이동

### 8. ROUTING (경로 산출)
- FROM / TO / CHECK NODE 입력
- Dijkstra 최단 경로 알고리즘
- 경유지(CHECK NODE) 지원
- 전체 케이블 배치 경로 산출 (비동기 배치 처리)

### 9. ANALYSIS (분석)
- Tray Capacity 분석 (Fill %)
- System Summary (시스템별 케이블 수/길이)
- Length Statistics (총/평균/중간값/최소/최대)
- Top Connected Nodes

### 10. TRAY PHYSICS
- **전체 노드 리스트** 클릭으로 Fill 시뮬레이션
- 노드별 통과 케이블 수 표시
- 물리 기반 케이블 적층 시뮬레이션
- 자동 Tray 크기 결정
- Canvas 시각화 (케이블 단면)
- Fill Ratio 계산

### 11. BOM (Bill of Materials)
- **케이블 타입별 합산** (수량, 총 길이, 마진 포함 길이, 평균 길이)
- 시스템 필터, 타입 필터, 검색
- 마진(%) 입력
- KPI 카드 (타입 수, 총 케이블, 총 길이, 마진 포함)
- Excel 내보내기

### 12. PROJECT (프로젝트)
- 현재 호선 정보 표시
- 서버 저장/불러오기
- Excel 내보내기

## Data Architecture
- **D1 Database**: users, groups_tbl, ships, projects
- **Storage**: 프로젝트 데이터는 JSON으로 D1에 저장
- **Auto-migration**: 첫 API 호출 시 테이블 자동 생성

## API Endpoints
- `POST /api/auth/login` - 로그인
- `POST /api/auth/verify` - 세션 검증
- `GET /api/admin/users` - 사용자 목록
- `POST /api/admin/users` - 사용자 추가
- `DELETE /api/admin/users/:id` - 사용자 삭제
- `GET /api/admin/groups` - 그룹 목록
- `POST /api/admin/groups` - 그룹 추가
- `GET /api/projects/ships` - 호선 목록
- `POST /api/projects/ships` - 호선 생성
- `POST /api/projects/save` - 프로젝트 저장
- `GET /api/projects/load/:shipId` - 프로젝트 로드

## Deployment
- **Platform**: Cloudflare Pages + D1
- **Status**: ✅ 로컬 개발 서버 활성
- **Last Updated**: 2023-03-10
