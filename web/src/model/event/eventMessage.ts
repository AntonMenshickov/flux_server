import type { LogLevel } from './logLevel';

export interface EventMessage {
  id: string;
  timestamp: number;
  logLevel: LogLevel;
  applicationId: string;
  platform: string;
  bundleId: string;
  deviceId: string;
  deviceName: string;
  osName: string;
  message: string;
  tags?: string[];
  meta?: Map<string, string>;
  stackTrace?: string;
}

export function eventMessageFromJson(json: { [key: string]: unknown } | EventMessage): EventMessage {
  return {
    ...json,
    meta: json.meta instanceof Map ? json.meta as Map<string, string> : new Map<string, string>(Object.entries(json.meta || {}))
  } as EventMessage;
}