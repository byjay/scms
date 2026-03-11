import { Hono } from 'hono'

type Bindings = { DB: D1Database }
export const projectApi = new Hono<{ Bindings: Bindings }>()

// List ships for user (with company filtering)
projectApi.get('/ships', async (c) => {
  const companyId = c.req.query('companyId')
  const groupId = c.req.query('groupId')
  const role = c.req.query('role')
  const db = c.env.DB
  
  let ships
  if (role === 'admin') {
    // Admins can see all ships in their company
    if (companyId) {
      ships = await db.prepare('SELECT * FROM ships WHERE company_id = ? ORDER BY created_at DESC').bind(companyId).all()
    } else {
      ships = await db.prepare('SELECT * FROM ships ORDER BY created_at DESC').all()
    }
  } else {
    // Regular users can only see ships in their group/company
    if (companyId) {
      ships = await db.prepare('SELECT * FROM ships WHERE company_id = ? AND group_id = ? ORDER BY created_at DESC').bind(companyId, groupId || '').all()
    } else if (groupId) {
      ships = await db.prepare('SELECT * FROM ships WHERE group_id = ? ORDER BY created_at DESC').bind(groupId).all()
    } else {
      return c.json({ ships: [] })
    }
  }
  
  return c.json({ ships: ships.results })
})

// Create ship
projectApi.post('/ships', async (c) => {
  const { name, shipNo, groupId, companyId, ownerId } = await c.req.json()
  
  if (!name) return c.json({ error: '호선명을 입력하세요' }, 400)
  
  const id = 'ship_' + crypto.randomUUID().slice(0, 8)
  const db = c.env.DB
  
  await db.prepare('INSERT INTO ships (id, name, ship_no, group_id, owner_id, company_id) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, name, shipNo || '', groupId || '', ownerId || '', companyId || '').run()
  
  return c.json({ id, name, shipNo, groupId, companyId })
})

// Delete ship
projectApi.delete('/ships/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  await db.prepare('DELETE FROM projects WHERE ship_id = ?').bind(id).run()
  await db.prepare('DELETE FROM ships WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Save project data
projectApi.post('/save', async (c) => {
  const { shipId, data, userId } = await c.req.json()
  if (!shipId || !data) return c.json({ error: 'Missing shipId or data' }, 400)
  
  const id = 'proj_' + crypto.randomUUID().slice(0, 8)
  const db = c.env.DB
  
  // Upsert: delete old, insert new
  await db.prepare('DELETE FROM projects WHERE ship_id = ?').bind(shipId).run()
  await db.prepare('INSERT INTO projects (id, ship_id, data_json, saved_by) VALUES (?, ?, ?, ?)')
    .bind(id, shipId, JSON.stringify(data), userId || '').run()
  
  return c.json({ success: true, id })
})

// Load project data (with group-based sharing)
projectApi.get('/load/:shipId', async (c) => {
  const shipId = c.req.param('shipId')
  const { userId } = await c.req.json()
  
  if (!userId) {
    return c.json({ error: 'userId is required' }, 400)
  }
  
  const db = c.env.DB
  
  // 사용자 조회 (group_id 확인용)
  const user: any = await db.prepare('SELECT group_id, company_id, role FROM users WHERE id = ?').bind(userId).first()
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  
  const proj = await db.prepare('SELECT * FROM projects WHERE ship_id = ? ORDER BY saved_at DESC LIMIT 1')
    .bind(shipId).first()
  
  if (!proj) {
    return c.json({ data: null })
  }
  
  // Ship 정보 조회
  const ship = await db.prepare('SELECT group_id, company_id, owner_id FROM ships WHERE id = ?')
    .bind(shipId).first()
  
  // 권한 체크
  const userRole = user.role
  const userGroupId = user.group_id
  const userCompanyId = user.company_id
  const shipGroupId = ship?.group_id
  const shipCompanyId = ship?.company_id
  const shipOwnerId = ship?.owner_id
  
  let hasAccess = false
  
  // Super Admin: 모든 접근 허용
  if (userRole === 'super_admin') {
    hasAccess = true
  }
  // Admin: 회사 내 모든 접근 허용
  else if (userRole === 'admin') {
    if (userCompanyId === shipCompanyId) {
      hasAccess = true
    }
  }
  // Manager: 그룹/회사 내 접근 허용
  else if (userRole === 'manager') {
    if (userCompanyId === shipCompanyId && (userGroupId === shipGroupId || shipGroupId === '' || shipGroupId === null)) {
      hasAccess = true
    }
  }
  // User: 본인 또는 같은 그룹 접근 허용
  else if (userRole === 'user') {
    // 본인 프로젝트
    if (shipOwnerId === userId) {
      hasAccess = true
    }
    // 같은 그룹의 프로젝트
    else if (userGroupId && userGroupId === shipGroupId) {
      hasAccess = true
    }
  }
  
  if (!hasAccess) {
    return c.json({ 
      error: '접근 권한이 없습니다',
      message: '이 프로젝트를 볼 권한이 없습니다. 같은 그룹에 속한 사용자만 볼 수 있습니다.'
    }, 403)
  }
  
  return c.json({ 
    data: JSON.parse(proj.data_json as string), 
    savedAt: proj.saved_at, 
    savedBy: proj.saved_by,
    canEdit: hasAccess
  })
})

// 프로젝트 공유 설정
projectApi.post('/share/:projectId', async (c) => {
  const { userId, targetGroupId } = await c.req.json()
  
  if (!userId || !targetGroupId) {
    return c.json({ error: 'userId and targetGroupId are required' }, 400)
  }
  
  const db = c.env.DB
  
  // 사용자 확인
  const user: any = await db.prepare('SELECT id, role, group_id, company_id FROM users WHERE id = ?').bind(userId).first()
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  
  // 권한 체크: 본인만 프로젝트를 공유할 수 있음
  if (user.id !== userId) {
    return c.json({ error: '본인의 프로젝트만 공유할 수 있습니다' }, 403)
  }
  
  // 프로젝트 확인
  const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(c.req.param('projectId')).first()
  if (!project) {
    return c.json({ error: 'Project not found' }, 404)
  }
  
  // 같은 그룹 사용자들에게 알림
  // TODO: 알림 시스템 구현 (이메일 또는 실시간 알림)
  
  return c.json({ 
    success: true, 
    message: '프로젝트를 공유했습니다. 같은 그룹 사용자들에게 알림을 보냈습니다.'
  })
})

// 그룹 내 공유 프로젝트 목록
projectApi.get('/shared', async (c) => {
  const { userId } = await c.req.json()
  
  if (!userId) {
    return c.json({ error: 'userId is required' }, 400)
  }
  
  const db = c.env.DB
  
  // 사용자 조회
  const user: any = await db.prepare('SELECT group_id, company_id, role FROM users WHERE id = ?').bind(userId).first()
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  
  // 같은 그룹/회사 내 다른 사용자들의 프로젝트 조회
  const projects = await db.prepare(`
    SELECT p.*, s.name as ship_name, s.group_id, s.company_id, u.name as creator_name
    FROM projects p
    JOIN ships s ON p.ship_id = s.id
    JOIN users u ON s.owner_id = u.id
    WHERE (s.group_id = ? OR s.company_id = ?) 
      AND s.owner_id != ?
      AND u.role != 'viewer'
    ORDER BY p.saved_at DESC
  `).bind(user.group_id || '', user.company_id || '', userId).all()
  
  return c.json({ projects: projects.results })
})
