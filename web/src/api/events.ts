import { request } from '.';
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

export interface EventMessage {
  id: string;
  timestamp: number;
  receiveTimestamp?: number;
  logLevel: LogLevel;
  applicationId: string;
  platform: string;
  bundleId: string;
  deviceId: string;
  message: string;
  tags: string[];
  meta: Map<string, string>;
  stackTrace?: string;
}

export interface EventsSearchResponse {
  events: EventMessage[]
}

export const events = {
  search,
}

async function search( limit: number, offset: number) {
  const result = await request<EventsSearchResponse>({ authorized: true, 'method': 'get', url: '/events/search', params: { limit, offset } },);
  return result;
}