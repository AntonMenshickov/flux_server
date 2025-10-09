import { EventMessageDto, LogLevel } from '../model/eventMessageDto';
import { Application, IApplication } from '../model/mongo/application';
import { ApplicationStats } from '../model/mongo/applicationStats';

export async function updateApplicationStatsByAppId(id: string, events: EventMessageDto[]) {
  const application =  await Application.findById(id);
  if (!application) return;
  updateApplicationStats(application, events);
}

export async function updateApplicationStats(application: IApplication, events: EventMessageDto[]): Promise<void> {
  //updating statistics
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