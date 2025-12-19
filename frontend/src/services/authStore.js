
const listeners = new Set();

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function getAuthSnapshot() {
  const user = safeJsonParse(localStorage.getItem("user"));
  return {
    isAuthenticated: !!user, // on se base sur user, pas sur token (vu que cookies)
    user,
    role: user?.role || null,
  };
}

export function subscribeAuth(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyAuthChanged() {
  for (const l of listeners) l();
}

// Optionnel: si tu veux aussi capter les changements entre onglets
window.addEventListener("storage", (e) => {
  if (e.key === "user") notifyAuthChanged();
});
