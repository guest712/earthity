export function getApiBaseUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_API_URL;
  if (typeof raw !== 'string') return null;
  const t = raw.trim().replace(/\/$/, '');
  return t.length > 0 ? t : null;
}

export type ApiFetchOptions = RequestInit & {
  accessToken?: string | null;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('EXPO_PUBLIC_API_URL is not set');
  }
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const { accessToken, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (!headers.has('Content-Type') && rest.body != null && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return fetch(url, { ...rest, headers });
}
