import { NextFunction, Request } from 'express';
import { WebSocket, MessageEvent, ErrorEvent, CloseEvent } from 'ws';
import { responseMessages } from '../strings/responseMessages';
import { tokenUtil } from '../utils/tokenUtil';
import { JwtPayload } from 'jsonwebtoken';
import { Application, IApplication } from '../model/mongo/application';
import { Document } from 'mongoose';
import z from 'zod';
import { WsClientMessageType } from './model/wsClientMessageType';
import { addEventMessage } from './controllers/addEventMessage';
import { WsClientMessage } from './model/wsCLientMessage';

export const wsConnectValidateSchema = z.object({
  query: z.object({
    token: z.string().trim().nonempty(),
    platform: z.string().trim().nonempty(),
    bundleId: z.string().trim().nonempty(),
    deviceId: z.string().trim().nonempty(),
  })
});

const wsMessageValidateSchema = z.object({
  type: z.enum(WsClientMessageType),
  payload: z.any(),
});

export class WsClient {
  readonly applicationId: string;
  readonly platform: string;
  readonly bundleId: string;
  readonly deviceId: string;

  constructor(applicationId: string, platform: string, bundleId: string, deviceId: string) {
    this.applicationId = applicationId;
    this.platform = platform;
    this.bundleId = bundleId;
    this.deviceId = deviceId;
  }
}

const clients: Map<WebSocket, WsClient> = new Map();

export async function websocket(ws: WebSocket, req: Request, next: NextFunction): Promise<void> {
  const parseResult = wsConnectValidateSchema.safeParse(req);
  if (!parseResult.success) {
    ws.close(4001, parseResult.error.message);
    return;
  }
  try {
    const { platform, bundleId, deviceId, token } = parseResult.data.query;
    const payload = tokenUtil.verify(token) as JwtPayload;
    const applicationId = payload.applicationId;
    if (!applicationId) {
      ws.close(4001, responseMessages.INVALID_TOKEN);
      return;
    }
    const application: IApplication & Document | null = await Application.findById(applicationId).exec();
    if (!application) {
      ws.close(4000, responseMessages.APPLICATION_NOT_FOUND);
      return;
    }
    if (!application.bundles.find(b => b.platform == platform && b.bundleId == bundleId)) {
      ws.close(4000, responseMessages.WRONG_BUNDLE_ID_OR_PLATFORM);
      return;
    }
    if (clients.has(applicationId)) {
      ws.close(4002, responseMessages.WS_ALREADY_CONNECTED);
      return;
    }
    clients.set(ws, new WsClient(applicationId, platform, bundleId, deviceId));
  } catch (err) {
    ws.close(4001, responseMessages.INVALID_TOKEN);
    return;
  }
  
  ws.onmessage = (event: MessageEvent) => {
    const client = clients.get(ws);
    if (!client) {
      ws.close(4003, responseMessages.WS_CLIENT_NOT_FOUND);
      return;
    }
    const parseResult = wsMessageValidateSchema.safeParse(JSON.parse(event.data as string));
    if (!parseResult.success) {
      ws.close(4004, parseResult.error.message);
      return;
    }
    const message: WsClientMessage = parseResult.data;
    switch (message.type) {
      case WsClientMessageType.eventMessage:
        addEventMessage(ws, client, message.payload);
        break;
      default:
        ws.close(4005, responseMessages.WS_UNKNOWN_MESSAGE_TYPE);
    }
  };
  ws.onclose = (event: CloseEvent) => {
    clients.delete(ws);
    console.log('WebSocket connection closed', event.code, event.reason);
  };
  ws.onerror = (err: ErrorEvent) => {
    console.error('WebSocket error:', err.error, err.message);
  };
}