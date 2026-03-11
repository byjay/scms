/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authApi } from './api/auth'
import { projectApi } from './api/projects'
import { adminApi } from './api/admin'
import { companiesApi } from './api/companies'
import { securityApi } from './api/security'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// Auto-initialize DB on first API request
app.use('/api/*', async (c, next) => {
  try {
    await c.env.DB.prepare('SELECT 1 FROM users LIMIT 1').first()
  } catch (e) {
    // Tables don't exist, create them
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, pw_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', group_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS groups_tbl (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS ships (id TEXT PRIMARY KEY, name TEXT NOT NULL, ship_no TEXT, group_id TEXT, owner_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, ship_id TEXT NOT NULL, data_json TEXT NOT NULL, saved_by TEXT, saved_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      INSERT OR IGNORE INTO groups_tbl (id, name) VALUES ('grp_default', '기본 그룹');
      -- Default admin with initial insecure hash (migration support) or just set to something secure if reset
      INSERT OR IGNORE INTO users (id, username, name, pw_hash, role, group_id) VALUES ('admin', 'admin', '최고관리자', 'hg10hvh8', 'admin', 'grp_default');
    `)
  }
  await next()
})

// API Routes
app.route('/api/auth', authApi)
app.route('/api/projects', projectApi)
app.route('/api/admin', adminApi)
app.route('/api/companies', companiesApi)
app.route('/api/security', securityApi)
app.route('/api/cad', cadApi)

// Serve static files
app.get('/static/*', async (c) => {
  return c.notFound()
})

// UI Entry Point
app.get('*', (c) => {
  // Use host to detect local development (localhost or 127.0.0.1)
  const host = c.req.header('host') || ''
  const isProd = !host.includes('localhost') && !host.includes('127.0.0.1')
  const scriptSrc = isProd ? '/static/main.js' : '/src/main.tsx'

  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SCMS — SEASTAR Cable Management System V6</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@100..900&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" crossorigin="anonymous"></script>
  <style>
    body { font-family: 'Pretendard', sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
    #root { min-height: 100vh; }
    /* Dashboard compatibility classes */
    .glass-panel { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="${scriptSrc}"></script>
</body>
</html>`)
})

export default app
