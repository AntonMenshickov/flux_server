import { container } from 'tsyringe';
import { MigrationInterface, QueryRunner } from "typeorm";
import { ConfigService } from '../services/configService';

export class CreateEventContentsTable1762355121600 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} up`);

    const eventsTable = container.resolve(ConfigService).postgresEventsTable;
    const contentsTable = `${eventsTable}_contents`;

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${contentsTable}" (
        id UUID NOT NULL PRIMARY KEY,
        message TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_${contentsTable.replace(/"/g, '')}_id ON "${contentsTable}"(id);
    `);

    await queryRunner.query(`
      DO $$
      DECLARE
        long_message_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO long_message_count
        FROM "${eventsTable}"
        WHERE LENGTH(message) > 1000;

        IF long_message_count > 0 THEN
          INSERT INTO "${contentsTable}" (id, message)
          SELECT id, message
          FROM "${eventsTable}"
          WHERE LENGTH(message) > 1000
          ON CONFLICT (id) DO NOTHING;

          UPDATE "${eventsTable}"
          SET message = LEFT(message, 1000)
          WHERE LENGTH(message) > 1000;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "${eventsTable}"
      ADD CONSTRAINT check_message_length CHECK (LENGTH(message) <= 1000);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(`[Migration] ${this.constructor.name} down`);

    const eventsTable = container.resolve(ConfigService).postgresEventsTable;
    const contentsTable = `${eventsTable}_contents`;

    await queryRunner.query(`
      ALTER TABLE "${eventsTable}"
      DROP CONSTRAINT IF EXISTS check_message_length;
    `);

    await queryRunner.query(`
      UPDATE "${eventsTable}" e
      SET message = COALESCE(c.message, e.message)
      FROM "${contentsTable}" c
      WHERE e.id = c.id;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "${contentsTable}";
    `);
  }
}

