PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS configs (
  id TEXT PRIMARY KEY CHECK (id = 'draft'),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  payload TEXT NOT NULL,
  checksum TEXT NOT NULL CHECK (length(checksum) = 64),
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('update', 'restore')),
  revision INTEGER NOT NULL CHECK (revision >= 0),
  payload TEXT NOT NULL,
  checksum TEXT NOT NULL CHECK (length(checksum) = 64),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS backups_created_at_idx
ON backups(created_at DESC);

CREATE TABLE IF NOT EXISTS published_snapshots (
  id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  payload TEXT NOT NULL,
  checksum TEXT NOT NULL CHECK (length(checksum) = 64),
  published_by TEXT NOT NULL,
  published_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS published_snapshots_created_at_idx
ON published_snapshots(published_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  occurred_at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  request_id TEXT NOT NULL,
  metadata TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL UNIQUE CHECK (length(entry_hash) = 64)
);

CREATE INDEX IF NOT EXISTS audit_log_occurred_at_idx
ON audit_log(occurred_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 1),
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_expiry_idx
ON rate_limits(expires_at);
