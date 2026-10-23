import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Space, Modal, message, Select, Statistic, List } from 'antd';
import { SoundOutlined, ForwardOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { workbenchApi } from '@/api/workbench';
import type { CallNextResult, WorkbenchSchedule } from '@/types';

const CallingSystem: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const scheduleIdParam = searchParams.get('scheduleId');
  const scheduleId = scheduleIdParam ? Number(scheduleIdParam) : null;

  const [schedules, setSchedules] = useState<WorkbenchSchedule[]>([]);
  const [currentPatient, setCurrentPatient] = useState<CallNextResult | null>(null);
  const [calledHistory, setCalledHistory] = useState<CallNextResult[]>([]);
  const [loading, setLoading] = useState(false);

  // 未指定排班时加载今日排班供选择
  useEffect(() => {
    if (scheduleId !== null) {
      return;
    }
    let cancelled = false;
    workbenchApi
      .todaySchedule({ pageNum: 1, pageSize: 50 })
      .then((res) => {
        if (!cancelled) {
          setSchedules(res.list);
        }
      })
      .catch(() => {
        message.error('加载今日排班失败');
      });
    return () => {
      cancelled = true;
    };
  }, [scheduleId]);

  const currentSchedule = schedules.find((s) => s.scheduleId === scheduleId);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    } else {
      message.warning('浏览器不支持语音播报');
    }
  };

  const handleSelectSchedule = (value: number) => {
    setSearchParams({ scheduleId: String(value) });
  };

  const handleCallNext = async () => {
    if (scheduleId === null) {
      message.warning('请先选择排班时段');
      return;
    }
    setLoading(true);
    try {
      const patient = await workbenchApi.callNext(scheduleId);
      setCurrentPatient(patient);
      setCalledHistory((prev) => [...prev, patient]);
      speak(`请${patient.patientName}到诊室就诊`);
    } catch {
      message.warning('暂无待叫号患者');
      setCurrentPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (!currentPatient) {
      return;
    }
    Modal.confirm({
      title: '确认过号',
      content: `确定要将 ${currentPatient.patientName} 过号吗？`,
      onOk: async () => {
        try {
          await workbenchApi.skipPatient({ regId: currentPatient.regId, reason: '患者未到' });
          setCurrentPatient(null);
          message.success('已过号');
        } catch {
          message.error('过号失败');
        }
      }
    });
  };

  const handleRecall = () => {
    if (!currentPatient) {
      return;
    }
    // 重新叫号仅本地重播语音，后端无对应接口
    speak(`请${currentPatient.patientName}到诊室就诊`);
    message.success('重新叫号');
  };

  const handleViewRecord = () => {
    if (!currentPatient) {
      return;
    }
    navigate(`/doctor/medical-record/${currentPatient.regId}`, {
      state: { patientId: currentPatient.patientId, patientName: currentPatient.patientName }
    });
  };

  if (scheduleId === null) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>叫号系统</h2>
        </div>
        <Card title="选择排班时段">
          <Select
            style={{ width: 320 }}
            placeholder="请选择要叫号的排班时段"
            onChange={handleSelectSchedule}
            options={schedules.map((s) => ({
              value: s.scheduleId,
              label: `${s.scheduleDate} ${s.amPm === 'AM' ? '上午' : '下午'} ${s.deptName || ''}（剩余 ${s.remainNum} 号）`
            }))}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>叫号系统</h2>
      </div>

      {currentSchedule && (
        <Card style={{ marginBottom: 16 }}>
          <Space size="large">
            <Statistic title="日期" value={currentSchedule.scheduleDate} />
            <Statistic title="时段" value={currentSchedule.amPm === 'AM' ? '上午' : '下午'} />
            {currentSchedule.deptName && (
              <Statistic title="科室" value={currentSchedule.deptName} />
            )}
            <Statistic
              title="剩余号源"
              value={currentSchedule.remainNum}
              valueStyle={{ color: currentSchedule.remainNum === 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Space>
        </Card>
      )}

      <Card
        title="当前叫号"
        style={{ marginBottom: 16, backgroundColor: currentPatient ? '#e6f7ff' : '#fff' }}
      >
        {currentPatient ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 56, fontWeight: 'bold', color: '#1890ff', marginBottom: 16 }}>
              {currentPatient.patientName}
            </div>
            <div style={{ marginBottom: 8 }}>
              <Tag color="blue" style={{ fontSize: 20, padding: '4px 16px' }}>
                订单号: {currentPatient.orderNo}
              </Tag>
            </div>
            <div style={{ marginTop: 24 }}>
              <Space size="large">
                <Button
                  type="primary"
                  icon={<SoundOutlined />}
                  size="large"
                  onClick={handleRecall}
                >
                  重新叫号
                </Button>
                <Button danger icon={<ForwardOutlined />} size="large" onClick={handleSkip}>
                  过号
                </Button>
                <Button icon={<FileTextOutlined />} size="large" onClick={handleViewRecord}>
                  填写病历
                </Button>
              </Space>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
            <div style={{ fontSize: 18 }}>暂无正在叫号的患者</div>
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleCallNext}
              style={{ marginTop: 16 }}
            >
              呼叫下一位
            </Button>
          </div>
        )}
      </Card>

      {currentPatient && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Button type="primary" loading={loading} onClick={handleCallNext}>
            呼叫下一位
          </Button>
        </div>
      )}

      {/* TODO: 后端暂无候诊队列明细接口，仅展示已叫号记录 */}
      <Card title={`已叫号记录 (${calledHistory.length}人)`}>
        <List
          dataSource={calledHistory}
          locale={{ emptyText: '尚未叫号' }}
          renderItem={(patient) => (
            <List.Item>
              <Space>
                <Tag color="green">{patient.patientName}</Tag>
                <span>{patient.orderNo}</span>
                <Button
                  type="link"
                  size="small"
                  onClick={() =>
                    navigate(`/doctor/medical-record/${patient.regId}`, {
                      state: { patientId: patient.patientId, patientName: patient.patientName }
                    })
                  }
                >
                  填写病历
                </Button>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default CallingSystem;
