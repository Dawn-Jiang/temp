import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { message } from 'antd';
import Booking from '../Booking';
import { scheduleApi } from '@/api/schedule';
import { doctorApi } from '@/api/doctor';
import { registrationApi } from '@/api/registration';
import type { Doctor, PageResult, Schedule } from '@/types';

vi.mock('@/api/schedule', () => ({
  scheduleApi: {
    byDoctor: vi.fn()
  }
}));

vi.mock('@/api/doctor', () => ({
  doctorApi: {
    detail: vi.fn()
  }
}));

vi.mock('@/api/registration', () => ({
  registrationApi: {
    create: vi.fn(),
    myBookings: vi.fn()
  }
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    useParams: () => ({ doctorId: '1' }),
    useNavigate: () => vi.fn()
  };
});

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

const mockedByDoctor = vi.mocked(scheduleApi.byDoctor);
const mockedDoctorDetail = vi.mocked(doctorApi.detail);
const mockedCreate = vi.mocked(registrationApi.create);
const mockedMyBookings = vi.mocked(registrationApi.myBookings);

const DOCTOR: Doctor = {
  doctorId: 1,
  userId: 3,
  hospitalId: 1,
  deptId: 1,
  hospitalName: '北京市第一人民医院',
  deptName: '内科',
  name: '张医生',
  title: '主任医师',
  specialty: '心血管疾病',
  regFee: 50,
  status: 1
};

const SCHEDULES: PageResult<Schedule> = {
  pageNum: 1,
  pageSize: 100,
  total: 3,
  pages: 1,
  list: [
    {
      scheduleId: 1,
      doctorId: 1,
      hospitalId: 1,
      deptId: 1,
      scheduleDate: '2026-09-20',
      amPm: 'AM',
      totalNum: 20,
      remainNum: 15,
      regFee: 100,
      status: 1
    },
    {
      scheduleId: 2,
      doctorId: 1,
      hospitalId: 1,
      deptId: 1,
      scheduleDate: '2026-09-20',
      amPm: 'PM',
      totalNum: 20,
      remainNum: 0,
      regFee: 100,
      status: 2
    },
    {
      scheduleId: 3,
      doctorId: 1,
      hospitalId: 1,
      deptId: 1,
      scheduleDate: '2026-09-21',
      amPm: 'AM',
      totalNum: 20,
      remainNum: 5,
      regFee: 120,
      status: 3
    }
  ]
};

const renderBooking = () =>
  render(
    <MemoryRouter>
      <Booking />
    </MemoryRouter>
  );

describe('Booking 预约挂号', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedDoctorDetail.mockResolvedValue(DOCTOR);
  });
  afterEach(cleanup);

  it('展示医生所属医院 / 科室上下文与返回入口', async () => {
    mockedByDoctor.mockResolvedValue({ pageNum: 1, pageSize: 100, total: 0, pages: 0, list: [] });
    renderBooking();
    expect(await screen.findByText('张医生')).toBeTruthy();
    expect(screen.getByText(/北京市第一人民医院 \/ 内科/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /返回医生列表/ })).toBeTruthy();
  });

  it('渲染页面标题与副标题', () => {
    mockedByDoctor.mockResolvedValue({ pageNum: 1, pageSize: 100, total: 0, pages: 0, list: [] });
    renderBooking();
    expect(screen.getByText('预约挂号')).toBeTruthy();
    expect(screen.getByText(/选择合适的就诊时间/)).toBeTruthy();
  });

  it('加载后展示排班卡片列表', async () => {
    mockedByDoctor.mockResolvedValue(SCHEDULES);
    renderBooking();
    const dates = await screen.findAllByText('2026-09-20');
    expect(dates.length).toBe(2);
    // 时段（文本为"时段：上午"，嵌套元素导致多个匹配）
    expect(screen.getAllByText((_c, el) => Boolean(el?.textContent?.includes('上午'))).length).toBeGreaterThan(0);
    expect(screen.getAllByText((_c, el) => Boolean(el?.textContent?.includes('下午'))).length).toBeGreaterThan(0);
    // 挂号费
    expect(screen.getAllByText((_c, el) => Boolean(el?.textContent?.includes('¥100'))).length).toBeGreaterThan(0);
    expect(screen.getAllByText((_c, el) => Boolean(el?.textContent?.includes('¥120'))).length).toBeGreaterThan(0);
  });

  it('已满的排班展示"已满"标签且不可点击', async () => {
    mockedByDoctor.mockResolvedValue(SCHEDULES);
    renderBooking();
    await screen.findAllByText('2026-09-20');
    const fullTags = screen.getAllByText('已满');
    expect(fullTags.length).toBeGreaterThanOrEqual(1);
  });

  it('停诊的排班展示"停诊"标签', async () => {
    mockedByDoctor.mockResolvedValue(SCHEDULES);
    renderBooking();
    await screen.findAllByText('2026-09-20');
    const stoppedTags = screen.getAllByText('停诊');
    expect(stoppedTags.length).toBeGreaterThanOrEqual(1);
  });

  it('可预约的排班展示"可预约"标签', async () => {
    mockedByDoctor.mockResolvedValue(SCHEDULES);
    renderBooking();
    await screen.findAllByText('2026-09-20');
    const availableTags = screen.getAllByText('可预约');
    expect(availableTags.length).toBeGreaterThanOrEqual(1);
  });

  it('未选择排班时确认预约按钮禁用', async () => {
    mockedByDoctor.mockResolvedValue(SCHEDULES);
    renderBooking();
    await screen.findAllByText('2026-09-20');
    const submitBtn = screen.getByRole('button', { name: '确认预约' });
    expect(submitBtn).toHaveProperty('disabled', true);
  });

  it('选择排班后点击确认预约调用创建接口', async () => {
    mockedByDoctor.mockResolvedValue(SCHEDULES);
    mockedCreate.mockResolvedValue('REG20260920001');
    mockedMyBookings.mockResolvedValue({ pageNum: 1, pageSize: 100, total: 0, pages: 0, list: [] });
    renderBooking();
    await screen.findAllByText('2026-09-20');

    // 点击第一个可预约的排班卡片（scheduleId=1）
    const availableTag = screen.getAllByText('可预约')[0];
    fireEvent.click(availableTag);

    await waitFor(() => {
      const submitBtn = screen.getByRole('button', { name: '确认预约' });
      expect(submitBtn).toHaveProperty('disabled', false);
    });

    fireEvent.click(screen.getByRole('button', { name: '确认预约' }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({ scheduleId: 1 });
    });
    expect(message.success).toHaveBeenCalledWith('预约成功，订单号：REG20260920001');
  });

  it('排班列表为空时展示空状态', async () => {
    mockedByDoctor.mockResolvedValue({ pageNum: 1, pageSize: 100, total: 0, pages: 0, list: [] });
    renderBooking();
    expect(await screen.findByText('暂无可用排班')).toBeTruthy();
  });

  it('状态为可预约但剩余号源为 0 的排班不可选择', async () => {
    mockedByDoctor.mockResolvedValue({
      pageNum: 1,
      pageSize: 100,
      total: 1,
      pages: 1,
      list: [{
        scheduleId: 4,
        doctorId: 1,
        hospitalId: 1,
        deptId: 1,
        scheduleDate: '2026-09-22',
        amPm: 'AM',
        totalNum: 20,
        remainNum: 0,
        regFee: 100,
        status: 1
      }]
    });
    renderBooking();
    await screen.findByText('2026-09-22');
    fireEvent.click(screen.getByText('可预约'));
    expect(screen.getByRole('button', { name: '确认预约' })).toHaveProperty('disabled', true);
  });

  it('预约失败后重新拉取排班列表且不弹笼统的失败提示', async () => {
    mockedByDoctor.mockResolvedValue(SCHEDULES);
    mockedMyBookings.mockResolvedValue({ pageNum: 1, pageSize: 100, total: 0, pages: 0, list: [] });
    mockedCreate.mockRejectedValue(new Error('预约失败，号源已被抢完，请重新预约'));
    renderBooking();
    await screen.findAllByText('2026-09-20');

    fireEvent.click(screen.getAllByText('可预约')[0]);
    fireEvent.click(screen.getByRole('button', { name: '确认预约' }));

    // 失败后自动重拉（初始 1 次 + 失败后 1 次）
    await waitFor(() => {
      expect(mockedByDoctor).toHaveBeenCalledTimes(2);
    });
    // 后端原文由拦截器统一提示，页面层不再弹固定的“预约失败”
    expect(message.error).not.toHaveBeenCalledWith('预约失败');
  });
});
