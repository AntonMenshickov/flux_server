export enum WsClientMessageType {
  eventMessage = 0,
  updateMetaKeys = 1,
}

export interface WsClientMessage {
  readonly type: WsClientMessageType;
  readonly payload: any;
}