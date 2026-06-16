SELECT
  r.id,
  r.title,
  r.category,
  r.unit_ref,
  r.status,
  r.submitted_by,
  r.created_at
FROM app_architectural_review__requests r
WHERE r.status IN ('pending', 'under_review')
ORDER BY r.created_at DESC
LIMIT 100
