import { request } from './apiClient';

const groupQuery = (groupId) => `groupId=${encodeURIComponent(groupId)}`;

export function fetchTodos(groupId) {
  return request(`/todos?${groupQuery(groupId)}`);
}

export function createTodo(groupId, title) {
  return request('/todos', {
    method: 'POST',
    body: JSON.stringify({ groupId, title }),
  });
}

export function updateTodo(id, updates) {
  return request(`/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export function deleteTodo(id) {
  return request(`/todos/${id}`, {
    method: 'DELETE',
  });
}

export function clearCompletedTodos(groupId) {
  return request(`/todos/completed?${groupQuery(groupId)}`, {
    method: 'DELETE',
  });
}

export function reorderTodos(groupId, orderedIds) {
  return request('/todos/reorder', {
    method: 'PUT',
    body: JSON.stringify({ groupId, orderedIds }),
  });
}
