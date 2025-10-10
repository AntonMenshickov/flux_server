import { EventMessageDto, LogLevel } from '../model/eventMessageDto';
import { EventMessageView } from '../model/eventMessageView';
import { Application, IApplication } from '../model/mongo/application';
import { ApplicationStats } from '../model/mongo/applicationStats';

export class EventsStatsService {
  public static async onEventsAdded(events: EventMessageView[]): Promise<void> {
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

  private static async updateApplicationStatsByAppId(id: string, events: EventMessageDto[]): Promise<void> {
    const application = await Application.findById(id);
    if (!application) return;
    this.updateApplicationStats(application, events);
  }


  private static async updateApplicationStats(application: IApplication, events: EventMessageDto[]): Promise<void> {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const currentApplicationStats = await ApplicationStats.findOne({ application: application._id, date: date });
    if (!currentApplicationStats) {
      const newAppStatus = new ApplicationStats({
        application: application._id,
        logLevelStats: new Map(Object.values(LogLevel).map(l => [l, events.filter(e => e.logLevel == l).length])),
        date: date,
      });
      await newAppStatus.save();
    } else {
      const stats: Map<LogLevel, number> = new Map(Object.values(LogLevel).map(l => [l, events.filter(e => e.logLevel == l).length + (currentApplicationStats.logLevelStats.get(l) ?? 0)]));
      await ApplicationStats.updateOne(
        { _id: currentApplicationStats._id },
        { $set: { logLevelStats: stats } }
      );
    }
  }
}