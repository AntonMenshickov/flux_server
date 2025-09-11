import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { EventFilter, EventsRepository } from '../../clickhouse/eventsRepository';
import { EventMessage, LogLevel } from '../../model/eventMessage';

const dateStringSchema = z
  .string()
  .transform((val) => new Date(val).getTime())
  .refine((date) => !isNaN(date), {
    message: `Invalid date`,
  });

const filtersValidateSchema = z.object({
  message: z.string().trim().nullable().optional(),
  logLevel: z.enum(LogLevel).nullable().optional(),
  tags: z.array(z.string().trim().nonempty()).nullable().optional(),
  meta: z.record(z.string(), z.string()).nullable().optional(),
  platform: z.string().trim().nullable().optional(),
  bundleId: z.string().trim().nullable().optional(),
  deviceId: z.string().trim().nullable().optional(),
  from: dateStringSchema.nullable().optional(),
  to: dateStringSchema.nullable().optional(),
});

export const searchEventsValidateSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().nonnegative(),
    offset: z.coerce.number().int().nonnegative(),
    filter: filtersValidateSchema.nullable().optional(),
  })
});

export async function searchEvents(req: AuthRequest, res: Response, next: NextFunction) {
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