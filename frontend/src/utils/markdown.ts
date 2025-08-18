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
  
  // 保留所有换行符，只移除连续3个或更多的换行符
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
  
  // 移除行首的列表符号（* - + 及其后的空格）
  cleanContent = cleanContent.replace(/^[\*\-\+]\s+/gm, '');
  
  // 移除有序列表的数字编号（如 1. 2. 等）
  cleanContent = cleanContent.replace(/^\d+\.\s+/gm, '');
  
  // 检查是否包含Markdown标记（更全面的检测）
  // 注意：列表符号已在上面被移除，所以这里不再检测列表
  const hasMarkdown = /^#{1,6}\s/m.test(cleanContent) || // 标题（多行模式）
                     /\*\*.*?\*\*/.test(cleanContent) || // 加粗
                     /\*[^*\s].*?[^*]\*/.test(cleanContent) || // 斜体（避免与加粗冲突）
                     /__.*?__/.test(cleanContent) || // 下划线加粗
                     /_[^_\s].*?[^_]_/.test(cleanContent) || // 下划线斜体（避免单独的下划线）
                     /`.*?`/.test(cleanContent) || // 内联代码
                     /^```/m.test(cleanContent) || // 代码块（多行模式）
                     /^>/m.test(cleanContent) || // 引用（多行模式）
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
  
  // 用双换行符分割段落
  const paragraphTexts = escaped.split(/\n\n+/);
  const paragraphs: string[] = [];
  
  for (const paragraphText of paragraphTexts) {
    if (paragraphText.trim()) {
      // 将段落内的单换行符替换为<br>
      const lines = paragraphText.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length > 0) {
        paragraphs.push(`<p>${lines.join('<br>')}</p>`);
      }
    }
  }
  
  // 如果没有段落，返回空字符串
  if (paragraphs.length === 0) {
    return '';
  }
  
  // 在段落之间插入空段落作为间隔
  const result: string[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    result.push(paragraphs[i]);
    // 在非最后一个段落后添加空段落
    if (i < paragraphs.length - 1) {
      result.push('<p>&nbsp;</p>');
    }
  }
  
  return result.join('');
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