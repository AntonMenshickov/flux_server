import { EventMessageView } from '../../model/eventMessageView';
import { EventFilter } from './eventsFilter';
import { EventMessage } from '../../model/postgres/eventMessageDbView';
import { Postgres } from '../postgres';


export class PostgresEventsRepository {
  private postgres: Postgres;

  constructor(postgres: Postgres) {
    this.postgres = postgres;
  }

  public async insert(events: EventMessageView[]): Promise<void> {
    const chunkSize = 500;

    await this.postgres.dataSource.transaction(async (manager) => {
      for (let i = 0; i < events.length; i += chunkSize) {
        const chunk = events.slice(i, i + chunkSize);
        
        const records: Partial<EventMessage>[] = chunk.map((e) => ({
          id: e.id,
          timestamp: new Date(e.timestamp / 1000),
          logLevel: e.logLevel,
          applicationId: e.applicationId,
          platform: e.platform,
          bundleId: e.bundleId,
          deviceId: e.deviceId,
          deviceName: e.deviceName,
          osName: e.osName,
          message: e.message,
          tags: e.tags ?? undefined,
          meta: e.meta ?? undefined,
          stackTrace: e.stackTrace ?? undefined,
        }));

        await manager
          .createQueryBuilder()
          .insert()
          .into(EventMessage)
          .values(records)
          .execute();
      }
    });
  }

  public async findById(id: string): Promise<EventMessageView | null> {

    const res = await EventMessage.findOneBy({ id });
    if (res == null) return null;
    return this.eventMessageFromDatabase(res);
  }

  public async find(
    limit: number,
    offset: number,
    applicationId: string,
    filters: EventFilter | null = null
  ): Promise<EventMessageView[]> {
    const qb = EventMessage.createQueryBuilder("event");


    if (applicationId) {
      qb.andWhere('LOWER(event.applicationId) = LOWER(:applicationId)', { applicationId });
    }


    if (filters?.message) {
      qb.andWhere('LOWER(event.message) LIKE :message', { message: `%${filters.message.toLowerCase()}%` });
    }


    if (filters?.logLevel && filters.logLevel.length > 0) {
      qb.andWhere('event.logLevel = ANY(:logLevels)', { logLevels: filters.logLevel });
    }


    if (filters?.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag, idx) => {
        qb.andWhere(`:tag${idx} = ANY(event.tags)`, { [`tag${idx}`]: tag });
      });
    }


    if (filters?.meta) {
      Object.entries(filters.meta).forEach(([key, value], idx) => {
        qb.andWhere(`event.meta ->> :metaKey${idx} = :metaValue${idx}`, {
          [`metaKey${idx}`]: key,
          [`metaValue${idx}`]: value,
        });
      });
    }


    if (filters?.platform) qb.andWhere('event.platform = :platform', { platform: filters.platform });
    if (filters?.bundleId) qb.andWhere('event.bundleId = :bundleId', { bundleId: filters.bundleId });
    if (filters?.deviceId) qb.andWhere('event.deviceId = :deviceId', { deviceId: filters.deviceId });
    if (filters?.deviceName) qb.andWhere('event.deviceName = :deviceName', { deviceName: filters.deviceName });
    if (filters?.osName) qb.andWhere('event.osName = :osName', { osName: filters.osName });


    if (filters?.from) qb.andWhere('event.timestamp >= :from', { from: new Date(filters.from) });
    if (filters?.to) qb.andWhere('event.timestamp <= :to', { to: new Date(filters.to) });


    qb.orderBy('event.timestamp', 'DESC')
      .take(limit)
      .skip(offset);


    const rows = await qb.getMany();


    return rows.map(r => this.eventMessageFromDatabase(r));
  }

  private eventMessageFromDatabase(dbEntry: EventMessage): EventMessageView {
    return {
      id: dbEntry.id,
      applicationId: dbEntry.applicationId,
      timestamp: dbEntry.timestamp.getTime() * 1000,
      logLevel: dbEntry.logLevel,
      platform: dbEntry.platform,
      bundleId: dbEntry.bundleId,
      deviceId: dbEntry.deviceId,
      message: dbEntry.message,
      tags: dbEntry.tags ?? undefined,
      meta: dbEntry.meta ?? undefined,
      stackTrace: dbEntry.stackTrace ?? undefined,
      deviceName: dbEntry.deviceName,
      osName: dbEntry.osName,
    };
  }
}
