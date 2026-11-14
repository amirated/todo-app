
import { useEffect, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { Toaster, toast } from 'sonner';

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

// Error toast: short summary as the title, the server's reason underneath.
function notifyError(title, err, options = {}) {
  toast.error(title, { description: err.message, ...options });
}

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  // Only for when the list itself can't be loaded; action failures use toasts.
  const [loadError, setLoadError] = useState('');

  // Incremented on every drop; lets a slow, older reorder request know it
  // has been superseded so it doesn't roll back a newer order.
  const latestReorderRef = useRef(0);

  async function loadTodos() {
    try {
      setLoadError('');
      const data = await fetchTodos();
      setTodos(data);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch todos when the app mounts.
  useEffect(() => {
    loadTodos();
  }, []);

  // Create a todo.
  async function addTodo(title) {
    try {
      const newTodo = await createTodo(title);
      setTodos((prev) => [newTodo, ...prev]);
      return true;
    } catch (err) {
      notifyError("Couldn't add task", err);
      return false;
    }
  }

  // Toggle completion.
  async function toggleTodo(id) {
    const todo = todos.find((item) => item.id === id);
    if (!todo) return;

    try {
      const updatedTodo = await updateTodo(id, {
        completed: !todo.completed,
      });

      setTodos((prev) =>
        prev.map((item) => item.id === id ? updatedTodo : item)
      );
    } catch (err) {
      notifyError("Couldn't update task", err);
    }
  }

  // Edit a todo.
  async function editTodo(id, title) {
    try {
      const updatedTodo = await updateTodo(id, { title });

      setTodos((prev) =>
        prev.map((item) => item.id === id ? updatedTodo : item)
      );
    } catch (err) {
      notifyError("Couldn't save changes", err);
    }
  }

  // Delete a todo.
  async function deleteTodo(id) {
    try {
      await deleteTodoRequest(id);

      setTodos((prev) => prev.filter((item) => item.id !== id));
      toast.success('Task deleted');
    } catch (err) {
      notifyError("Couldn't delete task", err);
    }
  }

  // Delete all completed todos.
  async function clearCompleted() {
    try {
      const { deletedCount } = await clearCompletedTodos();

      setTodos((prev) => prev.filter((item) => !item.completed));
      toast.success(
        `Cleared ${deletedCount} completed ${deletedCount === 1 ? 'task' : 'tasks'}`
      );
    } catch (err) {
      notifyError("Couldn't clear completed tasks", err);
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

    const requestId = ++latestReorderRef.current;

    // A fixed id makes repeated reorder toasts replace one another, not stack.
    const toastOptions = { id: 'reorder' };

    try {
      await reorderTodos(reordered.map((todo) => todo.id));

      // Only confirm the newest drop; an older one finishing late stays silent.
      if (requestId === latestReorderRef.current) {
        toast.success('list reordering successful', toastOptions);
      }
    } catch (err) {
      if (requestId !== latestReorderRef.current) return; // a newer drop wins

      if (err.status === 409) {
        // Our list is out of date (changed elsewhere): load the server's version.
        try {
          setTodos(await fetchTodos());
          toast.warning('Your list was out of date', {
            ...toastOptions,
            description: 'It changed somewhere else, so the latest version is now shown. Try the move again.',
          });
        } catch (refreshErr) {
          notifyError("Couldn't load the latest list", refreshErr, toastOptions);
        }
      } else {
        // Roll back only the order, keeping toggles/edits made in the meantime.
        setTodos((current) => sortByIdOrder(current, previousOrder));
        notifyError("Couldn't save the new order", err, toastOptions);
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

      <Toaster
        position="bottom-right"
        richColors
        closeButton
        style={{ fontFamily: 'inherit' }} // match the app's Inter font
      />

      {loadError && (
        <div className="error-message" role="alert">
          Couldn't load your tasks: {loadError}
          <button onClick={loadTodos}>Retry</button>
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
