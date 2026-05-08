import Axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  Method,
} from 'axios';
import { clearSession, getAccessToken, getRefreshToken, saveSession } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const AXIOS_INSTANCE = Axios.create({ baseURL: BASE_URL });

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// 401 → try refresh once, then retry the original request.
let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const r = await Axios.post<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string | null; role: string };
    }>(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
    saveSession({
      accessToken: r.data.accessToken,
      refreshToken: r.data.refreshToken,
      user: r.data.user,
    });
    return r.data.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

AXIOS_INSTANCE.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retry = true;
      if (!refreshPromise) refreshPromise = tryRefresh();
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        return AXIOS_INSTANCE(original);
      }
    }
    return Promise.reject(error);
  },
);

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
