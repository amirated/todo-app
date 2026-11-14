import { request } from './apiClient';

export function fetchGroups() {
  return request('/groups');
}

export function createGroup(name) {
  return request('/groups', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function renameGroup(id, name) {
  return request(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export function deleteGroup(id) {
  return request(`/groups/${id}`, {
    method: 'DELETE',
  });
}
