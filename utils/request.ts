import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { message } from 'antd';
import { useUserStore } from '@/store/userStore';

interface RequestInstance
  extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete' | 'patch' | 'request'> {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  request<T = unknown>(config: AxiosRequestConfig): Promise<T>;
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
}) as unknown as RequestInstance;

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/** 标识后端 403 是否实为“登录态失效”（token 过期/无效/未登录），而非真正的权限不足 */
const TOKEN_INVALID_KEYWORDS = [
  'token', '令牌', '过期', '失效', '无效', '未登录', '请登录', '请重新登录', '登录已过期', '认证',
  'expired', 'invalid', 'unauthorized', 'unauthenticated', 'jwt'
];

function isTokenInvalid403(error: AxiosError): boolean {
  if (error.response?.status !== 403) return false;
  // 本地已无 token，403 必然是因为未认证
  if (!localStorage.getItem('token')) return true;
  const raw = error.response.data as { message?: string } | string | undefined;
  const msg = typeof raw === 'string' ? raw : raw?.message ?? '';
  const lower = msg.toLowerCase();
  return TOKEN_INVALID_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

let redirecting = false;

/** 清除登录态并跳转登录页（防抖，避免多个并发请求重复跳转） */
function redirectToLogin(): void {
  if (redirecting) return;
  redirecting = true;
  localStorage.removeItem('token');
  useUserStore.getState().logout();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  } else {
    redirecting = false;
  }
}

request.interceptors.response.use(
  (response) => {
    const res = response.data;

    if (res.code !== 200 && res.code !== undefined) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }

    return res.data;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401 || isTokenInvalid403(error)) {
      message.error('登录已过期，请重新登录');
      redirectToLogin();
    } else if (error.response?.status === 403) {
      message.error('权限不足');
    } else {
      message.error(error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export { request };
