import { request } from '@/utils/request';
import type {
  PageQuery,
  PageResult,
  WorkbenchSchedule,
  CallNextResult,
  SkipPatientParams,
  SaveMedicalRecordParams,
  CreatePrescriptionParams,
  MedicalRecord,
  Prescription
} from '@/types';

/** 医生工作台模块（契约第 13 节） */
export const workbenchApi = {
  /** 13.1 今日排班 */
  todaySchedule: (params?: PageQuery) =>
    request.get<PageResult<WorkbenchSchedule>>('/doctor/workbench/today-schedule', { params }),

  /** 13.2 叫号（scheduleId 为查询参数） */
  callNext: (scheduleId: number) =>
    request.post<CallNextResult>(`/doctor/workbench/call-next?scheduleId=${scheduleId}`),

  /** 13.3 过号 */
  skipPatient: (data: SkipPatientParams) =>
    request.post<void>('/doctor/workbench/skip-patient', data),

  /** 13.4 保存病历，返回 recordId */
  saveMedicalRecord: (data: SaveMedicalRecordParams) =>
    request.post<number>('/doctor/workbench/medical-record/save', data),

  /** 13.5 查看病历（无记录时后端返回 data:null） */
  getMedicalRecord: (regId: number) =>
    request.get<MedicalRecord | null>(`/doctor/workbench/medical-record/${regId}`),

  /** 13.6 开具处方 */
  createPrescription: (data: CreatePrescriptionParams) =>
    request.post<void>('/doctor/workbench/prescription/create', data),

  /** 13.7 查看处方列表 */
  getPrescriptions: (recordId: number, params?: PageQuery) =>
    request.get<PageResult<Prescription>>(`/doctor/workbench/prescriptions/${recordId}`, { params }),

  /** 13.8 患者历史病历 */
  getMedicalHistory: (patientId: number, params?: PageQuery) =>
    request.get<PageResult<MedicalRecord>>(`/doctor/workbench/medical-history/${patientId}`, { params })
};
