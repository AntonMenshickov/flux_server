import { Response, NextFunction, application } from 'express';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { EventMessageView } from '../../model/eventMessageView';
import { Operator, SearchFieldKey } from '../../model/searchCriterion';
import { objectIdSchema } from '../../utils/zodUtil';
import { container } from 'tsyringe';
import { PostgresEventsRepository } from '../../database/repository/postgresEventRepository';


const searchCriterionsValidateSchema = z.array(z.object({
  field: z.enum(SearchFieldKey),
  operator: z.enum(Operator),
  value: z.union([
    z.string().trim(),
    z.number(),
    z.coerce.date(),
    z.array(z.string().trim().nonempty()),
    z.array(z.record(z.string().trim().nonempty(), z.string().trim().nonempty())),
  ]),
})).nullable().optional();

export const searchEventsValidateSchema = z.object({
  body: z.object({
    limit: z.coerce.number().int().nonnegative().default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
    applicationId: objectIdSchema.nonoptional(),
    filter: searchCriterionsValidateSchema.nullable().optional(),
  })
});

export async function searchEvents(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { limit, offset, applicationId, filter } = searchEventsValidateSchema.parse(req).body;


  const events: EventMessageView[] = await container.resolve(PostgresEventsRepository).find(limit, offset, applicationId.toString(), filter ?? []);


  return res.status(200).json({
    success: true,
    result: {
      events: events,
    }
  });
}