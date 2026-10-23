import React, { useEffect } from 'react';
import { Layout, notification } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useUserStore } from '@/store/userStore';
import { connectWebSocket, disconnectWebSocket } from '@/utils/websocket';

const { Content } = Layout;

/** 侧边栏固定宽度，需与 Sidebar.tsx 保持一致 */
const SIDER_WIDTH = 220;

const MainLayout: React.FC = () => {
  const token = useUserStore((state) => state.token);

  useEffect(() => {
    if (!token) {
      return undefined;
    }
    connectWebSocket(token, (n) => {
      notification.info({
        message: n.title,
        description: n.content,
        placement: 'topRight'
      });
    });
    return () => disconnectWebSocket();
  }, [token]);

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Sidebar width={SIDER_WIDTH} />
      <Layout style={{ marginLeft: SIDER_WIDTH }}>
        <Header />
        <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
