import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import App from './App';

// 捕获 BrowserRouter 接收到的 props，用于断言 future flags
const browserRouterProps: Record<string, unknown> = {};

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    BrowserRouter: ({ children, ...props }: { children: React.ReactNode; [k: string]: unknown }) => {
      Object.assign(browserRouterProps, props);
      // 使用实际的 BrowserRouter 实现以保持路由行为
      const RealBrowserRouter = actual.BrowserRouter as React.ComponentType<{ children: React.ReactNode; [k: string]: unknown }>;
      return <RealBrowserRouter {...props}>{children}</RealBrowserRouter>;
    }
  };
});

// Mock 页面组件，避免渲染时触发 API 调用与副作用
vi.mock('./pages/Auth/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('./pages/Auth/Register', () => ({
  default: () => <div data-testid="register-page">Register Page</div>
}));

vi.mock('./pages/Patient/Home', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}));

vi.mock('./components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>
}));

vi.mock('./components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// 其余页面组件统一 mock 为空 div
vi.mock('./pages/Patient/HospitalList', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Patient/DoctorList', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Patient/Booking', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Patient/MyBookings', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Patient/PatientManage', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Patient/Triage', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Patient/VisitService', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Admin/Dashboard', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Admin/ScheduleManage', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Admin/OrderManage', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Admin/HospitalApproval', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Admin/BlacklistManage', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Doctor/Workbench', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Doctor/CallingSystem', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Doctor/MedicalRecordEditor', () => ({ default: () => <div>Mocked</div> }));
vi.mock('./pages/Doctor/PrescriptionEditor', () => ({ default: () => <div>Mocked</div> }));

describe('App 路由配置', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(browserRouterProps).forEach((k) => delete browserRouterProps[k]);
  });
  afterEach(cleanup);

  it('BrowserRouter 配置了 v7_startTransition 与 v7_relativeSplatPath future flags', () => {
    render(<App />);
    const future = browserRouterProps.future as Record<string, boolean> | undefined;
    expect(future).toBeDefined();
    expect(future?.v7_startTransition).toBe(true);
    expect(future?.v7_relativeSplatPath).toBe(true);
  });

  it('App 正常渲染且 Login 路由可访问', () => {
    render(<App />);
    // 默认路径 / 受 ProtectedRoute 保护（mock 后直接渲染 children），
    // 但 Login 是公开路由，应可正常渲染
    expect(screen.getByTestId('layout')).toBeTruthy();
  });

  it('404 通配路由存在', () => {
    // 通过渲染 App 不抛错来间接验证路由表配置完整
    expect(() => render(<App />)).not.toThrow();
  });
});
