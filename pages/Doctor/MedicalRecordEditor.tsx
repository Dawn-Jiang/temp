import React, { useEffect, useState } from 'react';
import {
  Form, Input, Button, Card, message, Divider,
  Timeline, Modal, Space, Alert
} from 'antd';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { SaveOutlined, HistoryOutlined } from '@ant-design/icons';
import { workbenchApi } from '@/api/workbench';
import type { MedicalRecord, SaveMedicalRecordParams } from '@/types';

const { TextArea } = Input;

interface LocationState {
  patientId?: number;
  patientName?: string;
}

interface RecordFormValues {
  chiefComplaint: string;
  presentIllness?: string;
  pastHistory?: string;
  physicalExam?: string;
  diagnosis: string;
  treatmentPlan?: string;
  advice?: string;
}

const MedicalRecordEditor: React.FC = () => {
  const { regId } = useParams<{ regId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state ?? {}) as LocationState;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(locationState.patientId ?? null);
  const [patientName] = useState(locationState.patientName ?? '');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    if (!regId) {
      return;
    }
    let cancelled = false;
    workbenchApi
      .getMedicalRecord(Number(regId))
      .then((data) => {
        if (cancelled || !data) {
          return;
        }
        form.setFieldsValue({
          chiefComplaint: data.chiefComplaint,
          presentIllness: data.presentIllness,
          pastHistory: data.pastHistory,
          physicalExam: data.physicalExam,
          diagnosis: data.diagnosis,
          treatmentPlan: data.treatmentPlan,
          advice: data.advice
        });
        setRecordId(data.recordId);
        setPatientId(data.patientId);
      })
      .catch(() => {
        message.error('加载病历失败');
      });
    return () => {
      cancelled = true;
    };
  }, [regId, form]);

  const loadMedicalHistory = async (pid: number) => {
    try {
      const res = await workbenchApi.getMedicalHistory(pid, { pageNum: 1, pageSize: 20 });
      setMedicalHistory(res.list);
    } catch {
      message.error('加载病史失败');
    }
  };

  const handleSave = async (values: RecordFormValues) => {
    if (!regId) {
      message.error('缺少挂号信息');
      return;
    }
    if (patientId === null) {
      message.error('缺少患者信息，请从叫号系统或工作台进入');
      return;
    }
    setLoading(true);
    try {
      const params: SaveMedicalRecordParams = {
        regId: Number(regId),
        patientId,
        ...values
      };
      const newRecordId = await workbenchApi.saveMedicalRecord(params);
      setRecordId(newRecordId);
      message.success('病历保存成功');
    } catch {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleShowHistory = () => {
    if (patientId === null) {
      message.warning('缺少患者信息，无法查询病史');
      return;
    }
    setHistoryVisible(true);
    loadMedicalHistory(patientId);
  };

  const handleGoPrescription = () => {
    if (!regId) {
      return;
    }
    if (recordId === null || patientId === null) {
      message.warning('请先保存病历后再开具处方');
      return;
    }
    navigate(`/doctor/prescription/${regId}`, {
      state: { recordId, patientId, patientName }
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>病历编辑</h2>
      </div>
      <Card
        extra={
          <Button icon={<HistoryOutlined />} onClick={handleShowHistory}>
            查看病史
          </Button>
        }
      >
        {patientId === null && (
          <Alert
            message="缺少患者信息"
            description="未找到该挂号对应的已有病历，也未从叫号流程传入患者信息，请从工作台或叫号系统进入本页面。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Space size="large" style={{ marginBottom: 16 }}>
            <Form.Item label="患者姓名" style={{ marginBottom: 0 }}>
              <Input disabled size="large" value={patientName} placeholder={patientName || '未知'} />
            </Form.Item>
            {patientId !== null && (
              <Form.Item label="患者ID" style={{ marginBottom: 0 }}>
                <Input disabled size="large" value={patientId} style={{ width: 120 }} />
              </Form.Item>
            )}
          </Space>

          <Divider orientation="left">主诉</Divider>
          <Form.Item
            name="chiefComplaint"
            rules={[{ required: true, message: '请输入主诉' }]}
          >
            <TextArea rows={2} placeholder="患者的主要症状和持续时间" />
          </Form.Item>

          <Divider orientation="left">现病史</Divider>
          <Form.Item name="presentIllness">
            <TextArea rows={4} placeholder="详细描述疾病的发生、发展过程" />
          </Form.Item>

          <Divider orientation="left">既往史</Divider>
          <Form.Item name="pastHistory">
            <TextArea rows={3} placeholder="患者过去的健康状况和疾病史" />
          </Form.Item>

          <Divider orientation="left">体格检查</Divider>
          <Form.Item name="physicalExam">
            <TextArea rows={3} placeholder="体温、脉搏、呼吸等检查结果" />
          </Form.Item>

          <Divider orientation="left">诊断</Divider>
          <Form.Item
            name="diagnosis"
            rules={[{ required: true, message: '请输入诊断结果' }]}
          >
            <TextArea rows={2} placeholder="初步诊断或确诊的疾病" />
          </Form.Item>

          <Divider orientation="left">治疗方案</Divider>
          <Form.Item name="treatmentPlan">
            <TextArea rows={3} placeholder="具体的治疗措施和用药方案" />
          </Form.Item>

          <Divider orientation="left">医嘱</Divider>
          <Form.Item name="advice">
            <TextArea rows={2} placeholder="注意事项、复查时间等" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                保存病历
              </Button>
              <Button size="large" onClick={handleGoPrescription}>
                开具处方
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="病史记录"
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        width={700}
      >
        <Timeline
          items={medicalHistory.map((record) => ({
            key: record.recordId,
            children: (
              <div>
                <strong>{record.createTime}</strong>
                <div>诊断：{record.diagnosis}</div>
                <div>医生ID：{record.doctorId}</div>
              </div>
            )
          }))}
        />
      </Modal>
    </div>
  );
};

export default MedicalRecordEditor;
