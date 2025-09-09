import { createClient } from '@clickhouse/client';
import { NodeClickHouseClient } from '@clickhouse/client/dist/client';

export const clickhouseUtil = {
  createClient: (): NodeClickHouseClient => {
    const username = process.env.CLICKHOUSE_USERNAME;
    const password = process.env.CLICKHOUSE_PASSWORD;
    const host = process.env.CLICKHOUSE_HOST;
    const port = process.env.CLICKHOUSE_PORT;
    const connectionUrl = `http://${host}:${port}`;
    return createClient({
      url: connectionUrl,
      username: username,
      password: password
    });
  },
  databaseExists: async (): Promise<boolean> => {
    const dbName = process.env.CLICKHOUSE_DATABASE;
    const resultSet = await clickhouseUtil.createClient().query({
      query: `SELECT name FROM system.databases WHERE name = {db:String}`,
      query_params: { db: dbName },
    });

    const result = await resultSet.json();
    return result.data.length > 0;
  },

  ensureDatabase: async (): Promise<void> => {
    const dbName = process.env.CLICKHOUSE_DATABASE;
    const exists = await clickhouseUtil.databaseExists();
    if (!exists) {
      await clickhouseUtil.createClient().command({
        query: `CREATE DATABASE IF NOT EXISTS ${dbName}`,
      });
      console.log(`ClickHouse database ${dbName} created`);
    } else {
      console.log(`ClickHouse database ${dbName} exists`);
    }
  },

  tableExists: async (): Promise<boolean> => {
    const dbName = process.env.CLICKHOUSE_DATABASE;
    const tableName = process.env.CLICKHOUSE_EVENTS_TABLE;
    const resultSet = await clickhouseUtil.createClient().query({
      query: `
      SELECT name 
      FROM system.tables 
      WHERE database = {db:String} AND name = {table:String}
    `,
      query_params: {
        db: dbName,
        table: tableName,
      },
    });

    const result = await resultSet.json();
    return result.data.length > 0;
  },

  ensureTable: async (): Promise<void> => {
    const dbName = process.env.CLICKHOUSE_DATABASE;
    const tableName = process.env.CLICKHOUSE_EVENTS_TABLE;
    const exists = await clickhouseUtil.tableExists();
    if (!exists) {
      await clickhouseUtil.createClient().command({
        query: `
          CREATE TABLE ${dbName}.${tableName}
          (
              id String,  -- уникальный идентификатор (UUID или что-то своё)

              timestamp DateTime,  -- время события

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
      console.log(`ClickHouse table ${dbName}.${tableName} created`);
    } else {
      console.log(`ClickHouse table ${dbName}.${tableName} exists`);
    }

  }
}