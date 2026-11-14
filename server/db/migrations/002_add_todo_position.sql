-- Adds a persistent, user-controlled order to todos.
-- Lower position = higher in the list.

ALTER TABLE todos ADD COLUMN position INTEGER;

-- Backfill: keep the current visible order (newest first).
UPDATE todos AS t
SET position = ranked.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC, id) - 1 AS rn
  FROM todos
) AS ranked
WHERE t.id = ranked.id;

ALTER TABLE todos ALTER COLUMN position SET NOT NULL;

CREATE INDEX todos_position_idx ON todos (position);
