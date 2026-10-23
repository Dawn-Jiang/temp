import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, List, Button, message, Typography, Empty, Tag, Space } from 'antd';
import {
  ClockCircleOutlined, UserOutlined, DollarOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleApi } from '@/api/schedule';
import { doctorApi } from '@/api/doctor';
import { registrationApi } from '@/api/registration';
import type { Schedule } from '@/api/schedule';
import type { Doctor } from '@/api/doctor';
import { ScheduleStatus } from '@/config';

const { Title, Text } = Typography;

const Booking: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadSchedules = async (docId: number) => {
    setLoading(true);
    try {
      const data = await scheduleApi.byDoctor(docId, {
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
        pageNum: 1,
        pageSize: 100
      });
      setSchedules(data.list);
    } catch {
      message.error('加载排班数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!doctorId) return;
    const id = Number(doctorId);
    loadSchedules(id);
    // 拉取医生详情，展示所属医院 / 科室上下文
    doctorApi.detail(id)
      .then((data) => setDoctor(data))
      .catch(() => undefined);
    // 页面重新可见/获得焦点时重拉排班：管理员删除/清空或他人抢号后，
    // 长时间停留的页面也能尽快让失效排班消失、号源数对齐
    const reloadOnVisible = () => {
      if (document.visibilityState === 'visible') {
        loadSchedules(id);
      }
    };
    document.addEventListener('visibilitychange', reloadOnVisible);
    window.addEventListener('focus', reloadOnVisible);
    return () => {
      document.removeEventListener('visibilitychange', reloadOnVisible);
      window.removeEventListener('focus', reloadOnVisible);
    };
  }, [doctorId]);

  const handleBooking = async () => {
    if (!selectedSchedule) {
      message.warning('请选择就诊时间');
      return;
    }

    const selected = schedules.find(s => s.scheduleId === selectedSchedule);
    if (!selected) return;

    setSubmitting(true);
    try {
      // 检查同一时间段是否已有挂号
      const existing = await registrationApi.myBookings({ pageNum: 1, pageSize: 100 });
      const conflict = existing.list.find(r =>
        r.scheduleDate === selected.scheduleDate &&
        r.amPm === selected.amPm &&
        (r.regStatus === 'PENDING' || r.regStatus === 'PAID')
      );
      if (conflict) {
        message.warning(`该时间段（${selected.scheduleDate} ${selected.amPm === 'AM' ? '上午' : '下午'}）您已有挂号记录，不可同时挂不同医院的号`);
        return;
      }

      const orderNo = await registrationApi.create({ scheduleId: selectedSchedule });
      message.success(`预约成功，订单号：${orderNo}`);
      navigate('/my-bookings');
    } catch {
      // 业务错误（如“号源已被抢完/排班已删除”）已由响应拦截器弹出后端原文；
      // 此处重新拉取排班，让号源与状态立即与后端对齐，避免患者继续点击失效排班
      if (doctorId) {
        loadSchedules(Number(doctorId));
      }
      setSelectedSchedule(null);
    } finally {
      setSubmitting(false);
    }
  };

  /** 已选中的排班若已变为不可约状态或无号源，禁用提交按钮 */
  const selectedSlot = schedules.find(s => s.scheduleId === selectedSchedule);
  const selectedSlotUnavailable = selectedSlot
    ? selectedSlot.status !== ScheduleStatus.AVAILABLE || selectedSlot.remainNum <= 0
    : false;

  const getStatusTag = (status: number) => {
    if (status === ScheduleStatus.CLEARED) return <Tag>已清空</Tag>;
    if (status === ScheduleStatus.STOPPED) return <Tag color="red">停诊</Tag>;
    if (status === ScheduleStatus.FULL) return <Tag color="orange">已满</Tag>;
    return <Tag color="green">可预约</Tag>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>预约挂号</Title>
        <Text type="secondary">选择合适的就诊时间，完成在线预约</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center">
          <div>
            <Space align="center" style={{ marginBottom: 4 }}>
              <Title level={4} style={{ margin: 0 }}>{doctor?.name || '加载医生信息…'}</Title>
              {doctor?.title ? <Tag color="purple">{doctor.title}</Tag> : null}
            </Space>
            <div style={{ color: '#595959' }}>
              <Text type="secondary">
                {doctor?.hospitalName ? `${doctor.hospitalName} / ${doctor.deptName || '未知科室'}` : '医院 / 科室信息加载中'}
                {doctor?.specialty ? ` · 擅长：${doctor.specialty}` : ''}
              </Text>
            </div>
          </div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => doctor && navigate(`/hospitals/${doctor.hospitalId}/doctors`)}
          >
            返回医生列表
          </Button>
        </Space>
      </Card>

      <Card title="选择就诊时间">
        {schedules.length === 0 && !loading ? (
          <Empty description="暂无可用排班" style={{ padding: '40px 0' }} />
        ) : (
          <List
            loading={loading}
            grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }}
            dataSource={schedules}
            renderItem={(item) => {
              const isSelected = selectedSchedule === item.scheduleId;
              // 非可预约状态（含已清空/停诊/已满）或无剩余号源均不可选择
              const isDisabled =
                item.status !== ScheduleStatus.AVAILABLE || item.remainNum <= 0;
              return (
                <List.Item>
                  <Card
                    hoverable={!isDisabled}
                    onClick={() => !isDisabled && setSelectedSchedule(item.scheduleId)}
                    style={{
                      borderColor: isSelected ? '#1677ff' : undefined,
                      borderWidth: isSelected ? 2 : 1,
                      background: isDisabled ? '#fafafa' : isSelected ? '#e6f4ff' : '#fff',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>
                        {dayjs(item.scheduleDate).format('YYYY-MM-DD')}
                      </span>
                      {getStatusTag(item.status)}
                    </div>
                    <div style={{ color: '#595959', fontSize: 13, lineHeight: 2 }}>
                      <div>
                        <ClockCircleOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                        时段：{item.amPm === 'AM' ? '上午' : '下午'}
                      </div>
                      <div>
                        <UserOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                        剩余号源：<span style={{ color: item.remainNum === 0 ? '#ff4d4f' : '#52c41a', fontWeight: 500 }}>{item.remainNum}/{item.totalNum}</span>
                      </div>
                      <div>
                        <DollarOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                        挂号费：<span style={{ color: '#fa8c16', fontWeight: 500 }}>¥{item.regFee}</span>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            disabled={!selectedSchedule || selectedSlotUnavailable}
            loading={submitting}
            onClick={handleBooking}
            style={{ minWidth: 160 }}
          >
            确认预约
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Booking;
