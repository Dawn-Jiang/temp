import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Button, Statistic, message, Typography } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, SoundOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { workbenchApi } from '@/api/workbench';
import type { WorkbenchSchedule } from '@/types';

const { Title, Text } = Typography;

const Workbench: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<WorkbenchSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTodaySchedule = async () => {
    setLoading(true);
    try {
      const res = await workbenchApi.todaySchedule({ pageNum: 1, pageSize: 50 });
      setSchedules(res.list);
    } catch {
      message.error('加载今日排班失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodaySchedule();
  }, []);

  const totalNum = schedules.reduce((sum, item) => sum + item.totalNum, 0);
  const remainNum = schedules.reduce((sum, item) => sum + item.remainNum, 0);

  const columns = [
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
      render: (amPm: string) => (amPm === 'AM' ? '上午' : '下午')
    },
    {
      title: '科室',
      dataIndex: 'deptName',
      key: 'deptName',
      render: (deptName?: string) => deptName || '-'
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
      render: (remain: number, record: WorkbenchSchedule) => (
        <span style={{ color: remain === 0 ? 'red' : 'green' }}>
          {remain}/{record.totalNum}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: WorkbenchSchedule) => (
        <Button
          type="primary"
          size="small"
          icon={<SoundOutlined />}
          disabled={record.remainNum === 0}
          onClick={() => navigate(`/doctor/calling?scheduleId=${record.scheduleId}`)}
        >
          进入叫号
        </Button>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>医生工作台</Title>
        <Text type="secondary">今日排班概览与叫号入口</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="stat-card">
            <Statistic
              title="今日排班"
              value={schedules.length}
              suffix="个时段"
              prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card">
            <Statistic
              title="总号源"
              value={totalNum}
              prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card">
            <Statistic
              title="剩余号源"
              value={remainNum}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="今日排班"
        extra={
          <Button type="link" onClick={loadTodaySchedule}>
            刷新
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={schedules}
          rowKey="scheduleId"
          loading={loading}
          pagination={false}
          locale={{ emptyText: '今日暂无排班' }}
        />
      </Card>
    </div>
  );
};

export default Workbench;
