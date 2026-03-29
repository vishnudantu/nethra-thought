// Central API client — replaces all Supabase client calls

const BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('nethra_token') || '';
}

async function request(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  get:    (path: string) => request('GET', path),
  post:   (path: string, body: unknown) => request('POST', path, body),
  put:    (path: string, body: unknown) => request('PUT', path, body),
  delete: (path: string) => request('DELETE', path),

  // Auth
  login:  (email: string, password: string) => request('POST', '/api/auth/login', { email, password }),
  me:     () => request('GET', '/api/auth/me'),

  // Table helpers
  list:   (table: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('GET', `/api/${table}${qs}`);
  },
  create: (table: string, data: unknown) => request('POST', `/api/${table}`, data),
  update: (table: string, id: string, data: unknown) => request('PUT', `/api/${table}/${id}`, data),
  remove: (table: string, id: string) => request('DELETE', `/api/${table}/${id}`),
};

// Streaming fetch for AI — returns raw response for streaming
export async function streamFetch(path: string, body: unknown): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI service error: ${res.status}`);
  return res;
}
