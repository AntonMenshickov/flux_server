import { EventMessageDbView } from './eventMessageDbView';
import { EventMessageDto } from './eventMessageDto';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';

export interface EventMessage extends EventMessageDto {
  id: string;
  applicationId: string;
}

export function eventMessageFromDto(dto: EventMessageDto, applicationId: string) {
  return {
    ...dto,
    id: uuidv4(),
    applicationId: applicationId,
  }
}

export function eventMessageFromDatabase(databaseEntry: EventMessageDbView) {
  const dt = DateTime.fromFormat(databaseEntry['timestamp'].slice(0, 23), 'yyyy-MM-dd HH:mm:ss.SSS', { zone: 'utc' });
  return {
    ...databaseEntry,
    timestamp: dt.toMillis() * 1000
  }
}