import { NextFunction, Request } from 'express';
import { WebSocket } from 'ws';

import { ReliableBatchQueue } from '../eventsQueue/reliableBatchQueue';
import { responseMessages } from '../strings/responseMessages';
import { tokenUtil } from '../utils/tokenUtil';
import { JwtPayload } from 'jsonwebtoken';
import { Application, IApplication } from '../model/mongo/application';
import { Document } from 'mongoose';
import { wsEventMessageDtoSchema } from '../utils/zodUtil';
import { eventMessageFromWs, WsEventMessage } from '../model/eventMessage';

export async function websocket(ws: WebSocket, req: Request, next: NextFunction): Promise<void> {
  const token = req.query.token as string;

  if (!token) {
    ws.close(4001, responseMessages.INVALID_TOKEN);
    return;
  }
  const payload = tokenUtil.verify(token) as JwtPayload;
  const applicationId = payload.applicationId;
  if (!applicationId) {
    ws.close(4001, responseMessages.INVALID_TOKEN);
    return;
  }
  const application: IApplication & Document | null = await Application.findById(applicationId).exec();
  if (!application) {
    ws.close(4000, responseMessages.APPLICATION_NOT_FOUND);
    return;
  }
  ws.onmessage = (event) => {
    const logMessage: WsEventMessage = wsEventMessageDtoSchema.parse(JSON.parse(event.data as string));
    if (!application.bundles.find(b => b.platform == logMessage.platform && b.bundleId == logMessage.bundleId)) {
      return;
    }
    const eventData = eventMessageFromWs(logMessage, application._id.toString());
    ReliableBatchQueue.instance.enqueue(eventData);
    ws.send(`Echo: ${event.data}`);
  }
  ws.onclose = () => {
    console.log('WebSocket connection closed');
  }
  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  }
}