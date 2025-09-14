import { NodeClickHouseClient } from '@clickhouse/client/dist/client';
import { EventMessage, eventMessageFromDatabase } from '../model/eventMessage';
import { InsertResult } from '@clickhouse/client';
import { CLickhouse } from './clickhouse';
import { LogLevel } from '../model/eventMessageDto';
import { EventMessageDbView } from '../model/eventMessageDbView';

export interface EventFilter {
  applicationId?: string | null;
  message?: string | null;
  logLevel?: LogLevel[] | null;
  tags?: string[] | null;
  meta?: Record<string, string> | null;
  platform?: string | null;
  bundleId?: string | null;
  deviceId?: string | null;
  from?: number | null;
  to?: number | null;
}

export class EventsRepository {
  private client: NodeClickHouseClient;
  private table: string;

  constructor() {
    this.client = CLickhouse.instance.client;
    this.table = `${CLickhouse.instance.database}.${CLickhouse.instance.table}`;
  }

  public async insert(events: EventMessage[]): Promise<InsertResult> {
    return this.client.insert<EventMessage>({
      table: this.table,
      values: events,
      format: 'JSONEachRow',
    });
  }

  public async findById(id: string): Promise<EventMessage | null> {
    const resultSet = await this.client.query({
      query: `SELECT * FROM ${this.table} WHERE id = {id:String} LIMIT 1`,
      query_params: { id },
    });
    return (await resultSet.json<EventMessage>()).data[0] ?? null;
  }


  public async find(
    limit: number,
    offset: number,
    filters: EventFilter | null = null
  ): Promise<EventMessage[]> {
    const conditions: string[] = [];
    const queryParams: Record<string, any> = { limit, offset };

    if (filters?.applicationId) {
      conditions.push(`applicationId = {applicationId:String}`);
      queryParams.applicationId = filters.applicationId.toLowerCase();
    }

    if (filters?.message) {
      conditions.push(`lower(message) LIKE concat('%', {message:String}, '%')`);
      queryParams.message = filters.message.toLowerCase();
    }

    if (filters?.logLevel && filters.logLevel.length > 0) {
      conditions.push(`logLevel IN ({logLevel:Array(Enum8('info' = 1, 'warn' = 2, 'error' = 3, 'debug' = 4))})`);
      queryParams.logLevel = filters.logLevel;
    }

    if (filters?.tags && filters.tags.length > 0) {
      conditions.push(
        filters.tags.map((_, i) => `has(tags, {tag${i}:String})`).join(' AND ')
      );
      filters.tags.forEach((tag, i) => (queryParams[`tag${i}`] = tag));
    }

    if (filters?.meta) {
      Object.entries(filters.meta).forEach(([key, value], i) => {
        conditions.push(`mapContains(meta, {metaKey${i}:String}, {metaValue${i}:String})`);
        queryParams[`metaKey${i}`] = key;
        queryParams[`metaValue${i}`] = value;
      });
    }

    if (filters?.platform) {
      conditions.push(`platform = {platform:String}`);
      queryParams.platform = filters.platform;
    }

    if (filters?.bundleId) {
      conditions.push(`bundleId = {bundleId:String}`);
      queryParams.bundleId = filters.bundleId;
    }

    if (filters?.deviceId) {
      conditions.push(`deviceId = {deviceId:String}`);
      queryParams.deviceId = filters.deviceId;
    }

    if (filters?.from) {
      conditions.push(`timestamp >= {from:DateTime64(6)}`);
      queryParams.from = filters.from;
    }

    if (filters?.to) {
      conditions.push(`timestamp <= {to:DateTime64(6)}`);
      queryParams.to = filters.to;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
    SELECT *
    FROM ${this.table}
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT {limit:Int} OFFSET {offset:Int};
  `;

    const resultSet = await this.client.query({
      query,
      query_params: queryParams,
    });
    const result = await resultSet.json<EventMessageDbView>();

    return result.data.map(eventMessageFromDatabase);
  }

}