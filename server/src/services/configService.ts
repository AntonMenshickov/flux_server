import path from 'path';
import dotenv from 'dotenv';
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
    //Reading config from config.env
    const environmentConfig = path.join(__dirname, '../config.env');
    console.log('Loading config from file', environmentConfig);
    const configLoadResult = dotenv.config({ path: environmentConfig })

    if (configLoadResult.error) {
      console.error(configLoadResult.error);
      throw configLoadResult.error;
    }

    const schema = z.object({
      PORT: z.coerce.number(),

      JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
      JWT_AT_EXPIRES_IN: z.string(),
      JWT_RT_EXPIRES_IN: z.string(),

      MONGO_HOST: z.string(),
      MONGO_PORT: z.coerce.number(),
      MONGO_DATABASE: z.string(),

      POSTGRES_HOST: z.string(),
      POSTGRES_PORT: z.coerce.number(),
      POSTGRES_USERNAME: z.string(),
      POSTGRES_PASSWORD: z.string(),
      POSTGRES_DATABASE: z.string(),
      POSTGRES_EVENTS_TABLE: z.string(),

      DB_LOGS_MAX_AGE_DAYS: z.coerce.number(),

      REDIS_HOST: z.string(),
      REDIS_PORT: z.coerce.number(),

      EVENTS_BATCH_SIZE: z.coerce.number(),
      FLUSH_INTERVAL_MS: z.coerce.number(),
    });

    const result = schema.safeParse(configLoadResult.parsed);

    if (result.success) {
      const env = result.data;
      console.log('Config loaded', env)

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
    } else {
      console.error(result.error);
      throw result.error;
    }
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
