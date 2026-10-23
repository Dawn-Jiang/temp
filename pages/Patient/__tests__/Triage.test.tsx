import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { message } from 'antd';
import Triage from '../Triage';
import { patientApi } from '@/api/patient';

// mock 患者 API 模块
vi.mock('@/api/patient', () => ({
  patientApi: {
    triage: vi.fn()
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

const mockedTriage = vi.mocked(patientApi.triage);

const renderTriage = () =>
  render(
    <MemoryRouter>
      <Triage />
    </MemoryRouter>
  );

describe('Triage 智能导诊', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it('渲染标题、症状输入框与导诊按钮', () => {
    renderTriage();
    expect(screen.getByText('智能导诊')).toBeTruthy();
    expect(screen.getByPlaceholderText(/例如：最近三天持续头痛/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /开始导诊/ })).toBeTruthy();
  });

  it('症状为空时不调用导诊接口', async () => {
    const user = userEvent.setup();
    renderTriage();
    await user.click(screen.getByRole('button', { name: /开始导诊/ }));
    expect(message.warning).toHaveBeenCalledWith('请描述您的症状');
    expect(mockedTriage).not.toHaveBeenCalled();
  });

  it('导诊成功后展示下一步确认问题', async () => {
    const user = userEvent.setup();
    mockedTriage.mockResolvedValue({
      sessionId: 'session-1',
      status: 'IN_PROGRESS',
      currentQuestion: {
        key: 'duration',
        text: '您的头痛持续多久？',
        options: ['1天内', '1-3天', '3天以上']
      },
      recommendation: '请根据您的实际情况选择最接近的答案。'
    });
    renderTriage();
    await user.type(screen.getByRole('textbox'), '头痛发热');
    await user.click(screen.getByRole('button', { name: /开始导诊/ }));
    expect(mockedTriage).toHaveBeenCalledWith({ symptom: '头痛发热' });
    expect(await screen.findByText('您的头痛持续多久？')).toBeTruthy();
    expect(screen.getByText('1天内')).toBeTruthy();
  });

  it('导诊失败时提示错误且不展示结果', async () => {
    const user = userEvent.setup();
    mockedTriage.mockRejectedValue(new Error('服务不可用'));
    renderTriage();
    await user.type(screen.getByRole('textbox'), '腹痛');
    await user.click(screen.getByRole('button', { name: /开始导诊/ }));
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('智能导诊失败');
    });
    expect(screen.queryByText('推荐科室')).toBeNull();
  });
});
