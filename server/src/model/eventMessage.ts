import { EventMessageDto } from './eventMessageDto';
import { v4 as uuidv4 } from 'uuid';

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