import z from 'zod';
import { Request } from 'express';
import { WsDeviceMessageType } from './model/wsDeviceMessageType';
import { responseMessages } from '../../strings/responseMessages';
import { tokenUtil } from '../../utils/tokenUtil';
import { JwtPayload } from 'jsonwebtoken';
import { Application, IApplication } from '../../model/mongo/application';
import { Document } from 'mongoose';
import { WebSocket, MessageEvent, ErrorEvent, CloseEvent } from 'ws';
import { WsDeviceMessage } from './model/wsDeviceMessage';
import { addEventMessage } from './addEventMessage';
import { container } from 'tsyringe';
import { DeviceWsClientService } from '../../services/deviceWsClientsService';

export const wsConnectValidateSchema = z.object({
  headers: z.object({
    token: z.string().trim().nonempty(),
    platform: z.string().trim().nonempty(),
    bundleid: z.string().trim().nonempty(),
    deviceid: z.string().trim().nonempty(),
    devicename: z.string().trim().nonempty(),
    osname: z.string().trim().nonempty(),
  })
});

const wsMessageValidateSchema = z.object({
  type: z.enum(WsDeviceMessageType),
  payload: z.object(),
});

export class DeviceClientInfo {
  readonly applicationId: string;
  readonly platform: string;
  readonly bundleId: string;
  readonly deviceId: string;
  readonly deviceName: string;
  readonly osName: string;

  constructor(applicationId: string, platform: string, bundleId: string, deviceId: string, deviceName: string, osName: string) {
    this.applicationId = applicationId;
    this.platform = platform;
    this.bundleId = bundleId;
    this.deviceId = deviceId;
    this.deviceName = deviceName;
    this.osName = osName;
  }
}

export class DeviceWsClient {
  private clientInfo?: DeviceClientInfo;
  private api: ReturnType<DeviceWsClientService['createDeviceClientAPI']>;
  constructor(private ws: WebSocket, private req: Request) {
    this.api = container.resolve(DeviceWsClientService).createDeviceClientAPI(this);
    this.initializeClient();
  }

  // Expose client info for server-side introspection
  public getClientInfo(): DeviceClientInfo | undefined {
    return this.clientInfo;
  }

  private async initializeClient() {
    const parseResult = wsConnectValidateSchema.safeParse(this.req);
    if (!parseResult.success) {
      this.ws.close(4001, responseMessages.DEVICE_INFO_VALIDATION_FAILED);
      return;
    }
    try {
      const { platform, bundleid, deviceid, devicename, osname, token } = parseResult.data.headers;
      const payload = tokenUtil.verify(token) as JwtPayload;
      const applicationId = payload.applicationId;
      if (!applicationId) {
        this.ws.close(4001, responseMessages.INVALID_TOKEN);
        return;
      }
      const application: IApplication & Document | null = await Application.findById(applicationId).exec();
      if (!application) {
        this.ws.close(4000, responseMessages.APPLICATION_NOT_FOUND);
        return;
      }
      if (!application.bundles.find(b => b.platform == platform && b.bundleId == bundleid)) {
        this.ws.close(4000, responseMessages.WRONG_BUNDLE_ID_OR_PLATFORM);
        return;
      }
      this.clientInfo = new DeviceClientInfo(
        applicationId,
        platform,
        bundleid,
        deviceid,
        devicename,
        osname,
      );
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
    const message: WsDeviceMessage = parseResult.data;
    switch (message.type) {
      case WsDeviceMessageType.eventMessage:
        addEventMessage(this.clientInfo, message.payload);
        break;
      default:
        this.ws.close(4005, responseMessages.WS_UNKNOWN_MESSAGE_TYPE);
    }
  }

  private onClose(event: CloseEvent) {
    this.deleteClient();
    console.log('WebSocket connection closed', event.code, event.reason);
  }

  private onError(err: ErrorEvent) {
    this.deleteClient();
    console.error('WebSocket error:', err.error, err.message);
    this.ws.close(5000, responseMessages.INTERNAL_SERVER_ERROR);
  }

  private registerClient() {
    this.api.connect();
  }

  private deleteClient() {
    this.api.disconnect();
  }
}