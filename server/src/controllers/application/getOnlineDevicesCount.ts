import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import { DeviceWsClientService } from '../../services/deviceWsClientsService';
import { objectIdSchema } from '../../utils/zodUtil';

export const getOnlineDevicesCountValidateSchema = z.object({
  query: z.object({
    applicationId: objectIdSchema.nonoptional(),
  })
});

export async function getOnlineDevicesCount(req: Request, res: Response) {
  const { applicationId } = getOnlineDevicesCountValidateSchema.parse(req).query;
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