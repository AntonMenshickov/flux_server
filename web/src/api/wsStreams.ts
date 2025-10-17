import { request } from '.';

type EmptyResult = unknown;

export const wsStreams = {
  startLogs,
  stopLogs,
}

async function startLogs(webUuid: string, deviceUuid: string) {
  return await request<EmptyResult>({ authorized: true, method: 'post', url: '/ws/streams/start', data: { webUuid, deviceUuid } });
}

async function stopLogs(webUuid: string, deviceUuid: string) {
  return await request<EmptyResult>({ authorized: true, method: 'post', url: '/ws/streams/stop', data: { webUuid, deviceUuid } });
}
