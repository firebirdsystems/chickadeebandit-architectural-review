-- Votes are append-only. The UI and exports derive each committee member's
-- current vote from the latest row per voter/request.
CREATE INDEX IF NOT EXISTS idx_arc_votes_voter_created
  ON app_architectural_review__votes (request_id, voter_id, created_at);
