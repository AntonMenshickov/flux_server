import { Types } from 'mongoose';
import { Client } from 'pg';
import { EventMessage } from '../../../model/eventMessage';
import { EventFilter } from '../eventsFilter';
import { EventsRepository } from '../eventsRepository';
import { LogLevel } from '../../../model/eventMessageDto';
import { Postgres } from '../../postgress/postgress';

interface EventMessageDbView {
  id: string;
  applicationid: string;
  timestamp: Date;
  loglevel: LogLevel;
  platform: string;
  bundleid: string;
  deviceid: string;
  message: string;
  tags?: string[] | null;
  meta?: Record<string, any> | null;
  stacktrace?: string | null;
}

export class PostgresEventsRepository extends EventsRepository {
  private client: Client;
  private table: string;

  constructor(postgress: Postgres) {
    super();
    this.client = postgress.client;
    this.table = postgress.table;
  }

  public async insert(events: EventMessage[]): Promise<void> {
    const chunkSize = 500;
    await this.client.query('BEGIN');

    try {
      for (let i = 0; i < events.length; i += chunkSize) {
        const chunk = events.slice(i, i + chunkSize);

        const values: any[] = [];
        const placeholders = chunk
          .map((e, idx) => {
            const base = idx * 11;
            values.push(
              e.id,
              new Date(e.timestamp / 1000),
              e.logLevel,
              e.applicationId,
              e.platform,
              e.bundleId,
              e.deviceId,
              e.message,
              e.tags ?? null,
              e.meta ? JSON.stringify(e.meta) : null,
              e.stackTrace ?? null
            );
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5},
                     $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11})`;
          })
          .join(', ');

        const query = `
          INSERT INTO ${this.table}
          (id, timestamp, logLevel, applicationId, platform, bundleId, deviceId, message, tags, meta, stackTrace)
          VALUES ${placeholders};
        `;

        await this.client.query(query, values);
      }

      await this.client.query('COMMIT'); // фиксируем транзакцию
    } catch (err) {
      await this.client.query('ROLLBACK'); // откат при ошибке
      throw err;
    }
  }

  public async findById(id: string): Promise<EventMessage | null> {
    const res = await this.client.query<EventMessageDbView>(
      `SELECT * FROM ${this.table} WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (res.rowCount === 0) return null;
    return this.eventMessageFromDatabase(res.rows[0]);
  }

  public async find(
    limit: number,
    offset: number,
    applicationId: Types.ObjectId,
    filters: EventFilter | null = null
  ): Promise<EventMessage[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (applicationId) {
      conditions.push(`LOWER(applicationId) = LOWER($${idx++})`);
      values.push(applicationId.toString());
    }

    if (filters?.message) {
      conditions.push(`LOWER(message) LIKE '%' || LOWER($${idx++}) || '%'`);
      values.push(filters.message);
    }

    if (filters?.logLevel && filters.logLevel.length > 0) {
      conditions.push(`logLevel = ANY($${idx++})`);
      values.push(filters.logLevel);
    }

    if (filters?.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag) => {
        conditions.push(`$${idx++} = ANY(tags)`);
        values.push(tag);
      });
    }

    if (filters?.meta) {
      Object.entries(filters.meta).forEach(([key, value]) => {
        conditions.push(`meta->>$${idx++} = $${idx++}`);
        values.push(key, value);
      });
    }

    if (filters?.platform) {
      conditions.push(`platform = $${idx++}`);
      values.push(filters.platform);
    }

    if (filters?.bundleId) {
      conditions.push(`bundleId = $${idx++}`);
      values.push(filters.bundleId);
    }

    if (filters?.deviceId) {
      conditions.push(`deviceId = $${idx++}`);
      values.push(filters.deviceId);
    }

    if (filters?.from) {
      conditions.push(`timestamp >= $${idx++}`);
      values.push(new Date(filters.from / 1000).toISOString());
    }

    if (filters?.to) {
      conditions.push(`timestamp <= $${idx++}`);
      values.push(new Date(filters.to / 1000).toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT * 
      FROM ${this.table}
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    values.push(limit, offset);

    const res = await this.client.query<EventMessageDbView>(query, values);
    return res.rows.map((r) => this.eventMessageFromDatabase(r));
  }

  private eventMessageFromDatabase(dbEntry: EventMessageDbView): EventMessage {
    return {
      id: dbEntry.id,
      applicationId: dbEntry.applicationid,
      timestamp: dbEntry.timestamp.getTime() * 1000,
      logLevel: dbEntry.loglevel,
      platform: dbEntry.platform,
      bundleId: dbEntry.bundleid,
      deviceId: dbEntry.deviceid,
      message: dbEntry.message,
      tags: dbEntry.tags ?? undefined,
      meta: dbEntry.meta ?? undefined,
      stackTrace: dbEntry.stacktrace ?? undefined,
    };
  }
}
