import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import { DeviceWsClientService } from '../../services/deviceWsClientsService';
import { objectIdSchema } from '../../utils/zodUtil';
import { DeviceClientInfo } from '../../websocket/deviceClient/deviceWsClient';
import { responseMessages } from '../../strings/responseMessages';

export const getOnlineDeviceValidateSchema = z.object({
  query: z.object({
    deviceUuid: z.uuid().nonoptional(),
  })
});

export async function getOnlineDevice(req: Request, res: Response) {
  const { deviceUuid } = getOnlineDeviceValidateSchema.parse(req).query;
  const service = container.resolve(DeviceWsClientService);

  const device: DeviceClientInfo | undefined = service.clients
    .map(c => c.getClientInfo())
    .find(c => c && c.uuid === deviceUuid);

  if (!device) {
    return res.status(400).json({ error: responseMessages.DEVICE_NOT_FOUND });
  }


  res.json({
    success: true,
    result: {
      device,
    }
  });
}
