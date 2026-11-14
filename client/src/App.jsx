
import { useEffect, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

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
  reorderTodos,
} from './services/todoApi';

import './App.css';

// Sort items to match a list of IDs. Items not in the list (e.g. created while
// a request was in flight) go to the top, matching where new todos appear.
function sortByIdOrder(items, orderedIds) {
  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  return [...items].sort((a, b) => (rank.get(a.id) ?? -1) - (rank.get(b.id) ?? -1));
}

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Incremented on every drop; lets a slow, older reorder request know it
  // has been superseded so it doesn't roll back a newer order.
  const latestReorderRef = useRef(0);

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

  // Move a todo (drag-and-drop) and persist the full new order.
  async function reorderTodo(activeId, overId) {
    const oldIndex = todos.findIndex((todo) => todo.id === activeId);
    const newIndex = todos.findIndex((todo) => todo.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const previousOrder = todos.map((todo) => todo.id);
    const reordered = arrayMove(todos, oldIndex, newIndex);

    // Optimistic update: the list moves immediately, the save happens after.
    setTodos(reordered);
    setError('');

    const requestId = ++latestReorderRef.current;

    try {
      await reorderTodos(reordered.map((todo) => todo.id));
    } catch (err) {
      if (requestId !== latestReorderRef.current) return; // a newer drop wins

      setError(err.message);

      if (err.status === 409) {
        // Our list is out of date (changed elsewhere): load the server's version.
        try {
          setTodos(await fetchTodos());
        } catch {
          // Keep the conflict message; the list stays as the user arranged it.
        }
      } else {
        // Roll back only the order, keeping toggles/edits made in the meantime.
        setTodos((current) => sortByIdOrder(current, previousOrder));
      }
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
        onFilterChange={setFilter}
      />

      <TodoList
        todos={filteredTodos}
        isReorderable={filter === 'all'}
        onReorder={reorderTodo}
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
