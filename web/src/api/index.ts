import axios, { AxiosError } from 'axios';
import { useUserStore } from '@/stores/user';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { Either, left, right } from '@sweet-monads/either';
import { auth } from './auth';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ApiResponse<T> {
  success: boolean;
  result: T;
}

export interface ApiError {
  code: number;
  message: string;
}

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface RequestOptions {
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export async function request<T>(
  options: RequestOptions
): Promise<Either<ApiError, ApiResponse<T>>> {
  try {
    const response = await api.request<ApiResponse<T>>({
      method: options.method,
      url: options.url,
      data: options.data,
      params: options.params,
      headers: options.headers,
    });
    return right(response.data);
  } catch (err) {
    if (err instanceof AxiosError) {
      const error: ApiError = {
        code: err.response?.status ?? 500,
        message: err.response?.data?.error ?? err.message ?? 'Unknown error',
      };
      return left(error);
    } else {
      return left({
        code: 500,
        message: `Unknown error of type ${typeof err} ${err}`
      });
    }
  }
}


api.interceptors.request.use(async (config) => {
  const userStore = useUserStore();

  if (userStore.token) {
    const accessToken = userStore.token.accessToken;

    try {
      const accessTokenPayload = jwtDecode<JwtPayload>(accessToken);
      const now = Math.floor(Date.now() / 1000);

      // Проверяем, не истёк ли токен
      if (accessTokenPayload.exp == null || accessTokenPayload.exp < now) {
        console.log('Access token expired, trying to refresh...');
        const refreshToken = userStore.token.refreshToken;
        const refreshTokenPayload = jwtDecode<JwtPayload>(refreshToken);
        if (refreshTokenPayload.exp != null && refreshTokenPayload.exp > now) {

          const refreshResult = await auth.refresh(refreshToken);
          if (refreshResult.isRight()) {
            const token = refreshResult.value.result;
            userStore.setToken(token);

            config.headers.authorization = `Bearer ${token.accessToken}`;
          } else {
            userStore.logout();
            throw new Error('Session expired');
          }
        } else {
          userStore.logout();
          throw new Error('Session expired');
        }
      } else {
        // Токен действителен — добавляем его в заголовок
        config.headers.authorization = `Bearer ${accessToken}`;
      }
    } catch (e) {
      // Некорректный токен — разлогиниваем
      userStore.logout();
      throw e;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const userStore = useUserStore();

    if (error.response?.status === 401) {
      userStore.logout();
      // например, редирект на /login
    }

    return Promise.reject(error);
  }
);


export default api;
