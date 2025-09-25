import { Response, NextFunction, application } from 'express';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { EventsRepository } from '../../database/repository/eventsRepository';
import { EventMessage } from '../../model/eventMessage';
import { numberFromStringSchema, objectIdSchema } from '../../utils/zodUtil';
import { LogLevel } from '../../model/eventMessageDto';
import { DatabaseResolver } from '../../database/databaseResolver';

const filtersValidateSchema = z.object({
  message: z.string().trim().nullable().optional(),
  logLevel: z.array(z.enum(LogLevel)).nullable().optional(),
  tags: z.array(z.string().trim().nonempty()).nullable().optional(),
  meta: z.record(z.string(), z.string()).nullable().optional(),
  platform: z.string().trim().nullable().optional(),
  bundleId: z.string().trim().nullable().optional(),
  deviceId: z.string().trim().nullable().optional(),
  deviceName: z.string().trim().nullable().optional(),
  osName: z.string().trim().nullable().optional(),
  from: numberFromStringSchema.nullable().optional(),
  to: numberFromStringSchema.nullable().optional(),
});

export const searchEventsValidateSchema = z.object({
  query: z.object({
    applicationId: objectIdSchema.nonoptional(),
    limit: z.coerce.number().int().nonnegative().default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
    filter: filtersValidateSchema.nullable().optional(),
  })
});

export async function searchEvents(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { limit, offset, applicationId, filter } = searchEventsValidateSchema.parse(req).query;

  const eventsRepository: EventsRepository = DatabaseResolver.instance.eventsRepository;
  const events: EventMessage[] = await eventsRepository.find(limit, offset, applicationId, filter);


  return res.status(200).json({
    success: true,
    result: {
      events: events,
    }
  });
}