import type { UserType } from '@/config';

export interface User {
  userId: number;
  username: string;
  userType: UserType;
  realName: string;
  phone?: string;
  idCard?: string;
}

export interface Hospital {
  hospitalId: number;
  hospitalName: string;
  hospitalCode: string;
  level: string;
  city: string;
  address: string;
  phone: string;
  logoUrl?: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  deptId: number;
  hospitalId: number;
  parentId: number;
  deptName: string;
  deptCode: string;
  status: number;
  children?: Department[];
}

export interface Doctor {
  doctorId: number;
  userId: number;
  hospitalId: number;
  deptId: number;
  hospitalName?: string;
  deptName?: string;
  name: string;
  title: string;
  specialty: string;
  regFee: number;
  avatarUrl?: string;
  status: number;
  introduction?: string;
}

export interface Schedule {
  scheduleId: number;
  doctorId: number;
  hospitalId: number;
  deptId: number;
  /** 后端在部分排班查询接口中拼装返回（医院/科室维度排班） */
  doctorName?: string;
  hospitalName?: string;
  deptName?: string;
  scheduleDate: string;
  amPm: 'AM' | 'PM';
  totalNum: number;
  remainNum: number;
  regFee: number;
  status: number;
}

export interface Registration {
  regId: number;
  orderNo: string;
  /** 支付单号（后端接口层拼装返回，非底层实体字段；未支付或未拼装时为空。用于退款，契约 10.3） */
  payNo?: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  hospitalId?: number;
  hospitalName?: string;
  deptId?: number;
  deptName?: string;
  scheduleId: number;
  scheduleDate: string;
  amPm: 'AM' | 'PM';
  regFee: number;
  regStatus:
    | 'PENDING'
    | 'PAID'
    | 'CANCELLED'
    | 'NOSHOW'
    | 'COMPLETED';
  createTime: string;
}

export interface PayOrder {
  payId?: number;
  payNo: string;
  regId: number;
  amount: number;
  payChannel: string;
  /** 新版后端支付单状态：PENDING / SUCCESS / FAIL 等 */
  payStatus?: string;
  /** 兼容旧契约字段 */
  status?: string;
  transactionId?: string;
  payTime?: string;
}

export interface MedicalRecord {
  recordId: number;
  regId: number;
  patientId: number;
  doctorId: number;
  chiefComplaint: string;
  presentIllness?: string;
  pastHistory?: string;
  physicalExam?: string;
  diagnosis: string;
  treatmentPlan?: string;
  advice?: string;
  createTime: string;
}

export interface Prescription {
  prescriptionId: number;
  recordId: number;
  regId: number;
  patientId: number;
  doctorId: number;
  prescriptionNo: string;
  medicineName: string;
  specification?: string;
  usage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  status: number;
}

export interface Result<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
  list: T[];
}

export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
}

/** 今日排班项（契约 13.1 返回 Map<String,Object>，字段需与后端最终对齐） */
export interface WorkbenchSchedule {
  scheduleId: number;
  scheduleDate: string;
  amPm: 'AM' | 'PM';
  totalNum: number;
  remainNum: number;
  deptName?: string;
  doctorName?: string;
}

/** 叫号返回（契约 13.2） */
export interface CallNextResult {
  regId: number;
  patientId: number;
  patientName: string;
  orderNo: string;
  status: string;
}

/** 保存病历请求（契约 13.4） */
export interface SaveMedicalRecordParams {
  regId: number;
  patientId: number;
  chiefComplaint: string;
  presentIllness?: string;
  pastHistory?: string;
  physicalExam?: string;
  diagnosis: string;
  treatmentPlan?: string;
  advice?: string;
}

/** 处方药品项（契约 13.6 medicines 数组元素） */
export interface PrescriptionMedicineItem {
  medicineName: string;
  specification?: string;
  usage: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

/** 开具处方请求（契约 13.6） */
export interface CreatePrescriptionParams {
  recordId: number;
  regId: number;
  patientId: number;
  medicines: PrescriptionMedicineItem[];
}

/** 过号请求（契约 13.3） */
export interface SkipPatientParams {
  regId: number;
  reason: string;
}

/** WebSocket 通知消息（契约 14，/topic/notification payload） */
export interface WsNotification {
  type: string;
  patientId?: number;
  title: string;
  content: string;
}

/** 就诊人信息（契约 7.1/7.4，后端字段未完全明确，phone 为预留） */
export interface Patient {
  patientId: number;
  realName: string;
  idCard: string;
  gender: number;
  birthDate: string;
  phone?: string;
  /** 与账户持有人的关系（本人/父母/子女/配偶/兄弟姐妹/其他） */
  relationship?: string;
}

/** 候诊信息（契约 7.6） */
export interface WaitingInfo {
  orderNo: string;
  visitTime: string;
  status: string;
  position: number;
}

/** 绑定就诊人请求（契约 7.2） */
export interface BindPatientParams {
  realName: string;
  idCard: string;
  gender: number;
  birthDate: string;
  /** 与账户持有人的关系（本人/父母/子女/配偶/兄弟姐妹/其他） */
  relationship?: string;
}

/** 更新就诊人请求（契约 7.3） */
export interface UpdatePatientParams {
  realName: string;
  gender: number;
  birthDate: string;
}

/** 智能导诊请求（契约 7.5） */
export interface TriageQuestion {
  key: string;
  text: string;
  options: string[];
}

export interface TriageResponse {
  sessionId?: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  suggestion?: string;
  recommendation?: string;
  symptomSummary?: string;
  questions?: TriageQuestion[];
  currentQuestion?: TriageQuestion | null;
  confidence?: string;
  emergencyLevel?: string;
  department?: string;
  careNotes?: string[];
  disclaimer?: string;
  bookingUrl?: string;
  bookingHint?: string;
}

export interface TriageParams {
  symptom?: string;
  sessionId?: string;
  questionKey?: string;
  answer?: string;
}

/** 就诊评价请求（契约 7.7） */
export interface EvaluateParams {
  orderNo: string;
  rating: number;
  comment: string;
}

/** 预约挂号请求（契约 8.1，patientId 由后端从 JWT 推导） */
export interface CreateRegistrationParams {
  scheduleId: number;
}

/** 热门医院/推荐医生查询参数（契约 4.2/6.1） */
export interface RecommendQuery extends PageQuery {
  limit?: number;
}

/** 医生列表查询参数（契约 6.2） */
export interface DoctorListParams extends PageQuery {
  hospitalId: number;
  deptId?: number;
}

/** 批量生成排班请求（契约 9.1） */
export interface GenerateScheduleParams {
  doctorId: number;
  hospitalId: number;
  deptId: number;
  startDate: string;
  endDate: string;
  /** 周几，1-7 */
  weekDays: number[];
  amPmList: ('AM' | 'PM')[];
  totalNum: number;
  regFee: number;
}

/** 停诊请求（契约 9.3） */
export interface StopScheduleParams {
  scheduleId: number;
  reason: string;
}

/** 修改排班请求（平台管理员权限） */
export interface UpdateScheduleParams {
  scheduleId: number;
  scheduleDate?: string;
  amPm?: 'AM' | 'PM';
  totalNum?: number;
  regFee?: number;
  status?: number;
}

/** 支付渠道（payChannel / payMethod 二选一字段，后端均兼容） */
export type PayChannel = 'WECHAT' | 'ALIPAY';

/** 创建支付请求（契约 10.1，结算流程补全后支持支付密码） */
export interface CreatePayParams {
  regId: number;
  payChannel?: PayChannel;
  /** 后端兼容的支付方式字段名 */
  payMethod?: PayChannel;
  /** 支付密码（后端兼容 payPassword / password 两种字段名） */
  payPassword?: string;
  password?: string;
}

/** 医院入驻申请请求（POST /hospital/apply） */
export interface HospitalApplyParams {
  hospitalName: string;
  hospitalCode: string;
  level: string;
  city: string;
  address: string;
  phone: string;
  logoUrl?: string;
}

/** 医院入驻审核状态（GET /hospital/{id}/status）：0=待审核 1=已入驻 2=已驳回 */
export type HospitalApplyStatusValue = 0 | 1 | 2;

/** 支付回调请求（契约 10.2，无鉴权） */
export interface PayCallbackParams {
  payNo: string;
  transactionId: string;
  status: 'SUCCESS' | 'FAIL';
}

/** 退款请求（契约 10.3） */
export interface RefundParams {
  payNo: string;
  reason: string;
}

/** 创建科室请求（契约 11.1） */
export interface CreateDepartmentParams {
  hospitalId: number;
  parentId: number;
  deptName: string;
  deptCode: string;
}

/** 更新科室请求（契约 11.2） */
export interface UpdateDepartmentParams {
  deptId: number;
  deptName: string;
  status: number;
}

/** 创建医生请求（契约 11.3） */
export interface CreateDoctorParams {
  userId: number;
  hospitalId: number;
  deptId: number;
  name: string;
  title: string;
  specialty: string;
  regFee: number;
  avatarUrl?: string;
}

/** 更新医生请求（契约 11.4） */
export interface UpdateDoctorParams {
  doctorId: number;
  title?: string;
  specialty?: string;
  regFee?: number;
  status?: number;
}

/** 管理端订单查询参数（契约 11.5） */
export interface AdminOrderQuery extends PageQuery {
  status?: string;
  startDate?: string;
  endDate?: string;
}

/** 管理端统计查询参数（契约 11.6） */
export interface StatisticsQuery {
  startDate: string;
  endDate: string;
}

/** 医院数据统计（契约 11.6 返回 Map） */
export interface HospitalStatistics {
  totalRegistrations: number;
  totalIncome: number;
  completedCount: number;
  cancelledCount: number;
}

/** 审核医院请求（契约 12.2） */
export interface ApproveHospitalParams {
  hospitalId: number;
  approved: boolean;
  reason: string;
}

/** 黑名单操作请求（契约 12.3/12.4） */
export interface BlacklistParams {
  userId: number;
  reason: string;
}
