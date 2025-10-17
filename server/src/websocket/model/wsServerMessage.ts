export enum WsServerMessageType {
  startEventsStream = 0,
  stopEventsStream = 1,
  clientUuidResponse = 2,
  eventMessage = 3,
  keepEventsStream = 4,
  deviceDisconnected = 5,
}

export interface WsServerMessage {
  readonly type: WsServerMessageType;
  readonly payload: any;
}