/**
 * Route names configuration
 * All application route names should be defined here
 */
export const ROUTE_NAMES = {
  HOME: 'home',
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  USERS: 'users',
  APPLICATIONS: 'applications',
  LOGS: 'logs',
  EVENT_LOGS: 'event-logs',
  ONLINE_LOG_STREAM: 'online-log-stream',
  EVENT_LOG_SINGLE: 'event-log-single',
} as const;

/**
 * Type for route names
 */
export type RouteName = typeof ROUTE_NAMES[keyof typeof ROUTE_NAMES];

