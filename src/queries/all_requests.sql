SELECT
  r.id,
  r.title,
  r.category,
  r.unit_ref,
  -- Use the committee decisions table as the authoritative status source.
  -- If no decision exists and requests.status claims a terminal value, a submitter
  -- self-wrote it via direct SQL. Treat as under_review so false approvals
  -- don't surface in AI exports (mirrors applyDecisions() in the client).
  COALESCE(d.status,
    CASE WHEN r.status IN ('approved', 'approved_with_conditions', 'denied')
      THEN 'under_review'
      ELSE r.status
    END
  ) AS status,
  r.submitted_by,
  d.decided_by,
  d.decided_at,
  r.created_at
FROM app_architectural_review__requests r
LEFT JOIN app_architectural_review__decisions d
  ON d.request_id = r.id
ORDER BY r.created_at DESC
LIMIT 200
