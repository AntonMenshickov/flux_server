import type { Application } from '@/model/application/application';
import { request } from '.';
import type { Bundle } from '@/model/application/bundle';
import type { ApplicationShortStats } from '@/model/application/applicationShortStats';
import type { IApplicationStats } from '@/model/application/applicationStats';


interface ApplicationsSearchResponse {
  applications: Application[];
  total: number;
}

interface ApplicationsWithStatsResponse {
  applications: ApplicationShortStats[];
  total: number;
}

export interface ApplicationStatsResponse {
  id: string;
  name: string;
  bundles: Bundle[];
  stats: IApplicationStats[];
}

export interface ConnectedDevice {
  uuid: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  bundleId: string;
  osName: string;
}

export interface ConnectedDevicesResponse {
  devices: ConnectedDevice[];
}

export interface ConnectedDevicesCountResponse {
  count: number;
}

export const applications = {
  addApplication,
  updateApplication,
  deleteApplication,
  search,
  searchApplicationsStats,
  getAppStats,
  searchOnlineDevices,
  countOnlineDevices,
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

async function searchApplicationsStats(search: string | null, limit: number, offset: number) {
  const result = await request<ApplicationsWithStatsResponse>({ authorized: true, 'method': 'get', url: '/applications/search-stats', params: { search, limit, offset } },);
  return result;
}

async function getAppStats(applicationId: string) {
  const result = await request<ApplicationStatsResponse>({ authorized: true, 'method': 'get', url: '/applications/stats', params: { applicationId } },);
  return result;
}

async function countOnlineDevices(applicationId: string) {
  const result = await request<ConnectedDevicesCountResponse>({ authorized: true, 'method': 'get', url: '/applications/count-online-devices', params: { applicationId } },);
  return result;
}

async function searchOnlineDevices(applicationId: string, search?: string) {
  const result = await request<ConnectedDevicesResponse>({ 
    authorized: true, 
    method: 'get', 
    url: '/applications/search-online-devices', 
    params: { applicationId, search }
  });
  return result;
}