import { request } from '.';

interface BundleId {
  id: string;
  platform: string;
  bundleId: boolean;
}

export interface Application {
  id: string;
  name: string;
  bundleIds: BundleId[];
}

interface ApplicationsSearchResponse {
  applications: Application[];
  total: number;
}

export const applications = {
  addUser: addApplication,
  deleteUser: deleteApplication,
  search,
}

async function addApplication(name: string, bundleIds: { platform: string, bundleId: string }) {
  const result = await request<Application>({ 'method': 'post', url: '/applications/add', data: { name, bundleIds } },);
  return result;
}

async function deleteApplication(applicationId: string) {
  const result = await request<null>({ 'method': 'delete', url: '/applications/delete', params: { userId: applicationId } },);
  return result;
}

async function search(search: string | null, limit: number, offset: number) {
  const result = await request<ApplicationsSearchResponse>({ 'method': 'get', url: '/applications/search', params: { search, limit, offset } },);
  return result;
}