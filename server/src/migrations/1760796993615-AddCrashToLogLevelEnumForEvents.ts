import { container } from 'tsyringe';
import { MigrationInterface, QueryRunner } from "typeorm";
import { ConfigService } from '../services/configService';

export class AddCrashToLogLevelEnumForEvents1760796993615 implements MigrationInterface {
  

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} up`);
    await queryRunner.query(`
      ALTER TYPE log_level_enum ADD VALUE IF NOT EXISTS 'crash';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} down`);
    const table = container.resolve(ConfigService).postgresEventsTable;
    await queryRunner.query(`
      ALTER TYPE log_level_enum RENAME TO log_level_enum_old;
    `);
    
    await queryRunner.query(`
      CREATE TYPE log_level_enum AS ENUM ('info', 'warn', 'error', 'debug');
    `);
    
    await queryRunner.query(`
      ALTER TABLE "${table}"
      ALTER COLUMN "logLevel" TYPE log_level_enum
      USING CASE "logLevel"
        WHEN 'crash' THEN 'error'::log_level_enum
        ELSE "logLevel"::text::log_level_enum
      END;
    `);

    
    await queryRunner.query(`
      DROP TYPE log_level_enum_old;
    `);
  }
}
