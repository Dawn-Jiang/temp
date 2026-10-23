import React, { useEffect, useState } from 'react';
import {
  Table, Tag, Button, Space, Modal, message, Card, Typography,
  Form, Radio, Input, Descriptions, Alert
} from 'antd';
import { registrationApi } from '@/api/registration';
import { paymentApi } from '@/api/payment';
import type { Registration, PayChannel } from '@/types';
import { RegistrationStatus, PayStatus } from '@/config';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface PayFormValues {
  payChannel: PayChannel;
  payPassword: string;
}

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [payTarget, setPayTarget] = useState<Registration | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payForm] = Form.useForm<PayFormValues>();

  const loadBookings = (page = pageNum, size = pageSize) => {
    setLoading(true);
    registrationApi.myBookings({ pageNum: page, pageSize: size })
      .then((data) => {
        setBookings(data.list);
        setTotal(data.total);
      })
      .catch(() => message.error('加载挂号记录失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    registrationApi.myBookings({ pageNum: 1, pageSize: 10 })
      .then((data) => {
        if (!cancelled) {
          setBookings(data.list);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('加载挂号记录失败');
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
  }, []);

  /** 打开结算支付弹窗 */
  const openPayModal = (record: Registration) => {
    setPayTarget(record);
    payForm.setFieldsValue({ payChannel: 'WECHAT', payPassword: '' });
  };

  /** 提交结算：选择支付方式 + 输入支付密码 */
  const handlePaySubmit = async (values: PayFormValues) => {
    if (!payTarget) return;
    setPaySubmitting(true);
    try {
      const order = await paymentApi.create({
        regId: payTarget.regId,
        payChannel: values.payChannel,
        payPassword: values.payPassword
      });
      const settled =
        order?.payStatus === PayStatus.SUCCESS || order?.status === PayStatus.SUCCESS;
      message.success(settled ? '支付成功' : '支付请求已提交，请等待支付结果确认');
      setPayTarget(null);
      payForm.resetFields();
      loadBookings();
    } catch {
      message.error('结算支付失败');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleCancel = (regId: number) => {
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消这个挂号吗？',
      okText: '确认取消',
      cancelText: '再想想',
      onOk: async () => {
        try {
          await registrationApi.cancel(regId, '个人原因');
          message.success('取消成功');
          loadBookings();
        } catch {
          message.error('取消失败');
        }
      }
    });
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      [RegistrationStatus.PENDING]: { color: 'orange', text: '待支付' },
      [RegistrationStatus.PAID]: { color: 'blue', text: '已支付' },
      [RegistrationStatus.COMPLETED]: { color: 'green', text: '已完成' },
      [RegistrationStatus.CANCELLED]: { color: 'default', text: '已取消' },
      [RegistrationStatus.NOSHOW]: { color: 'red', text: '爽约' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (no: string) => <span style={{ fontFamily: 'monospace', color: '#1677ff' }}>{no}</span>
    },
    {
      title: '医院 / 科室 / 医生',
      key: 'hospitalInfo',
      width: 260,
      render: (_: unknown, record: Registration) => (
        <span>
          <span style={{ color: '#1677ff', fontWeight: 500 }}>{record.hospitalName || '未知医院'}</span>
          <span style={{ color: '#8c8c8c' }}> / {record.deptName || '未知科室'} / </span>
          <span style={{ fontWeight: 500 }}>{record.doctorName || '未知医生'}</span>
        </span>
      )
    },
    {
      title: '就诊日期',
      dataIndex: 'scheduleDate',
      key: 'scheduleDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '时段',
      dataIndex: 'amPm',
      key: 'amPm',
      width: 80,
      render: (amPm: string) => amPm === 'AM' ? '上午' : '下午'
    },
    {
      title: '挂号费',
      dataIndex: 'regFee',
      key: 'regFee',
      width: 90,
      render: (fee: number) => <span style={{ color: '#fa8c16', fontWeight: 500 }}>¥{fee}</span>
    },
    {
      title: '状态',
      key: 'regStatus',
      dataIndex: 'regStatus',
      width: 90,
      render: getStatusTag
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Registration) => (
        <Space>
          {record.regStatus === RegistrationStatus.PENDING ? (
            <Button type="primary" size="small" onClick={() => openPayModal(record)}>
              结算支付
            </Button>
          ) : null}
          {(record.regStatus === RegistrationStatus.PENDING || record.regStatus === RegistrationStatus.PAID) ? (
            <Button
              type="link"
              danger
              onClick={() => handleCancel(record.regId)}
            >
              取消挂号
            </Button>
          ) : null}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>我的挂号</Title>
        <Text type="secondary">查看您的挂号记录与就诊状态</Text>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="regId"
          loading={loading}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (page, size) => {
              setPageNum(page);
              setPageSize(size);
              loadBookings(page, size);
            }
          }}
        />
      </Card>

      {/* 结算支付弹窗：选择支付方式 + 输入支付密码 */}
      <Modal
        title="结算支付"
        open={!!payTarget}
        onOk={() => payForm.submit()}
        onCancel={() => { setPayTarget(null); payForm.resetFields(); }}
        okText="确认支付"
        cancelText="取消"
        confirmLoading={paySubmitting}
        destroyOnClose
      >
        {payTarget && (
          <>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{payTarget.orderNo}</Descriptions.Item>
              <Descriptions.Item label="就诊信息">
                {payTarget.hospitalName || '未知医院'} / {payTarget.deptName || '未知科室'} / {payTarget.doctorName || '未知医生'}
              </Descriptions.Item>
              <Descriptions.Item label="就诊时间">
                {dayjs(payTarget.scheduleDate).format('YYYY-MM-DD')} {payTarget.amPm === 'AM' ? '上午' : '下午'}
              </Descriptions.Item>
              <Descriptions.Item label="挂号费">
                <span style={{ color: '#fa8c16', fontWeight: 600, fontSize: 16 }}>¥{payTarget.regFee}</span>
              </Descriptions.Item>
            </Descriptions>
            <Form form={payForm} layout="vertical" onFinish={handlePaySubmit}>
              <Form.Item
                name="payChannel"
                label="支付方式"
                rules={[{ required: true, message: '请选择支付方式' }]}
              >
                <Radio.Group>
                  <Radio.Button value="WECHAT">微信支付</Radio.Button>
                  <Radio.Button value="ALIPAY">支付宝</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="payPassword"
                label="支付密码"
                rules={[
                  { required: true, message: '请输入支付密码' },
                  { pattern: /^\d{6}$/, message: '支付密码为 6 位数字' }
                ]}
              >
                <Input.Password
                  placeholder="请输入 6 位支付密码"
                  maxLength={6}
                  autoComplete="new-password"
                />
              </Form.Item>
              <Alert
                type="info"
                showIcon
                message="支付密码用于校验本次结算，提交后完成挂号费支付。"
                style={{ marginTop: 4 }}
              />
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MyBookings;
