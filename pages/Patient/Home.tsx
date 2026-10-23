import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, message, Empty, Button } from 'antd';
import { hospitalApi } from '@/api/hospital';
import { doctorApi } from '@/api/doctor';
import type { Hospital } from '@/api/hospital';
import type { Doctor } from '@/api/doctor';
import {
  EnvironmentOutlined,
  PhoneOutlined,
  MedicineBoxOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [hotHospitals, setHotHospitals] = useState<Hospital[]>([]);
  const [recommendDoctors, setRecommendDoctors] = useState<Doctor[]>([]);

  const loadData = async () => {
    try {
      const [hospitals, doctors] = await Promise.all([
        hospitalApi.hot({ limit: 6, pageNum: 1, pageSize: 6 }),
        doctorApi.recommend({ limit: 6, pageNum: 1, pageSize: 6 })
      ]);
      setHotHospitals(hospitals.list);
      setRecommendDoctors(doctors.list);
    } catch {
      message.error('加载数据失败');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page-container">
      {/* 热门医院 */}
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>热门医院</Title>
        <Text type="secondary">精选优质医院，为您的健康保驾护航</Text>
      </div>

      {hotHospitals.length === 0 ? (
        <Card><Empty description="暂无热门医院" /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {hotHospitals.map((hospital) => (
            <Col xs={24} sm={12} lg={8} key={hospital.hospitalId}>
              <Card hoverable className="stat-card">
                <Card.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{hospital.hospitalName}</span>
                      <span style={{
                        fontSize: 12,
                        color: '#1677ff',
                        background: '#e6f4ff',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        {hospital.level}
                      </span>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 12, color: '#595959', fontSize: 13 }}>
                      <div style={{ marginBottom: 6 }}>
                        <EnvironmentOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                        {hospital.address}
                      </div>
                      <div>
                        <PhoneOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                        {hospital.phone}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 推荐医生 */}
      <div className="page-header" style={{ marginTop: 32 }}>
        <Title level={3} style={{ margin: 0 }}>推荐医生</Title>
        <Text type="secondary">经验丰富的专家团队，为您提供专业诊疗</Text>
      </div>

      {recommendDoctors.length === 0 ? (
        <Card><Empty description="暂无推荐医生" /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {recommendDoctors.map((doctor) => (
            <Col xs={24} sm={12} lg={8} key={doctor.doctorId}>
              <Card hoverable className="stat-card">
                <Card.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{doctor.name}</span>
                      <span style={{
                        fontSize: 12,
                        color: '#722ed1',
                        background: '#f9f0ff',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        {doctor.title}
                      </span>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 12, color: '#595959', fontSize: 13 }}>
                      <div style={{ marginBottom: 6 }}>
                        <MedicineBoxOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                        {doctor.specialty}
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <DollarOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                        挂号费：¥{doctor.regFee}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => navigate(`/booking/${doctor.doctorId}`)}
                        >
                          预约挂号
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/hospitals/${doctor.hospitalId}/doctors`)}
                        >
                          查看医院
                        </Button>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Home;
