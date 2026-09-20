CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_token TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  choice TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  submitted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS answers_by_device_time
  ON answers (device_token, submitted_at DESC);
