import { Response, NextFunction, application } from 'express';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { EventMessageView } from '../../model/eventMessageView';
import { objectIdSchema, criteriaArraySchema } from '../../utils/zodUtil';
import { container } from 'tsyringe';
import { PostgresEventsRepository } from '../../database/repository/postgresEventRepository';


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


  const events: EventMessageView[] = await container.resolve(PostgresEventsRepository).find(limit, applicationId.toString(), lastTimestamp, lastId, filter ?? []);


  return res.status(200).json({
    success: true,
    result: {
      events: events,
    }
  });
}