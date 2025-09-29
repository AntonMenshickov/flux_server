import { Response, NextFunction, application } from 'express';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { EventMessageView } from '../../model/eventMessageView';
import { numberFromStringSchema, objectIdSchema } from '../../utils/zodUtil';
import { LogLevel } from '../../model/eventMessageDto';
import { Database } from '../../database/database';

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

  
  const events: EventMessageView[] = await Database.instance.eventsRepository.find(limit, offset, applicationId.toString(), filter);


  return res.status(200).json({
    success: true,
    result: {
      events: events,
    }
  });
}