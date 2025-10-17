import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import { DeviceWsClientService } from '../../services/deviceWsClientsService';
import { WebWsClientService } from '../../services/webWsClientsService';
import { WsServerMessageType } from '../../websocket/model/wsServerMessage';
import { UserAuthRequest } from '../../middleware/authorizationRequired';

export const streamControlValidateSchema = z.object({
  body: z.object({
    webUuid: z.uuid().nonempty(),
    deviceUuid: z.uuid().nonempty(),
  })
});

export async function startDeviceStream(req: UserAuthRequest, res: Response) {
  const { deviceUuid, webUuid } = streamControlValidateSchema.parse(req).body;
  const service = container.resolve(DeviceWsClientService);
  const sent = service.sendToDevice(deviceUuid, { type: WsServerMessageType.startEventsStream, payload: {} });
  if (!sent) {
    return res.status(404).json({ success: false, error: 'Device not found or not connected' });
  }
  // subscribe requesting web client (if connected)
  try {
    const webService = container.resolve(WebWsClientService);
    const user = req.user;
    if (user && user._id) {
      webService.subscribe(webUuid, deviceUuid);
    }
  } catch (e) { /* ignore */ }

  res.json({ success: true, result: {} });
}

export async function stopDeviceStream(req: UserAuthRequest, res: Response) {
  const { deviceUuid, webUuid } = streamControlValidateSchema.parse(req).body;
  const service = container.resolve(DeviceWsClientService);
  const sent = service.sendToDevice(deviceUuid, { type: WsServerMessageType.stopEventsStream, payload: {} });
  if (!sent) {
    return res.status(404).json({ success: false, error: 'Device not found or not connected' });
  }
  // unsubscribe requesting web client
  try {
    const webService = container.resolve(WebWsClientService);
    const user = req.user;
    if (user && user._id) {
      webService.unsubscribe(webUuid, deviceUuid);
    }
  } catch (e) { /* ignore */ }

  res.json({ success: true, result: {} });
}
