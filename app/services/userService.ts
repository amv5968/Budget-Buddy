// app/services/userService.ts
import { API_BASE } from '../config';

/** Shape returned by the backend for a user */
export type ApiUser = {
  _id: string;
  username: string;
  email: string;
};

/** Helper to build auth header */
function authHeader(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** GET /api/users/me — fetch current user */
export async function fetchMe(token: string): Promise<ApiUser> {
  const res = await fetch(`${API_BASE}/users/me`, {
    method: 'GET',
    headers: authHeader(token),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`fetchMe failed (${res.status}): ${err}`);
  }
  return res.json();
}

/** PUT /api/users/me — update profile (currently username only) */
export async function updateMe(
  token: string,
  data: { username: string }
): Promise<ApiUser> {
  const res = await fetch(`${API_BASE}/users/me`, {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`updateMe failed (${res.status}): ${err}`);
  }
  return res.json();
}
