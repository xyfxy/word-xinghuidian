/**
 * 获取应用配置
 * 优先级：
 * 1. 运行时配置（config.js - 如果存在）
 * 2. 构建时配置（.env文件）
 * 3. 默认值
 */
export function getConfig(key: string): string | boolean {
  // 1. 检查运行时配置（如果存在）
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
    const value = (window as any).APP_CONFIG[key];
    if (value !== undefined) {
      // 将字符串 "true"/"false" 转换为布尔值
      if (value === 'true' || value === true) return true;
      if (value === 'false' || value === false) return false;
      return value;
    }
  }
  
  // 2. 使用构建时配置
  const envValue = import.meta.env[key];
  if (envValue !== undefined) {
    // 将字符串 "true"/"false" 转换为布尔值
    if (envValue === 'true' || envValue === true) return true;
    if (envValue === 'false' || envValue === false) return false;
    return envValue;
  }
  
  // 3. 默认值
  if (key === 'VITE_ENABLE_DINGTALK_AUTH') return false;
  if (key === 'VITE_API_BASE_URL') return '/api';
  
  return '';
}

// 导出常用配置
export const isDingTalkAuthEnabled = () => getConfig('VITE_ENABLE_DINGTALK_AUTH') === true;
export const getApiBaseUrl = () => getConfig('VITE_API_BASE_URL') as string;