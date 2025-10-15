import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import { DeviceWsClientService } from '../../services/deviceWsClientsService';
import { objectIdSchema } from '../../utils/zodUtil';

export const getConnectedDevicesValidateSchema = z.object({
  query: z.object({
    applicationId: objectIdSchema.nonoptional(),
  })
});

export async function getConnectedDevices(req: Request, res: Response) {
  const applicationId = req.query.applicationId as string;
  const service = container.resolve(DeviceWsClientService);

  const clients = service.clients
    .map(c => ({ info: (c as any).getClientInfo ? (c as any).getClientInfo() : undefined }))
    .filter(c => c.info && c.info.applicationId === applicationId)
    .map(c => ({
      applicationId: c.info!.applicationId,
      deviceId: c.info!.deviceId,
      deviceName: c.info!.deviceName,
      platform: c.info!.platform,
      bundleId: c.info!.bundleId,
      osName: c.info!.osName,
    }));

  res.json({
    success: true,
    result: {
      devices: clients,
    }
  });
}
