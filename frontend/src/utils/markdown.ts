import { marked } from 'marked';

// 配置marked选项
marked.setOptions({
  breaks: true, // 支持单行换行
  gfm: true, // 支持GitHub风格的Markdown
});

/**
 * 将Markdown内容转换为HTML
 * @param markdown Markdown格式的内容
 * @returns HTML格式的内容
 */
export async function parseMarkdownToHtml(markdown: string): Promise<string> {
  if (!markdown) return '';
  
  try {
    // 使用marked解析Markdown
    const html = await marked(markdown.trim());
    return html;
  } catch (error) {
    console.error('Markdown解析失败:', error);
    // 如果解析失败，返回原始内容并进行基本的HTML转义
    return escapeHtml(markdown);
  }
}

/**
 * 清理和格式化MaxKB返回的内容
 * @param content MaxKB返回的原始内容
 * @returns 格式化后的HTML内容
 */
export async function formatMaxKbContent(content: string): Promise<string> {
  if (!content) return '';
  
  // 清理内容
  let cleanContent = content.trim();
  
  // 移除可能的多余空白行
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
  
  // 检查是否包含Markdown标记（更全面的检测）
  const hasMarkdown = /^#{1,6}\s/.test(cleanContent) || // 标题
                     /\*\*.*?\*\*/.test(cleanContent) || // 加粗
                     /\*[^*].*?[^*]\*/.test(cleanContent) || // 斜体（避免与加粗冲突）
                     /__.*?__/.test(cleanContent) || // 下划线加粗
                     /_.*?_/.test(cleanContent) || // 下划线斜体
                     /^\d+\.\s/.test(cleanContent) || // 有序列表
                     /^[-*+]\s/.test(cleanContent) || // 无序列表
                     /`.*?`/.test(cleanContent) || // 内联代码
                     /^```/.test(cleanContent) || // 代码块
                     /^>/.test(cleanContent) || // 引用
                     /\[.*?\]\(.*?\)/.test(cleanContent); // 链接
  
  if (hasMarkdown) {
    // 如果包含Markdown，解析为HTML
    return await parseMarkdownToHtml(cleanContent);
  } else {
    // 如果不包含Markdown，进行基本的文本格式化
    return formatPlainText(cleanContent);
  }
}

/**
 * 格式化纯文本内容
 * @param text 纯文本内容
 * @returns HTML格式的内容
 */
export function formatPlainText(text: string): string {
  if (!text) return '';
  
  // 转义HTML特殊字符
  const escaped = escapeHtml(text);
  
  // 将双换行符转换为段落
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`);
  
  return paragraphs.join('');
}

/**
 * HTML转义函数
 * @param text 要转义的文本
 * @returns 转义后的文本
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 移除HTML标签，获取纯文本
 * @param html HTML内容
 * @returns 纯文本内容
 */
export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
} 