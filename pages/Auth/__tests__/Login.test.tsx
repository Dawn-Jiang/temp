import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { message } from 'antd';
import Login from '../Login';
import { authApi } from '@/api/auth';
import { useUserStore } from '@/store/userStore';

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn()
  }
}));

vi.mock('@/store/userStore', () => ({
  useUserStore: vi.fn((selector?: (state: { setUserInfo: unknown }) => unknown) => {
    const state = { setUserInfo: vi.fn() };
    return selector ? selector(state) : state;
  })
}));

vi.mock('antd', async (importOriginal) => {
  const antd = (await importOriginal()) as Record<string, unknown>;
  return {
    ...antd,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      open: vi.fn()
    }
  };
});

const mockedLogin = vi.mocked(authApi.login);
const mockedUseUserStore = vi.mocked(useUserStore);

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login 登录页', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it('渲染系统标题与登录表单', () => {
    renderLogin();
    expect(screen.getByText('医疗挂号系统')).toBeTruthy();
    expect(screen.getByPlaceholderText('用户名')).toBeTruthy();
    expect(screen.getByPlaceholderText('密码')).toBeTruthy();
    expect(screen.getByRole('button', { name: '登 录' })).toBeTruthy();
  });

  it('展示测试账号信息', () => {
    renderLogin();
    expect(screen.getByText('测试账号')).toBeTruthy();
    expect(screen.getByText(/平台管理员: admin \/ admin123/)).toBeTruthy();
    expect(screen.getByText(/患者: patient_li \/ 123456/)).toBeTruthy();
  });

  it('空表单提交时不调用登录接口', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: '登 录' }));
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it('登录成功后调用 setUserInfo 并提示成功', async () => {
    const setUserInfo = vi.fn();
    mockedUseUserStore.mockImplementation(((selector?: (state: { setUserInfo: unknown }) => unknown) => {
      const state = { setUserInfo };
      return selector ? selector(state) : state;
    }) as never);
    mockedLogin.mockResolvedValue({
      token: 'fake-token',
      userId: 1,
      username: 'admin',
      userType: 'PLATFORM_ADMIN',
      realName: '管理员'
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('用户名'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('密码'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: '登 录' }));

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith({ username: 'admin', password: 'admin123' });
    });
    expect(setUserInfo).toHaveBeenCalledWith({
      token: 'fake-token',
      userId: 1,
      username: 'admin',
      userType: 'PLATFORM_ADMIN',
      realName: '管理员'
    });
    expect(message.success).toHaveBeenCalledWith('登录成功');
  });

  it('登录失败时提示错误', async () => {
    mockedLogin.mockRejectedValue(new Error('invalid credentials'));
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('用户名'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('密码'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: '登 录' }));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('登录失败');
    });
  });

  it('展示注册入口链接', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: '没有账号？立即注册' })).toBeTruthy();
  });
});
