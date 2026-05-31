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
FROM requests r
WHERE r.household_id = current_setting('app.household_id', true)::uuid
ORDER BY r.created_at DESC
LIMIT 200
