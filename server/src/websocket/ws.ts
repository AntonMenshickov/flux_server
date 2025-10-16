import { Request } from 'express';
import { WebSocket } from 'ws';
import { responseMessages } from '../strings/responseMessages';
import z from 'zod';
import { WsClientType } from './model/wsClientType';
import { DeviceWsClient } from './deviceClient/deviceWsClient';
import { WebWsClient } from './webClient/webWsClient';


const wsConnectValidateSchema = z.object({
  headers: z.object({
    client: z.enum(WsClientType).nonoptional()
  })
});

export async function websocket(ws: WebSocket, req: Request): Promise<void> {
  const parseResult = wsConnectValidateSchema.safeParse(req);
  if (!parseResult.success) {
    ws.close(4001, responseMessages.DEVICE_INFO_VALIDATION_FAILED);
    return;
  }
  try {
    const { client } = parseResult.data.headers;
    switch (client) {
      case WsClientType.device:
        new DeviceWsClient(ws, req);
        return;
      case WsClientType.web:
        new WebWsClient(ws, req);
        return;
    }
  } catch (err) {
    ws.close(5000, responseMessages.INTERNAL_SERVER_ERROR);
    return;
  }
}