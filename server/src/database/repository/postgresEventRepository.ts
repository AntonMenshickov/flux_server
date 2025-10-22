import { EventMessageView } from '../../model/eventMessageView';
import { EventFilter } from './eventsFilter';
import { EventMessage } from '../../model/postgres/eventMessageDbView';
import { Postgres } from '../postgres';
import { Operator, SearchCriterion } from '../../model/searchCriterion';
import { In, SelectQueryBuilder } from 'typeorm';
import { injectable } from 'tsyringe';


@injectable()
export class PostgresEventsRepository {

  constructor(private postgres: Postgres) { }

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

  public async findExistIds(ids: string[]): Promise<string[]> {
    if (!ids.length) return [];


    const existingRecords = await EventMessage.find({
      where: { id: In(ids) },
      select: ["id"],
    });


    return existingRecords.map(record => record.id);
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
    filters: SearchCriterion[] = [],
  ): Promise<EventMessageView[]> {
    const qb: SelectQueryBuilder<EventMessage> =
      EventMessage.createQueryBuilder("event");

    // Белый список разрешённых полей -> соответствующие SQL-столбцы
    const FIELD_TO_COLUMN: Record<string, string> = {
      id: 'event.id',
      timestamp: 'event.timestamp',
      applicationId: 'event."applicationId"',
      logLevel: 'event."logLevel"',
      platform: 'event.platform',
      bundleId: 'event."bundleId"',
      deviceId: 'event."deviceId"',
      deviceName: 'event."deviceName"',
      osName: 'event."osName"',
      message: 'event.message',
      tags: 'event.tags',
      meta: 'event.meta',
    };

    qb.andWhere(`event."applicationId" = :applicationId`, {
      applicationId,
    });

    filters.forEach((criterion, index) => {
      const paramKey = `param_${index}`;
      let value: any = criterion.value;

      if (criterion.field === "dateFrom" || criterion.field === "dateTo") {
        value = new Date(value);
        if (criterion.field === "dateFrom") {
          qb.andWhere(`event.timestamp >= :${paramKey}`, { [paramKey]: value });
        } else {
          qb.andWhere(`event.timestamp <= :${paramKey}`, { [paramKey]: value });
        }
        return;
      }

      // --- logLevel (всегда массив строк) ---
      if (criterion.field === "logLevel" && Array.isArray(value)) {
        const field = FIELD_TO_COLUMN['logLevel'];
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


      if (criterion.field === "meta" && Array.isArray(value)) {
        const field = FIELD_TO_COLUMN['meta'];
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

      // --- tags ---
      if (criterion.field === "tags") {
        const field = FIELD_TO_COLUMN['tags'];
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
            break;

          default:
            throw new Error(`Unsupported operator for tags: ${criterion.operator}`);
        }
        return;
      }

      // --- Общие случаи ---
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
          qb.andWhere(`CAST(${fieldExpr} AS TEXT) ILIKE :${paramKey}`, {
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
      .take(limit)
      .skip(offset);

    console.log(qb.getQueryAndParameters());
    const rows = await qb.getMany();
    return rows.map((r) => this.eventMessageFromDatabase(r));
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
