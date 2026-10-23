import { request } from '@/utils/request';
import type {
  Registration,
  PageQuery,
  PageResult,
  CreateRegistrationParams
} from '@/types';

export type { Registration };

export type { CreateRegistrationParams };

/** 挂号模块（契约第 8 节） */
export const registrationApi = {
  /** 8.1 预约挂号，data 为订单号 */
  create: (data: CreateRegistrationParams) =>
    request.post<string>('/registration/book', data),

  /** 8.2 取消预约 */
  cancel: (regId: number, reason?: string) =>
    request.post<void>('/registration/cancel', { regId, reason }),

  /** 8.3 我的挂号列表（分页） */
  myBookings: (params?: PageQuery) =>
    request.get<PageResult<Registration>>('/registration/my', { params }),

  /** 8.4 挂号详情 */
  detail: (orderNo: string) =>
    request.get<Registration>(`/registration/detail/${orderNo}`)
};
