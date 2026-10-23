import React from 'react';
import type { MenuProps } from 'antd';
import { Layout, Space, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { UserRoleNames } from '@/config';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { realName, userType, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#0a2540',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
        {userType ? UserRoleNames[userType] : ''}工作台
      </div>

      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }} size={12}>
          <Avatar
            style={{ backgroundColor: '#3d7eff' }}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500, lineHeight: 1.4, color: '#fff' }}>{realName}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
              {userType ? UserRoleNames[userType] : ''}
            </div>
          </div>
        </Space>
      </Dropdown>
    </AntHeader>
  );
};

export default Header;
