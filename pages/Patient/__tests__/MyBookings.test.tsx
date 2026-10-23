import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Modal, message } from 'antd';
import MyBookings from '../MyBookings';
import { registrationApi } from '@/api/registration';
import { paymentApi } from '@/api/payment';
import type { PageResult, Registration } from '@/types';
import { RegistrationStatus } from '@/config';

vi.mock('@/api/registration', () => ({
  registrationApi: {
    myBookings: vi.fn(),
    cancel: vi.fn()
  }
}));

vi.mock('@/api/payment', () => ({
  paymentApi: {
    create: vi.fn()
  }
}));

// 禁用 Modal 动画，避免 rc-motion 定时器拖慢弹窗测试；同时保留 Modal.confirm 等静态方法
vi.mock('antd', async (importOriginal) => {
  const antd = (await importOriginal()) as Record<string, unknown>;
  const OriginalModal = antd.Modal as React.ComponentType<Record<string, unknown>> & Record<string, unknown>;
  const ModalWithoutMotion = (props: Record<string, unknown>) => (
    <OriginalModal {...props} motion={false} />
  );
  Object.assign(ModalWithoutMotion, OriginalModal);
  return {
    ...antd,
    Modal: ModalWithoutMotion,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      open: vi.fn()
    }
  };
});

const mockedMyBookings = vi.mocked(registrationApi.myBookings);
const mockedCancel = vi.mocked(registrationApi.cancel);
const mockedPayCreate = vi.mocked(paymentApi.create);

// 弹窗表单交互在完整套件高负载下可能超过默认 20s，放宽本文件用例超时
vi.setConfig({ testTimeout: 40_000 });

const BOOKINGS: PageResult<Registration> = {
  pageNum: 1,
  pageSize: 10,
  total: 2,
  pages: 1,
  list: [
    {
      regId: 1,
      orderNo: 'REG20260920001',
      patientId: 1,
      patientName: '张三',
      doctorId: 1,
      doctorName: '张医生',
      scheduleId: 1,
      scheduleDate: '2026-09-20',
      amPm: 'AM',
      regFee: 100,
      regStatus: RegistrationStatus.PENDING,
      createTime: '2026-09-16 10:00:00'
    },
    {
      regId: 2,
      orderNo: 'REG20260920002',
      patientId: 1,
      patientName: '张三',
      doctorId: 2,
      doctorName: '李医生',
      scheduleId: 2,
      scheduleDate: '2026-09-21',
      amPm: 'PM',
      regFee: 120,
      regStatus: RegistrationStatus.PAID,
      createTime: '2026-09-16 11:00:00'
    }
  ]
};

const renderMyBookings = () =>
  render(
    <MemoryRouter>
      <MyBookings />
    </MemoryRouter>
  );

describe('MyBookings 我的挂号', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it('渲染页面标题与副标题', () => {
    mockedMyBookings.mockResolvedValue({ pageNum: 1, pageSize: 10, total: 0, pages: 0, list: [] });
    renderMyBookings();
    expect(screen.getByText('我的挂号')).toBeTruthy();
    expect(screen.getByText(/查看您的挂号记录/)).toBeTruthy();
  });

  it('加载后展示挂号记录列表', async () => {
    mockedMyBookings.mockResolvedValue(BOOKINGS);
    renderMyBookings();
    expect(await screen.findByText('张医生')).toBeTruthy();
    expect(screen.getByText('李医生')).toBeTruthy();
    // 时段
    expect(screen.getByText('上午')).toBeTruthy();
    expect(screen.getByText('下午')).toBeTruthy();
    // 状态标签
    expect(screen.getByText('待支付')).toBeTruthy();
    expect(screen.getByText('已支付')).toBeTruthy();
    // 挂号费
    expect(screen.getByText('¥100')).toBeTruthy();
    expect(screen.getByText('¥120')).toBeTruthy();
  });

  it('待支付/已支付订单展示取消挂号按钮', async () => {
    mockedMyBookings.mockResolvedValue(BOOKINGS);
    renderMyBookings();
    await screen.findByText('张医生');
    const cancelButtons = screen.getAllByRole('button', { name: '取消挂号' });
    expect(cancelButtons.length).toBe(2);
  });

  it('点击取消挂号后弹出确认框并调用取消接口', async () => {
    mockedMyBookings.mockResolvedValue(BOOKINGS);
    mockedCancel.mockResolvedValue(undefined);

    // Mock Modal.confirm 自动确认
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((options) => {
      if (options.onOk) {
        options.onOk();
      }
      return {} as never;
    });

    renderMyBookings();
    await screen.findByText('张医生');

    fireEvent.click(screen.getAllByRole('button', { name: '取消挂号' })[0]);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockedCancel).toHaveBeenCalledWith(1, '个人原因');
    });
    expect(message.success).toHaveBeenCalledWith('取消成功');

    confirmSpy.mockRestore();
  });

  it('取消失败时提示错误', async () => {
    mockedMyBookings.mockResolvedValue(BOOKINGS);
    mockedCancel.mockRejectedValue(new Error('cancel failed'));

    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((options) => {
      if (options.onOk) {
        options.onOk();
      }
      return {} as never;
    });

    renderMyBookings();
    await screen.findByText('张医生');

    fireEvent.click(screen.getAllByRole('button', { name: '取消挂号' })[0]);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('取消失败');
    });

    confirmSpy.mockRestore();
  });

  it('加载失败时提示错误', async () => {
    mockedMyBookings.mockRejectedValue(new Error('network'));
    renderMyBookings();
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载挂号记录失败');
    });
  });

  it('点击结算支付弹出结算弹窗并展示支付方式与密码输入', async () => {
    mockedMyBookings.mockResolvedValue(BOOKINGS);
    renderMyBookings();
    await screen.findByText('张医生');

    fireEvent.click(screen.getByRole('button', { name: '结算支付' }));

    expect(await screen.findByText('微信支付')).toBeTruthy();
    expect(screen.getByText('支付宝')).toBeTruthy();
    expect(screen.getByPlaceholderText('请输入 6 位支付密码')).toBeTruthy();
  });

  it('未输入支付密码时阻止提交并提示', async () => {
    mockedMyBookings.mockResolvedValue(BOOKINGS);
    renderMyBookings();
    await screen.findByText('张医生');

    fireEvent.click(screen.getByRole('button', { name: '结算支付' }));
    await screen.findByPlaceholderText('请输入 6 位支付密码');

    fireEvent.click(screen.getByRole('button', { name: '确认支付' }));

    await waitFor(() => {
      expect(screen.getByText('请输入支付密码')).toBeTruthy();
    }, { timeout: 8000 });
    expect(mockedPayCreate).not.toHaveBeenCalled();
  }, 40000);

  it('支付密码格式错误时提示 6 位数字', async () => {
    mockedMyBookings.mockResolvedValue(BOOKINGS);
    renderMyBookings();
    await screen.findByText('张医生');

    fireEvent.click(screen.getByRole('button', { name: '结算支付' }));
    const pwd = await screen.findByPlaceholderText('请输入 6 位支付密码');
    fireEvent.change(pwd, { target: { value: 'abc' } });

    fireEvent.click(screen.getByRole('button', { name: '确认支付' }));

    await waitFor(() => {
      expect(screen.getByText('支付密码为 6 位数字')).toBeTruthy();
    }, { timeout: 8000 });
    expect(mockedPayCreate).not.toHaveBeenCalled();
  }, 40000);

  it('输入正确支付密码后按支付方式提交结算并刷新列表', async () => {
    mockedMyBookings.mockResolvedValue(BOOKINGS);
    mockedPayCreate.mockResolvedValue({
      payNo: 'PAY20261007001',
      regId: 1,
      amount: 100,
      payChannel: 'WECHAT',
      payStatus: 'SUCCESS'
    });
    renderMyBookings();
    await screen.findByText('张医生');

    fireEvent.click(screen.getByRole('button', { name: '结算支付' }));
    const pwd = await screen.findByPlaceholderText('请输入 6 位支付密码');
    fireEvent.change(pwd, { target: { value: '123456' } });

    fireEvent.click(screen.getByRole('button', { name: '确认支付' }));

    await waitFor(() => {
      expect(mockedPayCreate).toHaveBeenCalledWith({
        regId: 1,
        payChannel: 'WECHAT',
        payPassword: '123456'
      });
    }, { timeout: 8000 });
    expect(message.success).toHaveBeenCalledWith('支付成功');
    // 提交成功后重新拉取挂号列表
    expect(mockedMyBookings.mock.calls.length).toBeGreaterThan(1);
  });
});
