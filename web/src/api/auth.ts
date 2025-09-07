import { request } from '.';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

interface ProfileResponse {
  id: string;
  login: string;
  isOwner: boolean;
}

export async function auth(login: string, password: string) {
  const result = await request<AuthResponse>({ 'method': 'post', url: '/auth', data: { login, password } },);
  return result;
}

export async function refresh(refreshToken: string) {
  const result = await request<AuthResponse>({ 'method': 'post', url: '/auth/refresh', data: { refreshToken } },);
  return result;
}


export async function fetchProfile() {
  const result = await request<ProfileResponse>({ 'method': 'get', url: '/user/profile' },);
  return result;
}
