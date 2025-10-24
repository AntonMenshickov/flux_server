import { eventMessageFromJson, type EventMessage } from '@/model/event/eventMessage';
import { request } from '.';
import type { SearchCriterion } from '@/components/base/smartSearch/types';


interface EventsSearchResponse {
  events: EventMessage[]
}

export const events = {
  search,
}

async function search(limit: number, applicationId: string, filter: SearchCriterion[] | null = null, lastTimestamp?: number, lastId?: string) {
  const result = await request<EventsSearchResponse>({ authorized: true, 'method': 'post', url: '/events/search', data: { limit, lastTimestamp, lastId, applicationId, filter } },);
  return result.mapRight((r) => ({
    ...r,
    result: {
      events: r.result.events.map(e => eventMessageFromJson(e))
    }
  }));
}