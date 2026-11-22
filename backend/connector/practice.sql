CREATE TABLE IF NOT EXISTS listening_attempts (
  id TEXT PRIMARY KEY,
  profile_hash TEXT NOT NULL,
  level TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  exercise TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  graded_at INTEGER,
  result TEXT
);
CREATE INDEX IF NOT EXISTS listening_attempts_profile
  ON listening_attempts (profile_hash, level, created_at DESC);
CREATE INDEX IF NOT EXISTS listening_attempts_expiry
  ON listening_attempts (expires_at);
