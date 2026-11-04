function TodoFilters({ filter, onFilterChange }) {
  const filters = ["all", "active", "completed"];

  return (
    <div className="filters">
      {filters.map((item) => (
        <button
          key={item}
          className={filter === item ? "selected" : ""}
          onClick={() => onFilterChange(item)}
        >
          {item.charAt(0).toUpperCase() + item.slice(1)}
        </button>
      ))}
    </div>
  );
}

export default TodoFilters;