import { request } from '@/utils/request';
import type { Doctor, PageResult, RecommendQuery, DoctorListParams } from '@/types';

export type { Doctor };

/** 医生模块（契约第 6 节） */
export const doctorApi = {
  /** 6.1 推荐医生（分页） */
  recommend: (params?: RecommendQuery) =>
    request.get<PageResult<Doctor>>('/doctor/recommend', { params }),

  /** 6.2 医生列表（hospitalId 必填，分页） */
  list: (params: DoctorListParams) =>
    request.get<PageResult<Doctor>>('/doctor/list', { params }),

  /** 6.3 医生详情 */
  detail: (id: number) =>
    request.get<Doctor>(`/doctor/${id}`)
};
