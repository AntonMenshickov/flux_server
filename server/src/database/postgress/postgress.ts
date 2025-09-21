// postgres.ts
import { Client } from 'pg';
import { Database } from '../database';

export class Postgres extends Database {
  private static _client: Client;

  private username: string;
  private password: string;
  private host: string;
  private port: number;
  public database: string;
  public table: string;

  constructor() {
    super();
    this.username = process.env.POSTGRESS_USERNAME as string;
    this.password = process.env.POSTGRESS_PASSWORD as string;
    this.host = process.env.POSTGRESS_HOST as string;
    this.port = Number(process.env.POSTGRESS_PORT);
    this.database = process.env.POSTGRESS_DATABASE as string;
    this.table = process.env.POSTGRESS_EVENTS_TABLE as string;
  }

  get client(): Client {
    if (!Postgres._client) {
      Postgres._client = new Client({
        user: this.username,
        password: this.password,
        host: this.host,
        port: this.port,
        database: this.database,
      });
    }
    return Postgres._client;
  }

  public async connect(): Promise<void> {
    if (!Postgres._client) {
      await this.client.connect();
    }
  }

  public async databaseExists(): Promise<boolean> {
    const adminClient = new Client({
      user: this.username,
      password: this.password,
      host: this.host,
      port: this.port,
      database: 'postgres',
    });
    await adminClient.connect();
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [this.database]
    );
    await adminClient.end();
    return (res.rowCount != null) && (res.rowCount > 0);
  }

  public async ensureDatabase(): Promise<void> {
    const exists = await this.databaseExists();
    if (!exists) {
      const adminClient = new Client({
        user: this.username,
        password: this.password,
        host: this.host,
        port: this.port,
        database: 'postgres',
      });
      await adminClient.connect();
      await adminClient.query(`CREATE DATABASE ${this.database}`);
      await adminClient.end();
      console.log(`Postgres database ${this.database} created`);
    } else {
      console.log(`Postgres database ${this.database} exists`);
    }
  }

  public async tableExists(): Promise<boolean> {
    const adminClient = new Client({
      user: this.username,
      password: this.password,
      host: this.host,
      port: this.port,
      database: 'postgres',
    });
    await adminClient.connect();
    const res = await this.client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [this.table]
    );
    await adminClient.end();
    return (res.rowCount != null) && (res.rowCount > 0);
  }

  public async ensureTable(): Promise<void> {
    const exists = await this.tableExists();
    if (!exists) {
      await this.client.query(`
        CREATE TABLE ${this.table} (
          id UUID PRIMARY KEY,
          timestamp TIMESTAMPTZ NOT NULL,
          logLevel TEXT CHECK (logLevel IN ('info','warn','error','debug')),
          applicationId TEXT,
          platform TEXT,
          bundleId TEXT,
          deviceId TEXT,
          message TEXT,
          tags TEXT[],
          meta JSONB,
          stackTrace TEXT
        );
        CREATE INDEX idx_${this.table}_timestamp ON ${this.table}(timestamp DESC);
        CREATE INDEX idx_${this.table}_app ON ${this.table}(applicationId);
        CREATE INDEX idx_${this.table}_loglevel_ts ON ${this.table}(loglevel, timestamp DESC);
        CREATE INDEX idx_${this.table}_meta ON ${this.table} USING gin(meta);
        CREATE INDEX idx_${this.table}_tags ON ${this.table} USING gin(tags);
      `);
      console.log(`Postgres table ${this.table} created`);
    } else {
      console.log(`Postgres table ${this.table} exists`);
    }
  }

  public async clearTable(): Promise<void> {
    await this.client.query(`TRUNCATE TABLE ${this.table};`);
  }

  public async dropTable(): Promise<void> {
    await this.client.query(`DROP TABLE IF EXISTS ${this.table};`);
  }
}
