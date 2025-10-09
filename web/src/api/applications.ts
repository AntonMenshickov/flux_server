import type { Application } from '@/model/application/application';
import { request } from '.';
import type { Bundle } from '@/model/application/bundle';
import type { ApplicationStats } from '@/model/application/applicationStats';


interface ApplicationsSearchResponse {
  applications: Application[];
  total: number;
}

interface ApplicationStatsSearchResponse {
  applications: ApplicationStats[];
  total: number;
}

export const applications = {
  addApplication,
  updateApplication,
  deleteApplication,
  search,
  searchStats,
}

async function addApplication(name: string, bundles: Bundle[], maintainers: string[]) {
  const result = await request<Application>({ authorized: true, 'method': 'post', url: '/applications/add', data: { name, bundles, maintainers } },);
  return result;
}

async function updateApplication(id: string, name: string, bundles: Bundle[], maintainers: string[]) {
  const result = await request<Application>({ authorized: true, 'method': 'put', url: '/applications/update', data: { id, name, bundles, maintainers } },);
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

async function searchStats(search: string | null, limit: number, offset: number) {
  const result = await request<ApplicationStatsSearchResponse>({ authorized: true, 'method': 'get', url: '/applications/searchStats', params: { search, limit, offset } },);
  return result;
}