import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { message } from 'antd';
import Dashboard from '../Dashboard';
import { adminApi } from '@/api/admin';
import type { HospitalStatistics, PageResult, Registration } from '@/types';
import { RegistrationStatus } from '@/config';

vi.mock('@/api/admin', () => ({
  adminApi: {
    statistics: vi.fn(),
    orders: vi.fn()
  }
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

const mockedStatistics = vi.mocked(adminApi.statistics);
const mockedOrders = vi.mocked(adminApi.orders);

const STATS: HospitalStatistics = {
  totalRegistrations: 120,
  totalIncome: 3500.0,
  completedCount: 95,
  cancelledCount: 10
};

const ORDERS: PageResult<Registration> = {
  pageNum: 1,
  pageSize: 5,
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
      regStatus: RegistrationStatus.PAID,
      createTime: '2026-09-16 10:00:00'
    }
  ]
};

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe('Dashboard 数据看板', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it('渲染页面标题与副标题', async () => {
    mockedStatistics.mockResolvedValue(STATS);
    mockedOrders.mockResolvedValue(ORDERS);
    renderDashboard();
    // Dashboard 加载中显示 Spin，需等待数据加载完成
    await screen.findByText('挂号总数');
    const titleMatches = screen.getAllByText((_c, el) => Boolean(el?.textContent?.includes('数据看板')));
    expect(titleMatches.length).toBeGreaterThan(0);
    expect(screen.getByText(/医院运营数据概览/)).toBeTruthy();
  });

  it('展示四个核心统计指标卡片', async () => {
    mockedStatistics.mockResolvedValue(STATS);
    mockedOrders.mockResolvedValue(ORDERS);
    renderDashboard();

    expect(await screen.findByText('挂号总数')).toBeTruthy();
    expect(screen.getByText('总收入')).toBeTruthy();
    expect(screen.getByText('已完成')).toBeTruthy();
    expect(screen.getByText('已取消')).toBeTruthy();

    // 数值
    expect(screen.getByText('120')).toBeTruthy();
    expect(screen.getByText('95')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
  });

  it('展示完成率指标', async () => {
    mockedStatistics.mockResolvedValue(STATS);
    mockedOrders.mockResolvedValue(ORDERS);
    renderDashboard();
    expect(await screen.findByText('完成率')).toBeTruthy();
    // 95/120*100 = 79.2，antd Statistic 可能拆分整数与小数部分，父元素也包含该文本
    const matches = screen.getAllByText((_c, el) => Boolean(el?.textContent?.includes('79.2')));
    expect(matches.length).toBeGreaterThan(0);
  });

  it('展示最近挂号订单表格', async () => {
    mockedStatistics.mockResolvedValue(STATS);
    mockedOrders.mockResolvedValue(ORDERS);
    renderDashboard();
    expect(await screen.findByText('最近挂号订单')).toBeTruthy();
    expect(screen.getByText('张三')).toBeTruthy();
    expect(screen.getByText('张医生')).toBeTruthy();
  });

  it('总挂号数为0时完成率为0', async () => {
    mockedStatistics.mockResolvedValue({
      totalRegistrations: 0,
      totalIncome: 0,
      completedCount: 0,
      cancelledCount: 0
    });
    mockedOrders.mockResolvedValue({ pageNum: 1, pageSize: 5, total: 0, pages: 0, list: [] });
    renderDashboard();
    expect(await screen.findByText('完成率')).toBeTruthy();
    const matches = screen.getAllByText((_c, el) => Boolean(el?.textContent?.includes('0.0')));
    expect(matches.length).toBeGreaterThan(0);
  });

  it('数据加载失败时提示错误', async () => {
    mockedStatistics.mockRejectedValue(new Error('network'));
    mockedOrders.mockRejectedValue(new Error('network'));
    renderDashboard();
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载数据失败');
    });
  });
});
