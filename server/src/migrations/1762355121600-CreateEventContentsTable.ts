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

    const longMessageCountResult = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM "${eventsTable}"
      WHERE LENGTH(message) > 1000;
    `);
    
    const longMessageCount = parseInt(longMessageCountResult[0]?.count || '0', 10);
    
    if (longMessageCount > 0) {
      console.log(`Found ${longMessageCount} messages longer than 1000 characters. Migrating to contents table...`);
      
      await queryRunner.query(`
        INSERT INTO "${contentsTable}" (id, message)
        SELECT id, message
        FROM "${eventsTable}"
        WHERE LENGTH(message) > 1000
        ON CONFLICT (id) DO UPDATE SET message = EXCLUDED.message;
      `);
      
      const insertedCountResult = await queryRunner.query(`
        SELECT COUNT(*) as count FROM "${contentsTable}";
      `);
      const insertedCount = parseInt(insertedCountResult[0]?.count || '0', 10);
      console.log(`Inserted ${insertedCount} messages into contents table`);
      
      await queryRunner.query(`
        UPDATE "${eventsTable}"
        SET message = LEFT(message, 1000)
        WHERE LENGTH(message) > 1000;
      `);
      
      const updatedCountResult = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM "${eventsTable}"
        WHERE LENGTH(message) > 1000;
      `);
      const remainingCount = parseInt(updatedCountResult[0]?.count || '0', 10);
      
      if (remainingCount > 0) {
        console.warn(`Warning: ${remainingCount} messages still longer than 1000 characters after truncation`);
      } else {
        console.log('All long messages have been migrated and truncated successfully');
      }
    }

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

