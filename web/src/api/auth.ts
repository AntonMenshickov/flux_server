import { request } from '.';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export const auth = {
  login,
  refresh
}

async function login(login: string, password: string) {
  const result = await request<AuthResponse>({ 'method': 'post', url: '/auth', data: { login, password } },);
  return result;
}

async function refresh(refreshToken: string) {
  const result = await request<AuthResponse>({ 'method': 'post', url: '/auth/refresh', data: { refreshToken } },);
  return result;
}