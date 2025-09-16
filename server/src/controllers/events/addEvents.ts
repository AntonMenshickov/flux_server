import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { Application, IApplication } from '../../model/mongo/application';
import z from 'zod';
import { eventMessageDtoSchema } from '../../utils/zodUtil';
import { EventMessageDto } from '../../model/eventMessageDto';
import { AppAuthRequest } from '../../middleware/authorizationRequired';
import { EventsRepository } from '../../clickhouse/eventsRepository';
import { eventMessageFromDto } from '../../model/eventMessage';

const eventsValidateSchema = z.array(eventMessageDtoSchema);

export const addEventsValidateSchema = z.object({ body: eventsValidateSchema });

export async function addEvents(req: AppAuthRequest, res: Response, next: NextFunction) {
  const events: EventMessageDto[] = eventsValidateSchema.parse(req.body);
  const application = req?.application;

  if (!application) {
    return res.status(401).json({ error: responseMessages.INVALID_TOKEN });
  }

  const existApp: IApplication & Document | null = await Application.findById(application._id).exec();
  if (!existApp) {
    return res.status(400).json({ error: responseMessages.APPLICATION_NOT_FOUND });
  }

  for (let message of events) {
    if (!application.bundles.find(b => b.platform == message.platform && b.bundleId == message.bundleId)) {
      return res.status(400).json({
        success: false,
        result: {
          message: `App with platform '${message.platform}' and bundle id '${message.bundleId}' not registered`
        }
      });
    }
  }

  await new EventsRepository().insert(events.map(e => eventMessageFromDto(e, application._id.toString())));


  return res.status(204).json({
    success: true,
  });
}