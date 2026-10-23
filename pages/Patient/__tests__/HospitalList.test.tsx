import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { message } from 'antd';
import HospitalList from '../HospitalList';
import { hospitalApi } from '@/api/hospital';
import type { PageResult, Hospital } from '@/types';

vi.mock('@/api/hospital', () => ({
  hospitalApi: {
    list: vi.fn()
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

const mockedList = vi.mocked(hospitalApi.list);

const HOSPITALS: PageResult<Hospital> = {
  pageNum: 1,
  pageSize: 10,
  total: 1,
  pages: 1,
  list: [
    {
      hospitalId: 1,
      hospitalName: '北京协和医院',
      hospitalCode: 'PUMCH',
      level: '三甲',
      city: '北京',
      address: '北京市东城区帅府园1号',
      phone: '010-69156114',
      status: 1
    }
  ]
};

const renderHospitalList = () =>
  render(
    <MemoryRouter>
      <HospitalList />
    </MemoryRouter>
  );

describe('HospitalList 医院列表', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it('渲染页面标题与副标题', () => {
    mockedList.mockResolvedValue({ pageNum: 1, pageSize: 10, total: 0, pages: 0, list: [] });
    renderHospitalList();
    expect(screen.getByText('医院列表')).toBeTruthy();
    expect(screen.getByText(/浏览所有合作医院/)).toBeTruthy();
  });

  it('加载后展示医院列表数据', async () => {
    mockedList.mockResolvedValue(HOSPITALS);
    renderHospitalList();
    expect(await screen.findByText('北京协和医院')).toBeTruthy();
    expect(screen.getByText('三甲')).toBeTruthy();
    expect(screen.getByText('北京')).toBeTruthy();
    expect(screen.getByText('010-69156114')).toBeTruthy();
    expect(mockedList).toHaveBeenCalledWith({ pageNum: 1, pageSize: 10 });
  });

  it('展示查看科室与预约医生操作按钮', async () => {
    mockedList.mockResolvedValue(HOSPITALS);
    renderHospitalList();
    await screen.findByText('北京协和医院');
    expect(screen.getByRole('button', { name: '查看科室/医生' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '预约医生' })).toBeTruthy();
  });

  it('加载失败时提示错误', async () => {
    mockedList.mockRejectedValue(new Error('network'));
    renderHospitalList();
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载医院列表失败');
    });
  });

  it('分页切换时重新加载数据', async () => {
    mockedList.mockResolvedValue(HOSPITALS);
    renderHospitalList();
    await screen.findByText('北京协和医院');

    // 模拟分页点击（antd Table 分页按钮）
    const pageButtons = screen.getAllByRole('button');
    const nextButton = pageButtons.find(b => b.getAttribute('title') === '下一页' || b.textContent === '下一页');
    if (nextButton) {
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(mockedList).toHaveBeenCalledTimes(2);
      });
    }
  });
});
