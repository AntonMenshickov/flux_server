import { CLickhouse } from './clickhouse/clickhouse';
import { Database } from './database';
import { Postgres } from './postgress/postgress';
import { ClickhouseEventsRepository } from './repository/clickhouse/clickhouseEventsRepository';
import { EventsRepository } from './repository/eventsRepository';
import { PostgresEventsRepository } from './repository/postgress/postgressEventRepository';

export class DatabaseResolver {
  private static _instance: DatabaseResolver;
  public database: Database;
  public eventsRepository: EventsRepository;

  private constructor(database: Database, eventsRepository: EventsRepository) {
    this.database = database;
    this.eventsRepository = eventsRepository;
  }

  static get instance() {
    return DatabaseResolver._instance;
  }


  static async resolveDatabase(): Promise<DatabaseResolver> {
    if (!DatabaseResolver._instance) {
      const postgressHost = process.env.POSTGRES_HOST as string;
      const clickhouseHost = process.env.CLICKHOUSE_HOST as string;
      let database;
      let eventsRepository;
      if (postgressHost) {
        database = new Postgres();
        await database.connect();
        eventsRepository = new PostgresEventsRepository(database);
      } else if (clickhouseHost) {
        database = new CLickhouse()
        await database.connect();
        eventsRepository = new ClickhouseEventsRepository(database);
      }
      else {
        throw new Error('Database cant be resolved check config');
      }
      DatabaseResolver._instance = new DatabaseResolver(database, eventsRepository);
    }
    return DatabaseResolver._instance;
  }
}