SELECT
  r.id,
  r.title,
  r.category,
  r.unit_ref,
  r.status,
  r.submitted_by,
  r.created_at
FROM app_architectural_review__requests r
LEFT JOIN app_architectural_review__decisions d
  ON d.request_id = r.id
 AND d.decided_at = (
   SELECT MAX(d2.decided_at)
   FROM app_architectural_review__decisions d2
   WHERE d2.request_id = r.id
 )
WHERE d.request_id IS NULL
ORDER BY r.created_at DESC
LIMIT 100
