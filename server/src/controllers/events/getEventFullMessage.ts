import z from 'zod';
import type { NextFunction, Response } from 'express';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { container } from 'tsyringe';
import { PostgresEventsRepository } from '../../database/repository/postgresEventRepository';
import { Application } from '../../model/mongo/application';
import { responseMessages } from '../../strings/responseMessages';
import { EventMessage } from '../../model/postgres/eventMessageDbView';

export const getEventFullMessageValidateSchema = z.object({
  params: z.object({
    id: z.uuid().nonoptional(),
  })
});

export async function getEventFullMessage(req: UserAuthRequest, res: Response, _next: NextFunction) {
  const { id } = getEventFullMessageValidateSchema.parse(req).params;

  const repo = container.resolve(PostgresEventsRepository);
  const event = await EventMessage.findOneBy({ id });

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  // Check user is a maintainer of the event's application
  const app = await Application.findOne({ _id: event.applicationId, maintainers: req.user._id }).exec();
  if (!app) {
    return res.status(403).json({ success: false, message: responseMessages.NOT_ALLOWED_TO_VIEW_APP });
  }

  const fullMessage = await repo.getFullMessage(id);

  if (fullMessage === null) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }

  return res.status(200).json({ success: true, result: { message: fullMessage } });
}

