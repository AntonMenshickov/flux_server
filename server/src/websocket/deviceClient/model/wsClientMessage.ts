export enum WsClientMessageType {
  eventMessage = 0,
}

export interface WsClientMessage {
  readonly type: WsClientMessageType;
  readonly payload: any;
}