SELECT
  r.id,
  r.title,
  r.category,
  r.unit_ref,
  COALESCE(d.status, r.status) AS status,
  r.submitted_by,
  d.decided_by,
  d.decided_at,
  r.created_at
FROM app_architectural_review__requests r
LEFT JOIN app_architectural_review__decisions d
  ON d.request_id = r.id
ORDER BY r.created_at DESC
LIMIT 200
