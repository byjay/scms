import { Hono } from 'hono'

type Bindings = { DB: D1Database }
export const authApi = new Hono<{ Bindings: Bindings }>()

function hashPw(pw: string): string {
  let h = 0
  for (let i = 0; i < pw.length; i++) { h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0 }
  return 'h' + Math.abs(h).toString(36) + pw.length
}

// Login
authApi.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) return c.json({ error: '아이디와 비밀번호를 입력하세요' }, 400)

  const db = c.env.DB
  const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
  if (!user || user.pw_hash !== hashPw(password)) {
    return c.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' }, 401)
  }
  const token = crypto.randomUUID()
  return c.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role, groupId: user.group_id }
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
    user: { id: user.id, username: user.username, name: user.name, role: user.role, groupId: user.group_id }
  })
})

// Change password
authApi.post('/change-password', async (c) => {
  const { userId, oldPassword, newPassword } = await c.req.json()
  const db = c.env.DB
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!user || user.pw_hash !== hashPw(oldPassword)) {
    return c.json({ error: '현재 비밀번호가 올바르지 않습니다' }, 401)
  }
  await db.prepare('UPDATE users SET pw_hash = ? WHERE id = ?').bind(hashPw(newPassword), userId).run()
  return c.json({ success: true })
})
