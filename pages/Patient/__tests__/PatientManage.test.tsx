import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import dayjs from 'dayjs';
import PatientManage from '../PatientManage';
import { patientApi } from '@/api/patient';
import type { PageResult, Patient } from '@/types';

// mock 患者 API 模块
vi.mock('@/api/patient', () => ({
  patientApi: {
    profile: vi.fn(),
    bind: vi.fn(),
    update: vi.fn(),
    servicePatients: vi.fn()
  }
}));

// mock antd 静态消息方法（React 19 下静态渲染不可用，同时便于断言）
// 同时：
// 1. 禁用 Modal 的 CSS 动画（rc-motion 在 jsdom 中不会真正执行动画，
//    但仍会设置定时器等待动画完成，导致弹窗测试极慢甚至超时）
// 2. 将 DatePicker 替换为轻量 Input（DatePicker 内部包含日历组件，
//    在 jsdom 中渲染极慢，测试中只需保证表单字段能被 setFieldsValue 填充即可）
vi.mock('antd', async (importOriginal) => {
  const antd = (await importOriginal()) as Record<string, unknown>;
  const OriginalModal = antd.Modal as React.ComponentType<Record<string, unknown>>;
  const OriginalInput = antd.Input as React.ComponentType<Record<string, unknown>>;
  const ModalWithoutMotion = (props: Record<string, unknown>) => (
    <OriginalModal {...props} motion={false} />
  );
  const LightDatePicker = (props: Record<string, unknown>) => {
    // 用 Input 替代 DatePicker，保留 value/onChange 接口供 Form 收集
    const { value, onChange, placeholder, ...rest } = props;
    return (
      <OriginalInput
        {...rest}
        placeholder={(placeholder as string) || '请选择日期'}
        value={value ? (value as { format: (f: string) => string }).format('YYYY-MM-DD') : ''}
        onChange={(e: { target: { value: string } }) => {
          const onChangeFn = onChange as ((v: unknown) => void) | undefined;
          onChangeFn?.(e.target.value ? dayjs(e.target.value) : undefined);
        }}
      />
    );
  };
  // 用原生 select 替代 antd Select，使 fireEvent.change 能正常触发 Form 收集
  const LightSelect = (props: Record<string, unknown>) => {
    const { value, onChange, options, ...rest } = props;
    return (
      <select
        {...rest}
        value={value as string | number}
        onChange={(e: { target: { value: string } }) => (onChange as ((v: string | number) => void) | undefined)?.(Number(e.target.value))}
      >
        {(options as Array<{ value: number; label: string }>)?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };
  return {
    ...antd,
    Modal: ModalWithoutMotion,
    DatePicker: LightDatePicker,
    Select: LightSelect,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      open: vi.fn()
    }
  };
});

const mockedProfile = vi.mocked(patientApi.profile);
const mockedServicePatients = vi.mocked(patientApi.servicePatients);
const mockedBind = vi.mocked(patientApi.bind);
const mockedUpdate = vi.mocked(patientApi.update);

const PROFILE: Patient = {
  patientId: 1,
  realName: '张三',
  idCard: '110101199001010011',
  gender: 1,
  birthDate: '1990-01-01',
  phone: '13800000000'
};

const PATIENT_LIST: PageResult<Patient> = {
  pageNum: 1,
  pageSize: 10,
  total: 1,
  pages: 1,
  list: [
    {
      patientId: 2,
      realName: '李四',
      idCard: '110101199505050022',
      gender: 2,
      birthDate: '1995-05-05',
      phone: '13900000000'
    }
  ]
};

describe('PatientManage 就诊人管理', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it('加载后展示绑定患者信息与就诊人列表', async () => {
    mockedProfile.mockResolvedValue(PROFILE);
    mockedServicePatients.mockResolvedValue(PATIENT_LIST);
    render(<PatientManage />);
    expect(await screen.findByText('李四')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('姓名：张三')).toBeTruthy();
    });
    expect(screen.getByText('当前绑定的患者信息：')).toBeTruthy();
    expect(screen.getByText('性别：男')).toBeTruthy();
    expect(screen.getByText('女')).toBeTruthy();
    expect(mockedProfile).toHaveBeenCalledWith();
    expect(mockedServicePatients).toHaveBeenCalledWith({ pageNum: 1, pageSize: 10 });
  });

  it('profile 加载失败时静默处理，列表正常展示', async () => {
    mockedProfile.mockRejectedValue(new Error('未绑定就诊人'));
    mockedServicePatients.mockResolvedValue(PATIENT_LIST);
    render(<PatientManage />);
    expect(await screen.findByText('李四')).toBeTruthy();
    expect(screen.queryByText('当前绑定的患者信息：')).toBeNull();
  });

  it('空表单提交绑定弹窗被必填校验拦截', async () => {
    mockedProfile.mockRejectedValue(new Error('未绑定就诊人'));
    mockedServicePatients.mockResolvedValue(PATIENT_LIST);
    render(<PatientManage />);
    await screen.findByText('李四');
    fireEvent.click(screen.getByRole('button', { name: /绑定就诊人/ }));
    expect(await screen.findByPlaceholderText('请输入真实姓名')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(mockedBind).not.toHaveBeenCalled();
  });

  it('绑定表单填写完整后提交成功并刷新列表', async () => {
    mockedProfile.mockRejectedValue(new Error('未绑定就诊人'));
    mockedServicePatients.mockResolvedValue(PATIENT_LIST);
    mockedBind.mockResolvedValue(undefined);
    render(<PatientManage />);
    await screen.findByText('李四');

    fireEvent.click(screen.getByRole('button', { name: /绑定就诊人/ }));
    expect(await screen.findByPlaceholderText('请输入真实姓名')).toBeTruthy();

    // 填写必填字段
    fireEvent.change(screen.getByPlaceholderText('请输入真实姓名'), {
      target: { value: '王五' }
    });
    fireEvent.change(screen.getByPlaceholderText('请输入18位身份证号'), {
      target: { value: '110101200001011234' }
    });

    // 性别 Select（已 mock 为原生 select）与出生日期 DatePicker（已 mock 为 Input）
    // 弹窗中有两个 select（性别、关系），取倒数第二个为性别、最后一个为关系
    const comboboxes = screen.getAllByRole('combobox');
    const genderSelect = comboboxes[comboboxes.length - 2];
    fireEvent.change(genderSelect, { target: { value: '1' } });

    const dateInput = screen.getByPlaceholderText('请选择日期');
    fireEvent.change(dateInput, { target: { value: '2000-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(mockedBind).toHaveBeenCalledWith({
        realName: '王五',
        idCard: '110101200001011234',
        gender: 1,
        birthDate: '2000-01-01',
        relationship: '本人'
      });
    }, { timeout: 5000 });
    expect(message.success).toHaveBeenCalledWith('绑定就诊人成功');
  }, 40000);

  it('更新弹窗预填数据并提交成功', async () => {
    mockedProfile.mockRejectedValue(new Error('未绑定就诊人'));
    mockedServicePatients.mockResolvedValue(PATIENT_LIST);
    mockedUpdate.mockResolvedValue(undefined);
    render(<PatientManage />);
    await screen.findByText('李四');

    // 点击"更新信息"打开弹窗
    fireEvent.click(screen.getByRole('button', { name: '更新信息' }));
    expect(await screen.findByText('更新就诊人信息')).toBeTruthy();

    // 等待表单预填完成：姓名输入框应已填入"李四"
    // 这是关键：确保 setFieldsValue 已生效后再提交，避免在高负载下出现竞态
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('请输入真实姓名') as HTMLInputElement;
      expect(nameInput.value).toBe('李四');
    });

    // 提交表单
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledWith({
        realName: '李四',
        gender: 2,
        birthDate: '1995-05-05'
      });
    });
    expect(message.success).toHaveBeenCalledWith('更新就诊人成功');
  });
});
