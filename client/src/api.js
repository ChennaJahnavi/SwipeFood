const BASE = '/api';

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out — is the server running?');
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  getItems: (sessionId) =>
    request(`/items?sessionId=${encodeURIComponent(sessionId)}`),
  vote: (body) =>
    request('/vote', { method: 'POST', body: JSON.stringify(body) }),
  undoVote: (sessionId) =>
    request('/vote', {
      method: 'DELETE',
      body: JSON.stringify({ sessionId }),
    }),
  getResults: (sort) => request(`/results?sort=${encodeURIComponent(sort)}`),
  getMatches: (sessionId) =>
    request(`/matches?sessionId=${encodeURIComponent(sessionId)}`),
};
