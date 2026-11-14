-- Task groups ("tabs"). Every todo belongs to exactly one group.

CREATE TABLE task_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  position    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tab names are unique, ignoring case and surrounding spaces.
CREATE UNIQUE INDEX task_groups_name_unique ON task_groups (LOWER(TRIM(name)));
CREATE INDEX task_groups_position_idx ON task_groups (position);

ALTER TABLE todos
  ADD COLUMN group_id UUID REFERENCES task_groups (id) ON DELETE CASCADE;

-- Create the default tab and move every existing todo into it.
-- Positions are kept, so the current order is preserved. A data-modifying
-- CTE always runs, so the tab is created even when there are no todos.
WITH default_group AS (
  INSERT INTO task_groups (name, position)
  VALUES ('My Tasks', 0)
  RETURNING id
)
UPDATE todos SET group_id = (SELECT id FROM default_group);

ALTER TABLE todos ALTER COLUMN group_id SET NOT NULL;

-- Todos are now listed and ordered per group.
DROP INDEX IF EXISTS todos_position_idx;
CREATE INDEX todos_group_position_idx ON todos (group_id, position);
