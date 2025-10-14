import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { Application, IApplication } from '../../model/mongo/application';
import z from 'zod';
import { eventMessageDtoSchema } from '../../utils/zodUtil';
import { AppAuthRequest } from '../../middleware/authorizationRequired';
import { eventMessageFromDto } from '../../model/eventMessageView';
import { EventsStatsService } from '../../services/eventsStatsService';
import { container } from 'tsyringe';
import { PostgresEventsRepository } from '../../database/repository/postgresEventRepository';

const eventsValidateSchema = z.array(eventMessageDtoSchema);

export const addEventsValidateSchema = z.object({
  body: z.object({
    platform: z.string().trim().nonempty(),
    bundleId: z.string().trim().nonempty(),
    deviceId: z.string().trim().nonempty(),
    deviceName: z.string().trim().nonempty(),
    osName: z.string().trim().nonempty(),
    events: eventsValidateSchema,
  })
});

export async function addEvents(req: AppAuthRequest, res: Response, next: NextFunction) {
  const { platform, bundleId, deviceId, deviceName, osName, events } = addEventsValidateSchema.parse(req).body;
  const application = req.application;

  const existApp: IApplication & Document | null = await Application.findById(application._id).exec();
  if (!existApp) {
    return res.status(400).json({ error: responseMessages.APPLICATION_NOT_FOUND });
  }

  if (!application.bundles.find(b => b.platform == platform && b.bundleId == bundleId)) {
    return res.status(400).json({
      success: false,
      result: {
        message: `App with platform '${platform}' and bundle id '${bundleId}' not registered`
      }
    });
  }
  const eventsView = events.map(e => eventMessageFromDto(e, application._id.toString(), platform, bundleId, deviceId, deviceName, osName));
  await container.resolve(PostgresEventsRepository).insert(eventsView);

  await container.resolve(EventsStatsService).onEventsAdded(eventsView);

  return res.status(204).json({
    success: true,
  });
}