import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import TodoItem from './TodoItem';

// Wraps TodoItem with dnd-kit's sortable behaviour. Only the handle starts a
// drag, so the checkbox, Edit/Delete buttons and edit input work as before.
function SortableTodoItem({ todo, ...itemProps }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    // Translate (not Transform) so items of different heights aren't stretched
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const dragHandle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className="drag-handle"
      aria-label={`Reorder "${todo.title}"`}
      {...attributes}
      {...listeners}
    >
      ⠿
    </button>
  );

  return (
    <TodoItem
      todo={todo}
      {...itemProps}
      containerRef={setNodeRef}
      containerStyle={style}
      isDragging={isDragging}
      dragHandle={dragHandle}
    />
  );
}

export default SortableTodoItem;
