import { Response, NextFunction } from 'express';
import { Document, Types } from 'mongoose';
import { EventsFilter, IEventsFilter } from '../../model/mongo/eventsFilter';
import z from 'zod';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { SearchFieldKey, Operator } from '../../model/searchCriterion';
import { criteriaArraySchema, objectIdSchema } from '../../utils/zodUtil';
import { v4 as uuidv4 } from 'uuid';

export const shareEventsFilterValidateSchema = z.object({
  body: z.object({
    filterId: z.string().optional(),
    criteria: criteriaArraySchema.optional(),
    dateTimeRange: z.object({
      start: z.number(),
      end: z.number(),
    }).optional(),
    applicationId: objectIdSchema.nonoptional(),
  })
});

function generateShareToken(): string {
  return uuidv4();
}

export async function shareEventsFilter(req: UserAuthRequest, res: Response, next: NextFunction) {
  const { filterId, criteria, dateTimeRange, applicationId } = shareEventsFilterValidateSchema.parse(req).body;
  const userId = req.user._id;

  let filter: IEventsFilter & Document | null = null;

  if (filterId && Types.ObjectId.isValid(filterId)) {
    filter = await EventsFilter.findOne({ _id: filterId, user: userId }).exec();

    if (!filter) {
      return res.status(404).json({ error: 'Filter not found or access denied' });
    }

    if (filter.shareToken) {
      return res.status(200).json({
        success: true,
        result: {
          shareToken: filter.shareToken,
          applicationId: filter.applicationId.toString(),
        }
      });
    }
  }

  const shareToken = generateShareToken();

  if (filter) {
    filter.shareToken = shareToken;
    await filter.save();

    return res.status(200).json({
      success: true,
      result: {
        shareToken: filter.shareToken,
        applicationId: filter.applicationId.toString(),
      }
    });
  }

  if (!criteria || criteria.length === 0) {
    return res.status(400).json({ error: 'Criteria are required when creating a new filter' });
  }


  const allCriteria = [...criteria];
  if (dateTimeRange) {
    allCriteria.push({
      field: SearchFieldKey.Timestamp,
      operator: Operator.GreaterThan,
      value: dateTimeRange.start,
    });
    allCriteria.push({
      field: SearchFieldKey.Timestamp,
      operator: Operator.LessThan,
      value: dateTimeRange.end,
    });
  }

  const filterData: Partial<IEventsFilter> = {
    user: userId,
    name: `Shared Filter ${new Date().toISOString()}`,
    criteria: allCriteria,
    shareToken,
    applicationId: new Types.ObjectId(applicationId),
    isSharedOnly: true,
  };

  const newFilter: IEventsFilter & Document = new EventsFilter(filterData);
  await newFilter.save();

  return res.status(200).json({
    success: true,
    result: {
      shareToken: newFilter.shareToken,
      applicationId: newFilter.applicationId.toString(),
    }
  });
}

