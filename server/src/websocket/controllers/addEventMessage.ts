import { WebSocket, MessageEvent, ErrorEvent, CloseEvent } from 'ws';
import { WsClient } from '../ws';
import { EventMessageDto } from '../../model/eventMessageDto';
import { eventMessageDtoSchema } from '../../utils/zodUtil';
import { eventMessageFromDto } from '../../model/eventMessage';
import { ReliableBatchQueue } from '../../eventsQueue/reliableBatchQueue';

export async function addEventMessage(ws: WebSocket, client: WsClient, payload: any) {
  const logMessage: EventMessageDto = eventMessageDtoSchema.parse(payload);

  const eventData = eventMessageFromDto(logMessage, client.applicationId, client.platform, client.bundleId, client.deviceId);
  ReliableBatchQueue.instance.enqueue(eventData);
}