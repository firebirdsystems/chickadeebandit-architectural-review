-- Committee decisions move out of the (owner-writable) requests row into a
-- committee-only child table (inherit_visibility + insert_privileged_only via the
-- committee group). Effective status is derived from this table, so a homeowner can
-- no longer approve their own request by writing status/decision on their own row.
-- `status` is plaintext (it's in the encryption skip-list); `rationale` mirrors the
-- old decision_note and is encrypted at rest / decrypted on read.
CREATE TABLE IF NOT EXISTS app_architectural_review__decisions (
  request_id  TEXT NOT NULL PRIMARY KEY,
  status      TEXT NOT NULL,
  rationale   TEXT NOT NULL DEFAULT '',
  decided_by  TEXT NOT NULL,
  decided_at  TEXT NOT NULL
);

INSERT OR IGNORE INTO app_architectural_review__decisions (request_id, status, rationale, decided_by, decided_at)
  SELECT id, status, decision_note, COALESCE(decided_by, submitted_by), COALESCE(decided_at, updated_at)
  FROM app_architectural_review__requests
  WHERE status IN ('approved', 'approved_with_conditions', 'denied');
