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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';

import TodoItem from './TodoItem';
import SortableTodoItem from './SortableTodoItem';

function TodoList({ todos, isReorderable, onReorder, onToggle, onDelete, onEdit }) {
  const sensors = useSensors(
    // Require a small movement so a click on the handle isn't treated as a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Space/Enter to pick up, arrow keys to move, Space/Enter to drop, Esc to cancel
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (todos.length === 0) {
    return <p className="empty-state">No tasks found.</p>;
  }

  const itemProps = { onToggle, onDelete, onEdit };

  if (!isReorderable) {
    return (
      <div className="todo-list">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} {...itemProps} />
        ))}
      </div>
    );
  }

  // Screen-reader announcements that use titles instead of raw UUIDs
  const titleOf = (id) => todos.find((todo) => todo.id === id)?.title ?? 'Task';
  const positionOf = (id) => todos.findIndex((todo) => todo.id === id) + 1;
  const total = todos.length;

  const accessibility = {
    screenReaderInstructions: {
      draggable:
        'To reorder, press Space or Enter on the handle, use the arrow keys to move, ' +
        'then press Space or Enter to drop. Press Escape to cancel.',
    },
    announcements: {
      onDragStart: ({ active }) =>
        `Picked up "${titleOf(active.id)}", position ${positionOf(active.id)} of ${total}.`,
      onDragOver: ({ active, over }) =>
        over
          ? `"${titleOf(active.id)}" moved to position ${positionOf(over.id)} of ${total}.`
          : `"${titleOf(active.id)}" is no longer over the list.`,
      onDragEnd: ({ active, over }) =>
        over
          ? `"${titleOf(active.id)}" dropped at position ${positionOf(over.id)} of ${total}.`
          : `"${titleOf(active.id)}" dropped.`,
      onDragCancel: ({ active }) =>
        `Reordering cancelled. "${titleOf(active.id)}" returned to position ${positionOf(active.id)}.`,
    },
  };

  function handleDragEnd({ active, over }) {
    if (over && active.id !== over.id) {
      onReorder(active.id, over.id);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={accessibility}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={todos.map((todo) => todo.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="todo-list">
          {todos.map((todo) => (
            <SortableTodoItem key={todo.id} todo={todo} {...itemProps} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default TodoList;
