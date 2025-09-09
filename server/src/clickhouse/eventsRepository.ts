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

  async insert(events: EventMessage[]): Promise<InsertResult> {
    return this.client.insert<EventMessage>({
      table: this.table,
      values: events,
      format: 'JSONEachRow',
    });
  }

  async findById(id: string): Promise<EventMessage | null> {
    const resultSet = await this.client.query({
      query: `SELECT * FROM ${this.table} WHERE id = {id:String} LIMIT 1`,
      query_params: { id },
    });
    return (await resultSet.json<EventMessage>()).data[0] ?? null;
  }
}