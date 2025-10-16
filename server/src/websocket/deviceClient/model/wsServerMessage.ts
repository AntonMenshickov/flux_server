export enum WsServerMessageType {
  startEventsStream = 0,
  stopEventsStream = 1,
}

export interface WsServerMessage {
  readonly type: WsServerMessageType;
  readonly payload: any;
}