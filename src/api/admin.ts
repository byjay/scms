import { Hono, MiddlewareHandler } from 'hono'
import { hashPassword } from '../utils/authUtils'

type Bindings = { DB: D1Database }
export const adminApi = new Hono<{ Bindings: Bindings }>()

// Admin-only middleware: Admins and Super Admins can access admin API
const requireAdmin: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: '인증이 필요합니다' }, 401)
  }
  
  const userId = authHeader.replace('Bearer ', '')
  const db = c.env.DB
  
  const user: any = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first()
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return c.json({ error: '관리자 권한이 필요합니다' }, 403)
  }
  
  await next()
}

// Apply admin-only middleware to all routes
adminApi.use('*', requireAdmin)

// List users (with company filtering)
adminApi.get('/users', async (c) => {
  const db = c.env.DB
  const users = await db.prepare('SELECT id, username, name, role, group_id, company_id, created_at FROM users ORDER BY created_at').all()
  return c.json({ users: users.results })
})

// Add user
adminApi.post('/users', async (c) => {
  const { username, password, name, role, groupId, companyId } = await c.req.json()
  if (!username || !password || !name) return c.json({ error: '필수 항목을 모두 입력하세요' }, 400)
  if (password.length < 8) return c.json({ error: '비밀번호는 8자 이상이어야 합니다' }, 400)
  
  const id = 'user_' + crypto.randomUUID().slice(0, 8)
  const db = c.env.DB
  
  const existingUser = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
  if (existingUser) return c.json({ error: '이미 존재하는 아이디입니다' }, 400)
  
  await db.prepare('INSERT INTO users (id, username, name, pw_hash, role, group_id, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, username, name, await hashPassword(password), role || 'user', groupId || '', companyId || '').run()
  return c.json({ id, username, name, role, groupId, companyId })
})

// Delete user
adminApi.delete('/users/:id', async (c) => {
  const id = c.req.param('id')
  if (id === 'admin') return c.json({ error: '최고관리자는 삭제할 수 없습니다' }, 400)
  const db = c.env.DB
  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Update user
adminApi.put('/users/:id', async (c) => {
  const id = c.req.param('id')
  const { role, groupId, companyId, name } = await c.req.json()
  const db = c.env.DB
  
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
  if (!user) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
  
  await db.prepare('UPDATE users SET role = ?, group_id = ?, company_id = ?, name = ? WHERE id = ?')
    .bind(role, groupId || '', companyId || '', name || '', id).run()
  return c.json({ success: true })
})

// Reset user password
adminApi.post('/users/:id/reset-password', async (c) => {
  const id = c.req.param('id')
  const { newPassword } = await c.req.json()
  if (!newPassword || newPassword.length < 8) {
    return c.json({ error: '비밀번호는 8자 이상이어야 합니다' }, 400)
  }
  const db = c.env.DB
  await db.prepare('UPDATE users SET pw_hash = ? WHERE id = ?').bind(await hashPassword(newPassword), id).run()
  return c.json({ success: true })
})

// List groups (legacy - now lists companies)
adminApi.get('/groups', async (c) => {
  const db = c.env.DB
  const groups = await db.prepare('SELECT * FROM groups_tbl ORDER BY created_at').all()
  return c.json({ groups: groups.results })
})

// Add group (legacy)
adminApi.post('/groups', async (c) => {
  const { name } = await c.req.json()
  if (!name) return c.json({ error: '그룹명을 입력하세요' }, 400)
  const id = 'grp_' + crypto.randomUUID().slice(0, 8)
  const db = c.env.DB
  await db.prepare('INSERT INTO groups_tbl (id, name) VALUES (?, ?)').bind(id, name).run()
  return c.json({ id, name })
})

// Delete group (legacy)
adminApi.delete('/groups/:id', async (c) => {
  const id = c.req.param('id')
  if (id === 'grp_default') return c.json({ error: '기본 그룹은 삭제할 수 없습니다' }, 400)
  const db = c.env.DB
  await db.prepare('DELETE FROM groups_tbl WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})
