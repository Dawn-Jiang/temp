import React, { useEffect, useState } from 'react';
import {
  Table, Button, Card, Row, Col, Select, message, Typography,
  Modal, Tag, Empty
} from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { doctorApi } from '@/api/doctor';
import { departmentApi } from '@/api/department';
import { hospitalApi } from '@/api/hospital';
import { scheduleApi } from '@/api/schedule';
import type { Doctor } from '@/api/doctor';
import type { Department } from '@/api/department';
import type { Schedule } from '@/api/schedule';
import { ScheduleStatus } from '@/config';

const { Option } = Select;
const { Title, Text } = Typography;

const DoctorList: React.FC = () => {
  const navigate = useNavigate();
  const { hospitalId } = useParams<{ hospitalId: string }>();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [hospitalName, setHospitalName] = useState('');
  // 科室可预约排班弹窗
  const [deptScheduleOpen, setDeptScheduleOpen] = useState(false);
  const [deptSchedules, setDeptSchedules] = useState<Schedule[]>([]);
  const [deptScheduleLoading, setDeptScheduleLoading] = useState(false);
  const [deptScheduleError, setDeptScheduleError] = useState(false);

  /** 拉取所选科室未来 30 天可预约排班（新接口 /schedule/hospital/{h}/dept/{d}） */
  const loadDeptSchedules = (deptId: number) => {
    if (!hospitalId) return;
    setDeptScheduleLoading(true);
    setDeptScheduleError(false);
    scheduleApi.byHospitalDept(
      Number(hospitalId),
      deptId,
      {
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
        pageNum: 1,
        pageSize: 100
      }
    )
      .then((data) => setDeptSchedules(data.list))
      .catch(() => {
        setDeptSchedules([]);
        setDeptScheduleError(true);
      })
      .finally(() => setDeptScheduleLoading(false));
  };

  const handleOpenDeptSchedules = () => {
    if (!selectedDept) {
      message.warning('请先选择科室');
      return;
    }
    setDeptScheduleOpen(true);
    loadDeptSchedules(selectedDept);
  };

  /** 排班医生名称：优先用后端拼装字段，回退到本科室医生列表 */
  const resolveDoctorName = (schedule: Schedule): string =>
    schedule.doctorName || doctors.find(d => d.doctorId === schedule.doctorId)?.name || '未知医生';

  const getScheduleStatusTag = (status: number) => {
    if (status === ScheduleStatus.STOPPED) return <Tag color="red">停诊</Tag>;
    if (status === ScheduleStatus.FULL) return <Tag color="orange">已满</Tag>;
    if (status === ScheduleStatus.AVAILABLE) return <Tag color="green">可预约</Tag>;
    return <Tag>不可约</Tag>;
  };

  const loadDoctors = (deptId: number | undefined, page: number, size: number) => {
    if (!hospitalId) return;
    setLoading(true);
    doctorApi.list({
      hospitalId: Number(hospitalId),
      deptId,
      pageNum: page,
      pageSize: size
    })
      .then((data) => {
        setDoctors(data.list);
        setTotal(data.total);
      })
      .catch(() => message.error('加载医生列表失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!hospitalId) return;
    let cancelled = false;
    departmentApi.byHospital(Number(hospitalId), { pageNum: 1, pageSize: 100 })
      .then((res) => {
        if (!cancelled) {
          setDepartments(res.list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('加载科室失败');
        }
      });
    hospitalApi.detail(Number(hospitalId))
      .then((data) => {
        if (!cancelled) {
          setHospitalName(data.hospitalName);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hospitalId]);

  useEffect(() => {
    if (!hospitalId) return;
    let cancelled = false;
    doctorApi.list({ hospitalId: Number(hospitalId), pageNum: 1, pageSize: 10 })
      .then((data) => {
        if (!cancelled) {
          setDoctors(data.list);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('加载医生列表失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hospitalId]);

  const handleDeptChange = (deptId: number | undefined) => {
    setSelectedDept(deptId);
    setPageNum(1);
    loadDoctors(deptId, 1, pageSize);
  };

  const columns = [
    {
      title: '医院 / 科室 / 医生',
      key: 'scope',
      width: 260,
      render: (_: unknown, record: Doctor) => (
        <span>
          <span style={{ color: '#1677ff', fontWeight: 500 }}>{record.hospitalName || '未知医院'}</span>
          <span style={{ color: '#8c8c8c' }}> / {record.deptName || '未知科室'} / </span>
          <span style={{ fontWeight: 500 }}>{record.name}</span>
        </span>
      )
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
      width: 110,
      render: (title: string) => (
        <span style={{ color: '#722ed1' }}>{title}</span>
      )
    },
    {
      title: '擅长',
      dataIndex: 'specialty',
      key: 'specialty',
      ellipsis: true
    },
    {
      title: '挂号费',
      dataIndex: 'regFee',
      key: 'regFee',
      width: 100,
      render: (fee: number) => <span style={{ color: '#fa8c16', fontWeight: 500 }}>¥{fee}</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      render: (_: unknown, record: Doctor) => (
        <Button
          type="primary"
          onClick={() => navigate(`/booking/${record.doctorId}`)}
        >
          预约挂号
        </Button>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>{hospitalName ? `${hospitalName} - 医生列表` : '医生列表'}</Title>
        <Text type="secondary">按科室筛选，选择您需要的医生进行预约</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>选择科室：</Text>
          </Col>
          <Col flex="auto">
            <Select
              style={{ width: 240 }}
              placeholder="全部科室"
              allowClear
              value={selectedDept}
              onChange={handleDeptChange}
            >
              {departments.map(dept => (
                <Option key={dept.deptId} value={dept.deptId}>
                  {dept.deptName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              ghost
              icon={<CalendarOutlined />}
              disabled={!selectedDept}
              onClick={handleOpenDeptSchedules}
            >
              查看本科室可约排班
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={doctors}
          rowKey="doctorId"
          loading={loading}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 位医生`,
            onChange: (page, size) => {
              setPageNum(page);
              setPageSize(size);
              loadDoctors(selectedDept, page, size);
            }
          }}
        />
      </Card>

      {/* 科室可预约排班弹窗：对接 /schedule/hospital/{hospitalId}/dept/{deptId} */}
      <Modal
        title={`${hospitalName || ''} - ${departments.find(d => d.deptId === selectedDept)?.deptName || ''} 可约排班`}
        open={deptScheduleOpen}
        width={820}
        onCancel={() => setDeptScheduleOpen(false)}
        footer={<Button onClick={() => setDeptScheduleOpen(false)}>关闭</Button>}
        destroyOnClose
      >
        {deptScheduleError ? (
          <Empty description="暂无法加载该科室排班，请稍后重试或直接在下方医生列表中选择医生预约">
            <Button type="primary" onClick={() => selectedDept && loadDeptSchedules(selectedDept)}>
              重新加载
            </Button>
          </Empty>
        ) : (
          <Table
            size="small"
            rowKey="scheduleId"
            loading={deptScheduleLoading}
            dataSource={deptSchedules}
            pagination={false}
            scroll={{ y: 420 }}
            locale={{ emptyText: <Empty description="该科室近 30 天暂无可预约排班" /> }}
            columns={[
              {
                title: '医生',
                dataIndex: 'doctorId',
                key: 'doctorId',
                width: 100,
                render: (_: unknown, record: Schedule) => resolveDoctorName(record)
              },
              {
                title: '日期',
                dataIndex: 'scheduleDate',
                key: 'scheduleDate',
                width: 110,
                render: (date: string) => dayjs(date).format('YYYY-MM-DD')
              },
              {
                title: '时段',
                dataIndex: 'amPm',
                key: 'amPm',
                width: 70,
                render: (amPm: string) => amPm === 'AM' ? '上午' : '下午'
              },
              {
                title: '剩余号源',
                dataIndex: 'remainNum',
                key: 'remainNum',
                width: 90,
                render: (remain: number, record: Schedule) => `${remain}/${record.totalNum}`
              },
              {
                title: '挂号费',
                dataIndex: 'regFee',
                key: 'regFee',
                width: 90,
                render: (fee: number) => <span style={{ color: '#fa8c16' }}>¥{fee}</span>
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 80,
                render: (status: number) => getScheduleStatusTag(status)
              },
              {
                title: '操作',
                key: 'action',
                width: 90,
                render: (_: unknown, record: Schedule) => (
                  <Button
                    type="primary"
                    size="small"
                    disabled={record.status !== ScheduleStatus.AVAILABLE || record.remainNum <= 0}
                    onClick={() => {
                      setDeptScheduleOpen(false);
                      navigate(`/booking/${record.doctorId}`);
                    }}
                  >
                    预约
                  </Button>
                )
              }
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default DoctorList;
