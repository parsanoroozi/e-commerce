const APP_ACTION_EVENT = 'shopverse:app-action';

export function emitAppAction(type, payload = {}) {
  window.dispatchEvent(new CustomEvent(APP_ACTION_EVENT, {
    detail: { type, payload, createdAt: Date.now() },
  }));
}

export function subscribeToAppActions(listener) {
  const handler = (event) => listener(event.detail);
  window.addEventListener(APP_ACTION_EVENT, handler);
  return () => window.removeEventListener(APP_ACTION_EVENT, handler);
}
