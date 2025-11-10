import { EventMessageFull } from '../../model/eventMessageFull';
import { EventMessageBasic } from '../../model/eventMessageBasic';
import { EventMessage } from '../../model/postgres/eventMessageDbView';
import { Postgres } from '../postgres';
import { Operator, SearchCriterion, SearchFieldKey } from '../../model/searchCriterion';
import { In, SelectQueryBuilder } from 'typeorm';
import { injectable } from 'tsyringe';
import { ConfigService } from '../../services/configService';


@injectable()
export class PostgresEventsRepository {
  private readonly contentsTable: string;

  constructor(
    private postgres: Postgres,
    private configService: ConfigService
  ) {
    this.contentsTable = `${this.configService.postgresEventsTable}_contents`;
  }

  public async insert(events: EventMessageFull[]): Promise<void> {
    const chunkSize = 500;
    const maxMessageLength = 1000;

    await this.postgres.dataSource.transaction(async (manager) => {
      for (let i = 0; i < events.length; i += chunkSize) {
        const chunk = events.slice(i, i + chunkSize);

        const records: Partial<EventMessage>[] = [];
        const contentsToInsert: Array<{ id: string; message: string }> = [];

        chunk.forEach((e) => {
          const messageLength = e.message.length;
          const truncatedMessage = messageLength > maxMessageLength 
            ? e.message.substring(0, maxMessageLength)
            : e.message;

          records.push({
            id: e.id,
            timestamp: new Date(e.timestamp),
            logLevel: e.logLevel,
            applicationId: e.applicationId,
            platform: e.platform,
            bundleId: e.bundleId,
            deviceId: e.deviceId,
            deviceName: e.deviceName,
            osName: e.osName,
            message: truncatedMessage,
            tags: e.tags ?? undefined,
            meta: e.meta ?? undefined,
            stackTrace: e.stackTrace ?? undefined,
          });

          if (messageLength > maxMessageLength) {
            contentsToInsert.push({
              id: e.id,
              message: e.message,
            });
          }
        });

        await manager
          .createQueryBuilder()
          .insert()
          .into(EventMessage)
          .values(records)
          .execute();

        if (contentsToInsert.length > 0) {
          const values = contentsToInsert.map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(', ');
          const params = contentsToInsert.flatMap((c) => [c.id, c.message]);
          await manager.query(
            `INSERT INTO "${this.contentsTable}" (id, message) VALUES ${values} ON CONFLICT (id) DO UPDATE SET message = EXCLUDED.message`,
            params
          );
        }
      }
    });
  }

  public async findExistIds(ids: string[]): Promise<string[]> {
    if (!ids.length) return [];


    const existingRecords = await EventMessage.find({
      where: { id: In(ids) },
      select: ["id"],
    });


    return existingRecords.map(record => record.id);
  }

  public async findById(id: string): Promise<EventMessageFull | null> {
    const res = await EventMessage.findOneBy({ id });
    if (res == null) return null;
    return this.eventMessageFromDatabase(res);
  }

  public async getFullMessage(id: string): Promise<string | null> {
    const result = await this.postgres.dataSource.query(
      `SELECT message FROM "${this.contentsTable}" WHERE id = $1`,
      [id]
    );
    
    if (result.length === 0) {
      const event = await EventMessage.findOneBy({ id });
      return event?.message ?? null;
    }
    
    return result[0].message;
  }

  public async find(
    limit: number,
    applicationId: string,
    lastTimestamp?: number,
    lastId?: string,
    filters: SearchCriterion[] = [],
  ): Promise<EventMessageBasic[]> {
    const hasMessageFilter = filters.some(f => f.field === SearchFieldKey.Message);
    
    const qb: SelectQueryBuilder<EventMessage> =
      EventMessage.createQueryBuilder("event");

    if (hasMessageFilter) {
      qb.leftJoin(
        `(SELECT id, message FROM "${this.contentsTable}")`,
        'contents',
        'contents.id = event.id'
      );
    }

    // Whitelist of allowed fields -> corresponding SQL columns
    const FIELD_TO_COLUMN: Record<SearchFieldKey, string> = {
      [SearchFieldKey.Message]: hasMessageFilter 
        ? `COALESCE(contents.message, event.message)`
        : 'event.message',
      [SearchFieldKey.LogLevel]: 'event."logLevel"',
      [SearchFieldKey.Meta]: 'event.meta',
      [SearchFieldKey.Tags]: 'event.tags',
      [SearchFieldKey.Timestamp]: 'event.timestamp',
      [SearchFieldKey.Platform]: 'event.platform',
      [SearchFieldKey.BundleId]: 'event."bundleId"',
      [SearchFieldKey.DeviceId]: 'event."deviceId"',
      [SearchFieldKey.DeviceName]: 'event."deviceName"',
      [SearchFieldKey.OsName]: 'event."osName"',
    };

    qb.andWhere(`event."applicationId" = :applicationId`, {
      applicationId,
    });

    if (lastTimestamp !== undefined && lastId !== undefined) {
      qb.andWhere(`("timestamp", id) < (:lastTimestamp, :lastId)`, {
        lastTimestamp: new Date(lastTimestamp),
        lastId,
      })
    }

    filters.forEach((criterion, index) => {
      const paramKey = `param_${index}`;
      let value: any = criterion.value;

      if (criterion.field === SearchFieldKey.Timestamp) {
        value = new Date(value);
        switch (criterion.operator) {
          case Operator.GreaterThan:
            qb.andWhere(`event.timestamp > :${paramKey}`, { [paramKey]: value });
            break;
          case Operator.LessThan:
            qb.andWhere(`event.timestamp < :${paramKey}`, { [paramKey]: value });
            break;
          default:
            throw new Error(`Unsupported operator for timestamp: ${criterion.operator}`);
        }
        return;
      }

      // logLevel (always array of strings)
      if (criterion.field === SearchFieldKey.LogLevel && Array.isArray(value)) {
        const field = FIELD_TO_COLUMN[SearchFieldKey.LogLevel];
        switch (criterion.operator) {
          case Operator.In:
            qb.andWhere(`${field} IN (:...${paramKey})`, {
              [paramKey]: value,
            });
            break;
          case Operator.NotIn:
            qb.andWhere(`${field} NOT IN (:...${paramKey})`, {
              [paramKey]: value,
            });
            break;
          default:
            throw new Error(`Unsupported operator for logLevel: ${criterion.operator}`);
        }
        return;
      }


      if (criterion.field === SearchFieldKey.Meta && Array.isArray(value)) {
        const field = FIELD_TO_COLUMN[SearchFieldKey.Meta];
        const metaFilters = value as Record<string, string>[];

        switch (criterion.operator) {
          case Operator.Equals: {
            const obj = Object.fromEntries(
              metaFilters.map((kv) => [Object.keys(kv)[0], Object.values(kv)[0]])
            );
            qb.andWhere(`${field} @> :${paramKey}`, {
              [paramKey]: JSON.stringify(obj),
            });
            break;
          }

          case Operator.NotEquals: {
            metaFilters.forEach((kv, kvIndex) => {
              const k = Object.keys(kv)[0];
              const v = Object.values(kv)[0];
              const metaParam = `${paramKey}_${kvIndex}`;
              qb.andWhere(`NOT (${field} @> :${metaParam})`, {
                [metaParam]: JSON.stringify({ [k]: v }),
              });
            });
            break;
          }

          case Operator.Similar: {
            metaFilters.forEach((kv, kvIndex) => {
              const k = Object.keys(kv)[0];
              const v = Object.values(kv)[0];
              const metaParam = `${paramKey}_${kvIndex}`;
              qb.andWhere(`${field}->>:key_${metaParam} ILIKE :${metaParam}`, {
                [`key_${metaParam}`]: k,
                [metaParam]: `%${v}%`,
              });
            });
            break;
          }

          default:
            throw new Error(`Unsupported operator for meta: ${criterion.operator}`);
        }
        return;
      }

      if (criterion.field === SearchFieldKey.Tags) {
        const field = FIELD_TO_COLUMN[SearchFieldKey.Tags];
        const tagsArray = Array.isArray(value)
          ? value
          : String(value).split(",").map((t) => t.trim()).filter(Boolean);

        switch (criterion.operator) {
          case Operator.In:
            qb.andWhere(`${field} && :${paramKey}`, { [paramKey]: tagsArray });
            break;

          case Operator.NotIn:
            qb.andWhere(`NOT (${field} && :${paramKey})`, { [paramKey]: tagsArray });
            break;

          case Operator.Equals:
            qb.andWhere(`${field} @> :${paramKey}`, { [paramKey]: tagsArray });
            qb.andWhere(`${field} <@ :${paramKey}`, { [paramKey]: tagsArray });
            break;

          default:
            throw new Error(`Unsupported operator for tags: ${criterion.operator}`);
        }
        return;
      }

      // Message field special handling - search in both tables using COALESCE with pg_trgm
      if (criterion.field === SearchFieldKey.Message) {
        const messageField = FIELD_TO_COLUMN[SearchFieldKey.Message];
        switch (criterion.operator) {
          case Operator.Equals:
            qb.andWhere(`${messageField} = :${paramKey}`, { [paramKey]: value });
            break;

          case Operator.NotEquals:
            qb.andWhere(`${messageField} != :${paramKey}`, { [paramKey]: value });
            break;

          case Operator.Similar:
            qb.andWhere(`${messageField} ILIKE :${paramKey}`, {
              [paramKey]: `%${value}%`,
            });
            break;

          case Operator.In:
            qb.andWhere(`${messageField} IN (:...${paramKey})`, {
              [paramKey]: value,
            });
            break;

          case Operator.NotIn:
            qb.andWhere(`${messageField} NOT IN (:...${paramKey})`, {
              [paramKey]: value,
            });
            break;

          default:
            throw new Error(`Unsupported operator for message: ${criterion.operator}`);
        }
        return;
      }

      // General cases
      const fieldExpr = FIELD_TO_COLUMN[criterion.field];
      if (!fieldExpr) {
        throw new Error(`Unsupported filter field: ${criterion.field}`);
      }
      switch (criterion.operator) {
        case Operator.Equals:
          qb.andWhere(`${fieldExpr} = :${paramKey}`, { [paramKey]: value });
          break;

        case Operator.NotEquals:
          qb.andWhere(`${fieldExpr} != :${paramKey}`, { [paramKey]: value });
          break;

        case Operator.Similar:
          qb.andWhere(`${fieldExpr} ILIKE :${paramKey}`, {
            [paramKey]: `%${value}%`,
          });
          break;

        case Operator.GreaterThan:
          qb.andWhere(`${fieldExpr} > :${paramKey}`, { [paramKey]: value });
          break;

        case Operator.LessThan:
          qb.andWhere(`${fieldExpr} < :${paramKey}`, { [paramKey]: value });
          break;

        case Operator.In:
          qb.andWhere(`${fieldExpr} IN (:...${paramKey})`, {
            [paramKey]: value,
          });
          break;

        case Operator.NotIn:
          qb.andWhere(`${fieldExpr} NOT IN (:...${paramKey})`, {
            [paramKey]: value,
          });
          break;

        default:
          throw new Error(`Unsupported operator: ${criterion.operator}`);
      }
    });

    qb.orderBy("event.timestamp", "DESC")
      .addOrderBy("event.id", "DESC")
      .take(limit);

    const rows = await qb.getMany();
    return rows.map((r) => this.eventMessageBasicFromDatabase(r));
  }


  private eventMessageBasicFromDatabase(dbEntry: EventMessage): EventMessageBasic {
    return {
      id: dbEntry.id,
      timestamp: dbEntry.timestamp.getTime(),
      logLevel: dbEntry.logLevel,
      message: dbEntry.message,
    };
  }

  private eventMessageFromDatabase(dbEntry: EventMessage): EventMessageFull {
    return {
      id: dbEntry.id,
      applicationId: dbEntry.applicationId,
      timestamp: dbEntry.timestamp.getTime(),
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
