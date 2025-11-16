import { container } from 'tsyringe';
import { MigrationInterface, QueryRunner } from "typeorm";
import { ConfigService } from '../services/configService';

export class AddApplicationIdToEventContents1763267533221 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} up`);

    const eventsTable = container.resolve(ConfigService).postgresEventsTable;
    const contentsTable = container.resolve(ConfigService).postgresEventsContentsTable;

    await queryRunner.query(`
      ALTER TABLE "${contentsTable}"
      ADD COLUMN IF NOT EXISTS "applicationId" TEXT;
    `);

    await queryRunner.query(`
      UPDATE "${contentsTable}" ec
      SET "applicationId" = e."applicationId"
      FROM "${eventsTable}" e
      WHERE ec.id = e.id;
    `);

    await queryRunner.query(`
      ALTER TABLE "${contentsTable}"
      ALTER COLUMN "applicationId" SET NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_${contentsTable.replace(/"/g, '')}_applicationId 
      ON "${contentsTable}"("applicationId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} down`);

    const contentsTable = container.resolve(ConfigService).postgresEventsContentsTable;

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_${contentsTable.replace(/"/g, '')}_applicationId;
    `);

    await queryRunner.query(`
      ALTER TABLE "${contentsTable}"
      DROP COLUMN IF EXISTS "applicationId";
    `);
  }
}

