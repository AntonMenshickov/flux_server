import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import { DeviceWsClientService } from '../../services/deviceWsClientsService';
import { DeviceClientInfo } from '../../websocket/deviceClient/deviceWsClient';
import { responseMessages } from '../../strings/responseMessages';
import { Application } from '../../model/mongo/application';
import { UserAuthRequest } from '../../middleware/authorizationRequired';

export const getOnlineDeviceValidateSchema = z.object({
  query: z.object({
    deviceUuid: z.uuid().nonoptional(),
  })
});

export async function getOnlineDevice(req: UserAuthRequest, res: Response) {
  const { deviceUuid } = getOnlineDeviceValidateSchema.parse(req).query;
  const service = container.resolve(DeviceWsClientService);

  const device: DeviceClientInfo | undefined = service.clients
    .map(c => c.getClientInfo())
    .find(c => c && c.uuid === deviceUuid);

  if (!device) {
    return res.status(400).json({ error: responseMessages.DEVICE_NOT_FOUND });
  }

  // access check: only maintainers of device.applicationId
  const app = await Application.findOne({ _id: device.applicationId, maintainers: req.user._id }).exec();
  if (!app) {
    return res.status(403).json({ success: false, message: responseMessages.NOT_ALLOWED_TO_VIEW_APP });
  }


  res.json({
    success: true,
    result: {
      device: device.toJson(),
    }
  });
}
