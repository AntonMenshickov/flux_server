import { EventMessage } from '../../model/eventMessage';
import { Types } from 'mongoose';
import { EventFilter } from './eventsFilter';

export abstract class EventsRepository {

  public abstract insert(events: EventMessage[]): Promise<void>;

  public abstract findById(id: string): Promise<EventMessage | null>;

  public abstract find(
    limit: number,
    offset: number,
    applicationId: Types.ObjectId,
    filters?: EventFilter | null,
  ): Promise<EventMessage[]>;
}