CREATE TABLE IF NOT EXISTS app_architectural_review__requests (
  id            TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'other',
  unit_ref      TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending',
  submitted_by  TEXT NOT NULL,
  decision_note TEXT NOT NULL DEFAULT '',
  decided_at    TEXT,
  decided_by    TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  visibility    TEXT NOT NULL DEFAULT 'private',
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_architectural_review__settings (
  key          TEXT NOT NULL,
  value        TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS app_architectural_review__votes (
  id           TEXT NOT NULL,
  request_id   TEXT NOT NULL,
  voter_id     TEXT NOT NULL,
  vote         TEXT NOT NULL,
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_architectural_review__comments (
  id           TEXT NOT NULL,
  request_id   TEXT NOT NULL,
  author_id    TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_arc_requests_status
  ON app_architectural_review__requests (status);

CREATE INDEX IF NOT EXISTS idx_arc_votes_request
  ON app_architectural_review__votes (request_id);

CREATE INDEX IF NOT EXISTS idx_arc_comments_request
  ON app_architectural_review__comments (request_id);
