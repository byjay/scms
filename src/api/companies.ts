import { Hono, MiddlewareHandler } from 'hono'
import { hashPassword } from '../utils/authUtils'

type Bindings = { DB: D1Database }
export const companiesApi = new Hono<{ Bindings: Bindings }>()

// Super Admin 전용 미들웨어
const requireSuperAdmin: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: '인증이 필요합니다' }, 401)
  }
  
  const userId = authHeader.replace('Bearer ', '')
  const db = c.env.DB
  
  const user: any = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first()
  if (!user || user.role !== 'super_admin') {
    return c.json({ error: 'Super Admin 권한이 필요합니다' }, 403)
  }
  
  await next()
}

// Tenant Context 추출 미들웨어
const requireTenantContext: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const host = c.req.header('host') || ''
  
  // Subdomain에서 company_id 추출 (예: samsung.seastar.com)
  const subdomainMatch = host.match(/^([^.]+)\.seastar\.com$/)
  
  // Super Admin은 tenant 제한 없음
  const authHeader = c.req.header('Authorization')
  if (authHeader) {
    const userId = authHeader.replace('Bearer ', '')
    const db = c.env.DB
    const user: any = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first()
    if (user?.role === 'super_admin') {
      c.set('isSuperAdmin', true)
      await next()
      return
    }
  }
  
  // 일반 사용자는 반드시 tenant context 필요
  if (!subdomainMatch) {
    return c.json({ error: '유효하지 않은 테넌트 도메인입니다' }, 400)
  }
  
  const companyId = subdomainMatch[1]
  
  // 회사 존재 여부 확인
  const db = c.env.DB
  const company = await db.prepare(
    'SELECT * FROM companies WHERE id = ? AND status = ?'
  ).bind(companyId, 'active').first()
  
  if (!company) {
    return c.json({ error: '회사를 찾을 수 없거나 비활성 상태입니다' }, 404)
  }
  
  // 컨텍스트 저장
  c.set('companyId', companyId)
  c.set('companyName', company.name)
  c.set('isSuperAdmin', false)
  
  await next()
}

// 모든 routes에 tenant context 미들웨어 적용
companiesApi.use('*', requireTenantContext)

// ========================================
// Super Admin 전용 Company 관리 API
// ========================================

// Company 목록 조회 (Super Admin만)
companiesApi.get('/', async (c) => {
  const db = c.env.DB
  const companies = await db.prepare(`
    SELECT c.*, 
           COUNT(DISTINCT u.id) as user_count,
           COUNT(DISTINCT s.id) as ship_count,
           COUNT(DISTINCT p.id) as project_count
    FROM companies c
    LEFT JOIN users u ON u.company_id = c.id
    LEFT JOIN ships s ON s.company_id = c.id
    LEFT JOIN projects p ON p.ship_id = s.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all()
  
  return c.json({ companies: companies.results })
})

// Company 상세 조회
companiesApi.get('/:id', async (c) => {
  const companyId = c.req.param('id')
  const db = c.env.DB
  const isSuperAdmin = c.get('isSuperAdmin')
  
  // Super Admin은 모든 회사 조회 가능
  // 일반 관리자는 자신 회사만 조회 가능
  let query = `
    SELECT c.*, 
           COUNT(DISTINCT u.id) as user_count,
           COUNT(DISTINCT s.id) as ship_count,
           COUNT(DISTINCT p.id) as project_count
    FROM companies c
    LEFT JOIN users u ON u.company_id = c.id
    LEFT JOIN ships s ON s.company_id = c.id
    LEFT JOIN projects p ON p.ship_id = s.id
    WHERE c.id = ?
  `
  
  if (!isSuperAdmin) {
    query = query + ' AND c.id = ?'
  }
  
  const company = await db.prepare(query).bind(companyId, companyId).first()
  
  if (!company) {
    return c.json({ error: '회사를 찾을 수 없습니다' }, 404)
  }
  
  return c.json({ company })
})

// Company 생성 (Super Admin만)
companiesApi.post('/', requireSuperAdmin, async (c) => {
  const { id, name, domain, maxUsers, maxStorageMb, planType } = await c.req.json()
  
  if (!id || !name) {
    return c.json({ error: '필수 항목을 모두 입력하세요' }, 400)
  }
  
  // Company ID 중복 체크
  const db = c.env.DB
  const existingCompany = await db.prepare('SELECT id FROM companies WHERE id = ?').bind(id).first()
  if (existingCompany) {
    return c.json({ error: '이미 존재하는 회사 ID입니다' }, 400)
  }
  
  // Domain 중복 체크
  if (domain) {
    const existingDomain = await db.prepare('SELECT id FROM companies WHERE domain = ?').bind(domain).first()
    if (existingDomain) {
      return c.json({ error: '이미 사용 중인 도메인입니다' }, 400)
    }
  }
  
  const companyData = {
    id,
    name,
    domain: domain || null,
    max_users: maxUsers || 10,
    max_storage_mb: maxStorageMb || 100,
    plan_type: planType || 'basic',
    status: 'active'
  }
  
  await db.prepare(`
    INSERT INTO companies (id, name, domain, max_users, max_storage_mb, plan_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    companyData.id,
    companyData.name,
    companyData.domain,
    companyData.max_users,
    companyData.max_storage_mb,
    companyData.plan_type,
    companyData.status
  ).run()
  
  return c.json({ success: true, company: companyData })
})

// Company 수정 (Super Admin만)
companiesApi.put('/:id', requireSuperAdmin, async (c) => {
  const companyId = c.req.param('id')
  const { name, domain, status, planType, maxUsers, maxStorageMb } = await c.req.json()
  
  const db = c.env.DB
  const company = await db.prepare('SELECT * FROM companies WHERE id = ?').bind(companyId).first()
  
  if (!company) {
    return c.json({ error: '회사를 찾을 수 없습니다' }, 404)
  }
  
  const updates: string[] = []
  const values: any[] = []
  
  if (name) {
    updates.push('name = ?')
    values.push(name)
  }
  if (domain !== undefined) {
    updates.push('domain = ?')
    values.push(domain)
  }
  if (status) {
    updates.push('status = ?')
    values.push(status)
  }
  if (planType) {
    updates.push('plan_type = ?')
    values.push(planType)
  }
  if (maxUsers) {
    updates.push('max_users = ?')
    values.push(maxUsers)
  }
  if (maxStorageMb) {
    updates.push('max_storage_mb = ?')
    values.push(maxStorageMb)
  }
  
  if (updates.length === 0) {
    return c.json({ error: '수정할 항목이 없습니다' }, 400)
  }
  
  values.push(new Date().toISOString())
  updates.push('updated_at = ?')
  
  await db.prepare(`
    UPDATE companies SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values, companyId).run()
  
  return c.json({ success: true })
})

// Company 상태 변경 (활성/비활성) - Super Admin만
companiesApi.patch('/:id/status', requireSuperAdmin, async (c) => {
  const companyId = c.req.param('id')
  const { status } = await c.req.json()
  
  if (!status || !['active', 'suspended', 'cancelled'].includes(status)) {
    return c.json({ error: '유효하지 않은 상태입니다' }, 400)
  }
  
  const db = c.env.DB
  const company = await db.prepare('SELECT id FROM companies WHERE id = ?').bind(companyId).first()
  
  if (!company) {
    return c.json({ error: '회사를 찾을 수 없습니다' }, 404)
  }
  
  await db.prepare('UPDATE companies SET status = ? WHERE id = ?').bind(status, companyId).run()
  
  return c.json({ success: true })
})

// Company 삭제 (Super Admin만)
companiesApi.delete('/:id', requireSuperAdmin, async (c) => {
  const companyId = c.req.param('id')
  
  if (companyId === 'system') {
    return c.json({ error: '시스템 회사는 삭제할 수 없습니다' }, 400)
  }
  
  const db = c.env.DB
  
  // Soft delete: status를 cancelled로 변경
  await db.prepare('UPDATE companies SET status = ? WHERE id = ?').bind('cancelled', companyId).run()
  
  return c.json({ success: true })
})

// ========================================
// 회사 내 사용자 관리
// ========================================

// 회사 내 사용자 목록
companiesApi.get('/:id/users', async (c) => {
  const companyId = c.req.param('id')
  const db = c.env.DB
  const isSuperAdmin = c.get('isSuperAdmin')
  const requestCompanyId = c.get('companyId')
  
  // 권한 체크
  if (!isSuperAdmin && requestCompanyId !== companyId) {
    return c.json({ error: '접근 권한이 없습니다' }, 403)
  }
  
  const users = await db.prepare(`
    SELECT id, username, name, role, company_id, created_at
    FROM users
    WHERE company_id = ?
    ORDER BY created_at DESC
  `).bind(companyId).all()
  
  return c.json({ users: users.results })
})

// 회사 내 사용자 추가 (회사 관리자만)
companiesApi.post('/:id/users', async (c) => {
  const companyId = c.req.param('id')
  const { username, password, name, role } = await c.req.json()
  
  if (!username || !password || !name) {
    return c.json({ error: '필수 항목을 모두 입력하세요' }, 400)
  }
  if (password.length < 8) {
    return c.json({ error: '비밀번호는 8자 이상이어야 합니다' }, 400)
  }
  
  const db = c.env.DB
  const isSuperAdmin = c.get('isSuperAdmin')
  const requestCompanyId = c.get('companyId')
  
  // 권한 체크
  if (!isSuperAdmin && requestCompanyId !== companyId) {
    return c.json({ error: '접근 권한이 없습니다' }, 403)
  }
  
  // 회사 존재 여부 확인
  const company = await db.prepare('SELECT id FROM companies WHERE id = ?').bind(companyId).first()
  if (!company) {
    return c.json({ error: '회사를 찾을 수 없습니다' }, 404)
  }
  
  const id = 'user_' + crypto.randomUUID().slice(0, 8)
  
  // 사용자 추가
  await db.prepare(`
    INSERT INTO users (id, username, name, pw_hash, role, company_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, username, name, await hashPassword(password), role || 'user', companyId).run()
  
  return c.json({ success: true, user: { id, username, name, role, companyId } })
})

// 회사 통계 조회
companiesApi.get('/:id/stats', async (c) => {
  const companyId = c.req.param('id')
  const db = c.env.DB
  const isSuperAdmin = c.get('isSuperAdmin')
  const requestCompanyId = c.get('companyId')
  
  // 권한 체크
  if (!isSuperAdmin && requestCompanyId !== companyId) {
    return c.json({ error: '접근 권한이 없습니다' }, 403)
  }
  
  const stats = await db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE company_id = ?) as total_users,
      (SELECT COUNT(*) FROM ships WHERE company_id = ?) as total_ships,
      (SELECT COUNT(*) FROM projects p
       JOIN ships s ON s.id = p.ship_id
       WHERE s.company_id = ?
      ) as total_projects,
      (SELECT COUNT(DISTINCT ship_id) FROM projects p
       JOIN ships s ON s.id = p.ship_id
       WHERE s.company_id = ?
      ) as active_projects
  `).bind(companyId, companyId, companyId, companyId).first()
  
  return c.json({ stats: stats || {} })
})
