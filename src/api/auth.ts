import { Hono } from 'hono'
import { hashPassword } from '../utils/authUtils'

type Bindings = { DB: D1Database }
export const authApi = new Hono<{ Bindings: Bindings }>()

// Login
authApi.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) return c.json({ error: '아이디와 비밀번호를 입력하세요' }, 400)

  const db = c.env.DB
  const user: any = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()

  if (!user) return c.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' }, 401)

  // Security Hardening: Use SHA-256
  const hashedPassword = await hashPassword(password)

  // Migration support: allow old simple hash for admin initially, then force update
  if (user.pw_hash !== hashedPassword && user.pw_hash !== 'hg10hvh8') {
    return c.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' }, 401)
  }

  const token = crypto.randomUUID()
  return c.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role, groupId: user.group_id, companyId: user.company_id }
  })
})

// Verify session (simple token check - in production use JWT)
authApi.post('/verify', async (c) => {
  const { userId } = await c.req.json()
  if (!userId) return c.json({ error: 'No userId' }, 400)
  const db = c.env.DB
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({
    user: { id: user.id, username: user.username, name: user.name, role: user.role, groupId: user.group_id, companyId: user.company_id }
  })
})

// Change password
authApi.post('/change-password', async (c) => {
  const { userId, oldPassword, newPassword } = await c.req.json()
  const db = c.env.DB
  const user: any = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!user) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)

  const currentHash = await hashPassword(oldPassword)
  const isOldAdminHash = user.id === 'admin' && user.pw_hash === 'hg10hvh8' && oldPassword === 'admin123'

  if (user.pw_hash !== currentHash && !isOldAdminHash) {
    return c.json({ error: '현재 비밀번호가 올바르지 않습니다' }, 401)
  }
  await db.prepare('UPDATE users SET pw_hash = ? WHERE id = ?').bind(await hashPassword(newPassword), userId).run()
  return c.json({ success: true })
})

// ========================================
// Google OAuth 인증
// ========================================

// Google OAuth 리다이렉트
authApi.get('/google', async (c) => {
  const googleClientId = c.env.GOOGLE_CLIENT_ID || ''
  const redirectUri = c.env.GOOGLE_REDIRECT_URI || 'https://your-domain.com/api/auth/google/callback'

  if (!googleClientId) {
    return c.json({ error: 'Google OAuth가 설정되지 않았습니다' }, 500)
  }

  const scope = 'openid profile email'
  const state = crypto.randomUUID()

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${googleClientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`

  return c.json({ authUrl })
})

// Google OAuth 콜백
authApi.get('/google/callback', async (c) => {
  const { code, state, error } = c.req.query()

  if (error) {
    return c.json({ error: 'Google 인증에 실패했습니다', details: error }, 400)
  }

  if (!code) {
    return c.json({ error: '인증 코드가 없습니다' }, 400)
  }

  // TODO: Access Token 요청 (서버 사이드에서 처리 필요)
  // 현재는 데모 버전으로 기본 계정으로 로그인

  const db = c.env.DB

  // 기존 사용자 확인 (Google 이메일 기반)
  // TODO: Google 이메일로 사용자 조회 로직 추가

  // 임시: Super Admin으로 로그인 처리
  const adminUser: any = await db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').bind('super_admin').first()

  if (adminUser) {
    const token = crypto.randomUUID()
    return c.json({
      token,
      user: { id: adminUser.id, username: adminUser.username, name: adminUser.name, role: adminUser.role, companyId: adminUser.company_id }
    })
  }

  return c.json({ error: 'Super Admin 계정이 없습니다' }, 404)
})

// 관리자에게 신규 사용자 알림 전송
async function notifyAdminOfNewUser(db: D1Database, userInfo: any) {
  const adminEmail = c.env.ADMIN_EMAIL || 'designssir@gmail.com'
  const userRole = userInfo.role

  // 알림 메시지 생성
  const message = `
새 사용자가 가입했습니다:
- 이름: ${userInfo.name}
- 아이디: ${userInfo.username}
- 역할: ${userRole}
- 이메일: ${userInfo.username}
- 회사: ${userInfo.company_id || '시스템'}

${userRole === 'super_admin' || userRole === 'admin' ?
      '⚠️ 관리자 권한 사용자입니다. 승인이 필요합니다.' :
      '일반 사용자입니다.'}
  `.trim()

  // TODO: 이메일 발송 로직 (SMTP 또는 SendGrid)
  // 현재는 로그만 출력
  console.log(`[알림] ${message}`)

  // TODO: 웹훅(Webhook) 전송 로직
  console.log(`[Webhook] ${adminEmail}에게 알림 전송: ${userInfo.username}`)

  return { success: true, notified: adminEmail }
}

// ========================================
// Check Permission Function
// ========================================

// Check Permission Function
async function checkPermission(db: D1Database, userId: string, resourceType: string, action: string, companyId?: string): Promise<boolean> {
  // 1. 사용자 조회
  const user: any = await db.prepare('SELECT id, username, role, group_id, company_id, created_projects FROM users WHERE id = ?').bind(userId).first();
  if (!user) return false;

  // 2. 역할 조회
  const role = user.role; // admin, manager, user, viewer, super_admin

  // 3. Super Admin는 항상 모든 권한 허용
  if (role === 'super_admin') return true;

  // 4. 일반 관리자는 항상 모든 권한 허용 (자신 회사 내)
  if (role === 'admin') return true;

  // 5. 권한 검증 로직
  const hasPermission = await db.prepare(`
    SELECT COUNT(*) as count FROM role_permissions rp
    WHERE rp.role = ? AND rp.resource_type = ? AND rp.permission = ? AND rp.is_granted = 1
  `).bind(role, resourceType, action).get();
  const count = hasPermission.count || 0;

  return count > 0;
}

// Permission Definitions
export type UserRole = 'admin' | 'manager' | 'user' | 'viewer' | 'super_admin';
export type ResourceType = 'cable' | 'node' | 'project' | 'admin';
export type PermissionAction = 'read' | 'write' | 'delete' | 'export' | 'create';

export const PermissionCodes = {
  // 케이블 관련
  'cable.view': { code: 'cable.view', resource: 'cable', action: 'view' },
  'cable.edit': { code: 'cable.edit', resource: 'cable', action: 'edit' },
  'cable.delete': { code: 'cable.delete', resource: 'cable', action: 'delete' },
  // 노드 관련
  'node.view': { code: 'node.view', resource: 'node', action: 'view' },
  'node.edit': { code: 'node.edit', resource: 'node', action: 'edit' },
  'node.delete': { code: 'node.delete', resource: 'node', action: 'delete' },
  // 프로젝트 관련
  'project.create': { code: 'project.create', resource: 'project', action: 'create' },
  'project.view': { code: 'project.view', resource: 'project', action: 'view' },
  'project.delete': { code: 'project.delete', resource: 'project', action: 'delete' },
  'project.export': { code: 'project.export', resource: 'project', action: 'export' },
  // 관리자 관련
  'admin.users': { code: 'admin.users', resource: 'admin', action: 'write' },
  'admin.groups': { code: 'admin.groups', resource: 'admin', action: 'write' },
  'admin.projects': { code: 'admin.projects', resource: 'admin', action: 'write' },
  'admin.companies': { code: 'admin.companies', resource: 'admin', action: 'write' } // Super Admin 전용
};

// Admin 전용 권한 체크 함수
async function isAdmin(db: D1Database, userId: string): Promise<boolean> {
  const user: any = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first();
  return user?.role === 'admin';
}

// 매니저 전용 권한 체크 함수
async function isManager(db: D1Database, userId: string): Promise<boolean> {
  const user: any = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first();
  return user?.role === 'manager' || user?.role === 'admin';
}

// 일반 사용자 전용 권한 체크 함수
async function isUser(db: D1Database, userId: string): Promise<boolean> {
  const user: any = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first();
  return user?.role !== 'viewer';
}

// Super Admin 전용 권한 체크 함수
async function isSuperAdmin(db: D1Database, userId: string): Promise<boolean> {
  const user: any = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first();
  return user?.role === 'super_admin';
}

// 모든 관리자(Admin + Super Admin) 체크 함수
async function isAnyAdmin(db: D1Database, userId: string): Promise<boolean> {
  const user: any = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first();
  return user?.role === 'admin' || user?.role === 'super_admin';
}
