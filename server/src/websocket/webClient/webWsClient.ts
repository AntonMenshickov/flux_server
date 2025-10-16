import z from 'zod';
import { Request } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { tokenUtil } from '../../utils/tokenUtil';
import { JwtPayload } from 'jsonwebtoken';
import { WebSocket, MessageEvent, ErrorEvent, CloseEvent } from 'ws';
import { container } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { WebWsClientService } from '../../services/webWsClientsService';
import { WsClientMessage, WsClientMessageType } from '../deviceClient/model/wsClientMessage';
import { WsClientMessage as WsClientMessageTypeDef } from '../deviceClient/model/wsClientMessage';
import { IUser, User } from '../../model/mongo/user';
import { Document } from 'mongoose';

const wsConnectValidateSchema = z.object({
  query: z.object({
    token: z.string().trim().nonempty(),
  })
});

const wsMessageValidateSchema = z.object({
  type: z.enum(WsClientMessageType),
  payload: z.unknown(),
});

export class WebClientInfo {
  readonly uuid: string;
  readonly userId: string;

  constructor(uuid: string, userId: string) {
    this.uuid = uuid;
    this.userId = userId;
  }
}

export class WebWsClient {
  private clientInfo?: WebClientInfo;
  private api: ReturnType<WebWsClientService['createWebClientAPI']>;

  constructor(private ws: WebSocket, private req: Request) {
    this.api = container.resolve(WebWsClientService).createWebClientAPI(this);
    this.initializeClient();
  }

  public getClientInfo(): WebClientInfo | undefined {
    return this.clientInfo;
  }

  private async initializeClient() {
    const parseResult = wsConnectValidateSchema.safeParse(this.req);

    if (!parseResult.success) {
      this.ws.close(4001, responseMessages.USER_INFO_VALIDATION_FAILED);
      return;
    }
    try {
      const { token } = parseResult.data.query;
      const payload = tokenUtil.verify(token);
      const userId = payload.userId;
      if (!userId) {
        this.ws.close(4001, responseMessages.INVALID_TOKEN);
        return;
      }
      const user: IUser & Document | null = await User.findById(userId).exec();
      if (!user) {
        this.ws.close(4000, responseMessages.USER_NOT_FOUND);
        return;
      }
      this.clientInfo = new WebClientInfo(uuidv4(), userId);
      this.registerClient();
    } catch (err) {
      this.deleteClient();
      this.ws.close(4001, responseMessages.INVALID_TOKEN);
      return;
    }

    this.ws.onmessage = (event) => this.onMessage(event);
    this.ws.onclose = (event) => this.onClose(event);
    this.ws.onerror = (err) => this.onError(err);
  }

  private onMessage(event: MessageEvent) {
    if (!this.clientInfo) {
      this.ws.close(4003, responseMessages.WS_CLIENT_NOT_FOUND);
      return;
    }
    const parseResult = wsMessageValidateSchema.safeParse(JSON.parse(event.data as string));
    if (!parseResult.success) {
      this.ws.close(4004, parseResult.error.message);
      return;
    }
    const message: WsClientMessage = parseResult.data;
    switch (message.type) {
      // For now web clients don't send event messages; close on unknown
      default:
        this.ws.close(4005, responseMessages.WS_UNKNOWN_MESSAGE_TYPE);
    }
  }

  private onClose(event: CloseEvent) {
    this.deleteClient();
    console.log('WebSocket (web) connection closed', event.code, event.reason);
  }

  private onError(err: ErrorEvent) {
    this.deleteClient();
    console.error('WebSocket (web) error:', err.error, err.message);
    this.ws.close(5000, responseMessages.INTERNAL_SERVER_ERROR);
  }

  private registerClient() {
    this.api.connect();
  }

  // Send a server-originated message to the web client
  public sendServerMessage(message: WsClientMessageTypeDef) {
    try {
      this.ws.send(JSON.stringify(message));
    } catch (err) {
      console.error('Failed to send server message to web ws client', err);
    }
  }

  private deleteClient() {
    this.api.disconnect();
  }
}
