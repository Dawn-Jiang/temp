import { describe, expect, it } from 'vitest';

/**
 * 验证 src/test/setup.ts 中注入的 jsdom polyfill 是否生效。
 * 这些 polyfill 是 antd 组件在测试环境下正常运行的前提。
 */
describe('测试环境 polyfill', () => {
  it('getComputedStyle 在传入 pseudoElt 参数时不抛出异常', () => {
    const el = document.createElement('div');
    // jsdom 原生实现遇到 pseudoElt 会抛 "Not implemented"，
    // setup.ts 中已做 try/catch 兜底，应返回一个对象而非抛出
    expect(() => window.getComputedStyle(el, '::before')).not.toThrow();
    const result = window.getComputedStyle(el, '::before');
    expect(result).toBeDefined();
  });

  it('getComputedStyle 正常调用（无 pseudoElt）仍可返回 CSSStyleDeclaration', () => {
    const el = document.createElement('div');
    const style = window.getComputedStyle(el);
    expect(style).toBeDefined();
  });

  it('matchMedia 存在并返回匹配结果对象', () => {
    const result = window.matchMedia('(min-width: 768px)');
    expect(result).toBeDefined();
    expect(result.matches).toBe(false);
    expect(typeof result.addListener).toBe('function');
    expect(typeof result.removeListener).toBe('function');
  });

  it('ResizeObserver 存在且可实例化', () => {
    expect(window.ResizeObserver).toBeDefined();
    const ro = new window.ResizeObserver(() => {});
    expect(typeof ro.observe).toBe('function');
    expect(typeof ro.unobserve).toBe('function');
    expect(typeof ro.disconnect).toBe('function');
  });

  it('scrollTo 存在且为函数', () => {
    expect(typeof window.scrollTo).toBe('function');
    expect(() => window.scrollTo(0, 0)).not.toThrow();
  });
});
