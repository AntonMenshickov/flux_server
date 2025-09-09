import { NodeClickHouseClient } from '@clickhouse/client/dist/client';
import { EventMessage } from '../model/logMessage';
import { InsertResult } from '@clickhouse/client';

export class EventsRepository {
  private client: NodeClickHouseClient;
  private table: string;

  constructor(client: NodeClickHouseClient, dbName: string = 'flux') {
    this.client = client;
    this.table = `${dbName}.logs`;
  }

  async insert(events: EventMessage[]): Promise<InsertResult> {
    return this.client.insert<EventMessage>({
      table: 'logs',
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