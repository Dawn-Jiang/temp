import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Steps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import type { RegisterParams } from '@/api/auth';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const handleNextStep = async () => {
    try {
      await form.validateFields(['username', 'password']);
      setCurrentStep(1);
    } catch {
      // 表单校验失败时不继续跳到下一步
    }
  };

  const onFinish = async (values: RegisterParams) => {
    setLoading(true);
    try {
      await authApi.register({
        username: values.username,
        password: values.password,
        phone: values.phone,
        realName: values.realName,
        idCard: values.idCard
      });
      message.success('注册成功，请登录');
      navigate('/login');
    } catch {
      message.error('注册失败');
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
      <Card style={{ width: 500, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>用户注册</h2>
        </div>
        <Steps
          current={currentStep}
          items={[
            { title: '基本信息' },
            { title: '身份信息' },
            { title: '完成' }
          ]}
          style={{ marginBottom: 24 }}
        />
        
        <Form form={form} onFinish={onFinish} layout="vertical">
          {currentStep === 0 && (
            <>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 4, max: 20, message: '用户名长度为4-20位' }
                ]}
              >
                <Input placeholder="请输入用户名" size="large" />
              </Form.Item>
              
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, max: 20, message: '密码长度为6-20位' }
                ]}
              >
                <Input.Password placeholder="请输入密码" size="large" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="button" block size="large" onClick={handleNextStep}>
                  下一步
                </Button>
              </Form.Item>
            </>
          )}
          
          {currentStep === 1 && (
            <>
              <Form.Item
                name="realName"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入真实姓名" size="large" />
              </Form.Item>
              
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确' }
                ]}
              >
                <Input placeholder="请输入身份证号" size="large" />
              </Form.Item>
              
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                ]}
              >
                <Input placeholder="请输入手机号" size="large" />
              </Form.Item>
              
              <Form.Item>
                <Button htmlType="button" block size="large" onClick={() => setCurrentStep(0)} style={{ marginRight: 8 }}>
                  上一步
                </Button>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  完成注册
                </Button>
              </Form.Item>
            </>
          )}
        </Form>
        
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/login')}>
            已有账号？立即登录
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Register;
