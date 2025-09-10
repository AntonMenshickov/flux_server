import { createClient } from '@clickhouse/client';
import { NodeClickHouseClient } from '@clickhouse/client/dist/client';

export class CLickhouse {
  private static _instance: CLickhouse;
  private static _client: NodeClickHouseClient;
  private username: string;
  private password: string;
  private host: string;
  private port: number;
  public database: string;
  public table: string;

  constructor() {
    this.username = process.env.CLICKHOUSE_USERNAME as string;
    this.password = process.env.CLICKHOUSE_PASSWORD as string;
    this.host = process.env.CLICKHOUSE_HOST as string;
    this.port = Number(process.env.CLICKHOUSE_PORT);
    this.database = process.env.CLICKHOUSE_DATABASE as string;
    this.table = process.env.CLICKHOUSE_EVENTS_TABLE as string;
  }

  static get instance(): CLickhouse {
    if (!CLickhouse._instance) {
      CLickhouse._instance = new CLickhouse();
    }
    return CLickhouse._instance;
  }

  get client(): NodeClickHouseClient {
    if (!CLickhouse._client) {
      const connectionUrl = `http://${this.host}:${this.port}`;
      CLickhouse._client = createClient({
        url: connectionUrl,
        username: this.username,
        password: this.password,
        database: this.database,
      });
    }
    return CLickhouse._client;
  };

  public async databaseExists(): Promise<boolean> {
    const dbName = process.env.CLICKHOUSE_DATABASE;
    const resultSet = await this.client.query({
      query: `SELECT name FROM system.databases WHERE name = {db:String}`,
      query_params: { db: dbName },
    });

    const result = await resultSet.json();
    return result.data.length > 0;
  };

  public async ensureDatabase(): Promise<void> {
    const dbName = process.env.CLICKHOUSE_DATABASE;
    const exists = await this.databaseExists();
    if (!exists) {
      await this.client.command({
        query: `CREATE DATABASE IF NOT EXISTS ${dbName}`,
      });
      console.log(`ClickHouse database ${dbName} created`);
    } else {
      console.log(`ClickHouse database ${dbName} exists`);
    }
  };

  public async tableExists(): Promise<boolean> {
    const resultSet = await this.client.query({
      query: `
      SELECT name 
      FROM system.tables 
      WHERE database = {db:String} AND name = {table:String}
    `,
      query_params: {
        db: this.database,
        table: this.table,
      },
    });

    const result = await resultSet.json();
    return result.data.length > 0;
  };

  public async ensureTable(): Promise<void> {
    const exists = await this.tableExists();
    if (!exists) {
      await this.client.command({
        query: `
          CREATE TABLE ${this.database}.${this.table}
          (
              id String,  -- уникальный идентификатор (UUID или что-то своё)

              timestamp DateTime64(3, 'UTC'),  -- время события

              logLevel Enum8(
                  'info'  = 1,
                  'warn'  = 2,
                  'error' = 3,
                  'debug' = 4
              ),

              applicationId String,   -- ID приложения
              platform String,        -- OS / device
              bundleId String,        -- идентификатор сборки
              deviceId String,        -- идентификатор устройства
              message String,         -- текст сообщения
              tags Array(String),     -- список тегов
              meta Map(String, String), -- дополнительные поля в формате ключ-значение
              stackTrace Nullable(String) -- стек вызова (может отсутствовать)
          )
          ENGINE = MergeTree
          PARTITION BY toYYYYMM(timestamp)         -- логично хранить по месяцам
          ORDER BY (applicationId, timestamp, id) -- оптимизация поиска
          TTL timestamp + INTERVAL 90 DAY          -- автоудаление старше 90 дней
          SETTINGS index_granularity = 8192;
      `,
      });
      console.log(`ClickHouse table ${this.database}.${this.table} created`);
    } else {
      console.log(`ClickHouse table ${this.database}.${this.table} exists`);
    }
  }

  public async clearTable(): Promise<void> {
    await this.client.command({
      query: `TRUNCATE TABLE ${this.database}.${this.table};`,
    });
  }

  public async dropTable(): Promise<void> {
    await this.client.command({
      query: `DROP TABLE ${this.database}.${this.table};`,
    });
  }
}