/**
 * 剪贴板工具函数
 * 提供兼容性更好的复制到剪贴板功能
 */

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 复制是否成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 优先使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // 降级方案：使用传统的 document.execCommand
    return fallbackCopyTextToClipboard(text);
  } catch (error) {
    console.warn('Clipboard API failed, trying fallback:', error);
    return fallbackCopyTextToClipboard(text);
  }
}

/**
 * 降级复制方案（兼容旧浏览器和非HTTPS环境）
 */
function fallbackCopyTextToClipboard(text: string): boolean {
  try {
    // 创建一个临时的 textarea 元素
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 设置样式以避免显示
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    
    // 添加到文档中
    document.body.appendChild(textArea);
    
    // 选中并复制
    textArea.focus();
    textArea.select();
    
    // 对于移动设备的兼容性
    if (textArea.setSelectionRange) {
      textArea.setSelectionRange(0, textArea.value.length);
    }
    
    // 执行复制命令
    const successful = document.execCommand('copy');
    
    // 清理
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
}

/**
 * 检查是否支持剪贴板功能
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText) || 
         document.queryCommandSupported?.('copy') === true;
}

/**
 * 复制文本并显示用户反馈
 * @param text 要复制的文本
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export async function copyWithFeedback(
  text: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  const success = await copyToClipboard(text);
  
  if (success) {
    onSuccess?.();
  } else {
    const errorMsg = '复制失败，请手动选择并复制文本';
    onError?.(errorMsg);
    console.error(errorMsg);
  }
}