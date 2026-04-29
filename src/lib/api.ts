import Axios, { AxiosRequestConfig, Method } from 'axios';
import { getAccessToken } from './auth';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const customInstance = async <T>(
  url: string,
  options: RequestInit & { method?: string } = {},
): Promise<T> => {
  const { method, body, headers, signal } = options;
  const config: AxiosRequestConfig = {
    url,
    method: (method || 'GET') as Method,
    headers: headers as Record<string, string> | undefined,
    data: body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined,
    signal: signal ?? undefined,
  };

  const response = await AXIOS_INSTANCE(config);

  // Orval 8 expects { data, status, headers } shape
  return {
    data: response.data,
    status: response.status,
    headers: new Headers(
      Object.entries(response.headers).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v != null) acc[k] = String(v);
        return acc;
      }, {}),
    ),
  } as T;
};

export default customInstance;
