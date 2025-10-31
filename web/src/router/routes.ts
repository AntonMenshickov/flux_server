/**
 * Конфигурация названий роутов
 * Все названия роутов приложения должны быть определены здесь
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
 * Тип для названий роутов
 */
export type RouteName = typeof ROUTE_NAMES[keyof typeof ROUTE_NAMES];

