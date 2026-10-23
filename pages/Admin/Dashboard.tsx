import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Typography, Spin, message } from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { adminApi } from '@/api/admin';
import { RegistrationStatus } from '@/config';
import type { HospitalStatistics, Registration } from '@/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<HospitalStatistics>({
    totalRegistrations: 0,
    totalIncome: 0,
    completedCount: 0,
    cancelledCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<Registration[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminApi.statistics({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      }),
      adminApi.orders({ pageNum: 1, pageSize: 5 })
    ])
      .then(([statistics, orders]) => {
        if (!cancelled) {
          setStats(statistics);
          setRecentOrders(orders.list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('加载数据失败');
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
  }, [dateRange]);

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (no: string) => <span style={{ fontFamily: 'monospace', color: '#1677ff' }}>{no}</span>
    },
    {
      title: '患者姓名',
      dataIndex: 'patientName',
      key: 'patientName'
    },
    {
      title: '医生',
      dataIndex: 'doctorName',
      key: 'doctorName'
    },
    {
      title: '就诊日期',
      dataIndex: 'scheduleDate',
      key: 'scheduleDate'
    },
    {
      title: '挂号费',
      dataIndex: 'regFee',
      key: 'regFee',
      render: (fee: number) => <span style={{ color: '#fa8c16' }}>¥{fee}</span>
    },
    {
      title: '状态',
      dataIndex: 'regStatus',
      key: 'regStatus',
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          [RegistrationStatus.PENDING]: { text: '待支付', color: '#fa8c16' },
          [RegistrationStatus.PAID]: { text: '已支付', color: '#1677ff' },
          [RegistrationStatus.COMPLETED]: { text: '已完成', color: '#52c41a' },
          [RegistrationStatus.CANCELLED]: { text: '已取消', color: '#8c8c8c' }
        };
        const config = statusMap[status] || { text: status, color: '#8c8c8c' };
        return <span style={{ color: config.color, fontWeight: 500 }}>{config.text}</span>;
      }
    }
  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>数据看板</Title>
          <Text type="secondary">医院运营数据概览与近期订单动态</Text>
        </div>
        <RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
        />
      </div>

      {/* 核心指标 - 4 列等分 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="挂号总数"
              value={stats.totalRegistrations}
              prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="总收入"
              value={stats.totalIncome}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="已完成"
              value={stats.completedCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="已取消"
              value={stats.cancelledCount}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 完成率 - 占 1/3 宽度 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card">
            <Statistic
              title="完成率"
              value={stats.totalRegistrations > 0
                ? (stats.completedCount / stats.totalRegistrations * 100).toFixed(1)
                : '0.0'}
              prefix={<PercentageOutlined style={{ color: '#722ed1' }} />}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近订单 - 占满宽度 */}
      <Card title="最近挂号订单">
        <Table
          columns={columns}
          dataSource={recentOrders}
          rowKey="regId"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
