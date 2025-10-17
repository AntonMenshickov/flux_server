import { schedule } from 'node-cron';
import { DataSource, LessThan } from 'typeorm';
import { EventMessage } from '../model/postgres/eventMessageDbView';
import { singleton } from 'tsyringe';
import path from 'path';

@singleton()
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
          migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
          synchronize: false,
          migrationsRun: true,
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
