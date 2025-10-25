import { container } from 'tsyringe';
import { MigrationInterface, QueryRunner } from "typeorm";
import { ConfigService } from '../services/configService';

export class AddTimestampPaginationIndex1761322449466 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} up`);

    const table = container.resolve(ConfigService).postgresEventsTable;
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_${table}_ts_id
      ON ${table}("timestamp" DESC, id DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} down`);

    const table = container.resolve(ConfigService).postgresEventsTable;
    await queryRunner.query(`DROP INDEX IF EXISTS idx_${table}_ts_id;`);
  }
}