import { useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { ROUTE_NAMES } from '@/router/routes';

/**
 * Composable функция для использования в компонентах
 * Все методы перехода на роуты должны использовать эту утилиту
 * Используется как: const routerUtils = useRouterUtils();
 */
export function useRouterUtils() {
  const router = useRouter();

  /**
   * Переход на главную страницу
   */
  function navigateToHome(): void {
    router.push({ name: ROUTE_NAMES.HOME });
  }

  /**
   * Переход на страницу входа
   */
  function navigateToLogin(): void {
    router.push({ name: ROUTE_NAMES.LOGIN });
  }

  /**
   * Переход на дашборд
   */
  function navigateToDashboard(): void {
    router.push({ name: ROUTE_NAMES.DASHBOARD });
  }

  /**
   * Переход на страницу пользователей
   */
  function navigateToUsers(): void {
    router.push({ name: ROUTE_NAMES.USERS });
  }

  /**
   * Переход на страницу приложений
   */
  function navigateToApplications(): void {
    router.push({ name: ROUTE_NAMES.APPLICATIONS });
  }

  /**
   * Переход на страницу списка логов
   */
  function navigateToLogs(): void {
    router.push({ name: ROUTE_NAMES.LOGS });
  }

  /**
   * Переход на страницу логов приложения
   * @param applicationId - ID приложения
   */
  function navigateToEventLogs(applicationId: string): void {
    router.push({
      name: ROUTE_NAMES.EVENT_LOGS,
      params: { applicationId },
    });
  }

  /**
   * Переход на страницу онлайн стрима логов
   * @param uuid - UUID устройства
   */
  function navigateToOnlineLogStream(uuid: string): void {
    router.push({
      name: ROUTE_NAMES.ONLINE_LOG_STREAM,
      params: { uuid },
    });
  }

  /**
   * Переход на страницу одного события
   * @param id - ID события
   */
  function navigateToEventLogSingle(id: string): void {
    router.push({
      name: ROUTE_NAMES.EVENT_LOG_SINGLE,
      params: { id },
    });
  }

  /**
   * Возврат назад по истории
   */
  function goBack(): void {
    router.back();
  }

  /**
   * Переход по произвольному маршруту
   * @param location - объект маршрута
   */
  function push(location: RouteLocationRaw): void {
    router.push(location);
  }

  /**
   * Генерирует URL для роута по его имени
   * @param routeName - название роута
   * @param params - параметры роута
   * @param query - query параметры
   * @returns полный URL
   */
  function resolveRouteUrl(routeName: string, params?: Record<string, string | number>, query?: Record<string, string>): string {
    const resolved = router.resolve({ name: routeName, params, query });
    return resolved.href;
  }

  /**
   * Генерирует URL для страницы логов приложения
   * @param applicationId - ID приложения
   * @param shareToken - опциональный токен для шаринга
   * @returns полный URL
   */
  function getEventLogsUrl(applicationId: string, shareToken?: string): string {
    const query = shareToken ? { shareToken } : undefined;
    return resolveRouteUrl(ROUTE_NAMES.EVENT_LOGS, { applicationId }, query);
  }

  /**
   * Генерирует URL для страницы одного события
   * @param id - ID события
   * @returns полный URL
   */
  function getEventLogSingleUrl(id: string): string {
    return resolveRouteUrl(ROUTE_NAMES.EVENT_LOG_SINGLE, { id });
  }

  return {
    navigateToHome,
    navigateToLogin,
    navigateToDashboard,
    navigateToUsers,
    navigateToApplications,
    navigateToLogs,
    navigateToEventLogs,
    navigateToOnlineLogStream,
    navigateToEventLogSingle,
    goBack,
    push,
    resolveRouteUrl,
    getEventLogsUrl,
    getEventLogSingleUrl,
  };
}

