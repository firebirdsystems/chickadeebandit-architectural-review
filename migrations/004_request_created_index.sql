-- all_requests and open_requests both order by created_at DESC under a LIMIT.
-- created_at is plaintext by the _at suffix rule, so the index gives the reads
-- an ordered walk that stops at the LIMIT rather than a full scan plus a sort
-- of every request in the table.
CREATE INDEX IF NOT EXISTS idx_arc_requests_created
  ON app_architectural_review__requests(created_at);
