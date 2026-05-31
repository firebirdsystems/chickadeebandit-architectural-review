CREATE TABLE IF NOT EXISTS requests (
  household_id  UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
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
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS votes (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  request_id   TEXT NOT NULL,
  voter_id     TEXT NOT NULL,
  vote         TEXT NOT NULL,
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS comments (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  request_id   TEXT NOT NULL,
  author_id    TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE INDEX IF NOT EXISTS idx_arc_requests_status
  ON requests (household_id, status);

CREATE INDEX IF NOT EXISTS idx_arc_votes_request
  ON votes (household_id, request_id);

CREATE INDEX IF NOT EXISTS idx_arc_comments_request
  ON comments (household_id, request_id)
