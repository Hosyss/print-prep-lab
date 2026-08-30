CREATE TABLE IF NOT EXISTS auth_settings (
  id TEXT PRIMARY KEY CHECK (id = 'totp'),
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TEXT NOT NULL,
  verified_at TEXT
);
