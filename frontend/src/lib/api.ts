/**
 * NAJMO ERP - API Helper
 * Centralized fetch utility that works with or without authentication.
 * Falls back to no-auth requests when session token is unavailable.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function getApiHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

export async function apiFetch(
  path: string,
  options?: RequestInit & { accessToken?: string | null }
): Promise<Response> {
  const { accessToken, ...fetchOptions } = options || {};
  const headers = {
    ...getApiHeaders(accessToken),
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  return fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });
}

export async function apiGet<T>(path: string, accessToken?: string | null): Promise<T | null> {
  try {
    const res = await apiFetch(path, { accessToken });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  accessToken?: string | null
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await apiFetch(path, {
      method: 'POST',
      body: JSON.stringify(body),
      accessToken,
    });
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json.message || 'Erreur serveur' };
    }
    return { data: json as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Erreur réseau' };
  }
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  accessToken?: string | null
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await apiFetch(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      accessToken,
    });
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json.message || 'Erreur serveur' };
    }
    return { data: json as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Erreur réseau' };
  }
}

export async function apiDelete(
  path: string,
  accessToken?: string | null
): Promise<{ success: boolean; error: string | null }> {
  try {
    const res = await apiFetch(path, {
      method: 'DELETE',
      accessToken,
    });
    if (!res.ok) {
      const json = await res.json();
      return { success: false, error: json.message || 'Erreur suppression' };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau' };
  }
}
