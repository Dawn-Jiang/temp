import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Select, Button, message, Typography, Alert, Space
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { hospitalApi } from '@/api/hospital';
import type { HospitalApplyParams } from '@/types';
import { HospitalStatus } from '@/config';

const { Title, Text } = Typography;

const STORAGE_KEY = 'hospital_apply';

interface StoredApply {
  hospitalId?: number;
  form?: HospitalApplyParams;
}

/** 审核状态接口可能直接返回数字，也可能返回含 status 字段的对象，统一归一化 */
const normalizeStatus = (raw: unknown): number | null => {
  if (typeof raw === 'number') return raw;
  if (raw && typeof raw === 'object' && 'status' in raw) {
    const v = Number((raw as { status: unknown }).status);
    return Number.isFinite(v) ? v : null;
  }
  return null;
};

const readStored = (): StoredApply => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as StoredApply : {};
  } catch {
    return {};
  }
};

const HospitalApply: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<HospitalApplyParams>();
  const [status, setStatus] = useState<number | null>(null);
  // 仅当本地存在已提交的申请ID时才需要展示加载态（惰性初始化，避免 effect 内同步 setState）
  const [statusLoading, setStatusLoading] = useState<boolean>(() => readStored().hospitalId != null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const stored = readStored();
    if (stored.form) {
      form.setFieldsValue(stored.form);
    }
    if (!stored.hospitalId) {
      return () => { cancelled = true; };
    }
    hospitalApi.applyStatus(stored.hospitalId)
      .then((raw) => {
        if (!cancelled) setStatus(normalizeStatus(raw));
      })
      .catch(() => {
        // 查询失败（如申请记录不存在）时回退到申请表单
        if (!cancelled) setStatus(null);
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form]);

  const persistStored = (next: StoredApply): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStored(), ...next }));
    } catch { /* ignore */ }
  };

  const handleSubmit = async (values: HospitalApplyParams) => {
    setSubmitting(true);
    try {
      const hospitalId = await hospitalApi.apply(values);
      persistStored({ hospitalId: typeof hospitalId === 'number' ? hospitalId : undefined, form: values });
      message.success('入驻申请已提交，请等待平台审核');
      if (typeof hospitalId === 'number') {
        setStatus(HospitalStatus.PENDING);
      } else {
        // 后端未返回 ID 时无法轮询状态，停留在审核中提示
        setStatus(HospitalStatus.PENDING);
      }
    } catch {
      message.error('入驻申请提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBanner = () => {
    if (status === HospitalStatus.PENDING) {
      return (
        <Alert
          type="warning"
          showIcon
          message="入驻申请审核中"
          description="平台正在审核您的医院入驻申请，审核结果将在本页面更新，请耐心等待。"
          style={{ marginBottom: 16 }}
        />
      );
    }
    if (status === HospitalStatus.ACTIVE) {
      return (
        <Alert
          type="success"
          showIcon
          message="医院已成功入驻"
          description="审核已通过，您现在可以使用排班与订单管理功能。"
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" onClick={() => navigate('/admin/dashboard')}>
              进入数据看板
            </Button>
          }
        />
      );
    }
    if (status === HospitalStatus.REJECTED) {
      return (
        <Alert
          type="error"
          showIcon
          message="入驻申请已被驳回"
          description="请核对并修改医院资料后重新提交入驻申请。"
          style={{ marginBottom: 16 }}
        />
      );
    }
    return null;
  };

  const showForm = status !== HospitalStatus.PENDING && status !== HospitalStatus.ACTIVE;

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>医院入驻</Title>
        <Text type="secondary">提交医院资料申请入驻平台，审核通过后即可开通排班与挂号服务</Text>
      </div>

      {renderStatusBanner()}

      {showForm && (
        <Card title={status === HospitalStatus.REJECTED ? '重新提交入驻申请' : '入驻申请资料'}>
          <Form
            form={form}
            layout="vertical"
            style={{ maxWidth: 640 }}
            onFinish={handleSubmit}
          >
            <Form.Item
              name="hospitalName"
              label="医院名称"
              rules={[{ required: true, message: '请输入医院名称' }]}
            >
              <Input placeholder="如：北京市第一人民医院" maxLength={64} />
            </Form.Item>
            <Space style={{ display: 'flex' }} align="start">
              <Form.Item
                name="hospitalCode"
                label="医院编码"
                style={{ flex: 1 }}
                rules={[
                  { required: true, message: '请输入医院编码' },
                  { pattern: /^[A-Za-z0-9_-]+$/, message: '编码仅支持字母、数字、下划线与短横线' }
                ]}
              >
                <Input placeholder="如：BJ001" maxLength={32} />
              </Form.Item>
              <Form.Item
                name="level"
                label="医院等级"
                style={{ flex: 1 }}
                rules={[{ required: true, message: '请选择医院等级' }]}
              >
                <Select placeholder="请选择医院等级" options={[
                  { value: '三甲', label: '三级甲等' },
                  { value: '三乙', label: '三级乙等' },
                  { value: '二甲', label: '二级甲等' },
                  { value: '二乙', label: '二级乙等' },
                  { value: '一级', label: '一级医院' },
                  { value: '其他', label: '其他' }
                ]} />
              </Form.Item>
            </Space>
            <Form.Item
              name="city"
              label="所在城市"
              rules={[{ required: true, message: '请输入所在城市' }]}
            >
              <Input placeholder="如：北京" maxLength={32} />
            </Form.Item>
            <Form.Item
              name="address"
              label="详细地址"
              rules={[{ required: true, message: '请输入详细地址' }]}
            >
              <Input placeholder="如：北京市东城区王府井大街1号" maxLength={128} />
            </Form.Item>
            <Form.Item
              name="phone"
              label="联系电话"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^[0-9-]{7,20}$/, message: '请输入正确的联系电话' }
              ]}
            >
              <Input placeholder="如：010-12345678" maxLength={20} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting || statusLoading}>
                {status === HospitalStatus.REJECTED ? '重新提交申请' : '提交入驻申请'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default HospitalApply;
