import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, clearApiCache } from './client';

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest', () => {
  afterEach(() => {
    clearApiCache();
    vi.unstubAllGlobals();
  });

  it('sends credentialed requests for HttpOnly cookie auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/api/example', { cache: false });

    expect(fetchMock).toHaveBeenCalledWith('/api/example', expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('does not share cached promises for abortable requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ value: 1 }))
      .mockResolvedValueOnce(jsonResponse({ value: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/api/products', { signal: new AbortController().signal });
    await apiRequest('/api/products', { signal: new AbortController().signal });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
