import { useRef, useState } from 'react';

import TabNameInput from './TabNameInput';

export const tabId = (groupId) => `tab-${groupId}`;
export const TAB_PANEL_ID = 'task-group-panel';

/**
 * The row of tabs. Follows the WAI-ARIA tabs pattern: one Tab stop for the
 * whole list, arrow keys / Home / End move between tabs and select them.
 */
function TaskGroupTabs({
  groups,
  activeGroupId,
  onSelect,
  onCreate,
  onRename,
  onRequestDelete,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const tabRefs = useRef(new Map());

  const activeGroup = groups.find((group) => group.id === activeGroupId);

  function focusAndSelect(index) {
    const group = groups[(index + groups.length) % groups.length];
    onSelect(group.id);
    tabRefs.current.get(group.id)?.focus();
  }

  function handleTabKeyDown(event, index) {
    const moves = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: groups.length - 1,
    };

    if (event.key in moves) {
      event.preventDefault();
      focusAndSelect(moves[event.key]);
    }
  }

  async function handleCreate(name) {
    const created = await onCreate(name);
    if (created) setIsAdding(false);
    return created;
  }

  async function handleRename(name) {
    const renamed = await onRename(renamingId, name);
    if (renamed) setRenamingId(null);
    return renamed;
  }

  return (
    <div className="tabs-bar">
      <div className="tabs" role="tablist" aria-label="Task groups">
        {groups.map((group, index) =>
          group.id === renamingId ? (
            <TabNameInput
              key={group.id}
              label={`New name for tab ${group.name}`}
              initialValue={group.name}
              onSave={handleRename}
              onCancel={() => setRenamingId(null)}
            />
          ) : (
            <button
              key={group.id}
              ref={(node) => {
                if (node) tabRefs.current.set(group.id, node);
                else tabRefs.current.delete(group.id);
              }}
              type="button"
              role="tab"
              id={tabId(group.id)}
              aria-selected={group.id === activeGroupId}
              aria-controls={TAB_PANEL_ID}
              tabIndex={group.id === activeGroupId ? 0 : -1}
              onClick={() => onSelect(group.id)}
              onDoubleClick={() => setRenamingId(group.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {group.name}
            </button>
          )
        )}

        {isAdding ? (
          <TabNameInput
            label="New tab name"
            onSave={handleCreate}
            onCancel={() => setIsAdding(false)}
          />
        ) : (
          <button
            type="button"
            className="tab-add"
            onClick={() => setIsAdding(true)}
          >
            + New tab
          </button>
        )}
      </div>

      {activeGroup && (
        <div className="tab-actions">
          <button
            type="button"
            onClick={() => setRenamingId(activeGroup.id)}
            aria-label={`Rename tab ${activeGroup.name}`}
          >
            Rename
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => onRequestDelete(activeGroup)}
            disabled={groups.length === 1}
            title={groups.length === 1 ? "You can't delete your only tab" : undefined}
            aria-label={`Delete tab ${activeGroup.name}`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskGroupTabs;
