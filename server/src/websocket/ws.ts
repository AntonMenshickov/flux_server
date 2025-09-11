import { NextFunction, Request } from 'express';
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { ReliableBatchQueue } from '../eventsQueue/reliableBatchQueue';

export function websocket(ws: WebSocket, req: Request, next: NextFunction): void {
  ws.onmessage = (event) => {
    const logMessage = JSON.parse(event.data as string);
    const eventData = {
      ...logMessage,
      id: uuidv4()
    }
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