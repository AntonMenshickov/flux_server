import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import { DeviceWsClientService } from '../../services/deviceWsClientsService';
import { objectIdSchema } from '../../utils/zodUtil';
import { Application } from '../../model/mongo/application';
import { responseMessages } from '../../strings/responseMessages';
import { UserAuthRequest } from '../../middleware/authorizationRequired';

export const getOnlineDevicesCountValidateSchema = z.object({
  query: z.object({
    applicationId: objectIdSchema.nonoptional(),
  })
});

export async function getOnlineDevicesCount(req: UserAuthRequest, res: Response) {
  const { applicationId } = getOnlineDevicesCountValidateSchema.parse(req).query;
  // access check: only maintainers can view devices of the application
  const app = await Application.findOne({ _id: applicationId, maintainers: req.user._id }).exec();
  if (!app) {
    return res.status(403).json({ success: false, message: responseMessages.NOT_ALLOWED_TO_VIEW_APP });
  }
  const service = container.resolve(DeviceWsClientService);

  const count = service.clients
    .map(c => c.getClientInfo())
    .filter(c => c && c.applicationId === applicationId.toString())
    .length;

  res.json({
    success: true,
    result: {
      count,
    }
  });
}