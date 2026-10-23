import React, { useEffect, useState } from 'react';
import {
  Form, Input, Button, Card, Table, Space,
  InputNumber, Modal, message, Divider, Alert
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { workbenchApi } from '@/api/workbench';
import type { PrescriptionMedicineItem } from '@/types';

interface MedicineItem extends PrescriptionMedicineItem {
  key: string;
}

interface MedicineFormValues {
  medicineName: string;
  specification?: string;
  usage: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface LocationState {
  recordId?: number;
  patientId?: number;
  patientName?: string;
}

const PrescriptionEditor: React.FC = () => {
  const navigate = useNavigate();
  const { regId } = useParams<{ regId: string }>();
  const location = useLocation();
  const locationState = (location.state ?? {}) as LocationState;

  const recordId = locationState.recordId ?? null;
  const patientId = locationState.patientId ?? null;
  const patientName = locationState.patientName ?? '';

  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [medicineModalVisible, setMedicineModalVisible] = useState(false);
  const [medicineForm] = Form.useForm<MedicineFormValues>();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 从病历编辑页进入时，加载该病历下已开具的处方供编辑
  useEffect(() => {
    if (recordId === null) {
      return;
    }
    let cancelled = false;
    workbenchApi
      .getPrescriptions(recordId, { pageNum: 1, pageSize: 50 })
      .then((res) => {
        if (cancelled) {
          return;
        }
        setMedicines(
          res.list.map((p) => ({
            key: String(p.prescriptionId),
            medicineName: p.medicineName,
            specification: p.specification,
            usage: p.usage,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            notes: p.notes
          }))
        );
      })
      .catch(() => {
        message.error('加载已有处方失败');
      });
    return () => {
      cancelled = true;
    };
  }, [recordId]);

  const handleAddMedicine = () => {
    setEditingIndex(null);
    medicineForm.resetFields();
    setMedicineModalVisible(true);
  };

  const handleEditMedicine = (index: number) => {
    setEditingIndex(index);
    const medicine = medicines[index];
    medicineForm.setFieldsValue(medicine);
    setMedicineModalVisible(true);
  };

  const handleDeleteMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineSubmit = (values: MedicineFormValues) => {
    if (editingIndex !== null) {
      // 编辑
      const updated = [...medicines];
      updated[editingIndex] = { ...values, key: updated[editingIndex].key };
      setMedicines(updated);
    } else {
      // 新增
      setMedicines([...medicines, { ...values, key: Date.now().toString() }]);
    }
    setMedicineModalVisible(false);
    medicineForm.resetFields();
  };

  const handleSubmitPrescription = async () => {
    if (medicines.length === 0) {
      message.warning('请至少添加一种药品');
      return;
    }
    if (!regId || recordId === null || patientId === null) {
      message.error('缺少病历信息，请从病历编辑页进入');
      return;
    }

    setSubmitting(true);
    try {
      await workbenchApi.createPrescription({
        recordId,
        regId: Number(regId),
        patientId,
        medicines: medicines.map(({ key: _key, ...rest }) => rest)
      });
      message.success('处方开具成功');
      navigate('/doctor/workbench');
    } catch {
      message.error('开具处方失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '药品名称',
      dataIndex: 'medicineName',
      key: 'medicineName'
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      render: (spec?: string) => spec || '-'
    },
    {
      title: '用法用量',
      dataIndex: 'usage',
      key: 'usage'
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number) => `¥${price}`
    },
    {
      title: '小计',
      key: 'subtotal',
      render: (_: unknown, record: MedicineItem) => `¥${(record.quantity * record.unitPrice).toFixed(2)}`
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes?: string) => notes || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, _record: MedicineItem, index: number) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleEditMedicine(index)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteMedicine(index)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  const totalPrice = medicines.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
          {patientName ? `处方开具 - ${patientName}` : '处方开具'}
        </h2>
      </div>
      <Card
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddMedicine}
          >
            添加药品
          </Button>
        }
      >
        {recordId === null && (
          <Alert
            message="缺少病历信息"
            description="请先在病历编辑页保存病历，再通过“开具处方”按钮进入本页面。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={medicines}
          pagination={false}
          locale={{ emptyText: '暂无药品，请点击右上角添加' }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <strong>总计</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                  ¥{totalPrice.toFixed(2)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={2} />
            </Table.Summary.Row>
          )}
        />

        <Divider />

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/doctor/workbench')}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleSubmitPrescription}
              disabled={medicines.length === 0 || recordId === null || patientId === null}
              loading={submitting}
            >
              提交处方
            </Button>
          </Space>
        </div>
      </Card>

      <Modal
        title={editingIndex !== null ? '编辑药品' : '添加药品'}
        open={medicineModalVisible}
        onCancel={() => setMedicineModalVisible(false)}
        onOk={() => medicineForm.submit()}
        width={600}
      >
        <Form
          form={medicineForm}
          layout="vertical"
          onFinish={handleMedicineSubmit}
        >
          <Form.Item
            name="medicineName"
            label="药品名称"
            rules={[{ required: true, message: '请输入药品名称' }]}
          >
            <Input placeholder="请输入药品名称" />
          </Form.Item>

          <Form.Item name="specification" label="规格">
            <Input placeholder="如：0.25g*12片/盒" />
          </Form.Item>

          <Form.Item
            name="usage"
            label="用法用量"
            rules={[{ required: true, message: '请输入用法用量' }]}
          >
            <Input placeholder="如：口服，每次1片，每日3次" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="unitPrice"
            label="单价"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input placeholder="特殊说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PrescriptionEditor;
