import { container } from 'tsyringe';
import { MigrationInterface, QueryRunner } from "typeorm";
import { ConfigService } from '../services/configService';

export class EnablePgTrgmExtension1762014196819 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} up`);

    const table = container.resolve(ConfigService).postgresEventsTable;

    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_${table}_message_trgm
      ON ${table} USING gin(message gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} down`);

    const table = container.resolve(ConfigService).postgresEventsTable;

    await queryRunner.query(`DROP INDEX IF EXISTS idx_${table}_message_trgm;`);
    
    await queryRunner.query(`
      DROP EXTENSION IF EXISTS pg_trgm;
    `);
  }
}

