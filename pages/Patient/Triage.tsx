import React, { useMemo, useState } from 'react';
import { Card, Input, Button, Tag, Typography, message, Space, Alert, Row, Col, Divider, Empty } from 'antd';
import { MedicineBoxOutlined, SendOutlined, WarningOutlined, ThunderboltOutlined, SafetyCertificateOutlined, StarFilled, BugOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { triageApi } from '@/api/triage';
import type { TriageQuestion, TriageResponse } from '@/types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const initialState: TriageResponse = {
  sessionId: null,
  status: 'INIT',
  symptomSummary: '',
  emergencyLevel: undefined,
  emergencyHint: undefined,
  department: null,
  departmentRecommendations: [],
  suggestion: null,
  careNotes: [],
  disclaimer: null,
  currentQuestion: null,
  bookingUrl: null,
  bookingHint: null
};

const levelConfig: Record<string, { color: string; icon: React.ReactNode; label: string; bg: string }> = {
  RED:    { color: 'red',    icon: <ThunderboltOutlined />,       label: '紧急！建议立即就医', bg: '#fff1f0' },
  YELLOW: { color: 'orange', icon: <WarningOutlined />,           label: '尽快就诊',          bg: '#fffbe6' },
  GREEN:  { color: 'green',  icon: <SafetyCertificateOutlined />,  label: '普通门诊',          bg: '#f6ffed' }
};

/** 智能导诊：多轮问答 + Top3 科室推荐 + 红旗症状预警 */
const Triage: React.FC = () => {
  const navigate = useNavigate();
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<TriageResponse>(initialState);

  const introHtml = useMemo(
    () => (session.status === 'IN_PROGRESS'
      ? '请根据您的实际情况选择最接近的答案，以便更准确判断。'
      : '请描述您的主要症状（如胸痛、发热、腹痛、头痛、呼吸困难等），系统将为您推荐合适的就诊科室。'),
    [session.status]
  );

  const syncResponse = (response: TriageResponse) => {
    setSession((prev) => ({
      ...prev,
      ...response,
      sessionId: response.sessionId ?? prev.sessionId,
      departmentRecommendations: response.departmentRecommendations ?? [],
      careNotes: response.careNotes ?? prev.careNotes ?? [],
      department: response.department ?? prev.department ?? null
    }));
  };

  const handleStart = async () => {
    if (!symptom.trim()) { message.warning('请描述您的症状'); return; }
    setLoading(true);
    try {
      const response = await triageApi.start({ symptom: symptom.trim() });
      syncResponse(response);
      if (response.emergencyLevel === 'RED') {
        message.error('🚨 检测到紧急症状！请立即前往急诊科或拨打 120！');
      } else if (response.emergencyLevel === 'YELLOW') {
        message.warning('建议尽快到医院就诊');
      }
    } catch {
      message.error('智能导诊失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (question: TriageQuestion, answer: string) => {
    if (!session.sessionId) return;
    setLoading(true);
    try {
      const response = await triageApi.answer({ sessionId: session.sessionId, questionKey: question.key, answer });
      syncResponse(response);
      if (response.emergencyLevel === 'RED') {
        message.error('🚨 检测到紧急症状！请立即前往急诊科或拨打 120！');
      }
    } catch {
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  const resetTriage = () => {
    setSymptom('');
    setSession(initialState);
  };

  const activeQuestion = session.status === 'IN_PROGRESS' ? session.currentQuestion : null;
  const cfg = session.emergencyLevel ? levelConfig[session.emergencyLevel as string] : null;

  return (
    <div className="page-container" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>
          <MedicineBoxOutlined /> 智能导诊
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>{introHtml}</Paragraph>
      </div>

      {/* RED 紧急警报横幅 */}
      {session.emergencyLevel === 'RED' && session.status !== 'INIT' && (
        <Alert
          type="error"
          showIcon
          icon={<ThunderboltOutlined />}
          message={<span style={{ fontWeight: 600 }}>🚨 紧急警告 — 建议立即前往急诊科或拨打 120</span>}
          description={session.emergencyHint || '系统检测到可能的红旗症状，请不要犹豫，立即就医！'}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        {/* 症状输入 */}
        {session.status === 'INIT' && (
          <>
            <TextArea
              rows={4}
              placeholder="例如：最近三天持续头痛，伴有低热、恶心……"
              value={symptom}
              maxLength={200}
              showCount
              onChange={(e) => setSymptom(e.target.value)}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={handleStart}
              style={{ marginTop: 16 }}
            >
              开始智能导诊
            </Button>
          </>
        )}

        {/* Top3 科室推荐（IN_PROGRESS 或 COMPLETED 都展示） */}
        {session.status !== 'INIT' && session.departmentRecommendations && session.departmentRecommendations.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 15 }}>
              <StarFilled style={{ color: '#faad14', marginRight: 6 }} />
              推荐就诊科室
            </div>
            <Row gutter={[12, 12]}>
              {session.departmentRecommendations.map((rec, idx) => {
                const isTop = idx === 0;
                const deptBg = cfg?.bg ?? '#fafafa';
                const deptBorder = cfg?.color ?? '#1677ff';
                return (
                  <Col xs={24} sm={8} key={rec.department + idx}>
                    <Card
                      size="small"
                      bordered
                      style={{
                        background: isTop ? deptBg : '#fafafa',
                        borderColor: isTop ? deptBorder : undefined
                      }}
                      title={
                        <Space>
                          {idx === 0 && <StarFilled style={{ color: '#faad14' }} />}
                          <Text strong={isTop}>{rec.department}</Text>
                        </Space>
                      }
                    >
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
                        匹配度：<Text strong>{rec.score}</Text>/10
                      </div>
                      {rec.reason && <div style={{ fontSize: 12, color: '#888' }}>{rec.reason}</div>}
                      {isTop && (
                        <Button type="link" size="small" style={{ padding: 0, marginTop: 4 }} onClick={() => navigate('/hospitals')}>
                          去挂号 →
                        </Button>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
            <Divider style={{ margin: '16px 0' }} />
          </div>
        )}

        {/* 多轮问答 */}
        {activeQuestion && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {session.symptomSummary && (
              <div style={{ color: '#666' }}>
                <BugOutlined style={{ marginRight: 6 }} />
                已知症状：「{session.symptomSummary}」
              </div>
            )}
            <div><Text strong>{activeQuestion.text}</Text></div>
            <Space direction="vertical" style={{ width: '100%' }}>
              {activeQuestion.options.map((option) => (
                <Button
                  key={option}
                  type="default"
                  style={{ width: '100%', textAlign: 'left', height: 'auto', padding: '10px 12px' }}
                  onClick={() => handleAnswer(activeQuestion, option)}
                  loading={loading}
                >
                  {option}
                </Button>
              ))}
            </Space>
            <Button type="link" onClick={resetTriage} style={{ paddingLeft: 0 }}>重新开始导诊</Button>
          </Space>
        )}

        {/* 问诊完成详情 */}
        {session.status === 'COMPLETED' && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {cfg && (
              <div
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.color}40`,
                  borderRadius: 8,
                  padding: 12
                }}
              >
                <Space>
                  <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                  <div>
                    <Text strong style={{ color: cfg.color, fontSize: 15 }}>{cfg.label}</Text>
                    {session.department && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                        建议挂：<Text strong>{session.department}</Text>
                      </div>
                    )}
                  </div>
                </Space>
              </div>
            )}

            {session.careNotes && session.careNotes.length > 0 && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>⚠️ 就诊前注意事项</div>
                <Space wrap>{session.careNotes.map((note) => <Tag color="blue" key={note}>{note}</Tag>)}</Space>
              </div>
            )}

            {session.suggestion && (
              <div style={{ lineHeight: 1.8, color: '#333' }}>
                <Text type="secondary">建议：</Text>{session.suggestion}
              </div>
            )}

            {session.disclaimer && (
              <Alert type="info" showIcon message={<Text type="secondary" style={{ fontSize: 12 }}>{session.disclaimer}</Text>} style={{ marginTop: 8 }} />
            )}

            <Space>
              <Button type="primary" onClick={() => navigate('/hospitals')}>前往医院挂号 →</Button>
              <Button onClick={resetTriage}>重新导诊</Button>
            </Space>
          </Space>
        )}

        {!activeQuestion && session.status !== 'INIT' && session.status !== 'COMPLETED' && (
          <Empty description="正在分析症状..." />
        )}
      </Card>
    </div>
  );
};

export default Triage;