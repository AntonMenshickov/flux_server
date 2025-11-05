import { eventMessageFromJson, type EventMessage } from '@/model/event/eventMessage';
import { request } from '.';
import type { SearchCriterion } from '@/components/base/smartSearch/types';

interface EventsSearchResponse {
  events: EventMessage[]
}

interface GetFullMessageResponse {
  message: string;
}

export const events = {
  search,
  getById,
  getFullMessage,
};

async function search(limit: number, applicationId: string, filter: SearchCriterion[] | null = null, lastTimestamp?: number, lastId?: string) {
  const result = await request<EventsSearchResponse>({ authorized: true, 'method': 'post', url: '/events/search', data: { limit, lastTimestamp, lastId, applicationId, filter } },);
  return result.mapRight((r) => ({
    ...r,
    result: {
      events: r.result.events.map(e => eventMessageFromJson(e))
    }
  }));
}

async function getById(id: string) {
  const result = await request<{ result: EventMessage }>({
    authorized: true,
    method: 'get',
    url: `/events/${id}`,
  });
  return result.mapRight(r => ({ ...r, result: eventMessageFromJson(r.result) }));
}

async function getFullMessage(id: string) {
  const result = await request<GetFullMessageResponse>({
    authorized: true,
    method: 'get',
    url: `/events/${id}/message`,
  });
  return result;
}