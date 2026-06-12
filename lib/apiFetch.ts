import { API_URL } from './constants';
import { getSessionToken } from './session';

function isApiRequest(input: RequestInfo | URL) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  return url.startsWith(API_URL) || url.startsWith('/api/');
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (isApiRequest(input)) {
    const token = await getSessionToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('Cookie', `better-auth.session_token=${token}`);
    }
  }

  return fetch(input, { ...init, headers, credentials: 'include' });
}
