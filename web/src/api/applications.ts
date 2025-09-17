import { request } from '.';

export interface Bundle {
  platform: string;
  bundleId: string;
}

export interface Application {
  id: string;
  name: string;
  bundles: Bundle[];
  token: string;
}

interface ApplicationsSearchResponse {
  applications: Application[];
  total: number;
}

export const applications = {
  addApplication,
  deleteApplication,
  search,
}

async function addApplication(name: string, bundles: Bundle[], maintainers: string[]) {
  const result = await request<Application>({ authorized: true, 'method': 'post', url: '/applications/add', data: { name, bundles, maintainers } },);
  return result;
}

async function deleteApplication(applicationId: string) {
  const result = await request<null>({ authorized: true, 'method': 'delete', url: '/applications/delete', params: { applicationId } },);
  return result;
}

async function search(search: string | null, limit: number, offset: number) {
  const result = await request<ApplicationsSearchResponse>({ authorized: true, 'method': 'get', url: '/applications/search', params: { search, limit, offset } },);
  return result;
}