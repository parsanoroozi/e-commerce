const API_BASE = import.meta.env.VITE_API_URL || '';
const DEFAULT_CACHE_TTL_MS = 60_000;
const responseCache = new Map();
const SESSION_CACHE_PREFIX = 'shopverse:api-cache:';
const API_CHANGE_EVENT = 'shopverse:api-change';

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function parseError(response) {
  try {
    const body = await response.json();
    return body.detail || body.title || 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export async function apiRequest(path, options = {}) {
  const {
    cache: cacheEnabled,
    cacheTtlMs,
    notify,
    headers: optionHeaders,
    ...fetchOptions
  } = options;
  const method = fetchOptions.method || 'GET';
  const token = localStorage.getItem('token');
  const authScope = token ? token.slice(-12) : 'guest';
  const cacheKey = `${authScope}:${method}:${path}`;
  const useCache = method === 'GET' && cacheEnabled !== false;
  const requestOptions = { ...fetchOptions };
  if (method === 'GET' && cacheEnabled === false) {
    requestOptions.cache = 'no-store';
  }

  if (useCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data !== undefined ? cached.data : cached.promise;
    }
    const stored = readSessionCache(cacheKey);
    if (stored) {
      responseCache.set(cacheKey, stored);
      return stored.data;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(optionHeaders || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const request = fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers,
  }).then(async (response) => {
    if (response.status === 204) {
      return null;
    }

    if (response.status === 201 && response.url.includes("wishlist")){
      return null;
    }

    if (!response.ok) {
      const message = await parseError(response);
      throw new ApiError(response.status, message);
    }

    return response.json();
  });

  const expiresAt = Date.now() + (cacheTtlMs ?? DEFAULT_CACHE_TTL_MS);
  if (useCache) {
    responseCache.set(cacheKey, {
      promise: request
        .then((data) => {
          const entry = { data, expiresAt };
          responseCache.set(cacheKey, entry);
          writeSessionCache(cacheKey, entry);
          return data;
        })
        .catch((error) => {
          responseCache.delete(cacheKey);
          removeSessionCache(cacheKey);
          throw error;
        }),
      expiresAt,
    });
  }

  return request.then((data) => {
    if (method !== 'GET' && notify !== false) {
      clearApiCache();
      emitApiChange({
        method,
        path,
        resources: inferChangedResources(path),
        mutation: inferMutation(path, method),
      });
    }
    return data;
  });
}

export async function apiUpload(path, file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new ApiError(response.status, message);
  }

  clearApiCache();
  emitApiChange({
    method: 'POST',
    path,
    resources: inferChangedResources(path),
    mutation: inferMutation(path, 'POST'),
  });
  return response.json();
}

export function clearApiCache() {
  responseCache.clear();
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(SESSION_CACHE_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
}

export function subscribeToApiChanges(listener) {
  const handler = (event) => listener(event.detail);
  window.addEventListener(API_CHANGE_EVENT, handler);
  return () => window.removeEventListener(API_CHANGE_EVENT, handler);
}

export function emitApiChange(detail) {
  window.dispatchEvent(new CustomEvent(API_CHANGE_EVENT, { detail }));
}

function inferChangedResources(path) {
  const resources = new Set();
  if (path.includes('/cart')) resources.add('cart');
  if (path.includes('/wishlist')) resources.add('wishlist');
  if (path.includes('/notifications')) resources.add('notifications');
  if (path.includes('/orders')) {
    resources.add('orders');
    resources.add('cart');
    resources.add('notifications');
  }
  if (path.includes('/products')) resources.add('products');
  if (path.includes('/categories')) resources.add('categories');
  if (path.includes('/coupons')) resources.add('coupons');
  if (path.includes('/auth')) resources.add('auth');
  if (path.includes('/images') || path.includes('/uploads')) resources.add('uploads');
  return [...resources];
}

function inferMutation(path, method) {
  if (path.includes('/wishlist/')) {
    return method === 'POST' ? 'wishlist:add' : method === 'DELETE' ? 'wishlist:remove' : 'wishlist:update';
  }
  if (path.includes('/cart/items')) {
    return method === 'POST' ? 'cart:add' : method === 'DELETE' ? 'cart:remove' : 'cart:update';
  }
  if (path === '/api/cart' && method === 'DELETE') {
    return 'cart:clear';
  }
  if (path.includes('/notifications') && method === 'PATCH') {
    return 'notifications:read';
  }
  if (path.includes('/orders')) {
    return 'orders:update';
  }
  return null;
}

function readSessionCache(cacheKey) {
  try {
    const raw = sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.expiresAt <= Date.now()) {
      removeSessionCache(cacheKey);
      return null;
    }
    return parsed;
  } catch {
    removeSessionCache(cacheKey);
    return null;
  }
}

function writeSessionCache(cacheKey, entry) {
  try {
    sessionStorage.setItem(`${SESSION_CACHE_PREFIX}${cacheKey}`, JSON.stringify(entry));
  } catch {
    // Storage can be unavailable or full; in-memory caching still applies.
  }
}

function removeSessionCache(cacheKey) {
  sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${cacheKey}`);
}
