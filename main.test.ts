import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM 环境下获取当前文件所在目录
const __dirname = dirname(fileURLToPath(import.meta.url));

describe('antd React 19 兼容补丁', () => {
  it('@ant-design/v5-patch-for-react-19 模块可正常导入且不抛错', async () => {
    await expect(import('@ant-design/v5-patch-for-react-19')).resolves.toBeDefined();
  });

  it('main.tsx 在 App 之前导入了 antd React 19 补丁', () => {
    const mainPath = resolve(__dirname, 'main.tsx');
    const content = readFileSync(mainPath, 'utf-8');

    const patchIndex = content.indexOf("@ant-design/v5-patch-for-react-19");
    const appIndex = content.indexOf("from './App.tsx'");

    expect(patchIndex).toBeGreaterThanOrEqual(0);
    expect(appIndex).toBeGreaterThanOrEqual(0);
    // 补丁导入必须在 App 导入之前
    expect(patchIndex).toBeLessThan(appIndex);
  });
});
