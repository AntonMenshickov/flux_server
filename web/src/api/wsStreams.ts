import { request } from '.';

type EmptyResult = unknown;

export const wsStreams = {
  startLogs,
  stopLogs,
}

async function startLogs(uuid: string) {
  return await request<EmptyResult>({ authorized: true, method: 'post', url: '/ws/streams/start', data: { uuid } });
}

async function stopLogs(uuid: string) {
  return await request<EmptyResult>({ authorized: true, method: 'post', url: '/ws/streams/stop', data: { uuid } });
}
