import { Response, NextFunction, application } from 'express';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { EventFilter, EventsRepository } from '../../clickhouse/eventsRepository';
import { EventMessage } from '../../model/eventMessage';
import { numberFromStringSchema, objectIdSchema } from '../../utils/zodUtil';
import { LogLevel } from '../../model/eventMessageDto';

const filtersValidateSchema = z.object({
  applicationId: objectIdSchema.nullable().optional(),
  message: z.string().trim().nullable().optional(),
  logLevel: z.array(z.enum(LogLevel)).nullable().optional(),
  tags: z.array(z.string().trim().nonempty()).nullable().optional(),
  meta: z.record(z.string(), z.string()).nullable().optional(),
  platform: z.string().trim().nullable().optional(),
  bundleId: z.string().trim().nullable().optional(),
  deviceId: z.string().trim().nullable().optional(),
  from: numberFromStringSchema.nullable().optional(),
  to: numberFromStringSchema.nullable().optional(),
});

export const searchEventsValidateSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().nonnegative(),
    offset: z.coerce.number().int().nonnegative(),
    filter: filtersValidateSchema.nullable().optional(),
  })
});

export async function searchEvents(req: UserAuthRequest, res: Response, next: NextFunction) {
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;
  const filterRaw = req.query.filter ? req.query.filter : null;
  const eventsFilter: EventFilter | null =
    filterRaw ? filtersValidateSchema.parse(req.query.filter) : null

  const eventsRepository: EventsRepository = new EventsRepository();
  const events: EventMessage[] = await eventsRepository.find(limit, offset, eventsFilter);


  return res.status(200).json({
    success: true,
    result: {
      events: events,
    }
  });
}