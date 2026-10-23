import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { message } from 'antd';
import VisitService from '../VisitService';
import { patientApi } from '@/api/patient';

// mock 患者 API 模块
vi.mock('@/api/patient', () => ({
  patientApi: {
    waitingInfo: vi.fn(),
    evaluate: vi.fn()
  }
}));

// mock antd 静态消息方法（React 19 下静态渲染不可用，同时便于断言）
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

const mockedWaitingInfo = vi.mocked(patientApi.waitingInfo);
const mockedEvaluate = vi.mocked(patientApi.evaluate);

const ORDER_NO = 'REG20260916001';

const WAITING_INFO = {
  orderNo: ORDER_NO,
  visitTime: '2026-09-16 10:00:00',
  status: 'PAID',
  position: 3
};

describe('VisitService 就诊服务', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it('渲染标题与订单号输入区', () => {
    render(<VisitService />);
    expect(screen.getByText('就诊服务')).toBeTruthy();
    expect(screen.getByPlaceholderText(/请输入挂号订单号/)).toBeTruthy();
  });

  it('订单号为空时不调用查询接口', async () => {
    const user = userEvent.setup();
    render(<VisitService />);
    await user.click(screen.getByRole('button', { name: /查\s*询/ }));
    expect(message.warning).toHaveBeenCalledWith('请输入挂号订单号');
    expect(mockedWaitingInfo).not.toHaveBeenCalled();
  });

  it('查询成功后展示候诊信息与评价表单', async () => {
    const user = userEvent.setup();
    mockedWaitingInfo.mockResolvedValue(WAITING_INFO);
    render(<VisitService />);
    await user.type(screen.getByPlaceholderText(/请输入挂号订单号/), ORDER_NO);
    await user.click(screen.getByRole('button', { name: /查\s*询/ }));
    expect(mockedWaitingInfo).toHaveBeenCalledWith(ORDER_NO);
    expect(await screen.findByText('候诊信息')).toBeTruthy();
    expect(screen.getByText(ORDER_NO)).toBeTruthy();
    expect(screen.getByText('待就诊')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('就诊评价')).toBeTruthy();
  });

  it('查询失败时提示错误', async () => {
    const user = userEvent.setup();
    mockedWaitingInfo.mockRejectedValue(new Error('订单不存在'));
    render(<VisitService />);
    await user.type(screen.getByPlaceholderText(/请输入挂号订单号/), ORDER_NO);
    await user.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('候诊查询失败，请检查订单号');
    });
    expect(screen.queryByText('候诊信息')).toBeNull();
  });

  it('评价提交成功后展示完成提示', async () => {
    mockedWaitingInfo.mockResolvedValue(WAITING_INFO);
    mockedEvaluate.mockResolvedValue(undefined);
    render(<VisitService />);
    fireEvent.change(screen.getByPlaceholderText(/请输入挂号订单号/), {
      target: { value: ORDER_NO }
    });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await screen.findByText('就诊评价');

    // 评分 4 星并填写评价内容
    fireEvent.click(screen.getAllByRole('radio')[3]);
    fireEvent.change(screen.getByPlaceholderText('请描述本次就诊体验……'), {
      target: { value: '服务很好' }
    });
    fireEvent.click(screen.getByRole('button', { name: '提交评价' }));

    await waitFor(() => {
      expect(mockedEvaluate).toHaveBeenCalledWith({
        orderNo: ORDER_NO,
        rating: 4,
        comment: '服务很好'
      });
    });
    expect(await screen.findByText('本订单已完成评价，感谢您的反馈。')).toBeTruthy();
    expect(screen.queryByText('就诊评价')).toBeNull();
  });
});
