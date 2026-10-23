import { request } from '@/utils/request';
import type {
  Schedule,
  PageQuery,
  PageResult,
  GenerateScheduleParams,
  StopScheduleParams,
  UpdateScheduleParams
} from '@/types';

export type { Schedule };

/** 按医生查询排班的查询参数（契约 9.2） */
export interface DoctorScheduleQuery extends PageQuery {
  startDate?: string;
  endDate?: string;
}

/** 按医院/科室查询可预约排班的查询参数 */
export interface HospitalDeptScheduleQuery extends PageQuery {
  startDate?: string;
  endDate?: string;
}

/** 排班模块（契约第 9 节） */
export const scheduleApi = {
  /** 9.1 批量生成排班 */
  generate: (data: GenerateScheduleParams) =>
    request.post<void>('/schedule/generate', data),

  /** 9.2 按医生查询排班（分页） */
  byDoctor: (doctorId: number, params?: DoctorScheduleQuery) =>
    request.get<PageResult<Schedule>>(`/schedule/doctor/${doctorId}`, { params }),

  /** 按医院 + 科室查询患者端可预约排班（分页，已删除/停诊排班后端不再返回） */
  byHospitalDept: (
    hospitalId: number,
    deptId: number,
    params?: HospitalDeptScheduleQuery
  ) =>
    request.get<PageResult<Schedule>>(
      `/schedule/hospital/${hospitalId}/dept/${deptId}`,
      { params }
    ),

  /** 9.3 停诊 */
  stop: (data: StopScheduleParams) =>
    request.post<void>('/schedule/stop', data),

  /** 修改排班（平台管理员权限） */
  update: (data: UpdateScheduleParams) =>
    request.put<void>('/schedule/update', data),

  /** 删除排班（平台管理员权限） */
  remove: (scheduleId: number) =>
    request.delete<void>(`/schedule/${scheduleId}`),

  /** 一键清空排班（医院管理员权限） */
  clearByDoctor: (doctorId: number, startDate: string, endDate: string) =>
    request.delete<void>(`/schedule/doctor/${doctorId}/clear`, {
      params: { startDate, endDate }
    })
};
