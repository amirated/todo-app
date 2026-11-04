
import { useEffect, useState } from 'react';

import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';
import TodoList from './components/TodoList';
import TodoFilters from './components/TodoFilters';
import TodoStats from './components/TodoStats';

import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo as deleteTodoRequest,
  clearCompletedTodos,
} from './services/todoApi';

import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch todos when the app mounts.
  useEffect(() => {
    async function loadTodos() {
      try {
        setError('');
        const data = await fetchTodos();
        setTodos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadTodos();
  }, []);

  // Create a todo.
  async function addTodo(title) {
    try {
      setError('');
      const newTodo = await createTodo(title);
      setTodos((prev) => [newTodo, ...prev]);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  // Toggle completion.
  async function toggleTodo(id) {
    const todo = todos.find((item) => item.id === id);
    if (!todo) return;

    try {
      setError('');
      const updatedTodo = await updateTodo(id, {
        completed: !todo.completed,
      });

      setTodos((prev) =>
        prev.map((item) => item.id === id ? updatedTodo : item)
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // Edit a todo.
  async function editTodo(id, title) {
    try {
      setError('');
      const updatedTodo = await updateTodo(id, { title });

      setTodos((prev) =>
        prev.map((item) => item.id === id ? updatedTodo : item)
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete a todo.
  async function deleteTodo(id) {
    try {
      setError('');
      await deleteTodoRequest(id);

      setTodos((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete all completed todos.
  async function clearCompleted() {
    try {
      setError('');
      await clearCompletedTodos();

      setTodos((prev) => prev.filter((item) => !item.completed));
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  if (isLoading) {
    return (
      <div className="app">
        <p>Loading todos...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>My Todo App</h1>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <TodoStats todos={todos} />

      <TodoForm onAdd={addTodo} />

      <TodoFilters
        filter={filter}
        onChange={setFilter}
      />

      <TodoList
        todos={filteredTodos}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onEdit={editTodo}
      />

      <button
        onClick={clearCompleted}
        disabled={!todos.some((todo) => todo.completed)}
      >
        Clear Completed
      </button>
    </div>
  );
}

export default App;
