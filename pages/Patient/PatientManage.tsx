import React, { useEffect, useState } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input,
  DatePicker, Select, Tag, message, Typography
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { patientApi } from '@/api/patient';
import type { Patient } from '@/api/patient';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;

const GENDER_OPTIONS = [
  { value: 1, label: '男' },
  { value: 2, label: '女' }
];

const RELATIONSHIP_OPTIONS = [
  { value: '本人', label: '本人' },
  { value: '父母', label: '父母' },
  { value: '子女', label: '子女' },
  { value: '配偶', label: '配偶' },
  { value: '兄弟姐妹', label: '兄弟姐妹' },
  { value: '其他', label: '其他' }
];

const getRelationshipText = (relationship?: string) => relationship || '本人';

const getGenderText = (gender: number) =>
  gender === 1 ? '男' : gender === 2 ? '女' : '未知';

interface BindForm {
  realName: string;
  idCard: string;
  gender: number;
  birthDate: Dayjs;
  relationship: string;
}

interface UpdateForm {
  realName: string;
  gender: number;
  birthDate: Dayjs;
}

/** 就诊人管理（契约 7.1/7.2/7.3/7.4） */
const PatientManage: React.FC = () => {
  const [profile, setProfile] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [bindModalVisible, setBindModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [bindForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const loadPatients = (page = pageNum, size = pageSize) => {
    setLoading(true);
    patientApi.servicePatients({ pageNum: page, pageSize: size })
      .then((data) => {
        setPatients(data.list);
        setTotal(data.total);
      })
      .catch(() => message.error('加载就诊人列表失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    patientApi.profile()
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
        }
      })
      .catch(() => {
        // 未绑定就诊人时 profile 可能返回失败，静默处理
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    patientApi.servicePatients({ pageNum: 1, pageSize: 10 })
      .then((data) => {
        if (!cancelled) {
          setPatients(data.list);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('加载就诊人列表失败');
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

  const handleBindSubmit = async (values: BindForm) => {
    try {
      await patientApi.bind({
        realName: values.realName,
        idCard: values.idCard,
        gender: values.gender,
        birthDate: values.birthDate.format('YYYY-MM-DD'),
        relationship: values.relationship
      });
      message.success('绑定就诊人成功');
      setBindModalVisible(false);
      bindForm.resetFields();
      loadPatients();
    } catch {
      message.error('绑定就诊人失败');
    }
  };

  const handleUpdateSubmit = async (values: UpdateForm) => {
    try {
      // 契约 7.3 请求体仅含 realName/gender/birthDate，就诊人由后端推导
      await patientApi.update({
        realName: values.realName,
        gender: values.gender,
        birthDate: values.birthDate.format('YYYY-MM-DD')
      });
      message.success('更新就诊人成功');
      setEditingPatient(null);
      updateForm.resetFields();
      loadPatients();
    } catch {
      message.error('更新就诊人失败');
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName'
    },
    {
      title: '关系',
      dataIndex: 'relationship',
      key: 'relationship',
      width: 80,
      render: (relationship?: string) => getRelationshipText(relationship)
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard'
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: number) => getGenderText(gender)
    },
    {
      title: '出生日期',
      dataIndex: 'birthDate',
      key: 'birthDate',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-')
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone?: string) => phone || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Patient) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditingPatient(record);
              updateForm.setFieldsValue({
                realName: record.realName,
                gender: record.gender,
                birthDate: record.birthDate ? dayjs(record.birthDate) : undefined
              });
            }}
          >
            更新信息
          </Button>
          <Button
            type="link"
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认删除就诊人',
                content: `确定删除就诊人“${record.realName}”吗？删除后将无法恢复。`,
                okText: '删除',
                cancelText: '取消',
                onOk: async () => {
                  try {
                    await patientApi.delete(record.patientId);
                    message.success('删除就诊人成功');
                    loadPatients();
                  } catch {
                    message.error('删除就诊人失败');
                  }
                }
              });
            }}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>就诊人管理</Title>
        <Typography.Text type="secondary">管理您的就诊人信息，支持绑定与更新</Typography.Text>
      </div>

      {profile && (
        <Card style={{ marginBottom: 16 }}>
          <Space size="large" wrap>
            <span>当前绑定的患者信息：</span>
            <span>姓名：{profile.realName}</span>
            <span>性别：{getGenderText(profile.gender)}</span>
            <span>
              出生日期：
              {profile.birthDate ? dayjs(profile.birthDate).format('YYYY-MM-DD') : '-'}
            </span>
            {profile.idCard && <span>身份证号：{profile.idCard}</span>}
            {profile.phone && <span>手机号：{profile.phone}</span>}
          </Space>
        </Card>
      )}

      <Card
        title="就诊人列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setBindModalVisible(true)}
          >
            绑定就诊人
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={patients}
          rowKey="patientId"
          loading={loading}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (page, size) => {
              setPageNum(page);
              setPageSize(size);
              loadPatients(page, size);
            }
          }}
        />
      </Card>

      <Modal
        title="绑定就诊人"
        open={bindModalVisible}
        onCancel={() => setBindModalVisible(false)}
        onOk={() => bindForm.submit()}
        destroyOnClose
      >
        <Form form={bindForm} layout="vertical" onFinish={handleBindSubmit}>
          <Form.Item
            name="realName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item
            name="idCard"
            label="身份证号"
            rules={[
              { required: true, message: '请输入身份证号' },
              { len: 18, message: '身份证号须为18位' }
            ]}
          >
            <Input placeholder="请输入18位身份证号" maxLength={18} />
          </Form.Item>
          <Form.Item
            name="gender"
            label="性别"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select placeholder="请选择性别" options={GENDER_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="relationship"
            label="与账户持有人关系"
            rules={[{ required: true, message: '请选择关系' }]}
            initialValue="本人"
          >
            <Select placeholder="请选择关系" options={RELATIONSHIP_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="birthDate"
            label="出生日期"
            rules={[{ required: true, message: '请选择出生日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新就诊人信息"
        open={!!editingPatient}
        onCancel={() => setEditingPatient(null)}
        onOk={() => updateForm.submit()}
        destroyOnClose
      >
        {editingPatient && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">{editingPatient.realName}</Tag>
            <span style={{ color: '#999' }}>身份证号：{editingPatient.idCard}</span>
          </div>
        )}
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateSubmit}>
          <Form.Item
            name="realName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item
            name="gender"
            label="性别"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select placeholder="请选择性别" options={GENDER_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="birthDate"
            label="出生日期"
            rules={[{ required: true, message: '请选择出生日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PatientManage;
