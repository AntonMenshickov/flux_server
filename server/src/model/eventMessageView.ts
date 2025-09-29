import { EventMessageDto } from './eventMessageDto';
import { v4 as uuidv4 } from 'uuid';

export interface EventMessageView extends EventMessageDto {
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
): EventMessageView {
  return {
    timestamp: dto.timestamp,
    logLevel: dto.logLevel,
    message: dto.message,
    tags: dto.tags ?? undefined,
    meta: dto.meta ?? undefined,
    stackTrace: dto.stackTrace ?? undefined,
    id: uuidv4(),
    applicationId,
    platform,
    bundleId,
    deviceId,
    deviceName,
    osName,
  }
}