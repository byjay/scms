-- Seed initial admin user and default group
INSERT OR IGNORE INTO groups_tbl (id, name) VALUES ('grp_default', '기본 그룹');
INSERT OR IGNORE INTO users (id, username, name, pw_hash, role, group_id)
  VALUES ('admin', 'admin', '최고관리자', 'hg10hvh8', 'admin', 'grp_default');
