import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { message } from 'antd';
import Home from '../Home';
import { hospitalApi } from '@/api/hospital';
import { doctorApi } from '@/api/doctor';
import type { PageResult, Hospital, Doctor } from '@/types';

vi.mock('@/api/hospital', () => ({
  hospitalApi: {
    hot: vi.fn()
  }
}));

vi.mock('@/api/doctor', () => ({
  doctorApi: {
    recommend: vi.fn()
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

const mockedHot = vi.mocked(hospitalApi.hot);
const mockedRecommend = vi.mocked(doctorApi.recommend);

const HOSPITALS: PageResult<Hospital> = {
  pageNum: 1,
  pageSize: 6,
  total: 2,
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
    },
    {
      hospitalId: 2,
      hospitalName: '上海瑞金医院',
      hospitalCode: 'RJH',
      level: '三甲',
      city: '上海',
      address: '上海市黄浦区瑞金二路197号',
      phone: '021-64370045',
      status: 1
    }
  ]
};

const DOCTORS: PageResult<Doctor> = {
  pageNum: 1,
  pageSize: 6,
  total: 2,
  pages: 1,
  list: [
    {
      doctorId: 1,
      userId: 10,
      hospitalId: 1,
      deptId: 1,
      name: '张医生',
      title: '主任医师',
      specialty: '心血管内科',
      regFee: 100,
      status: 1
    },
    {
      doctorId: 2,
      userId: 11,
      hospitalId: 1,
      deptId: 2,
      name: '李医生',
      title: '副主任医师',
      specialty: '神经内科',
      regFee: 80,
      status: 1
    }
  ]
};

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe('Home 患者首页', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it('渲染页面标题与副标题', () => {
    mockedHot.mockResolvedValue({ pageNum: 1, pageSize: 6, total: 0, pages: 0, list: [] });
    mockedRecommend.mockResolvedValue({ pageNum: 1, pageSize: 6, total: 0, pages: 0, list: [] });
    renderHome();
    expect(screen.getByText('热门医院')).toBeTruthy();
    expect(screen.getByText('推荐医生')).toBeTruthy();
  });

  it('加载后展示热门医院卡片（含等级标签）', async () => {
    mockedHot.mockResolvedValue(HOSPITALS);
    mockedRecommend.mockResolvedValue(DOCTORS);
    renderHome();
    expect(await screen.findByText('北京协和医院')).toBeTruthy();
    expect(screen.getByText('上海瑞金医院')).toBeTruthy();
    // 等级标签
    const levelTags = screen.getAllByText('三甲');
    expect(levelTags.length).toBeGreaterThanOrEqual(1);
    // 地址与电话
    expect(screen.getByText('北京市东城区帅府园1号')).toBeTruthy();
    expect(screen.getByText('010-69156114')).toBeTruthy();
  });

  it('加载后展示推荐医生卡片（含职称标签与挂号费）', async () => {
    mockedHot.mockResolvedValue(HOSPITALS);
    mockedRecommend.mockResolvedValue(DOCTORS);
    renderHome();
    expect(await screen.findByText('张医生')).toBeTruthy();
    expect(screen.getByText('李医生')).toBeTruthy();
    // 职称
    expect(screen.getByText('主任医师')).toBeTruthy();
    expect(screen.getByText('副主任医师')).toBeTruthy();
    // 挂号费
    expect(screen.getByText(/挂号费：¥100/)).toBeTruthy();
    expect(screen.getByText(/挂号费：¥80/)).toBeTruthy();
  });

  it('医院列表为空时展示空状态', async () => {
    mockedHot.mockResolvedValue({ pageNum: 1, pageSize: 6, total: 0, pages: 0, list: [] });
    mockedRecommend.mockResolvedValue(DOCTORS);
    renderHome();
    expect(await screen.findByText('暂无热门医院')).toBeTruthy();
  });

  it('医生列表为空时展示空状态', async () => {
    mockedHot.mockResolvedValue(HOSPITALS);
    mockedRecommend.mockResolvedValue({ pageNum: 1, pageSize: 6, total: 0, pages: 0, list: [] });
    renderHome();
    await screen.findByText('北京协和医院');
    expect(screen.getByText('暂无推荐医生')).toBeTruthy();
  });

  it('数据加载失败时提示错误', async () => {
    mockedHot.mockRejectedValue(new Error('network'));
    mockedRecommend.mockRejectedValue(new Error('network'));
    renderHome();
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载数据失败');
    });
  });
});
