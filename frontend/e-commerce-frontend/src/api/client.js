const API_BASE = import.meta.env.VITE_API_URL || '';

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
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

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

  return response.json();
}
