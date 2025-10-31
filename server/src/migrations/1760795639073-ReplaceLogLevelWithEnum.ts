import { container } from 'tsyringe';
import { MigrationInterface, QueryRunner } from "typeorm";
import { ConfigService } from '../services/configService';

export class ReplaceLogLevelWithEnum1760795639073 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} up`);
    const table = container.resolve(ConfigService).postgresEventsTable;
    
    await queryRunner.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'log_level_enum') THEN
              CREATE TYPE log_level_enum AS ENUM ('info', 'warn', 'error', 'debug');
          END IF;
      END$$;
    `);

    await queryRunner.query(`
      ALTER TABLE "${table}" ADD COLUMN "logLevel_tmp" log_level_enum;
    `);

    await queryRunner.query(`
      UPDATE "${table}" SET "logLevel_tmp" = "logLevel"::log_level_enum;
    `);

    await queryRunner.query(`
      ALTER TABLE "${table}" DROP COLUMN "logLevel";
    `);

    await queryRunner.query(`
      ALTER TABLE "${table}" RENAME COLUMN "logLevel_tmp" TO "logLevel";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} down`);
    const table = container.resolve(ConfigService).postgresEventsTable;
    
    // Revert to TEXT with CHECK constraint
    await queryRunner.query(`
      ALTER TABLE "${table}" ADD COLUMN "logLevel_tmp" TEXT CHECK ("logLevel_tmp" IN ('info','warn','error','debug'));
    `);

    await queryRunner.query(`
      UPDATE "${table}" SET "logLevel_tmp" = "logLevel"::text;
    `);

    await queryRunner.query(`
      ALTER TABLE "${table}" DROP COLUMN "logLevel";
    `);

    await queryRunner.query(`
      ALTER TABLE "${table}" RENAME COLUMN "logLevel_tmp" TO "logLevel";
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS log_level_enum;
    `);
  }
}