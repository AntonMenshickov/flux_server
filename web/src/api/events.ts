import type { EventMessage } from '@/model/event/eventMessage';
import { request } from '.';
import type { EventFilter } from '@/model/event/eventFilter';


interface EventsSearchResponse {
  events: EventMessage[]
}

export const events = {
  search,
}

async function search(limit: number, offset: number, applicationId: string, filter: EventFilter | null = null) {
  const result = await request<EventsSearchResponse>({ authorized: true, 'method': 'get', url: '/events/search', params: { limit, offset, applicationId, filter } },);
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