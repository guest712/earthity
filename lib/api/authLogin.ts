import { apiFetch, getApiBaseUrl } from './client';

export class AuthLoginError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthLoginError';
    this.status = status;
  }
}

function extractAccessToken(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  const raw = o.accessToken ?? o.access_token ?? o.token;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

/**
 * POST /auth/login — adjust path/body when the backend contract is fixed.
 */
export async function loginWithPassword(email: string, password: string): Promise<string> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new AuthLoginError('missing_api_url', 0);
  }

  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const msg =
      payload && typeof payload === 'object' && typeof (payload as { message?: unknown }).message === 'string'
        ? String((payload as { message: string }).message)
        : `http_${res.status}`;
    throw new AuthLoginError(msg, res.status);
  }

  const token = extractAccessToken(payload);
  if (!token) {
    throw new AuthLoginError('invalid_response', res.status);
  }
  return token;
}
