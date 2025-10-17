import { singleton } from 'tsyringe';
import { z } from 'zod';

export interface AppConfig {
  port: number;

  jwtSecret: string;
  jwtAtExpiresIn: string;
  jwtRtExpiresIn: string;

  mongoHost: string;
  mongoPort: number;
  mongoDatabase: string;

  postgresHost: string;
  postgresPort: number;
  postgresUsername: string;
  postgresPassword: string;
  postgresDatabase: string;
  postgresEventsTable: string;

  dbLogsMaxAgeDays: number;

  redisHost: string;
  redisPort: number;

  eventsBatchSize: number;
  flushIntervalMs: number;
}

@singleton()
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    const schema = z.object({
      PORT: z.coerce.number().default(4000),

      JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
      JWT_AT_EXPIRES_IN: z.string().default('1d'),
      JWT_RT_EXPIRES_IN: z.string().default('30d'),

      MONGO_HOST: z.string().default('127.0.0.1'),
      MONGO_PORT: z.coerce.number().default(27017),
      MONGO_DATABASE: z.string().default('flux'),

      POSTGRES_HOST: z.string().default('127.0.0.1'),
      POSTGRES_PORT: z.coerce.number().default(5432),
      POSTGRES_USERNAME: z.string().default('postgres'),
      POSTGRES_PASSWORD: z.string().default('default'),
      POSTGRES_DATABASE: z.string().default('flux'),
      POSTGRES_EVENTS_TABLE: z.string().default('events'),

      DB_LOGS_MAX_AGE_DAYS: z.coerce.number().default(30),

      REDIS_HOST: z.string().default('127.0.0.1'),
      REDIS_PORT: z.coerce.number().default(6379),

      EVENTS_BATCH_SIZE: z.coerce.number().default(100),
      FLUSH_INTERVAL_MS: z.coerce.number().default(60000),
    });

    const env = schema.parse(process.env);

    this.config = {
      port: env.PORT,

      jwtSecret: env.JWT_SECRET,
      jwtAtExpiresIn: env.JWT_AT_EXPIRES_IN,
      jwtRtExpiresIn: env.JWT_RT_EXPIRES_IN,

      mongoHost: env.MONGO_HOST,
      mongoPort: env.MONGO_PORT,
      mongoDatabase: env.MONGO_DATABASE,

      postgresHost: env.POSTGRES_HOST,
      postgresPort: env.POSTGRES_PORT,
      postgresUsername: env.POSTGRES_USERNAME,
      postgresPassword: env.POSTGRES_PASSWORD,
      postgresDatabase: env.POSTGRES_DATABASE,
      postgresEventsTable: env.POSTGRES_EVENTS_TABLE,

      dbLogsMaxAgeDays: env.DB_LOGS_MAX_AGE_DAYS,

      redisHost: env.REDIS_HOST,
      redisPort: env.REDIS_PORT,

      eventsBatchSize: env.EVENTS_BATCH_SIZE,
      flushIntervalMs: env.FLUSH_INTERVAL_MS,
    };
  }

  get port() { return this.config.port; }

  get jwtSecret() { return this.config.jwtSecret; }
  get jwtAtExpiresIn() { return this.config.jwtAtExpiresIn; }
  get jwtRtExpiresIn() { return this.config.jwtRtExpiresIn; }

  get mongoHost() { return this.config.mongoHost; }
  get mongoPort() { return this.config.mongoPort; }
  get mongoDatabase() { return this.config.mongoDatabase; }

  get postgresHost() { return this.config.postgresHost; }
  get postgresPort() { return this.config.postgresPort; }
  get postgresUsername() { return this.config.postgresUsername; }
  get postgresPassword() { return this.config.postgresPassword; }
  get postgresDatabase() { return this.config.postgresDatabase; }
  get postgresEventsTable() { return this.config.postgresEventsTable; }

  get dbLogsMaxAgeDays() { return this.config.dbLogsMaxAgeDays; }

  get redisHost() { return this.config.redisHost; }
  get redisPort() { return this.config.redisPort; }

  get eventsBatchSize() { return this.config.eventsBatchSize; }
  get flushIntervalMs() { return this.config.flushIntervalMs; }
}
