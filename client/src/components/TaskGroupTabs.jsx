import { useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

import TabNameInput from './TabNameInput';

export const tabId = (groupId) => `tab-${groupId}`;
export const TAB_PANEL_ID = 'task-group-panel';

// One draggable tab. The whole tab is the drag handle: a click (no movement)
// still selects it, because dragging only starts after the pointer moves 5px.
function SortableTab({
  group,
  isActive,
  isDragDisabled,
  isAnyDragActive,
  tabRef,
  onSelect,
  onStartRename,
  onArrowKey,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  function handleKeyDown(event) {
    // While a keyboard drag is active the arrow keys move the tab, so they
    // must not also switch tabs.
    if (!isAnyDragActive) onArrowKey(event);
    if (!event.defaultPrevented) listeners?.onKeyDown?.(event);
  }

  return (
    <button
      ref={(node) => {
        setNodeRef(node);
        tabRef(node);
      }}
      style={style}
      type="button"
      {...attributes}
      {...listeners}
      // Overrides for dnd-kit's defaults (role="button", tabIndex 0, "sortable"):
      // this is still a tab in a tablist, with a single Tab stop.
      role="tab"
      aria-roledescription="draggable tab"
      id={tabId(group.id)}
      aria-selected={isActive}
      aria-controls={TAB_PANEL_ID}
      tabIndex={isActive ? 0 : -1}
      className={isDragging ? 'dragging' : undefined}
      onClick={() => onSelect(group.id)}
      onDoubleClick={() => onStartRename(group.id)}
      onKeyDown={handleKeyDown}
    >
      {group.name}
    </button>
  );
}

/**
 * The row of tabs. Follows the WAI-ARIA tabs pattern: one Tab stop for the
 * whole list, arrow keys / Home / End move between tabs and select them.
 * Tabs can be reordered by dragging, or from the keyboard with Space/Enter,
 * the arrow keys, and Space/Enter again to drop.
 */
function TaskGroupTabs({
  groups,
  activeGroupId,
  onSelect,
  onCreate,
  onRename,
  onRequestDelete,
  onReorder,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const tabRefs = useRef(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeGroup = groups.find((group) => group.id === activeGroupId);
  const isEditing = isAdding || renamingId !== null;

  function focusAndSelect(index) {
    const group = groups[(index + groups.length) % groups.length];
    onSelect(group.id);
    tabRefs.current.get(group.id)?.focus();
  }

  function handleArrowKey(event, index) {
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

  function handleDragEnd({ active, over }) {
    setDraggingId(null);
    if (over && active.id !== over.id) {
      onReorder(active.id, over.id);
    }
  }

  // Screen-reader announcements that use tab names instead of raw UUIDs
  const nameOf = (id) => groups.find((group) => group.id === id)?.name ?? 'Tab';
  const positionOf = (id) => groups.findIndex((group) => group.id === id) + 1;
  const total = groups.length;

  const accessibility = {
    screenReaderInstructions: {
      draggable:
        'To reorder this tab, press Space or Enter, use the left and right arrow keys ' +
        'to move it, then press Space or Enter to drop. Press Escape to cancel.',
    },
    announcements: {
      onDragStart: ({ active }) =>
        `Picked up tab "${nameOf(active.id)}", position ${positionOf(active.id)} of ${total}.`,
      onDragOver: ({ active, over }) =>
        over
          ? `Tab "${nameOf(active.id)}" moved to position ${positionOf(over.id)} of ${total}.`
          : `Tab "${nameOf(active.id)}" is no longer over the tab list.`,
      onDragEnd: ({ active, over }) =>
        over
          ? `Tab "${nameOf(active.id)}" dropped at position ${positionOf(over.id)} of ${total}.`
          : `Tab "${nameOf(active.id)}" dropped.`,
      onDragCancel: ({ active }) =>
        `Reordering cancelled. Tab "${nameOf(active.id)}" returned to position ${positionOf(active.id)}.`,
    },
  };

  return (
    <div className="tabs-bar">
      <div className="tabs" role="tablist" aria-label="Task groups">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
          accessibility={accessibility}
          onDragStart={({ active }) => setDraggingId(active.id)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDraggingId(null)}
        >
          <SortableContext
            items={groups.map((group) => group.id)}
            strategy={horizontalListSortingStrategy}
          >
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
                <SortableTab
                  key={group.id}
                  group={group}
                  isActive={group.id === activeGroupId}
                  // No dragging while a name is being typed, or with one tab
                  isDragDisabled={isEditing || groups.length < 2}
                  isAnyDragActive={draggingId !== null}
                  tabRef={(node) => {
                    if (node) tabRefs.current.set(group.id, node);
                    else tabRefs.current.delete(group.id);
                  }}
                  onSelect={onSelect}
                  onStartRename={setRenamingId}
                  onArrowKey={(event) => handleArrowKey(event, index)}
                />
              )
            )}
          </SortableContext>
        </DndContext>

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
