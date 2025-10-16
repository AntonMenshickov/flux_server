import { EventMessageDto } from '../../model/eventMessageDto';
import { eventMessageDtoSchema } from '../../utils/zodUtil';
import { eventMessageFromDto } from '../../model/eventMessageView';
import { ReliableBatchQueue } from '../../eventsQueue/reliableBatchQueue';
import { container } from 'tsyringe';
import { DeviceClientInfo } from './deviceWsClient';
import { WebWsClientService } from '../../services/webWsClientsService';
import { WsClientMessageType, WsClientMessage } from './model/wsClientMessage';

export async function addEventMessage(client: DeviceClientInfo, payload: object) {
  const logMessage: EventMessageDto = eventMessageDtoSchema.parse(payload);

  const eventData = eventMessageFromDto(
    logMessage,
    client.applicationId,
    client.platform,
    client.bundleId,
    client.deviceId,
    client.deviceName,
    client.osName,
  );
  container.resolve(ReliableBatchQueue).enqueue(eventData);
  // Also forward the event to any subscribed web clients
  try {
    const webService = container.resolve(WebWsClientService);
  const subscribers = webService.getSubscribers(client.uuid);
  if (subscribers.length) console.log(`Forwarding event from device ${client.uuid} to ${subscribers.length} web subscribers`);
    const message: WsClientMessage = { type: WsClientMessageType.eventMessage, payload: eventData };
    subscribers.forEach(s => {
      try {
        (s as any).sendServerMessage(message);
      } catch (e) {
        console.error('Failed to forward event to web subscriber', e);
      }
    });
  } catch (e) {
    console.error(e);
  }
}