import type { EventMessage } from '@/model/event/eventMessage';
import { request } from '.';
import type { SearchCriterion } from '@/components/base/smartSearch/types';


interface EventsSearchResponse {
  events: EventMessage[]
}

export const events = {
  search,
}

async function search(limit: number, offset: number, applicationId: string, filter: SearchCriterion[] | null = null) {
  const result = await request<EventsSearchResponse>({ authorized: true, 'method': 'post', url: '/events/search', data: { limit, offset, applicationId, filter } },);
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