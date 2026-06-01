export const API_BASE = import.meta.env.VITE_API_URL || '';
const DEFAULT_CACHE_TTL_MS = 60_000;
const responseCache = new Map();
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
    if (body.detail || body.title || body.message) {
      return body.detail || body.title || body.message;
    }
    if (body.errors && typeof body.errors === 'object') {
      const first = Object.values(body.errors).flat().find(Boolean);
      if (first) return String(first);
    }
    return fallbackErrorMessage(response.status);
  } catch {
    return fallbackErrorMessage(response.status);
  }
}

export async function apiRequest(path, options = {}) {
  const {
    cache: cacheEnabled,
    cacheTtlMs,
    notify,
    headers: optionHeaders,
    signal,
    ...fetchOptions
  } = options;
  const method = fetchOptions.method || 'GET';
  const cacheKey = `${method}:${path}`;
  const useCache = method === 'GET' && cacheEnabled !== false && !signal;
  const requestOptions = { ...fetchOptions };
  if (method === 'GET' && cacheEnabled === false) {
    requestOptions.cache = 'no-store';
  }

  if (useCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data !== undefined ? cached.data : cached.promise;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(optionHeaders || {}),
  };

  const request = fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers,
    signal,
    credentials: 'include',
  }).catch((error) => {
    if (error?.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(0, 'We could not reach the store server. Check your connection and try again.');
  }).then(async (response) => {
    if (response.status === 204 || response.status === 202 || response.headers.get('content-length') === '0') {
      return null;
    }

    if (response.status === 201 && response.url.includes("wishlist")){
      return null;
    }

    if (!response.ok) {
      const message = await parseError(response);
      throw new ApiError(response.status, message);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  });

  const expiresAt = Date.now() + (cacheTtlMs ?? DEFAULT_CACHE_TTL_MS);
  if (useCache) {
    responseCache.set(cacheKey, {
      promise: request
        .then((data) => {
          const entry = { data, expiresAt };
            responseCache.set(cacheKey, entry);
            return data;
          })
        .catch((error) => {
          responseCache.delete(cacheKey);
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
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
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

function fallbackErrorMessage(status) {
  if (status === 400) return 'Some submitted details need attention. Review the form and try again.';
  if (status === 401) return 'Please sign in to continue.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'We could not find the requested item.';
  if (status === 409) return 'This item changed since you loaded it. Refresh and try again.';
  if (status === 422) return 'Some submitted details are invalid. Review the highlighted fields.';
  if (status >= 500) return 'The store server had a problem. Try again in a moment.';
  return 'The request could not be completed. Try again.';
}
