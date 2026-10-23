import { request } from '@/utils/request';
import type {
  PayOrder,
  CreatePayParams,
  PayCallbackParams,
  RefundParams
} from '@/types';

export type { PayOrder };

/** 支付模块（契约第 10 节） */
export const paymentApi = {
  /** 10.1 创建支付订单 */
  create: (data: CreatePayParams) =>
    request.post<PayOrder>('/payment/create', data),

  /** 10.2 支付回调（无鉴权，一般由支付平台调用） */
  callback: (data: PayCallbackParams) =>
    request.post<void>('/payment/callback', data),

  /** 10.3 退款 */
  refund: (data: RefundParams) =>
    request.post<void>('/payment/refund', data)
};
