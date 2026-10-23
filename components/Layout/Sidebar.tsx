import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  BankOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ClockCircleOutlined,
  AuditOutlined,
  StopOutlined,
  FormOutlined
} from '@ant-design/icons';
import { useUserStore } from '@/store/userStore';
import { UserType } from '@/config';

const { Sider } = Layout;

interface SidebarProps {
  width?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ width = 220 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userType } = useUserStore();

  const getMenuItems = () => {
    switch (userType) {
      case UserType.PATIENT:
        return [
          {
            key: '/',
            icon: <HomeOutlined />,
            label: '首页',
            onClick: () => navigate('/')
          },
          {
            key: '/hospitals',
            icon: <BankOutlined />,
            label: '医院列表',
            onClick: () => navigate('/hospitals')
          },
          {
            key: '/my-bookings',
            icon: <FileTextOutlined />,
            label: '我的挂号',
            onClick: () => navigate('/my-bookings')
          },
          {
            key: '/patient/manage',
            icon: <UserOutlined />,
            label: '就诊人管理',
            onClick: () => navigate('/patient/manage')
          },
          {
            key: '/patient/triage',
            icon: <MedicineBoxOutlined />,
            label: '智能导诊',
            onClick: () => navigate('/patient/triage')
          },
          {
            key: '/patient/visit-service',
            icon: <ClockCircleOutlined />,
            label: '就诊服务',
            onClick: () => navigate('/patient/visit-service')
          }
        ];

      // 管理端公共菜单（医院管理员 / 平台管理员）
      case UserType.PLATFORM_ADMIN:
      case UserType.HOSPITAL_ADMIN: {
        const adminItems = [
          {
            key: '/admin/dashboard',
            icon: <HomeOutlined />,
            label: '数据看板',
            onClick: () => navigate('/admin/dashboard')
          },
          {
            key: '/admin/schedule',
            icon: <CalendarOutlined />,
            label: '排班管理',
            onClick: () => navigate('/admin/schedule')
          },
          {
            key: '/admin/orders',
            icon: <FileTextOutlined />,
            label: '订单管理',
            onClick: () => navigate('/admin/orders')
          }
        ];
        // 平台管理员额外拥有医院审核与黑名单管理；医院管理员拥有医院入驻申请
        if (userType === UserType.PLATFORM_ADMIN) {
          adminItems.push(
            {
              key: '/admin/hospital-approval',
              icon: <AuditOutlined />,
              label: '医院审核',
              onClick: () => navigate('/admin/hospital-approval')
            },
            {
              key: '/admin/blacklist',
              icon: <StopOutlined />,
              label: '黑名单管理',
              onClick: () => navigate('/admin/blacklist')
            }
          );
        } else if (userType === UserType.HOSPITAL_ADMIN) {
          adminItems.push({
            key: '/admin/hospital-apply',
            icon: <FormOutlined />,
            label: '医院入驻',
            onClick: () => navigate('/admin/hospital-apply')
          });
        }
        return adminItems;
      }

      case UserType.DOCTOR:
        return [
          {
            key: '/doctor/workbench',
            icon: <HomeOutlined />,
            label: '工作台',
            onClick: () => navigate('/doctor/workbench')
          },
          {
            key: '/doctor/calling',
            icon: <TeamOutlined />,
            label: '叫号系统',
            onClick: () => navigate('/doctor/calling')
          }
        ];

      default:
        return [];
    }
  };

  return (
    <Sider
      width={width}
      theme="dark"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: '#0a2540',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.15)'
        }}
      >
        <BankOutlined style={{ color: '#fff', fontSize: 22, marginRight: 8 }} />
        <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>医疗挂号系统</span>
      </div>
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[location.pathname]}
        items={getMenuItems()}
        style={{ borderRight: 0, paddingTop: 8, background: '#0a2540' }}
      />
    </Sider>
  );
};

export default Sidebar;
