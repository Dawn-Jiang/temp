import React, { useState } from 'react';
import { Card, Form, Input, InputNumber, Button, Alert, message, Typography, Row, Col, Table } from 'antd';
import { adminApi } from '@/api/admin';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface BlacklistFormValues {
  userId: number;
  reason: string;
}

const BlacklistManage: React.FC = () => {
  const [addForm] = Form.useForm<BlacklistFormValues>();
  const [removeForm] = Form.useForm<BlacklistFormValues>();
  const [blacklistEntries, setBlacklistEntries] = useState<Array<{ userId: number; reason: string; addedAt: string }>>([]);

  const handleAdd = async (values: BlacklistFormValues) => {
    try {
      await adminApi.addBlacklist(values);
      message.success('已加入黑名单');
      setBlacklistEntries(prev => [...prev, { userId: values.userId, reason: values.reason, addedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }]);
      addForm.resetFields();
    } catch {
      message.error('加入黑名单失败');
    }
  };

  const handleRemove = async (values: BlacklistFormValues) => {
    try {
      await adminApi.removeBlacklist(values);
      message.success('已移出黑名单');
      setBlacklistEntries(prev => prev.filter(e => e.userId !== values.userId));
      removeForm.resetFields();
    } catch {
      message.error('移出黑名单失败');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>黑名单管理</Title>
        <Text type="secondary">对违规用户进行黑名单管理</Text>
      </div>

      <Alert
        type="info"
        showIcon
        message="黑名单管理说明"
        description="契约暂未提供黑名单列表查询接口，本页通过用户 ID / 患者 ID 进行添加与移除操作，可用于禁用违规就诊人。下方列表展示本会话内已操作的黑名单记录。"
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="添加黑名单" className="stat-card">
            <Form
              form={addForm}
              layout="vertical"
              onFinish={handleAdd}
            >
              <Form.Item
                name="userId"
                label="用户 ID"
                rules={[{ required: true, message: '请输入用户 ID' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入用户 ID" />
              </Form.Item>
              <Form.Item
                name="reason"
                label="拉黑原因"
                rules={[{ required: true, message: '请输入拉黑原因' }]}
              >
                <TextArea rows={3} placeholder="请输入拉黑原因" />
              </Form.Item>
              <Button type="primary" danger htmlType="submit" block>
                加入黑名单
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="移除黑名单" className="stat-card">
            <Form
              form={removeForm}
              layout="vertical"
              onFinish={handleRemove}
            >
              <Form.Item
                name="userId"
                label="用户 ID"
                rules={[{ required: true, message: '请输入用户 ID' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入用户 ID" />
              </Form.Item>
              <Form.Item
                name="reason"
                label="移除原因"
                rules={[{ required: true, message: '请输入移除原因' }]}
              >
                <TextArea rows={3} placeholder="请输入移除原因" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block>
                移出黑名单
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card title={`黑名单列表（本会话 ${blacklistEntries.length} 条）`} style={{ marginTop: 24 }}>
        <Table
          dataSource={blacklistEntries}
          rowKey="userId"
          pagination={false}
          locale={{ emptyText: '暂无黑名单记录' }}
          columns={[
            { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 100 },
            { title: '拉黑原因', dataIndex: 'reason', key: 'reason' },
            { title: '加入时间', dataIndex: 'addedAt', key: 'addedAt', width: 180 }
          ]}
        />
      </Card>
    </div>
  );
};

export default BlacklistManage;
