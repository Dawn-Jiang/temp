import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, message, Card, Typography } from 'antd';
import { hospitalApi } from '@/api/hospital';
import type { Hospital } from '@/api/hospital';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const HospitalList: React.FC = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const loadHospitals = (page = pageNum, size = pageSize) => {
    setLoading(true);
    hospitalApi.list({ pageNum: page, pageSize: size })
      .then((data) => {
        setHospitals(data.list);
        setTotal(data.total);
      })
      .catch(() => message.error('加载医院列表失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    hospitalApi.list({ pageNum: 1, pageSize: 10 })
      .then((data) => {
        if (!cancelled) {
          setHospitals(data.list);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('加载医院列表失败');
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

  const columns = [
    {
      title: '医院名称',
      dataIndex: 'hospitalName',
      key: 'hospitalName',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => <Tag color="blue">{level}</Tag>
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
      width: 140
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Hospital) => (
        <Space>
          <Button
            type="link"
            onClick={() => navigate(`/hospitals/${record.hospitalId}/doctors`)}
          >
            查看科室/医生
          </Button>
          <Button
            type="primary"
            onClick={() => navigate(`/hospitals/${record.hospitalId}/doctors`)}
          >
            预约医生
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>医院列表</Title>
        <Text type="secondary">浏览所有合作医院，选择适合您的就诊机构</Text>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={hospitals}
          rowKey="hospitalId"
          loading={loading}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 家医院`,
            onChange: (page, size) => {
              setPageNum(page);
              setPageSize(size);
              loadHospitals(page, size);
            }
          }}
        />
      </Card>
    </div>
  );
};

export default HospitalList;
