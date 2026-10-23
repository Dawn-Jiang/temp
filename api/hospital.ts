import { request } from '@/utils/request';
import type {
  Hospital,
  PageQuery,
  PageResult,
  RecommendQuery,
  HospitalApplyParams,
  HospitalApplyStatusValue
} from '@/types';

export type { Hospital };

/** 医院模块（契约第 4 节） */
export const hospitalApi = {
  /** 4.1 医院列表（分页） */
  list: (params?: PageQuery) =>
    request.get<PageResult<Hospital>>('/hospital/list', { params }),

  /** 4.2 热门医院（分页） */
  hot: (params?: RecommendQuery) =>
    request.get<PageResult<Hospital>>('/hospital/hot', { params }),

  /** 4.3 医院详情 */
  detail: (id: number) =>
    request.get<Hospital>(`/hospital/${id}`),

  /** 医院入驻申请，返回新建/更新的医院ID */
  apply: (data: HospitalApplyParams) =>
    request.post<number>('/hospital/apply', data),

  /** 查询当前账号医院入驻审核状态：0=待审核 1=已入驻 2=已驳回 */
  applyStatus: (id: number) =>
    request.get<HospitalApplyStatusValue>(`/hospital/${id}/status`)
};
