import { request } from '@/utils/request';
import type { UserType } from '@/config';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  realName: string;
  phone: string;
  idCard?: string;
  userType?: UserType;
}

export interface LoginResult {
  token: string;
  userId: number;
  username: string;
  userType: UserType;
  realName: string;
}

export const authApi = {
  login: (data: LoginParams) =>
    request.post<LoginResult>('/auth/login', data),

  register: (data: RegisterParams) =>
    request.post<void>('/auth/register', data),

  logout: () =>
    request.post<void>('/auth/logout')
};
