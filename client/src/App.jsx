import { useEffect, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { Toaster, toast } from 'sonner';

import TaskGroupTabs, { TAB_PANEL_ID, tabId } from './components/TaskGroupTabs';
import DeleteTabConfirm from './components/DeleteTabConfirm';
import TodoForm from './components/TodoForm';
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
import {
  fetchGroups,
  createGroup,
  renameGroup,
  deleteGroup,
} from './services/groupApi';

import './App.css';

const ACTIVE_TAB_STORAGE_KEY = 'todo-app:activeGroupId';

// Remembering the open tab is a convenience; storage can be unavailable
// (private mode, blocked cookies), so failures are ignored.
function readStoredTabId() {
  try {
    return localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeTabId(groupId) {
  try {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, groupId);
  } catch {
    // ignore
  }
}

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

const pluralTasks = (count) => `${count} ${count === 1 ? 'task' : 'tasks'}`;

function App() {
  // Tabs
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null); // tab awaiting confirmation
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  // Todos of the active tab
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);
  const [todosError, setTodosError] = useState('');
  const [todosReloadKey, setTodosReloadKey] = useState(0);

  // The tab currently shown. Async handlers compare against this before
  // updating `todos`, so a request that finishes after the user switched
  // tabs can't write into the other tab's list.
  const activeGroupIdRef = useRef(null);
  activeGroupIdRef.current = activeGroupId;
  const isStillActive = (groupId) => activeGroupIdRef.current === groupId;

  // Incremented on every drop; lets a slow, older reorder request know it
  // has been superseded so it doesn't roll back a newer order.
  const latestReorderRef = useRef(0);

  async function loadGroups() {
    try {
      setGroupsError('');
      const data = await fetchGroups();
      setGroups(data);

      // Reopen the last tab if it still exists, otherwise the first one.
      const storedId = readStoredTabId();
      const initial = data.find((group) => group.id === storedId) ?? data[0];
      setActiveGroupId(initial?.id ?? null);
    } catch (err) {
      setGroupsError(err.message);
    } finally {
      setIsLoadingGroups(false);
    }
  }

  // Load the tabs when the app mounts.
  useEffect(() => {
    loadGroups();
  }, []);

  // Load the active tab's todos whenever the tab changes (or on Retry).
  useEffect(() => {
    if (!activeGroupId) return;

    storeTabId(activeGroupId);

    let ignore = false; // set when the user switches away before this resolves
    setTodos([]);
    setTodosError('');
    setIsLoadingTodos(true);

    fetchTodos(activeGroupId)
      .then((data) => {
        if (!ignore) setTodos(data);
      })
      .catch((err) => {
        if (!ignore) setTodosError(err.message);
      })
      .finally(() => {
        if (!ignore) setIsLoadingTodos(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeGroupId, todosReloadKey]);

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  function selectGroup(groupId) {
    if (groupId === activeGroupId) return;
    setPendingDelete(null);
    setActiveGroupId(groupId);
  }

  // Returns true when created, so the name input can close.
  async function addGroup(name) {
    try {
      const group = await createGroup(name);
      setGroups((prev) => [...prev, group]);
      setPendingDelete(null);
      setActiveGroupId(group.id); // open the new tab
      return true;
    } catch (err) {
      notifyError("Couldn't create tab", err);
      return false;
    }
  }

  async function renameTab(groupId, name) {
    try {
      const updated = await renameGroup(groupId, name);
      setGroups((prev) => prev.map((group) => (group.id === groupId ? updated : group)));
      return true;
    } catch (err) {
      notifyError("Couldn't rename tab", err);
      return false;
    }
  }

  async function confirmDeleteGroup() {
    const group = pendingDelete;
    if (!group) return;

    setIsDeletingGroup(true);

    try {
      const { deletedTodoCount } = await deleteGroup(group.id);

      // Open the tab before the deleted one (or the next one if it was first).
      const index = groups.findIndex((item) => item.id === group.id);
      const remaining = groups.filter((item) => item.id !== group.id);
      const next = remaining[Math.max(0, index - 1)];

      setGroups(remaining);
      if (activeGroupIdRef.current === group.id) setActiveGroupId(next?.id ?? null);
      setPendingDelete(null);

      toast.success(
        deletedTodoCount > 0
          ? `Deleted "${group.name}" and ${pluralTasks(deletedTodoCount)}`
          : `Deleted "${group.name}"`
      );
    } catch (err) {
      notifyError("Couldn't delete tab", err);
    } finally {
      setIsDeletingGroup(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Todos (always within the active tab)
  // ---------------------------------------------------------------------------

  // Create a todo.
  async function addTodo(title) {
    const groupId = activeGroupId;

    try {
      const newTodo = await createTodo(groupId, title);
      if (isStillActive(groupId)) setTodos((prev) => [newTodo, ...prev]);
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

  // Delete the active tab's completed todos.
  async function clearCompleted() {
    const groupId = activeGroupId;

    try {
      const { deletedCount } = await clearCompletedTodos(groupId);

      if (isStillActive(groupId)) {
        setTodos((prev) => prev.filter((item) => !item.completed));
      }
      toast.success(`Cleared ${deletedCount} completed ${deletedCount === 1 ? 'task' : 'tasks'}`);
    } catch (err) {
      notifyError("Couldn't clear completed tasks", err);
    }
  }

  // Move a todo (drag-and-drop) and persist the tab's full new order.
  async function reorderTodo(activeId, overId) {
    const groupId = activeGroupId;
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
      await reorderTodos(groupId, reordered.map((todo) => todo.id));

      // Only confirm the newest drop; an older one finishing late stays silent.
      if (requestId === latestReorderRef.current) {
        toast.success('list reordering successful', toastOptions);
      }
    } catch (err) {
      if (requestId !== latestReorderRef.current) return; // a newer drop wins

      if (err.status === 409) {
        // Our list is out of date (changed elsewhere): load the server's version.
        try {
          const latest = await fetchTodos(groupId);
          if (isStillActive(groupId)) setTodos(latest);
          toast.warning('Your list was out of date', {
            ...toastOptions,
            description: 'It changed somewhere else, so the latest version is now shown. Try the move again.',
          });
        } catch (refreshErr) {
          notifyError("Couldn't load the latest list", refreshErr, toastOptions);
        }
      } else {
        // Roll back only the order, keeping toggles/edits made in the meantime.
        if (isStillActive(groupId)) {
          setTodos((current) => sortByIdOrder(current, previousOrder));
        }
        notifyError("Couldn't save the new order", err, toastOptions);
      }
    }
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  if (isLoadingGroups) {
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

      {groupsError ? (
        <div className="error-message" role="alert">
          Couldn't load your tabs: {groupsError}
          <button onClick={loadGroups}>Retry</button>
        </div>
      ) : (
        <>
          <TaskGroupTabs
            groups={groups}
            activeGroupId={activeGroupId}
            onSelect={selectGroup}
            onCreate={addGroup}
            onRename={renameTab}
            onRequestDelete={setPendingDelete}
          />

          {pendingDelete && (
            <DeleteTabConfirm
              group={pendingDelete}
              taskCount={todos.length}
              isDeleting={isDeletingGroup}
              onConfirm={confirmDeleteGroup}
              onCancel={() => setPendingDelete(null)}
            />
          )}

          {activeGroupId ? (
            <section
              role="tabpanel"
              id={TAB_PANEL_ID}
              aria-labelledby={tabId(activeGroupId)}
            >
              {todosError && (
                <div className="error-message" role="alert">
                  Couldn't load this tab's tasks: {todosError}
                  <button onClick={() => setTodosReloadKey((key) => key + 1)}>Retry</button>
                </div>
              )}

              <TodoStats todos={todos} />

              <TodoForm onAdd={addTodo} />

              <TodoFilters
                filter={filter}
                onFilterChange={setFilter}
              />

              {isLoadingTodos ? (
                <p className="empty-state">Loading tasks...</p>
              ) : (
                <TodoList
                  todos={filteredTodos}
                  isReorderable={filter === 'all'}
                  onReorder={reorderTodo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                />
              )}

              <button
                onClick={clearCompleted}
                disabled={!todos.some((todo) => todo.completed)}
              >
                Clear Completed
              </button>
            </section>
          ) : (
            <p className="empty-state">Create a tab to start adding tasks.</p>
          )}
        </>
      )}
    </div>
  );
}

export default App;
