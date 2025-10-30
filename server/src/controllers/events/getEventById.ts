import z from 'zod';
import type { NextFunction, Response } from 'express';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { container } from 'tsyringe';
import { PostgresEventsRepository } from '../../database/repository/postgresEventRepository';

export const getEventByIdValidateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  })
});

export async function getEventById(req: UserAuthRequest, res: Response, _next: NextFunction) {
  const { id } = getEventByIdValidateSchema.parse(req).params;

  const repo = container.resolve(PostgresEventsRepository);
  const event = await repo.findById(id);

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  return res.status(200).json({ success: true, result: event });
}


