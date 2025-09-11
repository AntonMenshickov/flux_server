import { request } from '.';
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

export interface EventFilter {
  message?: string | null;
  logLevel?: LogLevel[] | null;
  tags?: string[] | null;
  meta?: Record<string, string> | null;
  platform?: string | null;
  bundleId?: string | null;
  deviceId?: string | null;
  from?: Date | null;
  to?: Date | null;
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

async function search(limit: number, offset: number, filter: EventFilter | null = null) {
  const result = await request<EventsSearchResponse>({ authorized: true, 'method': 'get', url: '/events/search', params: { limit, offset, filter } },);
  return result.mapRight((r) => ({
    ...r,
    result: {
      events: r.result.events.map(e => ({
        ...e,
        meta: e.meta instanceof Map ? e.meta : new Map<string, string>(Object.entries(e.meta || {})),
      }))
    }
  }));
}