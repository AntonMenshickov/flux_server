import { request } from '.';

interface Bundle {
  platform: string;
  bundleId: boolean;
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

async function addApplication(name: string, bundles: { platform: string, bundleId: string }[]) {
  const result = await request<Application>({ 'method': 'post', url: '/applications/add', data: { name, bundles } },);
  return result;
}

async function deleteApplication(applicationId: string) {
  const result = await request<null>({ 'method': 'delete', url: '/applications/delete', params: { applicationId } },);
  return result;
}

async function search(search: string | null, limit: number, offset: number) {
  const result = await request<ApplicationsSearchResponse>({ 'method': 'get', url: '/applications/search', params: { search, limit, offset } },);
  return result;
}