const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'kaufpark.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('operator','admin'))
);

CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PENDIENTE','EN_PROCESO','FINALIZADO')),
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`);

// Seed default users if none
const usersCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (usersCount === 0) {
  const hashAdmin = bcrypt.hashSync('admin123', 10);
  const hashOperator = bcrypt.hashSync('operator123', 10);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hashAdmin, 'admin');
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('operator', hashOperator, 'operator');
}

// Helper functions
function getConfig(key) {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setConfig(key, value) {
  db.prepare('INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

function recordScan(spot) {
  const now = new Date().toISOString();
  db.prepare('INSERT INTO scans (spot, created_at) VALUES (?, ?)').run(spot, now);
}

function createServiceRequest(spot) {
  const now = new Date().toISOString();
  const info = db.prepare('INSERT INTO service_requests (spot, status, created_at) VALUES (?, ?, ?)').run(spot, 'PENDIENTE', now);
  return info.lastInsertRowid;
}

function listPendingRequests() {
  return db.prepare("SELECT * FROM service_requests WHERE status != 'FINALIZADO' ORDER BY created_at ASC, spot ASC").all();
}

function listAllRequests() {
  return db.prepare('SELECT * FROM service_requests ORDER BY created_at DESC').all();
}

function findUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function updateRequestStatus(id, status) {
  const now = new Date().toISOString();
  if (status === 'EN_PROCESO') {
    db.prepare('UPDATE service_requests SET status = ?, started_at = COALESCE(started_at, ?) WHERE id = ?').run(status, now, id);
  } else if (status === 'FINALIZADO') {
    db.prepare('UPDATE service_requests SET status = ?, finished_at = COALESCE(finished_at, ?) WHERE id = ?').run(status, now, id);
  } else {
    db.prepare('UPDATE service_requests SET status = ? WHERE id = ?').run(status, id);
  }
}

function getStats() {
  const scansCount = db.prepare('SELECT COUNT(*) as c FROM scans').get().c;
  const completedCount = db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE status = 'FINALIZADO'").get().c;

  const avgAttention = db.prepare(`
    SELECT AVG((julianday(started_at) - julianday(created_at)) * 24 * 60) as minutes
    FROM service_requests
    WHERE started_at IS NOT NULL
  `).get().minutes;

  const avgService = db.prepare(`
    SELECT AVG((julianday(finished_at) - julianday(started_at)) * 24 * 60) as minutes
    FROM service_requests
    WHERE finished_at IS NOT NULL AND started_at IS NOT NULL
  `).get().minutes;

  return {
    scansCount,
    completedCount,
    avgAttentionMinutes: avgAttention ? Number(avgAttention).toFixed(1) : 'N/A',
    avgServiceMinutes: avgService ? Number(avgService).toFixed(1) : 'N/A'
  };
}

module.exports = {
  db,
  getConfig,
  setConfig,
  recordScan,
  createServiceRequest,
  listPendingRequests,
  listAllRequests,
  findUserByUsername,
  updateRequestStatus,
  getStats
};

