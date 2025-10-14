import { injectable } from 'tsyringe';
import { EventMessageView } from '../model/eventMessageView';
import { Application, IApplication } from '../model/mongo/application';
import { ApplicationStats } from '../model/mongo/applicationStats';
import { countUniqueFields } from '../utils/statsUtils';

@injectable()
export class EventsStatsService {
  public async onEventsAdded(events: EventMessageView[]): Promise<void> {
    const grouped: Record<string, EventMessageView[]> = events.reduce<Record<string, EventMessageView[]>>((acc, event) => {
      if (!acc[event.applicationId]) {
        acc[event.applicationId] = [];
      }
      acc[event.applicationId].push(event);
      return acc;
    }, {});
    for (const [applicationId, events] of Object.entries(grouped)) {
      await this.updateApplicationStatsByAppId(applicationId, events);
    }
  }

  private async updateApplicationStatsByAppId(id: string, events: EventMessageView[]): Promise<void> {
    const application = await Application.findById(id);
    if (!application) return;
    this.updateApplicationStats(application, events);
  }


  private async updateApplicationStats(application: IApplication, events: EventMessageView[]): Promise<void> {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const incObject = {
      ...this.buildIncMap('logLevelStats', countUniqueFields(events, 'logLevel')),
      ...this.buildIncMap('platformStats', countUniqueFields(events, 'platform')),
      ...this.buildIncMap('osStats', countUniqueFields(events, 'osName')),
    };

    await ApplicationStats.findOneAndUpdate(
      { application: application._id, date },
      { $inc: incObject, $setOnInsert: { application: application._id, date } },
      { upsert: true, new: true }
    );
  }

  private buildIncMap(
    prefix: string,
    map: Map<string, number>
  ): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of map.entries()) {
      result[`${prefix}.${key}`] = value;
    }
    return result;
  }

}