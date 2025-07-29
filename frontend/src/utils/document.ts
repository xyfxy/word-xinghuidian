import { DocumentTemplate, ContentBlock, DocumentFormat, ImageContent, PageBreakContent, TableContent, TableCell } from '../types';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  PageBreak
} from 'docx';
import { saveAs } from 'file-saver';
import { convertHTMLToDocxParagraphs } from './htmlToDocx';

// 生成唯一ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// 创建默认模板
export const createDefaultTemplate = (): DocumentTemplate => {
  const now = new Date();
  const timeString = now.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/[\s/:]/g, '');
  
  return {
    id: generateId(),
    name: `新建模板_${timeString}`,
    description: '这是一个新的文档模板',
    format: {
      font: {
        family: '宋体',
        size: 12,
        color: '#000000',
        bold: false,
        italic: false,
        underline: false,
      },
      paragraph: {
        lineHeight: 1.5,
        paragraphSpacing: 0,
        spaceBefore: 0,
        indent: {
          firstLine: 0,
          firstLineUnit: 'pt',
          left: 0,
          leftUnit: 'pt',
          right: 0,
          rightUnit: 'pt',
        },
        alignment: 'left',
      },
      page: {
        width: 595,
        height: 842,
        margins: {
          top: 72,      // 2.54cm
          bottom: 72,   // 2.54cm
          left: 90.14,  // 3.18cm
          right: 90.14, // 3.18cm
        },
        orientation: 'portrait',
      },
    },
    content: [],
    createdAt: now,
    updatedAt: now,
  };
};

// 创建默认内容块
export const createDefaultContentBlock = (type: 'text' | 'ai-generated' | 'two-column' | 'image' | 'page-break' | 'table', position: number): ContentBlock => {
  if (type === 'two-column') {
    return {
      id: generateId(),
      type: 'two-column',
      title: '双栏文本',
      content: { left: '左侧文本', right: '右侧文本' },
      format: {
        useGlobalFormat: false, // 默认使用自定义格式
      },
      position,
    };
  }

  if (type === 'image') {
    return {
      id: generateId(),
      type: 'image',
      title: '图片',
      content: {
        src: '',
        alt: '图片描述',
        alignment: 'auto', // 默认自适应
        width: 200,
        height: 150,
        maxWidth: 600,
        maxHeight: 400,
        caption: '',
        border: {
          enabled: false,
          color: '#000000',
          width: 1,
          style: 'solid'
        }
      } as ImageContent,
      format: {
        useGlobalFormat: true,
      },
      position,
    };
  }

  if (type === 'page-break') {
    return {
      id: generateId(),
      type: 'page-break',
      title: '换页',
      content: {
        type: 'page-break',
        settings: {
          addBlankPage: false,
          pageOrientation: 'portrait'
        }
      } as PageBreakContent,
      format: {
        useGlobalFormat: true,
      },
      position,
    };
  }

  if (type === 'table') {
    return {
      id: generateId(),
      type: 'table',
      title: '表格',
      content: {
        rows: [
          [
            { content: '标题1' },
            { content: '标题2' },
            { content: '标题3' }
          ],
          [
            { content: '内容1' },
            { content: '内容2' },
            { content: '内容3' }
          ],
          [
            { content: '内容4' },
            { content: '内容5' },
            { content: '内容6' }
          ]
        ],
        style: {
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#000000',
          cellPadding: 8,
          cellSpacing: 0,
          width: 'full',
          headerRows: 1,
          headerStyle: {
            backgroundColor: '#f0f0f0',
            fontBold: true,
            textAlign: 'center'
          }
        }
      } as TableContent,
      format: {
        useGlobalFormat: true,
      },
      position,
    };
  }

  const block: ContentBlock = {
    id: generateId(),
    type,
    content: type === 'text' ? '请输入内容...' : '',
    format: {
      useGlobalFormat: true,
      style: 'normal',
    },
    position,
    title: type === 'ai-generated' ? 'AI生成内容' : '固定内容',
    aiPrompt: type === 'ai-generated' ? '请输入AI生成提示词...' : undefined,
  };

  // 注意：AI块的aiSettings将在EditorPage的handleAddContentBlock中设置
  // 这确保每个AI块都有独立的设置副本，不会共享引用
  
  return block;
};



// 将边框样式转换为docx格式
const getBorderStyle = (style: 'none' | 'single' | 'double' | 'thickThin' | undefined) => {
  switch (style) {
    case 'double':
      return BorderStyle.DOUBLE;
    case 'thickThin':
      // Based on user feedback, the border was inverted.
      // This style should produce the desired thick-over-thin effect.
      return BorderStyle.THIN_THICK_MEDIUM_GAP;
    case 'single':
    default:
      return BorderStyle.SINGLE;
  }
}

// Word字体名称映射 - 保持原字体名称以确保完全匹配
const FONT_NAME_MAP: { [key: string]: string } = {
  // 基础中文字体
  '宋体': 'SimSun',
  '新宋体': 'NSimSun',
  '仿宋': 'FangSong',  // 仿宋保持为FangSong
  '仿宋_GB2312': '仿宋_GB2312', // 仿宋_GB2312保持原名称
  '楷体': 'KaiTi',
  '楷体_GB2312': 'KaiTi_GB2312',
  '黑体': 'SimHei',
  
  // 微软字体
  '微软雅黑': 'Microsoft YaHei',
  '微软雅黑 Light': 'Microsoft YaHei Light',
  '微软雅黑 UI': 'Microsoft YaHei UI',
  
  // 华文字体
  '华文宋体': 'STSong',
  '华文仿宋': 'STFangsong',
  '华文楷体': 'STKaiti',
  '华文细黑': 'STXihei',
  '华文黑体': 'STHeiti',
  '华文中宋': 'STZhongsong',
  '华文彩云': 'STCaiyun',
  '华文琥珀': 'STHupo',
  '华文新魏': 'STXinwei',
  '华文隶书': 'STLiti',
  '华文行楷': 'STXingkai',
  
  // 方正字体
  '方正姚体': 'FZYaoti',
  '方正舒体': 'FZShuTi',
  '方正粗黑宋简体': 'FZCuHeiSongS-B-GB',
  
  // 其他中文字体
  '隶书': 'LiSu',
  '幼圆': 'YouYuan',
  '等线': 'DengXian',
  '等线 Light': 'DengXian Light',
};

// 剥离HTML标签，返回纯文本
// const stripHtml = (html: string): string => {
//   if (!html) return '';
//   const div = document.createElement('div');
//   div.innerHTML = html;
//   return div.textContent || div.innerText || '';
// };

// 单位转换辅助函数 (cm, px, char to pt)
const convertUnitToPt = (value: number, unit: 'pt' | 'cm' | 'px' | 'char' | undefined, fontSize: number = 12): number => {
  if (value === 0) return 0;
  
  // 1 inch = 72 pt = 2.54 cm = 96 px (CSS)
  switch (unit) {
    case 'cm':
      return value * (72 / 2.54); // cm to pt
    case 'px':
      return value * (72 / 96); // px to pt
    case 'char':
      // 估算一个中文字符宽度约等于字体大小
      return value * fontSize;
    case 'pt':
    default:
      return value;
  }
};

// 创建段落
const createParagraphs = (block: ContentBlock, defaultFormat: DocumentFormat): Paragraph[] => {
  if (typeof block.content !== 'string') {
    return [];
  }

  // 使用新的HTML转换函数，它会处理用户格式设置优先级
  return convertHTMLToDocxParagraphs(block.content, defaultFormat, block.format);
};

// 导出Word文档
export const exportToWord = async (template: DocumentTemplate): Promise<void> => {
  try {
    // 按position排序内容块
    const sortedContent = [...template.content].sort((a, b) => a.position - b.position);
    
    // 创建段落或表格，一个内容块可能包含多个段落
    const docxElements = sortedContent.flatMap(block => {
      // 处理图片块
      if (block.type === 'image' && typeof block.content === 'object' && 'src' in block.content) {
        const imageContent = block.content as ImageContent;
        
        // 如果没有图片源，返回空数组
        if (!imageContent.src) {
          return [];
        }

        try {
          // 获取图片对齐方式
          let alignment: any = AlignmentType.LEFT;
          if (imageContent.alignment === 'center') alignment = AlignmentType.CENTER;
          if (imageContent.alignment === 'right') alignment = AlignmentType.RIGHT;
          if (imageContent.alignment === 'auto') alignment = AlignmentType.CENTER;

          // 处理自适应宽度
          let exportWidth = imageContent.width || 200;
          let exportHeight = imageContent.height || 150;

          if (imageContent.alignment === 'auto') {
            // 页面内容区宽度 = 页面宽度 - 左右边距
            const pageWidth = template.format.page.width || 595;
            const marginLeft = template.format.page.margins.left || 72;
            const marginRight = template.format.page.margins.right || 72;
            const contentWidth = pageWidth - marginLeft - marginRight;
            // maxWidth优先
            exportWidth = imageContent.maxWidth ? Math.min(imageContent.maxWidth, contentWidth) : contentWidth;
            // 高度等比缩放（如果原始宽高有值）
            if (imageContent.width && imageContent.height) {
              const ratio = exportWidth / imageContent.width;
              exportHeight = Math.round(imageContent.height * ratio);
            } else {
              exportHeight = imageContent.maxHeight || 300;
            }
          }

          // 创建图片段落
          const imageParagraph = new Paragraph({
            alignment,
            children: [
              new ImageRun({
                data: imageContent.src,
                transformation: {
                  width: exportWidth,
                  height: exportHeight,
                },
              }),
            ],
            spacing: {
              after: 240, // 图片后添加一些间距
            },
          });

          const elements = [imageParagraph];

          // 如果有图片标题，添加标题段落
          if (imageContent.caption) {
            const captionParagraph = new Paragraph({
              alignment,
              children: [
                new TextRun({
                  text: imageContent.caption,
                  italics: true,
                  size: 20, // 10pt
                  color: '666666',
                }),
              ],
              spacing: {
                after: 240,
              },
            });
            elements.push(captionParagraph);
          }

          return elements;
        } catch (error) {
          console.warn('图片处理失败，跳过该图片块:', error);
          return [];
        }
      }

      // 处理换页块
      if (block.type === 'page-break' && typeof block.content === 'object' && 'type' in block.content) {
        const pageBreakContent = block.content as PageBreakContent;
        
        // 创建换页段落
        const pageBreakParagraph = new Paragraph({
          children: [new PageBreak()],
        });

        const elements = [pageBreakParagraph];

        // 如果需要添加空白页
        if (pageBreakContent.settings.addBlankPage) {
          elements.push(new Paragraph({
            children: [new PageBreak()],
          }));
        }

        return elements;
      }

      // 处理表格块
      if (block.type === 'table' && typeof block.content === 'object' && 'rows' in block.content) {
        const tableContent = block.content as TableContent;
        const style = tableContent.style || {};
        
        // 获取表格宽度
        let tableWidth = { size: 100, type: WidthType.PERCENTAGE };
        if (style.width === 'auto') {
          tableWidth = { size: 5000, type: WidthType.DXA }; // 自动宽度
        } else if (typeof style.width === 'number') {
          tableWidth = { size: style.width * 20, type: WidthType.DXA }; // 固定宽度
        }

        // 创建表格行
        const rows = tableContent.rows.map((row, rowIndex) => {
          const isHeaderRow = style.headerRows && rowIndex < style.headerRows;
          
          return new TableRow({
            children: row.map(cell => {
              // 跳过隐藏的单元格（已被合并）
              if (cell.hidden) {
                return null;
              }
              
              const cellStyle = cell.style || {};
              const shouldUseGlobal = block.format?.useGlobalFormat !== false;
              const fontSettings = shouldUseGlobal
                ? template.format.font
                : { ...template.format.font, ...block.format.font };

              // 合并单元格样式
              const textAlign = cellStyle.textAlign || 
                (isHeaderRow ? style.headerStyle?.textAlign : undefined) || 
                'left';
              
              const backgroundColor = cellStyle.backgroundColor || 
                (isHeaderRow ? style.headerStyle?.backgroundColor : undefined);

              const isBold = fontSettings.bold || 
                (isHeaderRow ? style.headerStyle?.fontBold : false);

              // 创建单元格内容
              const paragraph = new Paragraph({
                children: [
                  new TextRun({
                    text: cell.content,
                    font: { name: FONT_NAME_MAP[fontSettings.family] || fontSettings.family, hint: 'eastAsia' },
                    size: fontSettings.size * 2,
                    color: fontSettings.color.replace('#', ''),
                    bold: isBold,
                    italics: fontSettings.italic,
                    underline: fontSettings.underline ? {} : undefined,
                  }),
                ],
                alignment: textAlign === 'center' ? AlignmentType.CENTER : 
                          textAlign === 'right' ? AlignmentType.RIGHT : 
                          AlignmentType.LEFT,
              });

              // 创建表格单元格
              const tableCell = new TableCell({
                children: [paragraph],
                columnSpan: cell.colspan,
                rowSpan: cell.rowspan,
                verticalAlign: cellStyle.verticalAlign?.toUpperCase() as any || 'TOP',
                margins: style.cellPadding ? {
                  top: style.cellPadding * 20,
                  bottom: style.cellPadding * 20,
                  left: style.cellPadding * 20,
                  right: style.cellPadding * 20,
                } : undefined,
                shading: backgroundColor ? {
                  fill: backgroundColor.replace('#', ''),
                } : undefined,
              });

              return tableCell;
            }).filter(cell => cell !== null),
          });
        });

        // 边框样式
        const borderStyle = style.borderStyle === 'none' ? BorderStyle.NONE :
                          style.borderStyle === 'dashed' ? BorderStyle.DASHED :
                          style.borderStyle === 'dotted' ? BorderStyle.DOTTED :
                          BorderStyle.SINGLE;
        
        const borderSize = (style.borderWidth || 1) * 8;
        const borderColor = (style.borderColor || '#000000').replace('#', '');

        // 创建表格
        const table = new Table({
          width: tableWidth,
          rows,
          borders: style.borderStyle !== 'none' ? {
            top: { style: borderStyle, size: borderSize, color: borderColor },
            bottom: { style: borderStyle, size: borderSize, color: borderColor },
            left: { style: borderStyle, size: borderSize, color: borderColor },
            right: { style: borderStyle, size: borderSize, color: borderColor },
            insideHorizontal: { style: borderStyle, size: borderSize, color: borderColor },
            insideVertical: { style: borderStyle, size: borderSize, color: borderColor },
          } : {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
        });

        return [table];
      }

      // 处理双栏文本
      if (block.type === 'two-column' && typeof block.content === 'object' && 'left' in block.content) {
        const content = block.content as { left: string, right: string };
        
        const shouldUseGlobal = block.format?.useGlobalFormat !== false;
        const fontSettings = shouldUseGlobal
          ? template.format.font
          : { ...template.format.font, ...block.format.font };

        const paragraphSettings = shouldUseGlobal
          ? template.format.paragraph
          : { 
              ...template.format.paragraph, 
              ...block.format.paragraph, 
              indent: { 
                ...template.format.paragraph.indent, 
                ...block.format.paragraph?.indent 
              } 
            };
        
        const ratio = block.format.columnRatio || 0.5;
        // Assuming a total of 9000 units for 100% width in a table
        const totalWidth = 9000;
        const leftWidth = totalWidth * ratio;
        const rightWidth = totalWidth * (1 - ratio);

        const indent = paragraphSettings.indent;
        const fontSize = fontSettings.size;
        const border = paragraphSettings.border?.bottom;
        
        const createCellParagraph = (text: string, alignment: typeof AlignmentType[keyof typeof AlignmentType]): Paragraph => {
          const textRun = new TextRun({
              text,
              font: { name: FONT_NAME_MAP[fontSettings.family] || fontSettings.family, hint: 'eastAsia' },
              size: fontSettings.size * 2,
              color: fontSettings.color.replace('#', ''),
              bold: fontSettings.bold,
              italics: fontSettings.italic,
              underline: fontSettings.underline ? {} : undefined,
          });

          return new Paragraph({
              children: [textRun],
              alignment: alignment,
              spacing: {
                  line: Math.round(paragraphSettings.lineHeight * 240),
                  after: paragraphSettings.paragraphSpacing * 20,
                  before: paragraphSettings.spaceBefore * 20,
              },
              indent: {
                  firstLine: convertUnitToPt(indent.firstLine, indent.firstLineUnit, fontSize) * 20,
                  left: convertUnitToPt(indent.left, indent.leftUnit, fontSize) * 20,
                  right: convertUnitToPt(indent.right, indent.rightUnit, fontSize) * 20,
              },
          });
        };

        const rows = [
          new TableRow({
            children: [
              new TableCell({
                children: [createCellParagraph(content.left, AlignmentType.LEFT)],
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              }),
              new TableCell({
                children: [createCellParagraph(content.right, AlignmentType.RIGHT)],
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              }),
            ],
          }),
        ];

        if (border && border.style !== 'none') {
          rows.push(new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '' })],
                columnSpan: 2,
                borders: {
                  top: {
                    style: getBorderStyle(border.style),
                    size: (border.size || 1) * 8,
                    color: (border.color || '#000000').replace('#', ''),
                  },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                margins: { top: border.space ? border.space * 20 : 20 },
              }),
            ],
          }));
        }

        const table = new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          columnWidths: [leftWidth, rightWidth],
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
          rows,
        });
        return [table];
      }
      
      if (typeof block.content !== 'string') {
        return [];
      }
      // 为文本/ai生成块创建段落
      return createParagraphs(block, template.format);
    });
    
    // 创建文档
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: template.format.page.width * 20, // 转换为TWIPS
                height: template.format.page.height * 20,
              },
              margin: {
                top: template.format.page.margins.top * 20,
                bottom: template.format.page.margins.bottom * 20,
                left: template.format.page.margins.left * 20,
                right: template.format.page.margins.right * 20,
              },
            },
          },
          children: docxElements,
        },
      ],
    });

    // 生成并下载文件
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${template.name}.docx`);
  } catch (error) {
    console.error('导出Word文档失败:', error);
    throw new Error('导出文档失败，请检查模板格式');
  }
};

// 验证模板
export const validateTemplate = (template: DocumentTemplate): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!template.name.trim()) {
    errors.push('模板名称不能为空');
  }

  if (template.content.length === 0) {
    errors.push('模板至少需要包含一个内容块');
  }

  // 检查AI内容块是否有提示词
  const aiBlocks = template.content.filter(block => block.type === 'ai-generated');
  aiBlocks.forEach((block, index) => {
    if (!block.aiPrompt?.trim()) {
      errors.push(`第${index + 1}个AI内容块缺少提示词`);
    }
  });

  // 检查图片块
  const imageBlocks = template.content.filter(block => block.type === 'image');
  imageBlocks.forEach((block, index) => {
    if (typeof block.content === 'object' && 'src' in block.content) {
      const imageContent = block.content as ImageContent;
      if (!imageContent.src) {
        errors.push(`第${index + 1}个图片块缺少图片源`);
      }
      if (imageContent.width && (imageContent.width < 10 || imageContent.width > 1000)) {
        errors.push(`第${index + 1}个图片块宽度应在10-1000之间`);
      }
      if (imageContent.height && (imageContent.height < 10 || imageContent.height > 1000)) {
        errors.push(`第${index + 1}个图片块高度应在10-1000之间`);
      }
    }
  });

  // 检查字体大小
  if (template.format.font.size < 8 || template.format.font.size > 72) {
    errors.push('字体大小应在8-72之间');
  }

  // 检查行间距
  if (template.format.paragraph.lineHeight < 0.5 || template.format.paragraph.lineHeight > 3) {
    errors.push('行间距应在0.5-3之间');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 验证AI块设置独立性的辅助函数
export const validateAiSettingsIndependence = (template: DocumentTemplate): boolean => {
  const aiBlocks = template.content.filter(block => block.type === 'ai-generated');
  
  // 检查所有AI块是否有独立的设置对象
  for (let i = 0; i < aiBlocks.length; i++) {
    for (let j = i + 1; j < aiBlocks.length; j++) {
      const block1 = aiBlocks[i];
      const block2 = aiBlocks[j];
      
      // 如果两个AI块都有设置，检查它们是否是不同的对象引用
      if (block1.aiSettings && block2.aiSettings) {
        if (block1.aiSettings === block2.aiSettings) {
          console.warn(`AI块 ${block1.id} 和 ${block2.id} 共享相同的设置对象引用！`);
          return false;
        }
      }
    }
  }
  
  console.log('✅ AI块设置独立性验证通过');
  return true;
};

// 格式化文档大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 深拷贝对象
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
}; 