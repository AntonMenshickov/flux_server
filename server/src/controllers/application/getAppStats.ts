import { Response, NextFunction } from 'express';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { ApplicationStats } from '../../model/mongo/applicationStats';
import { objectIdSchema } from '../../utils/zodUtil';

export const getAppStatsValidateSchema = z.object({
  query: z.object({
    applicationId: objectIdSchema.nonoptional(),
  })
});


export async function getAppStats(req: UserAuthRequest, res: Response, next: NextFunction) {
  try {
    const { applicationId } = getAppStatsValidateSchema.parse(req).query;

    const stats = await ApplicationStats.find({ application: applicationId }).exec();

    return res.status(200).json({
      success: true,
      result: {
        stats: stats,
      }
    });
  } catch (err) {
    next(err);
  }
}
