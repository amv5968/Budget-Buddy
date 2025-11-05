import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://10.0.2.2:3000/api';

async function authHeader() {
  const token = await AsyncStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

export type UserDTO = { _id: string; username: string; email: string };

export async function getMe(): Promise<UserDTO> {
  const res = await fetch(`${API_BASE}/users/me`, { headers: await authHeader() });
  if (!res.ok) throw new Error(`getMe failed: ${res.status}`);
  return res.json();
}

export async function updateMe(username: string): Promise<UserDTO> {
  const res = await fetch(`${API_BASE}/users/me`, {
    method: 'PUT',
    headers: await authHeader(),
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error(`updateMe failed: ${res.status}`);
  return res.json();
}