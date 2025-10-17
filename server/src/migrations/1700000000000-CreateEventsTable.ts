import { container } from 'tsyringe';
import { MigrationInterface, QueryRunner } from "typeorm";
import { ConfigService } from '../services/configService';

export class CreateEventsTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = container.resolve(ConfigService).postgresEventsTable;

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
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

      CREATE INDEX IF NOT EXISTS idx_${table}_timestamp ON ${table}(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_${table}_app ON ${table}("applicationId");
      CREATE INDEX IF NOT EXISTS idx_${table}_loglevel_ts ON ${table}("logLevel", timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_${table}_meta ON ${table} USING gin(meta);
      CREATE INDEX IF NOT EXISTS idx_${table}_tags ON ${table} USING gin(tags);
      CREATE INDEX IF NOT EXISTS idx_${table}_deviceId ON ${table}("deviceId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = container.resolve(ConfigService).postgresEventsTable;
    await queryRunner.query(`
      DROP TABLE IF EXISTS ${table};
    `);
  }
}
