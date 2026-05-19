const KEY = 'swipevote_session_id';

function randomId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

export function getSessionId() {
  let id = localStorage.getItem(KEY);
  if (!id || id.length < 8) {
    id = randomId();
    localStorage.setItem(KEY, id);
  }
  return id;
}
