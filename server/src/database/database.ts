import { Postgres } from './postgres';
import { PostgresEventsRepository } from './repository/postgresEventRepository';

export class Database {
  private static _instance: Database;
  private _eventsRepository: PostgresEventsRepository;
  private _postgres: Postgres;


  private constructor(postgres: Postgres, eventsRepository: PostgresEventsRepository) {
    this._eventsRepository = eventsRepository;
    this._postgres = postgres;
  }

  static get instance(): Database {
    if (!this._instance) {
      const postgres = new Postgres();
      this._instance = new Database(postgres, new PostgresEventsRepository(postgres));
    }
    return this._instance;
  }

  public get eventsRepository(): PostgresEventsRepository {
    return this._eventsRepository;
  }

  public get postgres(): Postgres {
    return this._postgres;
  }
}