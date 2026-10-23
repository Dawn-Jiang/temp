import { request } from '@/utils/request';
import type {
  Hospital,
  Department,
  Doctor,
  Registration,
  PageQuery,
  PageResult,
  HospitalStatistics,
  CreateDepartmentParams,
  UpdateDepartmentParams,
  CreateDoctorParams,
  UpdateDoctorParams,
  AdminOrderQuery,
  StatisticsQuery,
  ApproveHospitalParams,
  BlacklistParams
} from '@/types';

export type { Hospital, Department, Doctor, Registration, HospitalStatistics };

/** 管理员模块（契约第 11 节医院管理员 + 第 12 节平台管理员） */
export const adminApi = {
  /** 11.1 创建科室 */
  createDepartment: (data: CreateDepartmentParams) =>
    request.post<void>('/admin/hospital/department/create', data),

  /** 11.2 更新科室 */
  updateDepartment: (data: UpdateDepartmentParams) =>
    request.put<void>('/admin/hospital/department/update', data),

  /** 11.3 创建医生 */
  createDoctor: (data: CreateDoctorParams) =>
    request.post<void>('/admin/hospital/doctor/create', data),

  /** 11.4 更新医生信息 */
  updateDoctor: (data: UpdateDoctorParams) =>
    request.put<void>('/admin/hospital/doctor/update', data),

  /** 11.5 订单列表 */
  orders: (params?: AdminOrderQuery) =>
    request.get<PageResult<Registration>>('/admin/hospital/orders', { params }),

  /** 11.6 数据统计 */
  statistics: (params: StatisticsQuery) =>
    request.get<HospitalStatistics>('/admin/hospital/statistics', { params }),

  /** 12.1 待审核医院列表 */
  pendingHospitals: (params?: PageQuery) =>
    request.get<PageResult<Hospital>>('/admin/platform/hospitals/pending', { params }),

  /** 12.2 审核医院入驻 */
  approveHospital: (data: ApproveHospitalParams) =>
    request.post<void>('/admin/platform/hospital/approve', data),

  /** 12.3 添加黑名单 */
  addBlacklist: (data: BlacklistParams) =>
    request.post<void>('/admin/platform/blacklist/add', data),

  /** 12.4 移除黑名单 */
  removeBlacklist: (data: BlacklistParams) =>
    request.post<void>('/admin/platform/blacklist/remove', data),

  /** 一键清空排班（平台管理员权限） */
  clearSchedule: (doctorId: number, startDate: string, endDate: string) =>
    request.delete<void>(`/admin/platform/schedule/doctor/${doctorId}/clear`, {
      params: { startDate, endDate }
    })
};
