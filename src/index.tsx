import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authApi } from './api/auth'
import { projectApi } from './api/projects'
import { adminApi } from './api/admin'

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
      INSERT OR IGNORE INTO users (id, username, name, pw_hash, role, group_id) VALUES ('admin', 'admin', '최고관리자', 'hg10hvh8', 'admin', 'grp_default');
    `)
  }
  await next()
})

// API Routes
app.route('/api/auth', authApi)
app.route('/api/projects', projectApi)
app.route('/api/admin', adminApi)

// Serve static files
app.get('/static/*', async (c) => {
  return c.notFound()
})

// SPA - serve index.html for all non-API routes
app.get('*', (c) => {
  return c.html(getIndexHtml())
})

function getIndexHtml() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEASTAR CMS V6 — Cable Management System</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;900&family=JetBrains+Mono:wght@300;400;600&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" crossorigin="anonymous"></script>
  <script>
    (function(){var cdns=['https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js','https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js'];var i=0;function t(){if(i>=cdns.length)return;var s=document.createElement('script');s.src=cdns[i];s.crossOrigin='anonymous';s.onerror=function(){i++;t()};document.head.appendChild(s)}t()})();
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="/static/app.css">
</head>
<body>
  <div id="app"></div>
  <script src="/static/app.js"></script>
</body>
</html>`
}

export default app
