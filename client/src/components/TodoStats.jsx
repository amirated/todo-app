function TodoStats({ todos }) {
  const total = todos.length;

  const completed = todos.filter(
    (todo) => todo.completed
  ).length;

  const active = total - completed;

  return (
    <div className="stats">
      <span>Total: <strong>{total}</strong></span>
      <span>Active: <strong>{active}</strong></span>
      <span>Completed: <strong>{completed}</strong></span>
    </div>
  );
}

export default TodoStats;