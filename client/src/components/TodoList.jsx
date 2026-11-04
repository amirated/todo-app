import TodoItem from './TodoItem';

function TodoList({ todos, onToggle, onDelete, onEdit }) {
  if (todos.length === 0) {
    return <p className="empty-state">No tasks found.</p>;
  }

  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default TodoList;
