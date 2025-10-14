import { schedule } from 'node-cron';
import { ApplicationStats } from '../model/mongo/applicationStats';

export class ApplicationStatsCleanupService {
  private readonly statsMaxAgeInDays: number;

  constructor() {
    this.statsMaxAgeInDays = Number(process.env.DB_LOGS_MAX_AGE_DAYS);
    console.info(
      `Mongo ApplicationStats cleanup scheduled hourly; keeping last ${this.statsMaxAgeInDays} days`
    );
    schedule('0 * * * *', () => this.deleteOldStats());
  }

  private async deleteOldStats(): Promise<void> {
    try {
      console.info(
        `Mongo deleting ApplicationStats older than ${this.statsMaxAgeInDays} days`
      );
      const deleteBefore = new Date();
      deleteBefore.setUTCHours(0, 0, 0, 0);
      deleteBefore.setDate(deleteBefore.getDate() - this.statsMaxAgeInDays);

      const result = await ApplicationStats.deleteMany({ date: { $lt: deleteBefore } });
      console.info(`Mongo deleted ${result.deletedCount ?? 0} old ApplicationStats docs`);
    } catch (err) {
      console.error('Mongo ApplicationStats cleanup failed', err);
    }
  }
}


