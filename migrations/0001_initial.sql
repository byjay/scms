-- SEcMS Database Schema
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pw_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  group_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups_tbl (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ships (Hull Numbers / Projects)
CREATE TABLE IF NOT EXISTS ships (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ship_no TEXT,
  group_id TEXT,
  owner_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Project data (cable + node data per ship)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  ship_id TEXT NOT NULL,
  data_json TEXT NOT NULL,
  saved_by TEXT,
  saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ship_id) REFERENCES ships(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_ship ON projects(ship_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_ships_group ON ships(group_id);
