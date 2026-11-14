const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

/**
 * Sends a JSON request to the API and returns the parsed body.
 * Throws an Error whose message is safe to show to the user, with the HTTP
 * status attached as `error.status` (e.g. so callers can react to a 409).
 */
export async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  } catch {
    // fetch only rejects on network failure (server down, offline, CORS)
    throw new Error('Cannot reach the server. Check that it is running and try again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Server errors look like { success: false, error: { message, details } }
    const message =
      data.error?.details?.[0]?.message ||
      data.error?.message ||
      `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}
