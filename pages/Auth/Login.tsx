import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Divider, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import type { LoginParams } from '@/api/auth';
import { useUserStore } from '@/store/userStore';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const setUserInfo = useUserStore((state) => state.setUserInfo);

  const onFinish = async (values: LoginParams) => {
    setLoading(true);
    try {
      const result = await authApi.login(values);
      localStorage.setItem('token', result.token);
      setUserInfo({
        token: result.token,
        userId: result.userId,
        username: result.username,
        userType: result.userType,
        realName: result.realName
      });
      message.success('登录成功');
      navigate('/');
    } catch {
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        style={{
          width: 420,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <MedicineBoxOutlined style={{ fontSize: 40, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>医疗挂号系统</Title>
          <Text type="secondary">在线预约 · 便捷就医</Text>
        </div>

        <Alert
          message="测试账号"
          description={
            <div style={{ fontSize: 12 }}>
              <div>平台管理员: admin / admin123</div>
              <div>医院管理员: hospital_admin / admin123</div>
              <div>医生: doctor_zhang / 123456</div>
              <div>患者: patient_li / 123456</div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />

        <Form onFinish={onFinish} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/register')}>
            没有账号？立即注册
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
