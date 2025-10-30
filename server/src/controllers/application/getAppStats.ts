import { Response, NextFunction } from 'express';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import z from 'zod';
import { ApplicationStats } from '../../model/mongo/applicationStats';
import { objectIdSchema } from '../../utils/zodUtil';
import { Application } from '../../model/mongo/application';
import { responseMessages } from '../../strings/responseMessages';

export const getAppStatsValidateSchema = z.object({
  query: z.object({
    applicationId: objectIdSchema.nonoptional(),
  })
});


export async function getAppStats(req: UserAuthRequest, res: Response, next: NextFunction) {
  try {
    const { applicationId } = getAppStatsValidateSchema.parse(req).query;

    const application = await Application.findById(applicationId).exec();
    if (!application) {
      return res.status(400).json({ error: responseMessages.APPLICATION_NOT_FOUND });
    }
    // Check user is a maintainer of the application
    if (!application.maintainers.find(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: responseMessages.NOT_ALLOWED_TO_VIEW_APP });
    }
    const stats = await ApplicationStats.find({ application: application._id }).sort({ date: 1 }).exec();

    return res.status(200).json({
      success: true,
      result: {
        id: application._id,
        name: application.name,
        bundles: application.bundles,
        stats: stats,
      }
    });
  } catch (err) {
    next(err);
  }
}
