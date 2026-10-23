import React, { useEffect, useState } from 'react';
import {
  Table, Tag, Button, Space, Modal, Form,
  DatePicker, Select, message, Card, Input, Typography
} from 'antd';
import { adminApi } from '@/api/admin';
import { registrationApi } from '@/api/registration';
import { paymentApi } from '@/api/payment';
import type { Registration } from '@/types';
import { RegistrationStatus } from '@/config';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title, Text } = Typography;

const OrderManage: React.FC = () => {
  const [orders, setOrders] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterForm] = Form.useForm();
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Registration | null>(null);
  const [refundForm] = Form.useForm();

  const readFilter = () => {
    const values = filterForm.getFieldsValue() as {
      dateRange?: [Dayjs, Dayjs];
      status?: string;
    };
    return {
      status: values.status,
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD')
    };
  };

  const loadOrders = (page = pageNum, size = pageSize) => {
    setLoading(true);
    adminApi.orders({ ...readFilter(), pageNum: page, pageSize: size })
      .then((data) => {
        setOrders(data.list);
        setTotal(data.total);
      })
      .catch(() => message.error('加载订单失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    adminApi.orders({ pageNum: 1, pageSize: 10 })
      .then((data) => {
        if (!cancelled) {
          setOrders(data.list);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('加载订单失败');
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

  const handleSearch = () => {
    setPageNum(1);
    loadOrders(1);
  };

  const handleCancelOrder = (order: Registration) => {
    Modal.confirm({
      title: '确认取消订单',
      content: `确定要取消订单 ${order.orderNo} 吗？`,
      okText: '确认取消',
      cancelText: '再想想',
      onOk: async () => {
        try {
          await registrationApi.cancel(order.regId, '管理员操作');
          message.success('取消成功');
          loadOrders();
        } catch {
          message.error('取消失败');
        }
      }
    });
  };

  const handleRefund = (order: Registration) => {
    setSelectedOrder(order);
    setRefundModalVisible(true);
  };

  const handleRefundSubmit = async (values: { reason: string }) => {
    if (!selectedOrder) {
      return;
    }
    if (!selectedOrder.payNo) {
      message.error('该订单暂无支付单号，无法退款');
      return;
    }
    try {
      await paymentApi.refund({ payNo: selectedOrder.payNo, reason: values.reason });
      message.success('退款成功');
      setRefundModalVisible(false);
      refundForm.resetFields();
      loadOrders();
    } catch {
      message.error('退款失败');
    }
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
      title: '患者姓名',
      dataIndex: 'patientName',
      key: 'patientName',
      render: (name: string, record: Registration) => (
        <span style={{ fontWeight: 500 }}>
          {name || `患者#${record.patientId}`}
        </span>
      )
    },
    {
      title: '患者ID',
      dataIndex: 'patientId',
      key: 'patientId',
      width: 80,
      render: (id: number) => <span style={{ color: '#8c8c8c' }}>{id}</span>
    },
    {
      title: '医生',
      dataIndex: 'doctorName',
      key: 'doctorName'
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
      dataIndex: 'regStatus',
      key: 'regStatus',
      width: 90,
      render: getStatusTag
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: Registration) => (
        <Space>
          {record.regStatus === RegistrationStatus.PENDING && (
            <Button
              type="link"
              danger
              onClick={() => handleCancelOrder(record)}
            >
              取消
            </Button>
          )}
          {record.regStatus === RegistrationStatus.PAID && (
            <Button
              type="link"
              onClick={() => handleRefund(record)}
            >
              退款
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>订单管理</Title>
        <Text type="secondary">查看与管理所有挂号订单，支持取消与退款操作</Text>
      </div>

      <Card>
        <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="dateRange">
            <RangePicker />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="订单状态" style={{ width: 120 }} allowClear>
              <Select.Option value={RegistrationStatus.PENDING}>待支付</Select.Option>
              <Select.Option value={RegistrationStatus.PAID}>已支付</Select.Option>
              <Select.Option value={RegistrationStatus.COMPLETED}>已完成</Select.Option>
              <Select.Option value={RegistrationStatus.CANCELLED}>已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="regId"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条订单`,
            onChange: (page, size) => {
              setPageNum(page);
              setPageSize(size);
              loadOrders(page, size);
            }
          }}
        />
      </Card>

      <Modal
        title="申请退款"
        open={refundModalVisible}
        onCancel={() => setRefundModalVisible(false)}
        onOk={() => refundForm.submit()}
        okText="确认退款"
        cancelText="取消"
      >
        {selectedOrder && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 8 }}>
            <p style={{ margin: '4px 0' }}>订单号：<span style={{ fontFamily: 'monospace' }}>{selectedOrder.orderNo}</span></p>
            <p style={{ margin: '4px 0' }}>支付单号：{selectedOrder.payNo || '暂无（未支付，无法退款）'}</p>
            <p style={{ margin: '4px 0' }}>患者：{selectedOrder.patientName}</p>
            <p style={{ margin: '4px 0' }}>金额：<span style={{ color: '#fa8c16', fontWeight: 500 }}>¥{selectedOrder.regFee}</span></p>
          </div>
        )}
        <Form
          form={refundForm}
          layout="vertical"
          onFinish={handleRefundSubmit}
        >
          <Form.Item
            name="reason"
            label="退款原因"
            rules={[{ required: true, message: '请输入退款原因' }]}
          >
            <TextArea rows={4} placeholder="请输入退款原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderManage;
