import { container } from 'tsyringe';
import { MigrationInterface, QueryRunner } from "typeorm";
import { ConfigService } from '../services/configService';

export class AddPgTrgmIndexesForMessage1762780478474 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} up`);

    const eventsTable = container.resolve(ConfigService).postgresEventsTable;
    const contentsTable = container.resolve(ConfigService).postgresEventsContentsTable;

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_${eventsTable}_message_trgm 
      ON ${eventsTable} USING gist(message gist_trgm_ops);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_${contentsTable.replace(/"/g, '')}_message_trgm 
      ON "${contentsTable}" USING gin(message gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} down`);

    const eventsTable = container.resolve(ConfigService).postgresEventsTable;
    const contentsTable = container.resolve(ConfigService).postgresEventsContentsTable;

    await queryRunner.query(`DROP INDEX IF EXISTS idx_${eventsTable}_message_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_${contentsTable.replace(/"/g, '')}_message_trgm;`);
    
  }
}

