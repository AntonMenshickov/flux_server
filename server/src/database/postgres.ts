import { schedule } from 'node-cron';
import { DataSource, LessThan } from 'typeorm';
import { EventMessage } from '../model/postgres/eventMessageDbView';

export class Postgres {
  private _dataSource!: DataSource;

  private username: string;
  private password: string;
  private host: string;
  private port: number;
  public database: string;
  public table: string;
  private logsMaxAgeInDays: number;

  constructor() {
    this.username = process.env.POSTGRES_USERNAME as string;
    this.password = process.env.POSTGRES_PASSWORD as string;
    this.host = process.env.POSTGRES_HOST as string;
    this.port = Number(process.env.POSTGRES_PORT);
    this.database = process.env.POSTGRES_DATABASE as string;
    this.table = process.env.POSTGRES_EVENTS_TABLE as string;
    this.logsMaxAgeInDays = Number(process.env.DB_LOGS_MAX_AGE_DAYS);
    console.info(`Postgres cron delete rows older than ${this.logsMaxAgeInDays} days scheduled for every hour`);
    schedule('0 * * * *', () => this.deleteOldRows());
  }

  get dataSource(): DataSource {
    if (!this._dataSource) {
      throw new Error('DataSource not initialized. Call ensureInitialized() first.');
    }
    return this._dataSource;
  }

  async ensureInitialized(): Promise<DataSource> {
    if (!this._dataSource) {
      this._dataSource =
        new DataSource({
          type: 'postgres',
          host: this.host,
          port: this.port,
          username: this.username,
          password: this.password,
          database: this.database,
          entities: [EventMessage],
          synchronize: false,
          logging: false,
          extra: {
            max: 20,// max pool size
            idleTimeoutMillis: 30000,// close idle clients after 30 second
          },
        });

      await this._dataSource.initialize();
    }
    return this._dataSource;
  }

  public async connect(): Promise<void> {
    return Promise.resolve();
  }

  public async databaseExists(): Promise<boolean> {
    const result = await this._dataSource
      .createQueryRunner()
      .query(
        `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) as exists`,
        [this.database],
      );
    return result[0]?.exists ?? false;
  }

  public async ensureDatabase(): Promise<void> {
    const exists = await this.databaseExists();
    if (!exists) {
      await this._dataSource.query(`CREATE DATABASE ${this.database}`);
      console.log(`Postgres database ${this.database} created`);
    } else {
      console.log(`Postgres database ${this.database} exists`);
    }
  }

  public async tableExists(): Promise<boolean> {
    const result = await this._dataSource
      .createQueryRunner()
      .query(
        `SELECT EXISTS (
         SELECT 1 
         FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = $1
       ) as exists`,
        [this.table],
      );

    return result[0]?.exists ?? false;
  }

  public async ensureTable(): Promise<void> {
    const exists = await this.tableExists();
    if (!exists) {
      await this._dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${this.table} (
            id UUID NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            "logLevel" TEXT NOT NULL CHECK ("logLevel" IN ('info','warn','error','debug')),
            "applicationId" TEXT NOT NULL,
            platform TEXT NOT NULL,
            "bundleId" TEXT NOT NULL,
            "deviceId" TEXT NOT NULL,
            "deviceName" TEXT NOT NULL,
            "osName" TEXT NOT NULL,
            message TEXT NOT NULL,
            tags TEXT[],
            meta JSONB,
            "stackTrace" TEXT,
            PRIMARY KEY (id, "applicationId")
        ) PARTITION BY LIST ("applicationId");

        -- Индексы
        CREATE INDEX IF NOT EXISTS idx_${this.table}_timestamp ON ${this.table}(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_${this.table}_app ON ${this.table}("applicationId");
        CREATE INDEX IF NOT EXISTS idx_${this.table}_loglevel_ts ON ${this.table}("logLevel", timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_${this.table}_meta ON ${this.table} USING gin(meta);
        CREATE INDEX IF NOT EXISTS idx_${this.table}_tags ON ${this.table} USING gin(tags);
      `);
      console.log(`Postgres table ${this.table} created`);
    } else {
      console.log(`Postgres table ${this.table} exists`);
    }
  }

  public async clearTable(): Promise<void> {
    await this._dataSource.query(`TRUNCATE TABLE ${this.table};`);
  }

  public async dropTable(): Promise<void> {
    await this._dataSource.query(`DROP TABLE IF EXISTS ${this.table};`);
  }

  private async deleteOldRows() {
    console.info(`Postgres deleting rows older than ${this.logsMaxAgeInDays} days`);
    const deleteFrom = new Date();
    deleteFrom.setDate(deleteFrom.getDate() - this.logsMaxAgeInDays);
    const result = await EventMessage.delete({
      timestamp: LessThan(deleteFrom)
    });
    console.info(`Postgres deleted ${result.affected} old rows`);
  }
}
