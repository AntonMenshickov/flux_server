import { NextFunction, Request } from 'express';
import { WebSocket } from 'ws';

export function websocket(ws: WebSocket, req: Request, next: NextFunction): void {
  ws.onmessage = (event) => {
    const logMessage = JSON.parse(event.data as string);
    console.log('Received message:', logMessage);
    ws.send(`Echo: ${event.data}`);
  }
  ws.onclose = () => {
    console.log('WebSocket connection closed');
  }
  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  }
}