import React, { useState } from 'react';
import {
  Card, Input, Button, Descriptions, Tag, Typography,
  message, Form, Rate, Space
} from 'antd';
import { SearchOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { patientApi } from '@/api/patient';
import type { WaitingInfo } from '@/api/patient';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'orange', text: '待支付' },
  PAID: { color: 'blue', text: '待就诊' },
  COMPLETED: { color: 'green', text: '已完成' },
  CANCELLED: { color: 'default', text: '已取消' }
};

const getStatusTag = (status: string) => {
  const config = STATUS_MAP[status] || { color: 'default', text: status };
  return <Tag color={config.color}>{config.text}</Tag>;
};

/** 就诊服务（契约 7.6 候诊查询 + 7.7 就诊评价） */
const VisitService: React.FC = () => {
  const [orderNo, setOrderNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingInfo, setWaitingInfo] = useState<WaitingInfo | null>(null);
  const [evaluated, setEvaluated] = useState(false);
  const [evalForm] = Form.useForm();

  const handleQuery = () => {
    if (!orderNo.trim()) {
      message.warning('请输入挂号订单号');
      return;
    }
    setLoading(true);
    setWaitingInfo(null);
    setEvaluated(false);
    patientApi.waitingInfo(orderNo.trim())
      .then((data) => {
        setWaitingInfo(data);
      })
      .catch(() => message.error('候诊查询失败，请检查订单号'))
      .finally(() => setLoading(false));
  };

  const handleEvaluateSubmit = async (values: { rating: number; comment: string }) => {
    if (!waitingInfo) return;
    try {
      await patientApi.evaluate({
        orderNo: waitingInfo.orderNo,
        rating: values.rating,
        comment: values.comment
      });
      message.success('评价提交成功，感谢您的反馈');
      setEvaluated(true);
      evalForm.resetFields();
    } catch {
      message.error('评价提交失败');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>
          <ClockCircleOutlined /> 就诊服务
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          输入挂号订单号，查询候诊进度；就诊完成后可对本次服务进行评价。
        </Paragraph>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="请输入挂号订单号，如 REG2026091612345"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            onPressEnter={handleQuery}
            allowClear
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={handleQuery}
          >
            查询
          </Button>
        </Space.Compact>
      </Card>

      {waitingInfo && (
        <Card title="候诊信息" style={{ marginBottom: 16 }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="订单号">{waitingInfo.orderNo}</Descriptions.Item>
            <Descriptions.Item label="就诊时间">
              {waitingInfo.visitTime
                ? dayjs(waitingInfo.visitTime).format('YYYY-MM-DD HH:mm:ss')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {getStatusTag(waitingInfo.status)}
            </Descriptions.Item>
            <Descriptions.Item label="候诊序号">
              当前前方还有 <strong style={{ color: '#fa541c' }}>{waitingInfo.position}</strong> 人
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {waitingInfo && !evaluated && (
        <Card title="就诊评价">
          <Form form={evalForm} layout="vertical" onFinish={handleEvaluateSubmit}>
            <Form.Item
              name="rating"
              label="满意度评分"
              rules={[{ required: true, message: '请给出评分' }]}
              initialValue={5}
            >
              <Rate />
            </Form.Item>
            <Form.Item
              name="comment"
              label="评价内容"
              rules={[{ required: true, message: '请填写评价内容' }]}
            >
              <TextArea rows={4} placeholder="请描述本次就诊体验……" maxLength={200} showCount />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                提交评价
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {waitingInfo && evaluated && (
        <Card>
          <Paragraph style={{ margin: 0, color: '#52c41a' }}>
            本订单已完成评价，感谢您的反馈。
          </Paragraph>
        </Card>
      )}
    </div>
  );
};

export default VisitService;
