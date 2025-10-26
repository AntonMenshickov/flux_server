import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { EventsFilter, IEventsFilter } from '../../model/mongo/eventsFilter';
import z from 'zod';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { SearchFieldKey, Operator } from '../../model/searchCriterion';

const criteriaItemSchema = z.object({
  field: z.enum(Object.values(SearchFieldKey) as [SearchFieldKey, ...SearchFieldKey[]]),
  operator: z.enum(Object.values(Operator) as [Operator, ...Operator[]]),
  value: z.union([
    z.string().trim(),
    z.number(),
    z.coerce.date(),
    z.array(z.string()),
    z.array(z.record(z.string(), z.string())),
  ]),
});

export const addEventsFilterValidateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, responseMessages.NAME_IS_REQUIRED),
    criteria: z.array(criteriaItemSchema).min(1, 'At least one criterion is required'),
  })
});

export async function addEventsFilter(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { name, criteria } = addEventsFilterValidateSchema.parse(req).body;
  const userId = req.user._id;

  const existFilter = await EventsFilter.findOne({ user: userId, name }).exec();
  if (existFilter) {
    return res.status(400).json({ error: responseMessages.EVENTS_FILTER_NAME_ALREADY_EXISTS });
  }

  const filter: IEventsFilter & Document = new EventsFilter({
    user: userId,
    name,
    criteria,
  });

  await filter.save();

  return res.status(200).json({
    success: true,
    result: {
      id: filter.id,
      name: filter.name,
      criteria: filter.criteria,
      createdAt: filter.createdAt,
    }
  });
}

