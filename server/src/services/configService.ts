import path from 'path';
import dotenv from 'dotenv';
import { singleton } from 'tsyringe';
import { z } from 'zod';

export interface AppConfig {
  port: number;
  host: string;

  jwtSecret: string;
  jwtAtExpiresIn: string;
  jwtRtExpiresIn: string;

  mongoHost: string;
  mongoPort: number;
  mongoDatabase: string;
  mongoUser: string | null;
  mongoPassword: string | null;

  postgresHost: string;
  postgresPort: number;
  postgresUsername: string;
  postgresPassword: string;
  postgresDatabase: string;
  postgresEventsTable: string;

  dbLogsMaxAgeDays: number;

  redisHost: string;
  redisPort: number;
  redisPassword: string | null;

  eventsBatchSize: number;
  flushIntervalMs: number;

  webPath: string;
}

@singleton()
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    //Reading config from config.env
    const configName = process.env.CONFIG_NAME ?? 'config.env';
    const environmentConfig = path.join(__dirname, `../${configName}`);
    console.log('Loading config from file', environmentConfig);
    const configLoadResult = dotenv.config({ path: environmentConfig })

    if (configLoadResult.error) {
      console.error(configLoadResult.error);
      throw configLoadResult.error;
    }

    const schema = z.object({
      PORT: z.coerce.number(),
      HOST: z.string(),

      JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
      JWT_AT_EXPIRES_IN: z.string(),
      JWT_RT_EXPIRES_IN: z.string(),

      MONGO_HOST: z.string(),
      MONGO_PORT: z.coerce.number(),
      MONGO_DATABASE: z.string(),
      MONGO_USER: z.string().optional().nullable().default(null),
      MONGO_PASSWORD: z.string().optional().nullable().default(null),

      POSTGRES_HOST: z.string(),
      POSTGRES_PORT: z.coerce.number(),
      POSTGRES_USERNAME: z.string(),
      POSTGRES_PASSWORD: z.string(),
      POSTGRES_DATABASE: z.string(),
      POSTGRES_EVENTS_TABLE: z.string(),

      DB_LOGS_MAX_AGE_DAYS: z.coerce.number(),

      REDIS_HOST: z.string(),
      REDIS_PORT: z.coerce.number(),
      REDIS_PASSWORD: z.string().optional().nullable().default(null),

      EVENTS_BATCH_SIZE: z.coerce.number(),
      FLUSH_INTERVAL_MS: z.coerce.number(),
      WEB_PATH: z.string(),
      
    });

    const result = schema.safeParse(process.env);

    if (result.success) {
      console.log('Config loaded successfully');
      const env = result.data;

      this.config = {
        port: env.PORT,
        host: env.HOST,

        jwtSecret: env.JWT_SECRET,
        jwtAtExpiresIn: env.JWT_AT_EXPIRES_IN,
        jwtRtExpiresIn: env.JWT_RT_EXPIRES_IN,

        mongoHost: env.MONGO_HOST,
        mongoPort: env.MONGO_PORT,
        mongoDatabase: env.MONGO_DATABASE,
        mongoUser: env.MONGO_USER,
        mongoPassword: env.MONGO_PASSWORD,

        postgresHost: env.POSTGRES_HOST,
        postgresPort: env.POSTGRES_PORT,
        postgresUsername: env.POSTGRES_USERNAME,
        postgresPassword: env.POSTGRES_PASSWORD,
        postgresDatabase: env.POSTGRES_DATABASE,
        postgresEventsTable: env.POSTGRES_EVENTS_TABLE,

        dbLogsMaxAgeDays: env.DB_LOGS_MAX_AGE_DAYS,

        redisHost: env.REDIS_HOST,
        redisPort: env.REDIS_PORT,
        redisPassword: env.REDIS_PASSWORD,

        eventsBatchSize: env.EVENTS_BATCH_SIZE,
        flushIntervalMs: env.FLUSH_INTERVAL_MS,

        webPath: env.WEB_PATH,
      };
    } else {
      console.error(result.error);
      throw result.error;
    }
  }

  get port() { return this.config.port; }
  get host() { return this.config.host; }

  get jwtSecret() { return this.config.jwtSecret; }
  get jwtAtExpiresIn() { return this.config.jwtAtExpiresIn; }
  get jwtRtExpiresIn() { return this.config.jwtRtExpiresIn; }

  get mongoHost() { return this.config.mongoHost; }
  get mongoPort() { return this.config.mongoPort; }
  get mongoDatabase() { return this.config.mongoDatabase; }
  get mongoUser() { return this.config.mongoUser; }
  get mongoPassword() { return this.config.mongoPassword; }

  get postgresHost() { return this.config.postgresHost; }
  get postgresPort() { return this.config.postgresPort; }
  get postgresUsername() { return this.config.postgresUsername; }
  get postgresPassword() { return this.config.postgresPassword; }
  get postgresDatabase() { return this.config.postgresDatabase; }
  get postgresEventsTable() { return this.config.postgresEventsTable; }

  get dbLogsMaxAgeDays() { return this.config.dbLogsMaxAgeDays; }

  get redisHost() { return this.config.redisHost; }
  get redisPort() { return this.config.redisPort; }
  get redisPassword() { return this.config.redisPassword; }

  get eventsBatchSize() { return this.config.eventsBatchSize; }
  get flushIntervalMs() { return this.config.flushIntervalMs; }

  get webPath() { return this.config.webPath; }
}
