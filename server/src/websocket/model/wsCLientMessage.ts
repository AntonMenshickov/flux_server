import { WsClientMessageType } from './wsClientMessageType';

export interface WsClientMessage {
  readonly type: WsClientMessageType;
  readonly payload: any;
}