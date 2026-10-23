/**
 * 实体 Mock 数据（与契约第 15 节实体结构一一对应）
 * 用途：本地开发调试、组件测试与页面演示；类型均来自 @/types
 */
import type {
  User,
  Hospital,
  Department,
  Doctor,
  Patient,
  Schedule,
  Registration,
  PayOrder,
  MedicalRecord,
  Prescription,
  HospitalStatistics,
  WorkbenchSchedule,
  CallNextResult,
  WaitingInfo,
  WsNotification
} from '@/types';

/** 用户（契约 15.2，四种角色各一条） */
export const mockUsers: User[] = [
  { userId: 1, username: 'platform_admin', userType: 'PLATFORM_ADMIN', realName: '平台管理员', phone: '13800000001' },
  { userId: 2, username: 'hospital_admin', userType: 'HOSPITAL_ADMIN', realName: '王院管', phone: '13800000002' },
  { userId: 3, username: 'doctor_li', userType: 'DOCTOR', realName: '李医生', phone: '13800000003' },
  { userId: 4, username: 'patient_zhang', userType: 'PATIENT', realName: '张三', phone: '13800000004' }
];

/** 医院（契约 15.3，覆盖三种状态：0=待审核 1=已通过 2=已驳回） */
export const mockHospitals: Hospital[] = [
  {
    hospitalId: 1,
    hospitalName: '北京市第一人民医院',
    hospitalCode: 'BJ001',
    level: '三甲',
    city: '北京',
    address: '北京市东城区长安街 1 号',
    phone: '010-12345678',
    status: 1,
    createdAt: '2026-01-10 09:00:00',
    updatedAt: '2026-01-11 10:00:00'
  },
  {
    hospitalId: 2,
    hospitalName: '上海仁济医院',
    hospitalCode: 'SH002',
    level: '三甲',
    city: '上海',
    address: '上海市黄浦区山东中路 145 号',
    phone: '021-87654321',
    status: 0,
    createdAt: '2026-09-01 14:30:00'
  },
  {
    hospitalId: 3,
    hospitalName: '广州市中心医院',
    hospitalCode: 'GZ003',
    level: '二甲',
    city: '广州',
    address: '广州市越秀区中山二路 66 号',
    phone: '020-66668888',
    status: 2,
    createdAt: '2026-08-20 11:00:00',
    updatedAt: '2026-08-25 16:20:00'
  }
];

/** 科室（契约 15.4，含一级科室与子科室树形演示） */
export const mockDepartments: Department[] = [
  { deptId: 1, hospitalId: 1, parentId: 0, deptName: '内科', deptCode: 'NK', status: 1 },
  { deptId: 2, hospitalId: 1, parentId: 1, deptName: '神经内科', deptCode: 'NK-SJ', status: 1 },
  { deptId: 3, hospitalId: 1, parentId: 0, deptName: '外科', deptCode: 'WK', status: 1 }
];

// 一级科室的树形结构（引用上方数据）
mockDepartments[0].children = [mockDepartments[1]];

/** 医生（契约 15.5） */
export const mockDoctors: Doctor[] = [
  {
    doctorId: 1,
    userId: 3,
    hospitalId: 1,
    deptId: 2,
    name: '李建国',
    title: '主任医师',
    specialty: '脑血管疾病、头痛诊治',
    regFee: 50,
    avatarUrl: 'https://example.com/avatar/doctor1.png',
    status: 1,
    introduction: '从事神经内科临床工作 20 年。'
  },
  {
    doctorId: 2,
    userId: 5,
    hospitalId: 1,
    deptId: 1,
    name: '赵敏',
    title: '副主任医师',
    specialty: '高血压、糖尿病综合管理',
    regFee: 35,
    status: 1
  }
];

/** 就诊人（契约 15.6） */
export const mockPatients: Patient[] = [
  { patientId: 1, realName: '张三', idCard: '110101199001011234', gender: 1, birthDate: '1990-01-01', phone: '13800000004', relationship: '本人' },
  { patientId: 2, realName: '李四', idCard: '110101199505054321', gender: 2, birthDate: '1995-05-05', relationship: '父母' }
];

/** 排班（契约 15.8，覆盖三种状态：1=可预约 2=已满 3=停诊） */
export const mockSchedules: Schedule[] = [
  {
    scheduleId: 1,
    doctorId: 1,
    hospitalId: 1,
    deptId: 2,
    scheduleDate: '2026-09-17',
    amPm: 'AM',
    totalNum: 20,
    remainNum: 8,
    regFee: 50,
    status: 1
  },
  {
    scheduleId: 2,
    doctorId: 1,
    hospitalId: 1,
    deptId: 2,
    scheduleDate: '2026-09-17',
    amPm: 'PM',
    totalNum: 20,
    remainNum: 0,
    regFee: 50,
    status: 2
  },
  {
    scheduleId: 3,
    doctorId: 2,
    hospitalId: 1,
    deptId: 1,
    scheduleDate: '2026-09-18',
    amPm: 'AM',
    totalNum: 15,
    remainNum: 15,
    regFee: 35,
    status: 3
  }
];

/** 挂号单（契约 15.7，覆盖全部 5 种状态；每条均含 payNo，模拟 11.5 订单列表接口层拼装后的返回） */
export const mockRegistrations: Registration[] = [
  {
    regId: 1,
    orderNo: 'REG20260916100001',
    payNo: 'PAY20260916100001',
    patientId: 1,
    patientName: '张三',
    doctorId: 1,
    doctorName: '李建国',
    hospitalId: 1,
    hospitalName: '北京市第一人民医院',
    deptId: 2,
    deptName: '神经内科',
    scheduleId: 1,
    scheduleDate: '2026-09-17',
    amPm: 'AM',
    regFee: 50,
    regStatus: 'PAID',
    createTime: '2026-09-16 09:30:00'
  },
  {
    regId: 2,
    orderNo: 'REG20260916100002',
    payNo: 'PAY20260916100002', // 已创建支付单（待支付，见 mockPayOrders[1]）
    patientId: 2,
    patientName: '李四',
    doctorId: 2,
    doctorName: '赵敏',
    hospitalId: 1,
    hospitalName: '北京市第一人民医院',
    deptId: 1,
    deptName: '内科',
    scheduleId: 2,
    scheduleDate: '2026-09-17',
    amPm: 'PM',
    regFee: 35,
    regStatus: 'PENDING',
    createTime: '2026-09-16 10:15:00'
  },
  {
    regId: 3,
    orderNo: 'REG20260915100003',
    payNo: 'PAY20260915100003',
    patientId: 1,
    patientName: '张三',
    doctorId: 1,
    doctorName: '李建国',
    hospitalId: 1,
    hospitalName: '北京市第一人民医院',
    deptId: 2,
    deptName: '神经内科',
    scheduleId: 3,
    scheduleDate: '2026-09-15',
    amPm: 'AM',
    regFee: 50,
    regStatus: 'COMPLETED',
    createTime: '2026-09-14 15:40:00'
  },
  {
    regId: 4,
    orderNo: 'REG20260916100004',
    payNo: 'PAY20260916100004', // 取消前已创建支付单
    patientId: 2,
    patientName: '李四',
    doctorId: 2,
    doctorName: '赵敏',
    hospitalId: 1,
    hospitalName: '北京市第一人民医院',
    deptId: 1,
    deptName: '内科',
    scheduleId: 1,
    scheduleDate: '2026-09-17',
    amPm: 'AM',
    regFee: 35,
    regStatus: 'CANCELLED',
    createTime: '2026-09-16 11:00:00'
  },
  {
    regId: 5,
    orderNo: 'REG20260914100005',
    payNo: 'PAY20260914100005',
    patientId: 1,
    patientName: '张三',
    doctorId: 1,
    doctorName: '李建国',
    hospitalId: 1,
    hospitalName: '北京市第一人民医院',
    deptId: 2,
    deptName: '神经内科',
    scheduleId: 2,
    scheduleDate: '2026-09-14',
    amPm: 'PM',
    regFee: 50,
    regStatus: 'NOSHOW',
    createTime: '2026-09-13 16:20:00'
  }
];

/** 支付单（契约 15.9，覆盖待支付与支付成功） */
export const mockPayOrders: PayOrder[] = [
  {
    payNo: 'PAY20260916100001',
    regId: 1,
    amount: 50,
    payChannel: 'WECHAT',
    status: 'SUCCESS',
    transactionId: 'TX20260916100001',
    payTime: '2026-09-16 09:31:00'
  },
  {
    payNo: 'PAY20260916100002',
    regId: 2,
    amount: 35,
    payChannel: 'ALIPAY',
    status: 'PENDING'
  }
];

/** 病历（契约 15.10） */
export const mockMedicalRecords: MedicalRecord[] = [
  {
    recordId: 1,
    regId: 3,
    patientId: 1,
    doctorId: 1,
    chiefComplaint: '反复头痛 3 天，加重 1 天',
    presentIllness: '患者 3 天前无明显诱因出现头痛，以额颞部为主。',
    pastHistory: '高血压病史 5 年，规律服药。',
    physicalExam: '血压 145/90mmHg，神清，神经系统查体未见明显异常。',
    diagnosis: '偏头痛；高血压 2 级',
    treatmentPlan: '口服布洛芬缓释胶囊止痛，继续降压治疗。',
    advice: '注意休息，避免劳累；一周后复诊。',
    createTime: '2026-09-15 10:20:00'
  }
];

/** 处方（契约 15.10，同一处方号的药品明细两条） */
export const mockPrescriptions: Prescription[] = [
  {
    prescriptionId: 1,
    recordId: 1,
    regId: 3,
    patientId: 1,
    doctorId: 1,
    prescriptionNo: 'RX20260915001',
    medicineName: '布洛芬缓释胶囊',
    specification: '0.3g*20粒',
    usage: '每日 2 次，每次 1 粒',
    quantity: 1,
    unitPrice: 25.5,
    totalPrice: 25.5,
    notes: '饭后服用',
    status: 1
  },
  {
    prescriptionId: 2,
    recordId: 1,
    regId: 3,
    patientId: 1,
    doctorId: 1,
    prescriptionNo: 'RX20260915001',
    medicineName: '苯磺酸氨氯地平片',
    specification: '5mg*14片',
    usage: '每日 1 次，每次 1 片',
    quantity: 2,
    unitPrice: 18.0,
    totalPrice: 36.0,
    status: 1
  }
];

/** 医院数据统计（契约 11.6） */
export const mockHospitalStatistics: HospitalStatistics = {
  totalRegistrations: 120,
  totalIncome: 3500.0,
  completedCount: 95,
  cancelledCount: 10
};

/** 医生今日排班（契约 13.1，返回 Map 字段松散） */
export const mockWorkbenchSchedules: WorkbenchSchedule[] = [
  {
    scheduleId: 1,
    scheduleDate: '2026-09-17',
    amPm: 'AM',
    totalNum: 20,
    remainNum: 8,
    deptName: '神经内科',
    doctorName: '李建国'
  },
  {
    scheduleId: 2,
    scheduleDate: '2026-09-17',
    amPm: 'PM',
    totalNum: 20,
    remainNum: 0,
    deptName: '神经内科',
    doctorName: '李建国'
  }
];

/** 叫号结果（契约 13.2） */
export const mockCallNextResult: CallNextResult = {
  regId: 1,
  patientId: 1,
  patientName: '张三',
  orderNo: 'REG20260916100001',
  status: 'CALLED'
};

/** 候诊信息（契约 7.6） */
export const mockWaitingInfo: WaitingInfo = {
  orderNo: 'REG20260916100001',
  visitTime: '2026-09-17 09:30:00',
  status: 'PAID',
  position: 3
};

/** WebSocket 通知（契约 14） */
export const mockWsNotification: WsNotification = {
  type: 'WECHAT',
  patientId: 1,
  title: '预约成功通知',
  content: '您已成功预约 2026-09-17 上午李建国主任医师的号源，请按时就诊。'
};
