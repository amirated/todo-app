const API_URL = `${import.meta.env.VITE_API_URL}/api/todos`;

async function request(endpoint = '', options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Server errors look like { success: false, error: { message, details } }
    const message =
      data.error?.details?.[0]?.message ||
      data.error?.message ||
      `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status; // lets callers react to e.g. 409 Conflict
    throw error;
  }

  return data;
}

export function fetchTodos() {
  return request();
}

export function createTodo(title) {
  return request('', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export function updateTodo(id, updates) {
  return request(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export function deleteTodo(id) {
  return request(`/${id}`, {
    method: 'DELETE',
  });
}

export function clearCompletedTodos() {
  return request('/completed', {
    method: 'DELETE',
  });
}

export function reorderTodos(orderedIds) {
  return request('/reorder', {
    method: 'PUT',
    body: JSON.stringify({ orderedIds }),
  });
}
