import {
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { DocumentFormat } from '../types';

// 字体名称映射
const FONT_NAME_MAP: { [key: string]: string } = {
  '宋体': 'SimSun',
  '仿宋_GB2312': '仿宋_GB2312',
  '仿宋': 'FangSong', 
  '楷体': 'KaiTi',
  '黑体': 'SimHei',
  '微软雅黑': 'Microsoft YaHei',
};



// 单位转换函数
const convertUnitToPt = (value: number, unit: 'pt' | 'cm' | 'px' | 'char' | undefined, fontSize: number = 12): number => {
  if (value === 0) return 0;
  
  switch (unit) {
    case 'cm':
      return value * (72 / 2.54);
    case 'px':
      return value * (72 / 96);
    case 'char':
      return value * fontSize;
    case 'pt':
    default:
      return value;
  }
};

// 获取对齐方式
const getAlignmentType = (alignment: string) => {
  switch (alignment) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
};

// 将边框样式转换为docx格式
const getBorderStyle = (style: 'none' | 'single' | 'double' | 'thickThin' | undefined) => {
  switch (style) {
    case 'double':
      return BorderStyle.DOUBLE;
    case 'thickThin':
      return BorderStyle.THIN_THICK_MEDIUM_GAP;
    case 'single':
    default:
      return BorderStyle.SINGLE;
  }
};

// HTML节点到TextRun的转换
interface TextRunOptions {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  font?: string;
  size?: number;
  color?: string;
}

const createTextRun = (options: TextRunOptions, userFontSettings?: any): TextRun => {
  // 修复优先级：HTML样式 > 用户设置 > 默认值
  // 1. HTML内联样式和语义标签优先级最高
  // 2. 用户设置（自定义格式或全局格式）作为默认值
  
  const finalFont = options.font || userFontSettings?.family || 'Microsoft YaHei';
  const finalSize = options.size || userFontSettings?.size || 12;
  const finalColor = options.color || userFontSettings?.color || '#000000';
  
  // 格式设置：HTML中的语义格式优先，如果HTML中有格式（如加粗），则使用HTML格式，否则使用用户设置
  const finalBold = options.bold || (userFontSettings?.bold || false);
  const finalItalic = options.italic || (userFontSettings?.italic || false);
  const finalUnderline = options.underline || (userFontSettings?.underline || false);
  
  return new TextRun({
    text: options.text,
    font: {
      name: FONT_NAME_MAP[finalFont] || finalFont,
      hint: 'eastAsia',
    },
    size: finalSize * 2, // docx使用半点
    color: finalColor.replace('#', ''),
    bold: finalBold,
    italics: finalItalic,
    underline: finalUnderline ? {} : undefined,
  });
};

// 解析HTML元素的样式（不包含text属性）
interface StyleOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  font?: string;
  size?: number;
  color?: string;
}

const parseElementStyle = (element: HTMLElement): StyleOptions => {
  const style = window.getComputedStyle(element);
  
  // 解析内联样式颜色
  const inlineStyle = element.getAttribute('style');
  let inlineColor: string | undefined;
  
  if (inlineStyle) {
    const colorMatch = inlineStyle.match(/color\s*:\s*([^;]+)/);
    if (colorMatch) {
      inlineColor = colorMatch[1].trim();
    }
  }
  
  // 转换RGB颜色为十六进制
  const convertColorToHex = (color: string): string => {
    if (!color) return '#000000';
    
    // 如果已经是十六进制，直接返回
    if (color.startsWith('#')) {
      return color;
    }
    
    // 处理rgb()格式
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // 处理rgba()格式
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // 处理颜色名称
    const colorNames: { [key: string]: string } = {
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
    };
    
    return colorNames[color.toLowerCase()] || '#000000';
  };
  
  return {
    bold: style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600 || element.tagName === 'B' || element.tagName === 'STRONG',
    italic: style.fontStyle === 'italic' || element.tagName === 'I' || element.tagName === 'EM',
    underline: style.textDecoration?.includes('underline') || element.tagName === 'U',
    font: style.fontFamily?.split(',')[0]?.trim()?.replace(/['"]/g, ''),
    size: parseInt(style.fontSize) || undefined,
    color: inlineColor ? convertColorToHex(inlineColor) : (style.color ? convertColorToHex(style.color) : undefined),
  };
};

// 递归解析HTML节点
const parseHTMLNode = (node: Node, inheritedStyle: StyleOptions = {}, userFontSettings?: any): TextRun[] => {
  const runs: TextRun[] = [];
  
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      runs.push(createTextRun({
        text,
        ...inheritedStyle,
      }, userFontSettings));
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const elementStyle = parseElementStyle(element);
    const mergedStyle = { ...inheritedStyle, ...elementStyle };
    
    // 处理换行
    if (element.tagName === 'BR') {
      runs.push(createTextRun({ text: '\n', ...inheritedStyle }, userFontSettings));
      return runs;
    }
    
    // 递归处理子节点
    for (const childNode of Array.from(element.childNodes)) {
      runs.push(...parseHTMLNode(childNode, mergedStyle, userFontSettings));
    }
  }
  
  return runs;
};

// 将HTML内容转换为Word段落
export const convertHTMLToDocxParagraphs = (
  htmlContent: string,
  defaultFormat: DocumentFormat,
  blockFormat?: any
): Paragraph[] => {
  // 确定最终的格式设置
  const shouldUseGlobal = blockFormat?.useGlobalFormat !== false;
  
  const finalFontSettings = shouldUseGlobal
    ? defaultFormat.font
    : { ...defaultFormat.font, ...blockFormat?.font };

  const finalParagraphSettings = shouldUseGlobal
    ? defaultFormat.paragraph
    : { 
        ...defaultFormat.paragraph, 
        ...blockFormat?.paragraph, 
        indent: { 
          ...defaultFormat.paragraph.indent, 
          ...blockFormat?.paragraph?.indent 
        } 
      };

  // 标题格式设置
  let headingFontSettings = finalFontSettings;
  let headingParagraphSettings = finalParagraphSettings;

  if (blockFormat?.enableHeadingFormat && blockFormat?.headingFormat) {
    // 标题字体设置（优先使用标题设置，否则使用正文设置）
    headingFontSettings = {
      ...finalFontSettings,
      ...blockFormat.headingFormat.font
    };

    // 标题段落设置
    headingParagraphSettings = {
      ...finalParagraphSettings,
      ...blockFormat.headingFormat.paragraph,
      indent: {
        ...finalParagraphSettings.indent,
        ...blockFormat.headingFormat.paragraph?.indent
      }
    };
  }

  if (!htmlContent) return [];
  
  // 创建临时DOM元素来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const paragraphs: Paragraph[] = [];
  
  // 处理不同的HTML元素
  const processElement = (element: Element, listLevel = 0): void => {
    const tagName = element.tagName.toLowerCase();
    
    switch (tagName) {
             case 'h1':
       case 'h2':
       case 'h3':
       case 'h4':
       case 'h5':
       case 'h6':
         // 标题处理 - 使用标题专用格式设置
         const headingLevel = parseInt(tagName.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6;
         const headingRuns = parseHTMLNode(element, {}, headingFontSettings);
         
         if (headingRuns.length > 0) {
           const indent = headingParagraphSettings.indent;
           const fontSize = headingFontSettings.size;
           const border = headingParagraphSettings.border?.bottom;
           
           paragraphs.push(new Paragraph({
             children: headingRuns,
             heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, 
                      HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6][headingLevel - 1],
             spacing: {
               line: Math.round(headingParagraphSettings.lineHeight * 240), // 转换为TWIPS
               after: headingParagraphSettings.paragraphSpacing * 20,
               before: headingParagraphSettings.spaceBefore * 20,
             },
             indent: {
               firstLine: convertUnitToPt(indent.firstLine, indent.firstLineUnit, fontSize) * 20,
               left: convertUnitToPt(indent.left, indent.leftUnit, fontSize) * 20,
               right: convertUnitToPt(indent.right, indent.rightUnit, fontSize) * 20,
             },
             border: border && border.style !== 'none' ? {
               bottom: {
                 color: (border.color || '#000000').replace('#', ''),
                 style: getBorderStyle(border.style),
                 size: (border.size || 1) * 8, // 1pt = 8dxf
                 space: border.space || 1,
               }
             } : undefined,
             alignment: getAlignmentType(headingParagraphSettings.alignment),
           }));
         }
         break;
        
             case 'p':
         // 段落处理
         const pRuns = parseHTMLNode(element, {}, finalFontSettings);
         
         if (pRuns.length > 0) {
           const indent = finalParagraphSettings.indent;
           const fontSize = finalFontSettings.size;
           const border = finalParagraphSettings.border?.bottom;
           
           paragraphs.push(new Paragraph({
             children: pRuns,
             spacing: {
               line: Math.round(finalParagraphSettings.lineHeight * 240), // 转换为TWIPS
               after: finalParagraphSettings.paragraphSpacing * 20,
               before: finalParagraphSettings.spaceBefore * 20,
             },
             indent: {
               firstLine: convertUnitToPt(indent.firstLine, indent.firstLineUnit, fontSize) * 20,
               left: convertUnitToPt(indent.left, indent.leftUnit, fontSize) * 20,
               right: convertUnitToPt(indent.right, indent.rightUnit, fontSize) * 20,
             },
             border: border && border.style !== 'none' ? {
               bottom: {
                 color: (border.color || '#000000').replace('#', ''),
                 style: getBorderStyle(border.style),
                 size: (border.size || 1) * 8, // 1pt = 8dxf
                 space: border.space || 1,
               }
             } : undefined,
             alignment: getAlignmentType(finalParagraphSettings.alignment),
           }));
         }
         break;
        
             case 'ul':
       case 'ol':
         // 列表处理
         const listItems = element.querySelectorAll('li');
         listItems.forEach((li, index) => {
           const liRuns = parseHTMLNode(li, {}, finalFontSettings);
           
           if (liRuns.length > 0) {
             // 为列表项添加序号或项目符号
             const bulletText = tagName === 'ol' ? `${index + 1}. ` : '• ';
             const bulletRun = createTextRun({
               text: bulletText,
             }, finalFontSettings);
             
             const indent = finalParagraphSettings.indent;
             const fontSize = finalFontSettings.size;
             const border = finalParagraphSettings.border?.bottom;
             
             paragraphs.push(new Paragraph({
               children: [bulletRun, ...liRuns],
               spacing: {
                 line: Math.round(finalParagraphSettings.lineHeight * 240), // 转换为TWIPS
                 after: finalParagraphSettings.paragraphSpacing * 10,
                 before: finalParagraphSettings.spaceBefore * 10,
               },
               indent: {
                 firstLine: convertUnitToPt(indent.firstLine, indent.firstLineUnit, fontSize) * 20,
                 left: convertUnitToPt(indent.left, indent.leftUnit, fontSize) * 20 + (listLevel + 1) * 360, // 基础缩进 + 列表缩进
                 right: convertUnitToPt(indent.right, indent.rightUnit, fontSize) * 20,
               },
               border: border && border.style !== 'none' ? {
                 bottom: {
                   color: (border.color || '#000000').replace('#', ''),
                   style: getBorderStyle(border.style),
                   size: (border.size || 1) * 8, // 1pt = 8dxf
                   space: border.space || 1,
                 }
               } : undefined,
               alignment: getAlignmentType(finalParagraphSettings.alignment),
             }));
           }
         });
         break;
        
             case 'blockquote':
         // 引用块处理
         const quoteRuns = parseHTMLNode(element, {}, finalFontSettings);
         
         if (quoteRuns.length > 0) {
           const indent = finalParagraphSettings.indent;
           const fontSize = finalFontSettings.size;
           const border = finalParagraphSettings.border?.bottom;
           
           paragraphs.push(new Paragraph({
             children: quoteRuns,
             indent: {
               firstLine: convertUnitToPt(indent.firstLine, indent.firstLineUnit, fontSize) * 20,
               left: convertUnitToPt(indent.left, indent.leftUnit, fontSize) * 20 + 720, // 基础缩进 + 引用缩进
               right: convertUnitToPt(indent.right, indent.rightUnit, fontSize) * 20,
             },
             spacing: {
               line: Math.round(finalParagraphSettings.lineHeight * 240), // 转换为TWIPS
               after: finalParagraphSettings.paragraphSpacing * 20,
               before: finalParagraphSettings.spaceBefore * 20,
             },
             border: border && border.style !== 'none' ? {
               bottom: {
                 color: (border.color || '#000000').replace('#', ''),
                 style: getBorderStyle(border.style),
                 size: (border.size || 1) * 8, // 1pt = 8dxf
                 space: border.space || 1,
               }
             } : undefined,
             alignment: getAlignmentType(finalParagraphSettings.alignment),
           }));
         }
         break;
        
      case 'div':
        // div元素，递归处理子元素
        for (const child of Array.from(element.children)) {
          processElement(child, listLevel);
        }
        break;
        
             default:
         // 其他元素，作为内联文本处理
         const runs = parseHTMLNode(element, {}, finalFontSettings);
         
         if (runs.length > 0) {
           const indent = finalParagraphSettings.indent;
           const fontSize = finalFontSettings.size;
           const border = finalParagraphSettings.border?.bottom;
           
           paragraphs.push(new Paragraph({
             children: runs,
             spacing: {
               line: Math.round(finalParagraphSettings.lineHeight * 240), // 转换为TWIPS
               after: finalParagraphSettings.paragraphSpacing * 20,
               before: finalParagraphSettings.spaceBefore * 20,
             },
             indent: {
               firstLine: convertUnitToPt(indent.firstLine, indent.firstLineUnit, fontSize) * 20,
               left: convertUnitToPt(indent.left, indent.leftUnit, fontSize) * 20,
               right: convertUnitToPt(indent.right, indent.rightUnit, fontSize) * 20,
             },
             border: border && border.style !== 'none' ? {
               bottom: {
                 color: (border.color || '#000000').replace('#', ''),
                 style: getBorderStyle(border.style),
                 size: (border.size || 1) * 8, // 1pt = 8dxf
                 space: border.space || 1,
               }
             } : undefined,
             alignment: getAlignmentType(finalParagraphSettings.alignment),
           }));
         }
         break;
    }
  };
  
  // 如果没有块级元素，则作为单个段落处理
  const blockElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, div');
  
     if (blockElements.length === 0) {
     // 没有块级元素，直接作为段落处理
     const runs = parseHTMLNode(tempDiv, {}, finalFontSettings);
     if (runs.length > 0) {
       const indent = finalParagraphSettings.indent;
       const fontSize = finalFontSettings.size;
       const border = finalParagraphSettings.border?.bottom;
       
       paragraphs.push(new Paragraph({
         children: runs,
         spacing: {
           line: Math.round(finalParagraphSettings.lineHeight * 240), // 转换为TWIPS
           after: finalParagraphSettings.paragraphSpacing * 20,
           before: finalParagraphSettings.spaceBefore * 20,
         },
         indent: {
           firstLine: convertUnitToPt(indent.firstLine, indent.firstLineUnit, fontSize) * 20,
           left: convertUnitToPt(indent.left, indent.leftUnit, fontSize) * 20,
           right: convertUnitToPt(indent.right, indent.rightUnit, fontSize) * 20,
         },
         border: border && border.style !== 'none' ? {
           bottom: {
             color: (border.color || '#000000').replace('#', ''),
             style: getBorderStyle(border.style),
             size: (border.size || 1) * 8, // 1pt = 8dxf
             space: border.space || 1,
           }
         } : undefined,
         alignment: getAlignmentType(finalParagraphSettings.alignment),
       }));
     }
   } else {
     // 有块级元素，逐个处理
     for (const element of Array.from(blockElements)) {
       processElement(element);
     }
   }
   
   return paragraphs.length > 0 ? paragraphs : [
     new Paragraph({
       children: [createTextRun({
         text: tempDiv.textContent || '',
       }, finalFontSettings)],
       spacing: {
         line: Math.round(finalParagraphSettings.lineHeight * 240), // 转换为TWIPS
         after: finalParagraphSettings.paragraphSpacing * 20,
         before: finalParagraphSettings.spaceBefore * 20,
       },
       indent: {
         firstLine: convertUnitToPt(finalParagraphSettings.indent.firstLine, finalParagraphSettings.indent.firstLineUnit, finalFontSettings.size) * 20,
         left: convertUnitToPt(finalParagraphSettings.indent.left, finalParagraphSettings.indent.leftUnit, finalFontSettings.size) * 20,
         right: convertUnitToPt(finalParagraphSettings.indent.right, finalParagraphSettings.indent.rightUnit, finalFontSettings.size) * 20,
       },
       border: finalParagraphSettings.border?.bottom && finalParagraphSettings.border.bottom.style !== 'none' ? {
         bottom: {
           color: (finalParagraphSettings.border.bottom.color || '#000000').replace('#', ''),
           style: getBorderStyle(finalParagraphSettings.border.bottom.style),
           size: (finalParagraphSettings.border.bottom.size || 1) * 8, // 1pt = 8dxf
           space: finalParagraphSettings.border.bottom.space || 1,
         }
       } : undefined,
       alignment: getAlignmentType(finalParagraphSettings.alignment),
     })
   ];
}; 