import { NodeClickHouseClient } from '@clickhouse/client/dist/client';
import { Types } from 'mongoose';
import { CLickhouse } from '../../clickhouse/clickhouse';
import { EventMessage } from '../../../model/eventMessage';
import { EventFilter } from '../eventsFilter';
import { DateTime } from 'luxon';
import { EventsRepository } from '../eventsRepository';
import { LogLevel } from '../../../model/eventMessageDto';

interface EventMessageDbView {
  id: string;
  applicationId: string;
  timestamp: string;
  logLevel: LogLevel;
  platform: string;
  bundleId: string;
  deviceId: string;
  deviceName: string;
  osName: string;
  message: string;
  tags?: string[] | null;
  meta?: Record<string, string> | null;
  stackTrace?: string | null;
}

export class ClickhouseEventsRepository extends EventsRepository {
  private client: NodeClickHouseClient;
  private table: string;

  constructor(clickhouse: CLickhouse) {
    super();
    this.client = clickhouse.client;
    this.table = `${clickhouse.database}.${clickhouse.table}`;
  }

  public async insert(events: EventMessage[]): Promise<void> {
    await this.client.insert<EventMessage>({
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
    applicationId: Types.ObjectId,
    filters: EventFilter | null = null
  ): Promise<EventMessage[]> {
    const conditions: string[] = [];
    const queryParams: Record<string, any> = { limit, offset };

    if (applicationId) {
      conditions.push(`applicationId = {applicationId:String}`);
      queryParams.applicationId = applicationId.toString().toLowerCase();
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
        conditions.push(`mapValues(meta)[indexOf(mapKeys(meta), {metaKey${i}:String})] = {metaValue${i}:String}`);
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

    if (filters?.deviceName) {
      conditions.push(`deviceName = {deviceName:String}`);
      queryParams.deviceName = filters.deviceName;
    }

    if (filters?.osName) {
      conditions.push(`osName = {osName:String}`);
      queryParams.osName = filters.deviceName;
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

    return result.data.map(this.eventMessageFromDatabase);
  }

  private eventMessageFromDatabase(databaseEntry: EventMessageDbView): EventMessage {
    const dt = DateTime.fromFormat(databaseEntry['timestamp'].slice(0, 23), 'yyyy-MM-dd HH:mm:ss.SSS', { zone: 'utc' });
    return {
      ...databaseEntry,
      timestamp: dt.toMillis() * 1000
    }
  }

}