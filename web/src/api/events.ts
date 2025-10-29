import { eventMessageFromJson, type EventMessage } from '@/model/event/eventMessage';
import { request } from '.';
import type { SearchCriterion, Criterion } from '@/components/base/smartSearch/types';


interface EventsSearchResponse {
  events: EventMessage[]
}

interface EventsFilterResponse {
  id: string;
  name: string;
  criteria: Criterion[];
  createdAt: string;
  updatedAt?: string;
}

interface ShareFilterRequest {
  filterId?: string;
  criteria?: Criterion[];
  dateTimeRange?: {
    start: number;
    end: number;
  };
  applicationId: string;
}

interface ShareFilterResponse {
  shareToken: string;
  applicationId: string;
}

interface GetSharedFilterResponse {
  criteria: Criterion[];
  dateTimeRange?: {
    start: number;
    end: number;
  };
  applicationId: string;
}



export const events = {
  search,
  addFilter,
  updateFilter,
  deleteFilter,
  searchFilters,
  shareFilter,
  getSharedFilter,
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

async function addFilter(name: string, criteria: Criterion[], applicationId: string) {
  const result = await request<EventsFilterResponse>({
    authorized: true,
    method: 'post',
    url: '/events-filter/add',
    data: { name, criteria, applicationId }
  });
  return result.mapRight((r) => ({
    ...r,
    result: {
      ...r.result,
      createdAt: new Date(r.result.createdAt),
      updatedAt: r.result.updatedAt ? new Date(r.result.updatedAt) : undefined,
    }
  }));
}

async function updateFilter(id: string, name: string, criteria: Criterion[]) {
  const result = await request<EventsFilterResponse>({
    authorized: true,
    method: 'put',
    url: '/events-filter/update',
    data: { id, name, criteria }
  });
  return result.mapRight((r) => ({
    ...r,
    result: {
      ...r.result,
      createdAt: new Date(r.result.createdAt),
      updatedAt: r.result.updatedAt ? new Date(r.result.updatedAt) : undefined,
    }
  }));
}

async function deleteFilter(id: string) {
  const result = await request<{ success: boolean }>({
    authorized: true,
    method: 'delete',
    url: '/events-filter/delete',
    params: { id }
  });
  return result;
}

async function searchFilters(search: string, applicationId: string) {
  const params: Record<string, string> = { search, applicationId };
  const result = await request<{ filters: EventsFilterResponse[] }>({
    authorized: true,
    method: 'get',
    url: '/events-filter/search',
    params
  });
  return result.mapRight((r) => ({
    ...r,
    result: {
      filters: r.result.filters.map(f => ({
        ...f,
        createdAt: new Date(f.createdAt),
        updatedAt: f.updatedAt ? new Date(f.updatedAt) : undefined,
      }))
    }
  }));
}


async function shareFilter(data: ShareFilterRequest) {
  const result = await request<ShareFilterResponse>({
    authorized: true,
    method: 'post',
    url: '/events-filter/share',
    data
  });
  return result;
}

async function getSharedFilter(shareToken: string) {
  const result = await request<GetSharedFilterResponse>({
    authorized: false,
    method: 'get',
    url: `/events-filter/shared/${shareToken}`
  });
  return result;
}