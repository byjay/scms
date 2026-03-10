import { Hono } from 'hono'

type Bindings = { DB: D1Database }
export const projectApi = new Hono<{ Bindings: Bindings }>()

// List ships for user
projectApi.get('/ships', async (c) => {
  const groupId = c.req.query('groupId')
  const role = c.req.query('role')
  const db = c.env.DB
  let ships
  if (role === 'admin') {
    ships = await db.prepare('SELECT * FROM ships ORDER BY created_at DESC').all()
  } else {
    ships = await db.prepare('SELECT * FROM ships WHERE group_id = ? ORDER BY created_at DESC').bind(groupId || '').all()
  }
  return c.json({ ships: ships.results })
})

// Create ship
projectApi.post('/ships', async (c) => {
  const { name, shipNo, groupId, ownerId } = await c.req.json()
  if (!name) return c.json({ error: '호선명을 입력하세요' }, 400)
  const id = 'ship_' + crypto.randomUUID().slice(0, 8)
  const db = c.env.DB
  await db.prepare('INSERT INTO ships (id, name, ship_no, group_id, owner_id) VALUES (?, ?, ?, ?, ?)')
    .bind(id, name, shipNo || '', groupId || '', ownerId || '').run()
  return c.json({ id, name, shipNo, groupId })
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

// Load project data
projectApi.get('/load/:shipId', async (c) => {
  const shipId = c.req.param('shipId')
  const db = c.env.DB
  const proj = await db.prepare('SELECT * FROM projects WHERE ship_id = ? ORDER BY saved_at DESC LIMIT 1')
    .bind(shipId).first()
  if (!proj) return c.json({ data: null })
  return c.json({ data: JSON.parse(proj.data_json as string), savedAt: proj.saved_at, savedBy: proj.saved_by })
})
