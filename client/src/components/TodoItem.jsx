
import { useState } from 'react';

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(todo.title);

  function handleSave() {
    const trimmedTitle = editedTitle.trim();

    if (!trimmedTitle) return;

    onEdit(todo.id, trimmedTitle);
    setIsEditing(false);
  }

  function handleCancel() {
    setEditedTitle(todo.title);
    setIsEditing(false);
  }

  return (
    <div className="todo-item">
      {!isEditing && (
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
      )}

      {isEditing ? (
        <>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
        </>
      ) : (
        <>
          <span className={todo.completed ? 'completed' : ''}>
            {todo.title}
          </span>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={() => onDelete(todo.id)}>Delete</button>
        </>
      )}
    </div>
  );
}

export default TodoItem;
