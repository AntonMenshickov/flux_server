import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import { DeviceWsClientService } from '../../services/deviceWsClientsService';
import { objectIdSchema } from '../../utils/zodUtil';
import { DeviceClientInfo } from '../../websocket/deviceClient/deviceWsClient';

export const searchOnlineDevicesValidateSchema = z.object({
  query: z.object({
    applicationId: objectIdSchema.nonoptional(),
    search: z.string().trim().optional(),
  })
});

export async function searchOnlineDevices(req: Request, res: Response) {
  const { applicationId, search } = searchOnlineDevicesValidateSchema.parse(req).query;
  const service = container.resolve(DeviceWsClientService);

  const clients: DeviceClientInfo[] = service.clients
    .map(c => c.getClientInfo())
    .filter(c => c && c.applicationId === applicationId.toString()).map(c => c!);

  // If a search query is provided, filter devices by any field (case-insensitive)
  const s = search?.toLowerCase();
  const filtered = s
    ? clients.filter(d => {
      return (
        (d.uuid && d.uuid.toLowerCase().includes(s)) ||
        (d.applicationId && d.applicationId.toLowerCase().includes(s)) ||
        (d.deviceId && d.deviceId.toLowerCase().includes(s)) ||
        (d.deviceName && d.deviceName.toLowerCase().includes(s)) ||
        (d.platform && d.platform.toLowerCase().includes(s)) ||
        (d.bundleId && d.bundleId.toLowerCase().includes(s)) ||
        (d.osName && d.osName.toLowerCase().includes(s))
      );
    })
    : clients;

  res.json({
    success: true,
    result: {
      devices: filtered,
    }
  });
}
