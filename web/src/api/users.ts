import { request } from '.';


export interface User {
  id: string;
  login: string;
  isOwner: boolean;
}

interface UsersSearchResponse {
  users: User[];
  total: number;
}

export const users = {
  addUser,
  deleteUser,
  search,
  profile,
}

async function addUser(login: string, password: string) {
  const result = await request<User>({ authorized: true, 'method': 'post', url: '/users/add', data: { login, password } },);
  return result;
}

async function deleteUser(userId: string) {
  const result = await request<null>({ authorized: true, 'method': 'delete', url: '/users/delete', params: { userId } },);
  return result;
}

async function profile() {
  const result = await request<User>({ authorized: true, 'method': 'get', url: '/users/profile' });
  return result;
}

async function search(search: string | null, limit: number, offset: number) {
  const result = await request<UsersSearchResponse>({ authorized: true, 'method': 'get', url: '/users/search', params: { search, limit, offset } },);
  return result;
}