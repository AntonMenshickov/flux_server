import { Response, NextFunction, application } from 'express';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { EventMessageBasic } from '../../model/eventMessageBasic';
import { objectIdSchema, criteriaArraySchema } from '../../utils/zodUtil';
import { container } from 'tsyringe';
import { PostgresEventsRepository } from '../../database/repository/postgresEventRepository';
import { Application } from '../../model/mongo/application';
import { responseMessages } from '../../strings/responseMessages';


export const searchEventsValidateSchema = z.object({
  body: z.object({
    limit: z.coerce.number().int().nonnegative().default(20),
    lastTimestamp: z.coerce.number().int().nonnegative().optional(),
    lastId: z.string().optional(),
    applicationId: objectIdSchema.nonoptional(),
    filter: criteriaArraySchema.nullable().optional(),
  })
});

export async function searchEvents(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { limit, lastTimestamp, lastId, applicationId, filter } = searchEventsValidateSchema.parse(req).body;

  // Check user is a maintainer of the application
  const app = await Application.findOne({ _id: applicationId, maintainers: req.user._id }).exec();
  if (!app) {
    return res.status(403).json({ success: false, message: responseMessages.NOT_ALLOWED_TO_VIEW_APP });
  }


  const events: EventMessageBasic[] = await container.resolve(PostgresEventsRepository).find(limit, applicationId.toString(), lastTimestamp, lastId, filter ?? []);


  return res.status(200).json({
    success: true,
    result: {
      events: events,
    }
  });
}