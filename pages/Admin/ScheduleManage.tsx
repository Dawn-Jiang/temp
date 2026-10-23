import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, DatePicker, InputNumber,
  Select, message, Space, Tag, Card, Typography
} from 'antd';

const { Title, Text } = Typography;
import { PlusOutlined, ClearOutlined } from '@ant-design/icons';
import { scheduleApi } from '@/api/schedule';
import { adminApi } from '@/api/admin';
import { doctorApi } from '@/api/doctor';
import { hospitalApi } from '@/api/hospital';
import { departmentApi } from '@/api/department';
import type { Schedule } from '@/api/schedule';
import type { Doctor } from '@/api/doctor';
import type { Hospital } from '@/api/hospital';
import { ScheduleStatus, UserType } from '@/config';
import { useUserStore } from '@/store/userStore';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Option } = Select;

const WEEK_DAY_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
];

interface GenerateScheduleForm {
  doctorId: number;
  dateRange: [Dayjs, Dayjs];
  weekDays: number[];
  amPmList: ('AM' | 'PM')[];
  totalNum: number;
  regFee: number;
}

const ScheduleManage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number>();
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [defaultsModalVisible, setDefaultsModalVisible] = useState(false);
  const [defaultsDoctorId, setDefaultsDoctorId] = useState<number>();
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [doctorDefaults, setDoctorDefaults] = useState<Record<number, { totalNum: number; regFee: number }>>(() => {
    try {
      const stored = localStorage.getItem('schedule_defaults');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });
  const [deptMap, setDeptMap] = useState<Record<number, string>>({});
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [defaultsForm] = Form.useForm();
  const [clearForm] = Form.useForm();
  const userType = useUserStore((s) => s.userType);
  const isPlatformAdmin = userType === UserType.PLATFORM_ADMIN;

  useEffect(() => {
    let cancelled = false;
    hospitalApi.list({ pageNum: 1, pageSize: 100 })
      .then((res) => {
        if (!cancelled) {
          setHospitals(res.list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('加载医院列表失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSchedules = async (doctorId: number, page: number, size: number) => {
    setLoading(true);
    try {
      const startDate = dayjs().format('YYYY-MM-DD');
      const endDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
      const data = await scheduleApi.byDoctor(doctorId, {
        startDate,
        endDate,
        pageNum: page,
        pageSize: size
      });
      setSchedules(data.list);
      setTotal(data.total);
    } catch {
      message.error('加载排班数据失败');
    } finally {
      setLoading(false);
    }
  };

  /** 按当前筛选视图刷新：选中具体医生刷该医生，否则刷全院聚合视图 */
  const refreshCurrentView = () => {
    if (selectedDoctorId && selectedDoctorId > 0) {
      loadSchedules(selectedDoctorId, pageNum, pageSize);
    } else if (selectedHospitalId) {
      handleHospitalChange(selectedHospitalId);
    }
  };

  /**
   * 写操作后复查指定医生的排班（今天起 30 天窗口，大分页覆盖弹窗可选范围）。
   * 用于校验“接口返回成功但数据未真正删除”的后端异常（如写库未提交）。
   * 查询失败时返回 null，调用方降级为普通成功提示。
   */
  const fetchSchedulesForVerify = async (
    doctorId: number,
    startDate: string,
    endDate: string
  ): Promise<Schedule[] | null> => {
    try {
      const res = await scheduleApi.byDoctor(doctorId, {
        startDate,
        endDate,
        pageNum: 1,
        pageSize: 200
      });
      return res.list;
    } catch {
      return null;
    }
  };

  const handleHospitalChange = async (hospitalId: number) => {
    setSelectedHospitalId(hospitalId);
    setSelectedDoctorId(undefined);
    setSchedules([]);
    setTotal(0);
    try {
      const data = await doctorApi.list({ hospitalId, pageNum: 1, pageSize: 100 });
      setDoctors(data.list);
      // Load schedules for all doctors in this hospital
      if (data.list.length > 0) {
        const startDate = dayjs().format('YYYY-MM-DD');
        const endDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
        const allSchedules = await Promise.all(
          data.list.map(doc => scheduleApi.byDoctor(doc.doctorId, { startDate, endDate, pageNum: 1, pageSize: 100 }))
        );
        const combined = allSchedules.flatMap(res => res.list);
        setSchedules(combined);
        setTotal(combined.length);
      }
    } catch {
      message.error('加载医生列表失败');
    }
    // Also load departments for display
    try {
      const deptRes = await departmentApi.byHospital(hospitalId, { pageNum: 1, pageSize: 100 });
      const map: Record<number, string> = {};
      deptRes.list.forEach(d => { map[d.deptId] = d.deptName; });
      setDeptMap(map);
    } catch { /* ignore */ }
  };

  const handleDoctorChange = (doctorId: number) => {
    setSelectedDoctorId(doctorId);
    setPageNum(1);
    if (doctorId === 0) {
      // Reload all schedules for the hospital
      if (selectedHospitalId) {
        handleHospitalChange(selectedHospitalId);
      }
    } else {
      loadSchedules(doctorId, 1, pageSize);
    }
  };

  const handleGenerate = async (values: GenerateScheduleForm) => {
    const doctor = doctors.find((d) => d.doctorId === values.doctorId);
    if (!doctor) {
      message.error('请先选择医院和医生');
      return;
    }
    try {
      await scheduleApi.generate({
        doctorId: values.doctorId,
        hospitalId: doctor.hospitalId,
        deptId: doctor.deptId,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        weekDays: values.weekDays,
        amPmList: values.amPmList,
        totalNum: values.totalNum,
        regFee: values.regFee
      });
      message.success('排班生成成功');
      setModalVisible(false);
      form.resetFields();
      // 后端生成后会清理缓存，前端按当前视图重新拉取
      refreshCurrentView();
    } catch {
      message.error('生成排班失败');
    }
  };

  /** 选择医生时自动填入该医生的默认号源与挂号费 */
  const handleGenerateDoctorChange = (doctorId: number) => {
    const defaults = doctorDefaults[doctorId];
    const doctor = doctors.find(d => d.doctorId === doctorId);
    if (defaults) {
      form.setFieldsValue({ totalNum: defaults.totalNum, regFee: defaults.regFee });
    } else if (doctor) {
      form.setFieldsValue({ regFee: doctor.regFee });
    }
  };

  /** 打开默认配置弹窗 */
  const handleOpenDefaults = () => {
    setDefaultsModalVisible(true);
    defaultsForm.resetFields();
    setDefaultsDoctorId(undefined);
  };

  /** 在默认配置弹窗中选择医生后预填已有默认值 */
  const handleDefaultsDoctorChange = (doctorId: number) => {
    setDefaultsDoctorId(doctorId);
    const defaults = doctorDefaults[doctorId];
    const doctor = doctors.find(d => d.doctorId === doctorId);
    defaultsForm.setFieldsValue({
      totalNum: defaults?.totalNum,
      regFee: defaults?.regFee ?? doctor?.regFee
    });
  };

  /** 保存医生默认排班配置 */
  const handleDefaultsSubmit = (values: { totalNum: number; regFee: number }) => {
    if (!defaultsDoctorId) return;
    const updated = { ...doctorDefaults, [defaultsDoctorId]: { totalNum: values.totalNum, regFee: values.regFee } };
    setDoctorDefaults(updated);
    try {
      localStorage.setItem('schedule_defaults', JSON.stringify(updated));
    } catch { /* ignore */ }
    message.success('默认配置已保存，生成排班时将自动填入');
    setDefaultsModalVisible(false);
  };

  /** 一键清空排班 */
  const handleClearSubmit = async (values: {
    doctorId: number;
    dateRange: [Dayjs, Dayjs];
  }) => {
    const startDate = values.dateRange[0].format('YYYY-MM-DD');
    const endDate = values.dateRange[1].format('YYYY-MM-DD');
    setClearing(true);
    try {
      if (isPlatformAdmin) {
        await adminApi.clearSchedule(values.doctorId, startDate, endDate);
      } else {
        await scheduleApi.clearByDoctor(values.doctorId, startDate, endDate);
      }
      setClearModalVisible(false);
      clearForm.resetFields();
      // 复查后端是否真正删除（曾出现接口返回成功但写库未生效、记录仍在的情况）
      const latest = await fetchSchedulesForVerify(values.doctorId, startDate, endDate);
      const survivors = latest
        ? latest.filter(s => s.scheduleDate >= startDate && s.scheduleDate <= endDate).length
        : 0;
      if (latest === null) {
        message.success(`已提交清空 ${startDate} 至 ${endDate} 排班的请求`);
      } else if (survivors > 0) {
        message.warning(`仍有 ${survivors} 条排班未被删除：后端可能未生效，请稍后重试或联系管理员检查服务`);
      } else {
        message.success(`已清空 ${startDate} 至 ${endDate} 的排班`);
      }
      // 无论复查结果如何都按当前视图重拉，保证 UI 与最新查询结果一致
      refreshCurrentView();
    } catch {
      message.error('清空排班失败');
    } finally {
      setClearing(false);
    }
  };

  const handleStopClinic = (scheduleId: number) => {
    Modal.confirm({
      title: '确认停诊',
      content: '确定要停止该排班吗？已预约的患者将收到通知。',
      onOk: async () => {
        try {
          await scheduleApi.stop({ scheduleId, reason: '管理员停诊' });
          message.success('停诊成功');
          refreshCurrentView();
        } catch {
          message.error('停诊失败');
        }
      }
    });
  };

  const handleEdit = (record: Schedule) => {
    setEditingSchedule(record);
    editForm.setFieldsValue({
      scheduleDate: dayjs(record.scheduleDate),
      amPm: record.amPm,
      totalNum: record.totalNum,
      regFee: record.regFee,
      status: record.status
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values: {
    scheduleDate: Dayjs;
    amPm: 'AM' | 'PM';
    totalNum: number;
    regFee: number;
    status: number;
  }) => {
    if (!editingSchedule) return;
    try {
      await scheduleApi.update({
        scheduleId: editingSchedule.scheduleId,
        scheduleDate: values.scheduleDate.format('YYYY-MM-DD'),
        amPm: values.amPm,
        totalNum: values.totalNum,
        regFee: values.regFee,
        status: values.status
      });
      message.success('排班修改成功');
      setEditModalVisible(false);
      setEditingSchedule(null);
      refreshCurrentView();
    } catch {
      message.error('修改排班失败');
    }
  };

  const handleDelete = (schedule: Schedule) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${schedule.scheduleDate} ${schedule.amPm === 'AM' ? '上午' : '下午'} 的排班吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await scheduleApi.remove(schedule.scheduleId);
          // 复查该排班是否真的从查询结果消失，接口“假成功”时明确告警
          const latest = await fetchSchedulesForVerify(
            schedule.doctorId,
            schedule.scheduleDate,
            schedule.scheduleDate
          );
          if (latest === null) {
            message.success('已提交删除排班请求');
          } else if (latest.some(s => s.scheduleId === schedule.scheduleId)) {
            message.warning('排班仍存在：后端可能未真正删除，请稍后重试或联系管理员检查服务');
          } else {
            message.success('排班删除成功');
          }
          // 后端物理删除后不再返回该排班，按当前视图重新拉取
          refreshCurrentView();
        } catch {
          message.error('删除排班失败');
        }
      }
    });
  };

  const getStatusTag = (status: number) => {
    const statusMap: Record<number, { color: string; text: string }> = {
      [ScheduleStatus.CLEARED]: { color: 'default', text: '已清空' },
      [ScheduleStatus.AVAILABLE]: { color: 'green', text: '可预约' },
      [ScheduleStatus.FULL]: { color: 'orange', text: '已满' },
      [ScheduleStatus.STOPPED]: { color: 'red', text: '停诊' }
    };
    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '医生',
      dataIndex: 'doctorId',
      key: 'doctorId',
      render: (doctorId: number) => {
        const doctor = doctors.find(d => d.doctorId === doctorId);
        return doctor?.name || '-';
      }
    },
    {
      title: '科室',
      dataIndex: 'deptId',
      key: 'deptId',
      render: (deptId: number) => deptMap[deptId] || '-'
    },
    {
      title: '日期',
      dataIndex: 'scheduleDate',
      key: 'scheduleDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '时段',
      dataIndex: 'amPm',
      key: 'amPm',
      render: (amPm: string) => amPm === 'AM' ? '上午' : '下午'
    },
    {
      title: '总号源',
      dataIndex: 'totalNum',
      key: 'totalNum'
    },
    {
      title: '剩余号源',
      dataIndex: 'remainNum',
      key: 'remainNum',
      render: (remain: number, record: Schedule) => (
        <span style={{ color: remain === 0 ? 'red' : 'green' }}>
          {remain}/{record.totalNum}
        </span>
      )
    },
    {
      title: '挂号费',
      dataIndex: 'regFee',
      key: 'regFee',
      render: (fee: number) => `¥${fee}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Schedule) => (
        <Space>
          {record.status === ScheduleStatus.AVAILABLE && (
            <Button
              type="link"
              danger
              onClick={() => handleStopClinic(record.scheduleId)}
            >
              停诊
            </Button>
          )}
          {isPlatformAdmin && (
            <>
              <Button
                type="link"
                onClick={() => handleEdit(record)}
              >
                修改
              </Button>
              <Button
                type="link"
                danger
                onClick={() => handleDelete(record)}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>排班管理</Title>
          <Text type="secondary">为医生生成排班，管理号源与停诊</Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            生成排班
          </Button>
          {isPlatformAdmin && (
            <Button onClick={handleOpenDefaults}>医生默认配置</Button>
          )}
          <Button
            danger
            icon={<ClearOutlined />}
            disabled={!selectedHospitalId}
            onClick={() => setClearModalVisible(true)}
          >
            一键清空排班
          </Button>
        </Space>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            style={{ width: 240 }}
            placeholder="选择医院"
            value={selectedHospitalId}
            onChange={handleHospitalChange}
          >
            {hospitals.map(hospital => (
              <Option key={hospital.hospitalId} value={hospital.hospitalId}>
                {hospital.hospitalName}
              </Option>
            ))}
          </Select>
          <Select
            style={{ width: 200 }}
            placeholder="选择医生"
            value={selectedDoctorId}
            onChange={handleDoctorChange}
            disabled={!selectedHospitalId}
          >
            <Option value={0}>全部医生</Option>
            {doctors.map(doctor => (
              <Option key={doctor.doctorId} value={doctor.doctorId}>
                {doctor.name} - {doctor.title}
              </Option>
            ))}
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={schedules}
          rowKey="scheduleId"
          loading={loading}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条排班`,
            onChange: (page, size) => {
              setPageNum(page);
              setPageSize(size);
              if (selectedDoctorId) {
                loadSchedules(selectedDoctorId, page, size);
              }
            }
          }}
        />
      </Card>

      <Modal
        title="生成排班"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
        >
          <Form.Item
            name="doctorId"
            label="选择医生"
            rules={[{ required: true, message: '请选择医生' }]}
          >
            <Select
              placeholder="请先选择医院后选择医生"
              onChange={handleGenerateDoctorChange}
            >
              {doctors.map(doctor => (
                <Option key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.name} - {doctor.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="weekDays"
            label="每周排班日"
            rules={[{ required: true, message: '请选择每周排班日' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择每周排班日"
              options={WEEK_DAY_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            name="amPmList"
            label="时段（可多选）"
            rules={[{ required: true, message: '请选择时段' }]}
          >
            <Select mode="multiple" placeholder="请选择时段">
              <Option value="AM">上午</Option>
              <Option value="PM">下午</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="totalNum"
            label="每时段号源数量"
            rules={[{ required: true, message: '请输入号源数量' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="regFee"
            label="挂号费"
            rules={[{ required: true, message: '请输入挂号费' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改排班弹窗（仅平台管理员可见） */}
      <Modal
        title="修改排班"
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); setEditingSchedule(null); }}
        onOk={() => editForm.submit()}
        okText="保存修改"
        cancelText="取消"
        width={500}
        destroyOnClose
      >
        {editingSchedule && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 8 }}>
            <p style={{ margin: '4px 0' }}>排班ID：{editingSchedule.scheduleId}</p>
            <p style={{ margin: '4px 0' }}>医生：{doctors.find(d => d.doctorId === editingSchedule.doctorId)?.name || '-'}</p>
            <p style={{ margin: '4px 0' }}>科室：{deptMap[editingSchedule.deptId] || '-'}</p>
          </div>
        )}
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            name="scheduleDate"
            label="就诊日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="amPm"
            label="时段"
            rules={[{ required: true, message: '请选择时段' }]}
          >
            <Select>
              <Option value="AM">上午</Option>
              <Option value="PM">下午</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="totalNum"
            label="总号源"
            rules={[{ required: true, message: '请输入总号源' }]}
          >
            <InputNumber min={1} max={200} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="regFee"
            label="挂号费"
            rules={[{ required: true, message: '请输入挂号费' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value={ScheduleStatus.CLEARED}>已清空</Option>
              <Option value={ScheduleStatus.AVAILABLE}>可预约</Option>
              <Option value={ScheduleStatus.FULL}>已满</Option>
              <Option value={ScheduleStatus.STOPPED}>停诊</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 医生默认配置弹窗（仅平台管理员） */}
      <Modal
        title="医生默认排班配置"
        open={defaultsModalVisible}
        onCancel={() => setDefaultsModalVisible(false)}
        onOk={() => defaultsForm.submit()}
        okText="保存配置"
        cancelText="取消"
        width={480}
        destroyOnClose
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          为每位医生设定默认号源数量与挂号费，生成排班时将自动填入对应字段。
        </Text>
        <Form form={defaultsForm} layout="vertical" onFinish={handleDefaultsSubmit}>
          <Form.Item
            name="doctorId"
            label="选择医生"
            rules={[{ required: true, message: '请选择医生' }]}
          >
            <Select
              placeholder="请选择医生"
              onChange={handleDefaultsDoctorChange}
              disabled={!selectedHospitalId}
            >
              {doctors.map(doctor => (
                <Option key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.name} - {doctor.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="totalNum"
            label="默认号源数量"
            rules={[{ required: true, message: '请输入号源数量' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="每时段默认号源数" />
          </Form.Item>
          <Form.Item
            name="regFee"
            label="默认挂号费"
            rules={[{ required: true, message: '请输入挂号费' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" placeholder="默认挂号费" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 一键清空排班弹窗 */}
      <Modal
        title="一键清空排班"
        open={clearModalVisible}
        onCancel={() => { setClearModalVisible(false); clearForm.resetFields(); }}
        onOk={() => clearForm.submit()}
        okText="确认清空"
        okType="danger"
        cancelText="取消"
        confirmLoading={clearing}
        width={500}
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', borderRadius: 8, border: '1px solid #ffccc7' }}>
          <Text type="danger" strong style={{ display: 'block', marginBottom: 4 }}>
            ⚠️ 危险操作
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            该操作将彻底删除指定医生在选定日期范围内的所有排班，医生端、患者端与管理端均不再显示这些排班数据。此操作不可撤销。
          </Text>
        </div>
        <Form
          form={clearForm}
          layout="vertical"
          onFinish={handleClearSubmit}
        >
          <Form.Item
            name="doctorId"
            label="选择医生"
            rules={[{ required: true, message: '请选择医生' }]}
          >
            <Select placeholder="请选择要清空排班的医生">
              {doctors.map(doctor => (
                <Option key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.name} - {doctor.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="清空日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleManage;
