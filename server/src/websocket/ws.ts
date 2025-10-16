import { Request } from 'express';
import { WebSocket } from 'ws';
import { responseMessages } from '../strings/responseMessages';
import z from 'zod';
import { WsClientType } from './model/wsClientType';
import { DeviceWsClient } from './deviceClient/deviceWsClient';
import { WebWsClient } from './webClient/webWsClient';


export async function websocket(ws: WebSocket, req: Request): Promise<void> {
  // Accept client type from headers.client or query.client (browser cannot set custom headers on WS handshake)
  const clientRaw = (req.headers as any).client ?? (req as any).query?.client;
  if (!clientRaw || (clientRaw !== WsClientType.device && clientRaw !== WsClientType.web)) {
    ws.close(4001, responseMessages.DEVICE_INFO_VALIDATION_FAILED);
    return;
  }
  try {
    const client = clientRaw as WsClientType;
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