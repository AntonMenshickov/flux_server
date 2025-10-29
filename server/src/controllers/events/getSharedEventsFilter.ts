import { Response, NextFunction } from 'express';
import { EventsFilter } from '../../model/mongo/eventsFilter';
import z from 'zod';
import { SearchFieldKey, Operator } from '../../model/searchCriterion';

export const getSharedEventsFilterValidateSchema = z.object({
  params: z.object({
    shareToken: z.string().min(1),
  })
});

export async function getSharedEventsFilter(req: any, res: Response, next: NextFunction) {
  const { shareToken } = getSharedEventsFilterValidateSchema.parse(req).params;

  const filter = await EventsFilter.findOne({ shareToken }).exec();

  if (!filter) {
    return res.status(404).json({ error: 'Shared filter not found' });
  }

  // Extract dateTimeRange from criteria if present
  const dateTimeCriteria = filter.criteria.filter(
    c => c.field === SearchFieldKey.Timestamp && (c.operator === Operator.GreaterThan || c.operator === Operator.LessThan)
  );
  
  const regularCriteria = filter.criteria.filter(
    c => c.field !== SearchFieldKey.Timestamp
  );

  const dateTimeRange = dateTimeCriteria.length === 2 ? {
    start: dateTimeCriteria.find(c => c.operator === Operator.GreaterThan)?.value as number,
    end: dateTimeCriteria.find(c => c.operator === Operator.LessThan)?.value as number,
  } : undefined;

  return res.status(200).json({
    success: true,
    result: {
      criteria: regularCriteria,
      dateTimeRange,
      applicationId: filter.applicationId.toString(),
    }
  });
}

