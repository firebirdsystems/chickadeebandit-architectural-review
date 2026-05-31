SELECT
  r.id,
  r.title,
  r.category,
  r.unit_ref,
  r.status,
  r.submitted_by,
  r.created_at
FROM requests r
WHERE r.household_id = current_setting('app.household_id', true)::uuid
  AND r.status IN ('pending', 'under_review')
ORDER BY r.created_at DESC
LIMIT 100
