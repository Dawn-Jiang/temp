import { request } from '@/utils/request';
import type {
  Patient,
  WaitingInfo,
  PageQuery,
  PageResult,
  BindPatientParams,
  UpdatePatientParams,
  TriageParams,
  TriageResponse,
  EvaluateParams
} from '@/types';

export type { Patient, WaitingInfo, TriageResponse };

/** 患者模块（契约第 7 节） */
export const patientApi = {
  /** 7.1 获取当前用户绑定的患者信息 */
  profile: () =>
    request.get<Patient>('/patient/profile'),

  /** 7.2 绑定就诊人 */
  bind: (data: BindPatientParams) =>
    request.post<void>('/patient/bind', data),

  /** 7.3 更新就诊人信息 */
  update: (data: UpdatePatientParams) =>
    request.put<void>('/patient/update', data),

  /** 删除就诊人 */
  delete: (patientId: number) =>
    request.delete<void>(`/patient/delete/${patientId}`),

  /** 7.4 就诊人列表（患者服务） */
  servicePatients: (params?: PageQuery) =>
    request.get<PageResult<Patient>>('/patient/service/patients', { params }),

  /** 7.5 智能导诊，多轮问答并返回推荐科室/下一问题 */
  triage: (data: TriageParams) =>
    request.post<TriageResponse>('/patient/service/triage', data),

  /** 7.6 候诊查询 */
  waitingInfo: (orderNo: string) =>
    request.get<WaitingInfo>(`/patient/service/waiting/${orderNo}`),

  /** 7.7 就诊评价 */
  evaluate: (data: EvaluateParams) =>
    request.post<void>('/patient/service/evaluate', data)
};
