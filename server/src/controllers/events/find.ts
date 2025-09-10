import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { EventsRepository } from '../../clickhouse/eventsRepository';
import { EventMessage, LogLevel } from '../../model/eventMessage';

export const searchEventsValidateSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().nonnegative(),
    offset: z.coerce.number().int().nonnegative(),
    message: z.string().trim().nullable().optional(),
    logLevel: z.enum(LogLevel).nullable().optional(),
    tags: z.array(z.string().trim().nonempty()).nullable().optional(),
    // meta: z.record(z.string(), z.string()).nullable().optional(), add validation for meta
    platform: z.string().trim().nullable().optional(),
    bundleId: z.string().trim().nullable().optional(),
    deviceId: z.string().trim().nullable().optional(),
    from: z.date().nullable().optional(),
    to: z.date().nullable().optional(),
  })
});

export async function searchEvents(req: AuthRequest, res: Response, next: NextFunction) {
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;

  const eventsRepository: EventsRepository = new EventsRepository();
  const events: EventMessage[] = await eventsRepository.find(limit, offset);


  return res.status(200).json({
    success: true,
    result: {
      events: events,
    }
  });
}