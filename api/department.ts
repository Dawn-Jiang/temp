import { request } from '@/utils/request';
import type { Department, PageQuery, PageResult } from '@/types';

export type { Department };

/** 科室模块（契约第 5 节） */
export const departmentApi = {
  /** 5.1 根据医院获取科室（分页） */
  byHospital: (hospitalId: number, params?: PageQuery) =>
    request.get<PageResult<Department>>(`/department/hospital/${hospitalId}`, { params }),

  /** 5.2 全部科室列表（分页） */
  list: (params?: PageQuery) =>
    request.get<PageResult<Department>>('/department/list', { params }),

  /** 5.3 科室详情 */
  detail: (id: number) =>
    request.get<Department>(`/department/${id}`)
};
