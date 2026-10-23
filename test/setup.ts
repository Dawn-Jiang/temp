import { vi } from 'vitest';
import { configure } from '@testing-library/react';

// 慢机环境下默认 1s 的 findBy* 超时不够用
configure({ asyncUtilTimeout: 4000 });

// jsdom 未实现 matchMedia，antd 组件（Grid/Select 等）依赖它
// 注意：这里必须是普通函数而非 vi.fn()，否则测试内 vi.resetAllMocks() 会把实现一并重置
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })
});

// antd Table/Select 等组件依赖 ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock
});

// 部分组件滚动定位依赖
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn()
});

// jsdom 未实现 getComputedStyle 的 pseudoElt 参数，antd/rc-util 测量滚动条时会调用，
// 导致大量 "Not implemented" 错误拖慢测试。返回空对象即可。
const originalGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = ((elt: Element, pseudoElt?: string | null) => {
  try {
    return originalGetComputedStyle(elt, pseudoElt);
  } catch {
    return {} as CSSStyleDeclaration;
  }
}) as typeof window.getComputedStyle;
