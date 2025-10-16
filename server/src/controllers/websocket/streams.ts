import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import { DeviceWsClientService } from '../../services/deviceWsClientsService';
import { WebWsClientService } from '../../services/webWsClientsService';
import { WsServerMessageType } from '../../websocket/deviceClient/model/wsServerMessage';
import { UserAuthRequest } from '../../middleware/authorizationRequired';

export const streamControlValidateSchema = z.object({
  body: z.object({
    uuid: z.string().trim().nonempty(),
  })
});

export async function startDeviceStream(req: UserAuthRequest, res: Response) {
  const { uuid } = streamControlValidateSchema.parse(req).body;
  const service = container.resolve(DeviceWsClientService);
  const sent = service.sendToDevice(uuid, { type: WsServerMessageType.startEventsStream, payload: {} });
  if (!sent) {
    return res.status(404).json({ success: false, error: 'Device not found or not connected' });
  }
  // subscribe requesting web client (if connected)
  try {
    const webService = container.resolve(WebWsClientService);
    const user = req.user;
    if (user && user._id) {
      webService.subscribe(user._id.toString(), uuid);
    }
  } catch (e) { /* ignore */ }

  res.json({ success: true, result: {} });
}

export async function stopDeviceStream(req: UserAuthRequest, res: Response) {
  const { uuid } = streamControlValidateSchema.parse(req).body;
  const service = container.resolve(DeviceWsClientService);
  const sent = service.sendToDevice(uuid, { type: WsServerMessageType.stopEventsStream, payload: {} });
  if (!sent) {
    return res.status(404).json({ success: false, error: 'Device not found or not connected' });
  }
  // unsubscribe requesting web client
  try {
    const webService = container.resolve(WebWsClientService);
    const user = req.user;
    if (user && user._id) {
      webService.unsubscribe(user._id.toString(), uuid);
    }
  } catch (e) { /* ignore */ }

  res.json({ success: true, result: {} });
}
