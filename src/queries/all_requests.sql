SELECT
  r.id,
  r.title,
  r.category,
  r.unit_ref,
  r.status,
  r.submitted_by,
  r.decided_by,
  r.decided_at,
  r.created_at
FROM app_architectural_review__requests r
ORDER BY r.created_at DESC
LIMIT 200
