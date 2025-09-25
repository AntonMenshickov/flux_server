import { EventMessageDto } from './eventMessageDto';
import { v4 as uuidv4 } from 'uuid';

export interface EventMessage extends EventMessageDto {
  id: string;
  applicationId: string;
  platform: string;
  bundleId: string;
  deviceId: string;
  deviceName: string;
  osName: string;
}

export function eventMessageFromDto(
  dto: EventMessageDto,
  applicationId: string,
  platform: string,
  bundleId: string,
  deviceId: string,
  deviceName: string,
  osName: string,
): EventMessage {
  return {
    ...dto,
    id: uuidv4(),
    applicationId,
    platform,
    bundleId,
    deviceId,
    deviceName,
    osName,
  }
}