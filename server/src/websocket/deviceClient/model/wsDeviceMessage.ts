import { WsDeviceMessageType } from './wsDeviceMessageType';

export interface WsDeviceMessage {
  readonly type: WsDeviceMessageType;
  readonly payload: any;
}