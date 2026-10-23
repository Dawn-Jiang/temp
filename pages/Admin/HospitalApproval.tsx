import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Card, Modal, Form, Input, Tag, message, Typography
} from 'antd';
import { adminApi } from '@/api/admin';
import type { Hospital } from '@/types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text } = Typography;

/** 医院入驻审核状态（后端数据库实际值：0=待审核 1=已入驻 2=已驳回） */
const HOSPITAL_STATUS: Record<number, { color: string; text: string }> = {
  0: { color: 'orange', text: '待审核' },
  1: { color: 'green', text: '已入驻' },
  2: { color: 'red', text: '已驳回' }
};

const HospitalApproval: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  // 当前审核目标：hospital 为待审核医院，approved 表示是否通过
  const [reviewTarget, setReviewTarget] = useState<{ hospital: Hospital; approved: boolean } | null>(null);
  const [reviewForm] = Form.useForm();

  const loadHospitals = (page = pageNum, size = pageSize) => {
    setLoading(true);
    adminApi.pendingHospitals({ pageNum: page, pageSize: size })
      .then((data) => {
        setHospitals(data.list);
        setTotal(data.total);
      })
      .catch(() => message.error('加载待审核医院失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    adminApi.pendingHospitals({ pageNum: 1, pageSize: 10 })
      .then((data) => {
        if (!cancelled) {
          setHospitals(data.list);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('加载待审核医院失败');
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

  const openReview = (hospital: Hospital, approved: boolean) => {
    setReviewTarget({ hospital, approved });
    // 通过时预填默认审核意见，驳回时留空由管理员填写
    reviewForm.setFieldsValue({ reason: approved ? '资料齐全，同意入驻' : '' });
  };

  const handleReviewSubmit = async (values: { reason: string }) => {
    if (!reviewTarget) {
      return;
    }
    const { hospital, approved } = reviewTarget;
    try {
      await adminApi.approveHospital({
        hospitalId: hospital.hospitalId,
        approved,
        reason: values.reason
      });
      message.success(approved ? '已通过入驻审核' : '已驳回入驻申请');
      setReviewTarget(null);
      loadHospitals();
    } catch {
      message.error(approved ? '审核操作失败' : '驳回操作失败');
    }
  };

  const columns = [
    {
      title: '医院名称',
      dataIndex: 'hospitalName',
      key: 'hospitalName',
      width: 180
    },
    {
      title: '医院编码',
      dataIndex: 'hospitalCode',
      key: 'hospitalCode',
      width: 120
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (level: string) => <Tag>{level}</Tag>
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: number) => {
        const config = HOSPITAL_STATUS[status] || { color: 'default', text: '未知' };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date?: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Hospital) => (
        <Space>
          <Button type="link" onClick={() => openReview(record, true)}>
            通过
          </Button>
          <Button type="link" danger onClick={() => openReview(record, false)}>
            驳回
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>医院审核</Title>
        <Text type="secondary">审核医院入驻申请，通过或驳回</Text>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={hospitals}
          rowKey="hospitalId"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 家待审核医院`,
            onChange: (page, size) => {
              setPageNum(page);
              setPageSize(size);
              loadHospitals(page, size);
            }
          }}
        />
      </Card>

      <Modal
        title={
          reviewTarget
            ? `${reviewTarget.approved ? '通过审核' : '驳回申请'} - ${reviewTarget.hospital.hospitalName}`
            : ''
        }
        open={!!reviewTarget}
        onOk={() => reviewForm.submit()}
        onCancel={() => setReviewTarget(null)}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
          <Form.Item
            name="reason"
            label="审核意见"
            rules={[{ required: true, message: '请输入审核意见' }]}
          >
            <TextArea rows={3} placeholder="请输入审核意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HospitalApproval;
