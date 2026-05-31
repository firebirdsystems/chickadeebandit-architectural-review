CREATE TABLE IF NOT EXISTS settings (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  key          TEXT NOT NULL,
  value        TEXT NOT NULL DEFAULT '',
  PRIMARY KEY  (household_id, key)
);

ALTER TABLE requests ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private';
