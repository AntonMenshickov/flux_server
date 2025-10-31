import { useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { ROUTE_NAMES } from '@/router/routes';

/**
 * Composable function for use in components
 * All route navigation methods should use this utility
 * Usage: const routerUtils = useRouterUtils();
 */
export function useRouterUtils() {
  const router = useRouter();

  /**
   * Navigate to home page
   */
  function navigateToHome(): void {
    router.push({ name: ROUTE_NAMES.HOME });
  }

  /**
   * Navigate to login page
   */
  function navigateToLogin(): void {
    router.push({ name: ROUTE_NAMES.LOGIN });
  }

  /**
   * Navigate to dashboard
   */
  function navigateToDashboard(): void {
    router.push({ name: ROUTE_NAMES.DASHBOARD });
  }

  /**
   * Navigate to users page
   */
  function navigateToUsers(): void {
    router.push({ name: ROUTE_NAMES.USERS });
  }

  /**
   * Navigate to applications page
   */
  function navigateToApplications(): void {
    router.push({ name: ROUTE_NAMES.APPLICATIONS });
  }

  /**
   * Navigate to logs list page
   */
  function navigateToLogs(): void {
    router.push({ name: ROUTE_NAMES.LOGS });
  }

  /**
   * Navigate to application event logs page
   * @param applicationId - Application ID
   */
  function navigateToEventLogs(applicationId: string): void {
    router.push({
      name: ROUTE_NAMES.EVENT_LOGS,
      params: { applicationId },
    });
  }

  /**
   * Navigate to online log stream page
   * @param uuid - Device UUID
   */
  function navigateToOnlineLogStream(uuid: string): void {
    router.push({
      name: ROUTE_NAMES.ONLINE_LOG_STREAM,
      params: { uuid },
    });
  }

  /**
   * Navigate to single event log page
   * @param id - Event ID
   */
  function navigateToEventLogSingle(id: string): void {
    router.push({
      name: ROUTE_NAMES.EVENT_LOG_SINGLE,
      params: { id },
    });
  }

  /**
   * Go back in history
   */
  function goBack(): void {
    router.back();
  }

  /**
   * Navigate to arbitrary route
   * @param location - Route location object
   */
  function push(location: RouteLocationRaw): void {
    router.push(location);
  }

  /**
   * Generate URL for route by its name
   * @param routeName - Route name
   * @param params - Route parameters
   * @param query - Query parameters
   * @returns Full URL
   */
  function resolveRouteUrl(routeName: string, params?: Record<string, string | number>, query?: Record<string, string>): string {
    const resolved = router.resolve({ name: routeName, params, query });
    return resolved.href;
  }

  /**
   * Generate URL for application event logs page
   * @param applicationId - Application ID
   * @param shareToken - Optional share token
   * @returns Full URL
   */
  function getEventLogsUrl(applicationId: string, shareToken?: string): string {
    const query = shareToken ? { shareToken } : undefined;
    return resolveRouteUrl(ROUTE_NAMES.EVENT_LOGS, { applicationId }, query);
  }

  /**
   * Generate URL for single event log page
   * @param id - Event ID
   * @returns Full URL
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

