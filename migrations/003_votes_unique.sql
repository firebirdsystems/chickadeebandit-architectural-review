-- Enforce one vote per voter per request at the DB level.
-- The client already does DELETE + INSERT but without this constraint a race
-- or failed DELETE could leave duplicate rows that skew the tally.
CREATE UNIQUE INDEX IF NOT EXISTS uq_arc_votes_voter
  ON app_architectural_review__votes (request_id, voter_id);
