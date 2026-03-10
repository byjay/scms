import { Hono } from 'hono'

type Bindings = { DB: D1Database }
export const adminApi = new Hono<{ Bindings: Bindings }>()

function hashPw(pw: string): string {
  let h = 0
  for (let i = 0; i < pw.length; i++) { h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0 }
  return 'h' + Math.abs(h).toString(36) + pw.length
}

// List users
adminApi.get('/users', async (c) => {
  const db = c.env.DB
  const users = await db.prepare('SELECT id, username, name, role, group_id, created_at FROM users ORDER BY created_at').all()
  return c.json({ users: users.results })
})

// Add user
adminApi.post('/users', async (c) => {
  const { username, password, name, role, groupId } = await c.req.json()
  if (!username || !password || !name) return c.json({ error: '필수 항목을 모두 입력하세요' }, 400)
  const id = 'user_' + crypto.randomUUID().slice(0, 8)
  const db = c.env.DB
  try {
    await db.prepare('INSERT INTO users (id, username, name, pw_hash, role, group_id) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, username, name, hashPw(password), role || 'user', groupId || '').run()
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return c.json({ error: '이미 존재하는 아이디입니다' }, 400)
    throw e
  }
  return c.json({ id, username, name, role, groupId })
})

// Delete user
adminApi.delete('/users/:id', async (c) => {
  const id = c.req.param('id')
  if (id === 'admin') return c.json({ error: '최고관리자는 삭제할 수 없습니다' }, 400)
  const db = c.env.DB
  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Update user role
adminApi.put('/users/:id', async (c) => {
  const id = c.req.param('id')
  const { role, groupId, name } = await c.req.json()
  const db = c.env.DB
  await db.prepare('UPDATE users SET role = ?, group_id = ?, name = ? WHERE id = ?')
    .bind(role, groupId || '', name || '', id).run()
  return c.json({ success: true })
})

// Reset user password
adminApi.post('/users/:id/reset-password', async (c) => {
  const id = c.req.param('id')
  const { newPassword } = await c.req.json()
  const db = c.env.DB
  await db.prepare('UPDATE users SET pw_hash = ? WHERE id = ?').bind(hashPw(newPassword), id).run()
  return c.json({ success: true })
})

// List groups
adminApi.get('/groups', async (c) => {
  const db = c.env.DB
  const groups = await db.prepare('SELECT * FROM groups_tbl ORDER BY created_at').all()
  return c.json({ groups: groups.results })
})

// Add group
adminApi.post('/groups', async (c) => {
  const { name } = await c.req.json()
  if (!name) return c.json({ error: '그룹명을 입력하세요' }, 400)
  const id = 'grp_' + crypto.randomUUID().slice(0, 8)
  const db = c.env.DB
  await db.prepare('INSERT INTO groups_tbl (id, name) VALUES (?, ?)').bind(id, name).run()
  return c.json({ id, name })
})

// Delete group
adminApi.delete('/groups/:id', async (c) => {
  const id = c.req.param('id')
  if (id === 'grp_default') return c.json({ error: '기본 그룹은 삭제할 수 없습니다' }, 400)
  const db = c.env.DB
  await db.prepare('DELETE FROM groups_tbl WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})
