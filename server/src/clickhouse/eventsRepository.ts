import { NodeClickHouseClient } from '@clickhouse/client/dist/client';
import { EventMessage } from '../model/eventMessage';
import { InsertResult } from '@clickhouse/client';
import { CLickhouse } from './clickhouse';

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

  public async find(limit: number, offset: number): Promise<EventMessage[]> {
    const resultSet = await this.client.query({
      query: `SELECT *
      FROM ${this.table}
      ORDER BY timestamp DESC
      LIMIT {limit:Int} OFFSET {offset:Int};`,
      query_params: { limit, offset },
    });
    const result =  await resultSet.json<EventMessage>();
    return result.data;
  }
}