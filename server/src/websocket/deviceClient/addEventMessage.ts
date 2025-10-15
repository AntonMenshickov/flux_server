import { EventMessageDto } from '../../model/eventMessageDto';
import { eventMessageDtoSchema } from '../../utils/zodUtil';
import { eventMessageFromDto } from '../../model/eventMessageView';
import { ReliableBatchQueue } from '../../eventsQueue/reliableBatchQueue';
import { container } from 'tsyringe';
import { DeviceClientInfo } from './deviceWsClient';

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
}