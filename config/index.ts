export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const UserType = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT'
} as const;

export type UserType = typeof UserType[keyof typeof UserType];

export const UserRoleNames: Record<UserType, string> = {
  [UserType.PLATFORM_ADMIN]: '平台运营官',
  [UserType.HOSPITAL_ADMIN]: '医院管理员',
  [UserType.DOCTOR]: '执业医师',
  [UserType.PATIENT]: '注册患者'
};

export const RegistrationStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  NOSHOW: 'NOSHOW',
  COMPLETED: 'COMPLETED'
} as const;

export const ScheduleStatus = {
  CLEARED: 0,
  AVAILABLE: 1,
  FULL: 2,
  STOPPED: 3
} as const;

/** 医院入驻审核状态：0=待审核 1=已入驻 2=已驳回 */
export const HospitalStatus = {
  PENDING: 0,
  ACTIVE: 1,
  REJECTED: 2
} as const;

/** 支付单状态 */
export const PayStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAIL: 'FAIL'
} as const;
