const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

function decodePayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  const payload = decodePayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  if (payload.exp < Date.now() / 1000) {
    clearToken();
    return false;
  }
  return true;
}

export function getToken(): string | null {
  return localStorage.getItem('epistemia_token');
}

export function setToken(token: string): void {
  localStorage.setItem('epistemia_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('epistemia_token');
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    return new Promise(() => {});
  }

  return res;
}
