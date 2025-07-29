// Word导入相关的API路由
import express from 'express';
import multer from 'multer';
import { EnhancedWordParserService } from '../services/enhancedWordParserService';
import { DEFAULT_RULES } from '../constants/wordImportRules';
import { RecognitionRule, ContentBlockGroup } from '../types/wordImport';
import { DocumentTemplate, ContentBlock, TableContent } from '../types';

const router = express.Router();

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制10MB
  },
  fileFilter: (req, file, cb) => {
    // 只接受Word文档
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword'
    ) {
      cb(null, true);
    } else {
      cb(new Error('只支持Word文档格式（.doc, .docx）'));
    }
  }
});

// 解析Word文档
router.post('/parse-word', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: '请上传文件' 
      });
    }

    // 从请求体获取选项 - multer会将非文件字段放在req.body中
    
    // 处理不同的值类型
    let ignoreWordStyles = false;
    if (req.body.ignoreWordStyles !== undefined) {
      if (typeof req.body.ignoreWordStyles === 'string') {
        ignoreWordStyles = req.body.ignoreWordStyles === 'true';
      } else if (typeof req.body.ignoreWordStyles === 'boolean') {
        ignoreWordStyles = req.body.ignoreWordStyles;
      }
    }
    
    const options = { ignoreWordStyles };
    
    // 使用增强解析器解析文档
    const enhancedParser = new EnhancedWordParserService();
    const parsedDocument = await enhancedParser.parseDocument(file.buffer, options);
    
    
    res.json({ 
      success: true, 
      data: parsedDocument 
    });
  } catch (error: any) {
    console.error('解析Word文档失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '解析文档时发生错误' 
    });
  }
});

// 获取默认识别规则
router.get('/recognition-rules', (req, res) => {
  res.json({
    success: true,
    data: DEFAULT_RULES
  });
});

// 应用识别规则
router.post('/apply-rules', async (req, res) => {
  try {
    const { parsedDocument, rules } = req.body;
    
    if (!parsedDocument || !rules) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    // 应用规则生成内容块分组
    const enhancedParser = new EnhancedWordParserService();
    const contentGroups = await enhancedParser.applyRecognitionRules(
      parsedDocument,
      rules
    );


    res.json({
      success: true,
      data: contentGroups
    });
  } catch (error: any) {
    console.error('应用规则失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '应用规则时发生错误'
    });
  }
});

// 从元素中提取样式信息
const extractStylesFromElements = (elements: any[]): any => {
  const fontStyles: any = {};
  const paragraphStyles: any = {};
  
  // 如果只有一个元素，直接使用该元素的样式
  if (elements.length === 1 && elements[0].style) {
    const style = elements[0].style;
    
    // 字体样式
    fontStyles.family = style.fontFamily || '宋体';
    fontStyles.size = style.fontSize || 12;
    fontStyles.color = style.color || '#000000';
    // 只有当属性明确存在时才设置，避免默认设置为false
    if (style.bold !== undefined) fontStyles.bold = style.bold;
    if (style.italic !== undefined) fontStyles.italic = style.italic;
    if (style.underline !== undefined) fontStyles.underline = style.underline;
    
    // 段落样式
    if (style.alignment) paragraphStyles.alignment = style.alignment;
    if (style.lineHeight !== undefined) {
      if (typeof style.lineHeight === 'string' && style.lineHeight.includes('pt')) {
        const ptValue = parseFloat(style.lineHeight);
        if (!isNaN(ptValue)) {
          const baseSize = style.fontSize || 12;
          paragraphStyles.lineHeight = parseFloat((ptValue / baseSize).toFixed(2));
        } else {
          paragraphStyles.lineHeight = 1.5;
        }
      } else {
        paragraphStyles.lineHeight = parseFloat(style.lineHeight) || 1.5;
      }
    }
    if (style.textIndent !== undefined) paragraphStyles.textIndent = style.textIndent;
    if (style.leftIndent !== undefined) paragraphStyles.leftIndent = style.leftIndent;
    if (style.rightIndent !== undefined) paragraphStyles.rightIndent = style.rightIndent;
    if (style.spaceBefore !== undefined) paragraphStyles.spaceBefore = style.spaceBefore;
    if (style.spaceAfter !== undefined) paragraphStyles.spaceAfter = style.spaceAfter;
  } else {
    // 多个元素时，使用统计方法找出最常用的样式
    
    // 收集所有元素的通用样式，而不是强制使用第一个元素的样式
    // 这样可以避免将个别段落的样式（如加粗）应用到整个内容块
    const styleCounts = {
      fontSize: new Map<number, number>(),
      fontFamily: new Map<string, number>(),
      color: new Map<string, number>(),
      alignment: new Map<string, number>(),
      lineHeight: new Map<number, number>()
    };
    
    // 统计各种样式的出现频率
    elements.forEach(elem => {
      if (elem.style) {
        const style = elem.style;
        
        // 统计字体大小
        if (style.fontSize !== undefined) {
          const count = styleCounts.fontSize.get(style.fontSize) || 0;
          styleCounts.fontSize.set(style.fontSize, count + 1);
        }
      
      // 统计字体家族
      if (style.fontFamily !== undefined) {
        const count = styleCounts.fontFamily.get(style.fontFamily) || 0;
        styleCounts.fontFamily.set(style.fontFamily, count + 1);
      }
      
      // 统计颜色
      if (style.color !== undefined) {
        const count = styleCounts.color.get(style.color) || 0;
        styleCounts.color.set(style.color, count + 1);
      }
      
      // 统计对齐方式
      if (style.alignment !== undefined) {
        const count = styleCounts.alignment.get(style.alignment) || 0;
        styleCounts.alignment.set(style.alignment, count + 1);
      }
      
      // 处理行高
      if (style.lineHeight !== undefined) {
        let lineHeightValue: number;
        if (typeof style.lineHeight === 'string' && style.lineHeight.includes('pt')) {
          const ptValue = parseFloat(style.lineHeight);
          if (!isNaN(ptValue)) {
            const baseSize = style.fontSize || 12;
            lineHeightValue = parseFloat((ptValue / baseSize).toFixed(2));
          } else {
            lineHeightValue = 1.5;
          }
        } else {
          lineHeightValue = parseFloat(style.lineHeight) || 1.5;
        }
        const count = styleCounts.lineHeight.get(lineHeightValue) || 0;
        styleCounts.lineHeight.set(lineHeightValue, count + 1);
      }
      
      // 段落缩进（使用第一个有缩进的元素）
      if (!paragraphStyles.textIndent && style.textIndent !== undefined) {
        paragraphStyles.textIndent = style.textIndent;
      }
      if (!paragraphStyles.leftIndent && style.leftIndent !== undefined) {
        paragraphStyles.leftIndent = style.leftIndent;
      }
      if (!paragraphStyles.rightIndent && style.rightIndent !== undefined) {
        paragraphStyles.rightIndent = style.rightIndent;
      }
      
      // 段前距（使用第一个有段前距的元素）
      if (!paragraphStyles.spaceBefore && style.spaceBefore !== undefined) {
        paragraphStyles.spaceBefore = style.spaceBefore;
      }
      
      // 段后距（使用第一个有段后距的元素）
      if (!paragraphStyles.spaceAfter && style.spaceAfter !== undefined) {
        paragraphStyles.spaceAfter = style.spaceAfter;
      }
      }
    });
    
    // 使用最常见的样式作为内容块的默认样式
    // 字体大小
    if (styleCounts.fontSize.size > 0) {
      let maxCount = 0;
      let mostCommonSize = 12;
      styleCounts.fontSize.forEach((count, size) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonSize = size;
        }
      });
      fontStyles.size = mostCommonSize;
    }
  
  // 字体家族
  if (styleCounts.fontFamily.size > 0) {
    let maxCount = 0;
    let mostCommonFamily = '宋体';
    styleCounts.fontFamily.forEach((count, family) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonFamily = family;
      }
    });
    fontStyles.family = mostCommonFamily;
  }
    
    // 颜色
    if (styleCounts.color.size > 0) {
      let maxCount = 0;
      let mostCommonColor = '#000000';
      styleCounts.color.forEach((count, color) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonColor = color;
        }
      });
      fontStyles.color = mostCommonColor;
    }
    
    // 对齐方式
    if (styleCounts.alignment.size > 0) {
      let maxCount = 0;
      let mostCommonAlignment = 'left';
      styleCounts.alignment.forEach((count, alignment) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonAlignment = alignment;
        }
      });
      paragraphStyles.alignment = mostCommonAlignment;
    }
    
    // 行高
    if (styleCounts.lineHeight.size > 0) {
      let maxCount = 0;
      let mostCommonLineHeight = 1.5;
      styleCounts.lineHeight.forEach((count, lineHeight) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonLineHeight = lineHeight;
        }
      });
      paragraphStyles.lineHeight = mostCommonLineHeight;
    }
  }
  
  // 检查是否是标题，如果原本没有设置样式，提供默认样式
  const hasHeading = elements.some(elem => elem.type === 'heading');
  if (hasHeading) {
    const headingElem = elements.find(elem => elem.type === 'heading');
    if (headingElem) {
      // 只有在没有设置字体大小时，才根据标题级别设置默认大小
      if (!fontStyles.size) {
        const headingSizes: {[key: number]: number} = { 
          1: 22, // 一级标题
          2: 18, // 二级标题
          3: 16, // 三级标题
          4: 14, // 四级标题
          5: 12, // 五级标题
          6: 12  // 六级标题
        };
        fontStyles.size = headingSizes[headingElem.level] || 14;
      }
      // 不再自动为标题设置粗体，保留原有的粗体设置
    }
  }
  
  // 设置默认值，构建完整的格式对象
  const result = {
    font: {
      family: fontStyles.family || '宋体',
      size: fontStyles.size || 12,
      color: fontStyles.color || '#000000',
      // 不设置默认的格式属性，只有当明确存在时才添加
      ...(fontStyles.bold !== undefined && { bold: fontStyles.bold }),
      ...(fontStyles.italic !== undefined && { italic: fontStyles.italic }),
      ...(fontStyles.underline !== undefined && { underline: fontStyles.underline })
    },
    paragraph: {
      lineHeight: paragraphStyles.lineHeight || 1.5,
      paragraphSpacing: paragraphStyles.spaceAfter || 0,
      spaceBefore: paragraphStyles.spaceBefore || 0,
      alignment: paragraphStyles.alignment || 'left',
      indent: {
        firstLine: paragraphStyles.textIndent || 0,
        firstLineUnit: 'pt',
        left: paragraphStyles.leftIndent || 0,
        leftUnit: 'pt',
        right: paragraphStyles.rightIndent || 0,
        rightUnit: 'pt'
      }
    }
  };
  
  return result;
};

// 生成模板预览
router.post('/generate-template', async (req, res) => {
  try {
    const { contentGroups, templateName, templateDescription } = req.body;
    
    if (!contentGroups || !templateName) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    // 生成唯一ID
    const generateId = (): string => {
      return Math.random().toString(36).substr(2, 9);
    };

    // 收集所有元素的字体信息，用于确定全局默认字体
    const allFontFamilies = new Map<string, number>();
    const allFontSizes = new Map<number, number>();
    const allColors = new Map<string, number>();
    
    // 统计所有内容组中的字体使用情况
    contentGroups.forEach((group: ContentBlockGroup) => {
      group.elements.forEach(elem => {
        if (elem.style) {
          if (elem.style.fontFamily) {
            const count = allFontFamilies.get(elem.style.fontFamily) || 0;
            allFontFamilies.set(elem.style.fontFamily, count + 1);
          }
          if (elem.style.fontSize) {
            const count = allFontSizes.get(elem.style.fontSize) || 0;
            allFontSizes.set(elem.style.fontSize, count + 1);
          }
          if (elem.style.color) {
            const count = allColors.get(elem.style.color) || 0;
            allColors.set(elem.style.color, count + 1);
          }
        }
      });
    });
    
    // 找出最常用的字体作为全局默认值
    let globalFontFamily = '宋体';
    let globalFontSize = 12;
    let globalFontColor = '#000000';
    
    if (allFontFamilies.size > 0) {
      let maxCount = 0;
      allFontFamilies.forEach((count, family) => {
        if (count > maxCount) {
          maxCount = count;
          globalFontFamily = family;
        }
      });
    }
    
    if (allFontSizes.size > 0) {
      let maxCount = 0;
      allFontSizes.forEach((count, size) => {
        if (count > maxCount) {
          maxCount = count;
          globalFontSize = size;
        }
      });
    }
    
    if (allColors.size > 0) {
      let maxCount = 0;
      allColors.forEach((count, color) => {
        if (count > maxCount) {
          maxCount = count;
          globalFontColor = color;
        }
      });
    }
    

    // 将内容块组转换为模板格式
    const contentBlocks: ContentBlock[] = [];
    let position = 0;

    contentGroups.forEach((group: ContentBlockGroup) => {
      
      // 合并组内元素的内容，保留段落结构和原始样式
      
      const combinedHtml = group.elements
        .map(elem => {
          // 处理图片元素
          if (elem.type === 'image' && elem.imageData) {
            const img = elem.imageData;
            const imgStyles: string[] = [];
            
            if (img.width) imgStyles.push(`width: ${img.width}px`);
            if (img.height) imgStyles.push(`height: ${img.height}px`);
            imgStyles.push('max-width: 100%'); // 确保图片不会超出容器
            
            const styleAttr = imgStyles.length > 0 ? ` style="${imgStyles.join('; ')}"` : '';
            const altAttr = img.alt ? ` alt="${img.alt}"` : '';
            return `<p><img src="${img.src}"${altAttr}${styleAttr} /></p>`;
          }
          
          // 处理表格元素
          if (elem.type === 'table' && elem.tableData) {
            // 表格已经在后端解析过了，保存表格数据到内容块
            return elem.html || ''; // 返回HTML用于预览
          }
          
          // 如果有html，使用html；否则将content包装在段落标签中
          if (elem.html) {
            // 保留原始HTML，其中包含了样式信息
            return elem.html;
          } else if (elem.content) {
            // 根据元素类型和样式生成适当的HTML
            let styledContent = elem.content;
            
            // 应用内联样式
            if (elem.style) {
              const inlineStyles: string[] = [];
              
              // 处理样式 - 只有明确设置为true时才应用
              if (elem.style.bold === true) {
                styledContent = `<strong>${styledContent}</strong>`;
              }
              if (elem.style.italic === true) {
                styledContent = `<em>${styledContent}</em>`;
              }
              if (elem.style.underline === true) {
                styledContent = `<u>${styledContent}</u>`;
              }
              
              // 处理字体样式
              if (elem.style.fontSize && elem.style.fontSize !== 12) {
                inlineStyles.push(`font-size: ${elem.style.fontSize}pt`);
              }
              if (elem.style.color && elem.style.color !== '#000000') {
                inlineStyles.push(`color: ${elem.style.color}`);
              }
              if (elem.style.fontFamily) {
                // 处理各种中文字体，确保正确的fallback
                let fontFamilyValue = elem.style.fontFamily;
                
                // 定义字体fallback映射
                const fontFallbacks: { [key: string]: string } = {
                  // 基础中文字体
                  '宋体': `"${fontFamilyValue}", "宋体", "SimSun", "STSong", serif`,
                  '新宋体': `"${fontFamilyValue}", "新宋体", "NSimSun", serif`,
                  '仿宋': `"仿宋", "FangSong", "仿宋_GB2312", "FangSong_GB2312", "STFangsong", "华文仿宋", serif`,
                  '仿宋_GB2312': `"仿宋_GB2312", "FangSong_GB2312", "仿宋", "FangSong", "STFangsong", "华文仿宋", serif`,
                  'FangSong': `"FangSong", "仿宋", "仿宋_GB2312", "FangSong_GB2312", "STFangsong", "华文仿宋", serif`,
                  '黑体': `"${fontFamilyValue}", "黑体", "SimHei", "STHeiti", sans-serif`,
                  '楷体': `"${fontFamilyValue}", "楷体", "KaiTi", "STKaiti", serif`,
                  '楷体_GB2312': `"${fontFamilyValue}", "楷体_GB2312", "KaiTi_GB2312", serif`,
                  
                  // 微软字体系列
                  '微软雅黑': `"${fontFamilyValue}", "微软雅黑", "Microsoft YaHei", sans-serif`,
                  '微软雅黑 Light': `"${fontFamilyValue}", "微软雅黑 Light", "Microsoft YaHei Light", sans-serif`,
                  '微软雅黑 UI': `"${fontFamilyValue}", "微软雅黑 UI", "Microsoft YaHei UI", sans-serif`,
                  
                  // 华文字体系列
                  '华文细黑': `"${fontFamilyValue}", "华文细黑", "STXihei", sans-serif`,
                  '华文黑体': `"${fontFamilyValue}", "华文黑体", "STHeiti", sans-serif`,
                  '华文楷体': `"${fontFamilyValue}", "华文楷体", "STKaiti", serif`,
                  '华文宋体': `"${fontFamilyValue}", "华文宋体", "STSong", serif`,
                  '华文仿宋': `"${fontFamilyValue}", "华文仿宋", "STFangsong", serif`,
                  '华文中宋': `"${fontFamilyValue}", "华文中宋", "STZhongsong", serif`,
                  '华文彩云': `"${fontFamilyValue}", "华文彩云", "STCaiyun", serif`,
                  '华文琥珀': `"${fontFamilyValue}", "华文琥珀", "STHupo", serif`,
                  '华文新魏': `"${fontFamilyValue}", "华文新魏", "STXinwei", serif`,
                  '华文隶书': `"${fontFamilyValue}", "华文隶书", "STLiti", serif`,
                  '华文行楷': `"${fontFamilyValue}", "华文行楷", "STXingkai", serif`,
                  
                  // 方正字体系列
                  '方正姚体': `"${fontFamilyValue}", "方正姚体", "FZYaoti", serif`,
                  '方正舒体': `"${fontFamilyValue}", "方正舒体", "FZShuTi", serif`,
                  '方正粗黑宋简体': `"${fontFamilyValue}", "方正粗黑宋简体", "FZCuHeiSongS-B-GB", serif`,
                  
                  // 其他中文字体
                  '隶书': `"${fontFamilyValue}", "隶书", "LiSu", serif`,
                  '幼圆': `"${fontFamilyValue}", "幼圆", "YouYuan", serif`,
                  '等线': `"${fontFamilyValue}", "等线", "DengXian", sans-serif`,
                  '等线 Light': `"${fontFamilyValue}", "等线 Light", "DengXian Light", sans-serif`
                };
                
                // 查找匹配的字体
                let matched = false;
                for (const [key, fallback] of Object.entries(fontFallbacks)) {
                  if (fontFamilyValue.includes(key)) {
                    fontFamilyValue = fallback;
                    matched = true;
                    break;
                  }
                }
                
                // 如果没有匹配到特定的中文字体，使用通用fallback
                if (!matched) {
                  // 检查是否是英文字体
                  const englishFonts = ['Arial', 'Times New Roman', 'Calibri', 'Verdana', 'Georgia', 'Helvetica'];
                  const isEnglishFont = englishFonts.some(font => fontFamilyValue.includes(font));
                  
                  if (isEnglishFont) {
                    fontFamilyValue = `"${fontFamilyValue}", sans-serif`;
                  } else {
                    // 未知的中文字体，提供通用的中文字体fallback
                    fontFamilyValue = `"${fontFamilyValue}", "宋体", "SimSun", serif`;
                  }
                }
                
                inlineStyles.push(`font-family: ${fontFamilyValue}`);
              }
              
              // 如果有内联样式，包裹在span标签中
              if (inlineStyles.length > 0) {
                styledContent = `<span style="${inlineStyles.join('; ')}">${styledContent}</span>`;
              }
            }
            
            // 根据元素类型生成HTML
            if (elem.type === 'heading') {
              const level = elem.level || 1;
              return `<h${level}>${styledContent}</h${level}>`;
            } else {
              return `<p>${styledContent}</p>`;
            }
          }
          return '';
        })
        .filter(html => html) // 过滤掉空内容
        .join('\n');
      
      // 从元素中提取样式信息
      const extractedStyles = extractStylesFromElements(group.elements);
      
      
      // 检查是否是纯图片组（只包含图片元素）
      const isImageOnlyGroup = group.elements.length === 1 && 
                               group.elements[0].type === 'image' && 
                               group.elements[0].imageData;
      
      // 检查是否是纯表格组（只包含表格元素）
      const isTableOnlyGroup = group.elements.length === 1 && 
                               group.elements[0].type === 'table' && 
                               group.elements[0].tableData;
      
      let blockContent: string | any;
      let blockType: ContentBlock['type'];
      
      if (isImageOnlyGroup && group.elements[0].imageData) {
        // 创建图片内容块
        blockType = 'image';
        const imageData = group.elements[0].imageData;
        
        blockContent = {
          src: imageData.src,
          width: imageData.width || 0,
          height: imageData.height || 0,
          alignment: 'center',
          caption: imageData.alt || '', // 只使用Word文档中的描述
          alt: imageData.alt || '',
          border: {
            enabled: false,
            width: 1,
            color: '#cccccc',
            style: 'solid' as const
          }
        };
      } else if (isTableOnlyGroup && group.elements[0].tableData) {
        // 创建表格内容块
        blockType = 'table';
        const tableData = group.elements[0].tableData;
        
        // 转换表格数据格式，包含合并信息和样式
        blockContent = {
          rows: tableData.rows.map((row, rowIndex) => 
            row.map((cell, cellIndex) => {
              const mergeInfo = tableData.cellMergeInfo?.[rowIndex]?.[cellIndex];
              const cellStyle = tableData.cellStyles?.[rowIndex]?.[cellIndex];
              
              const cellObj: any = { content: cell };
              
              // 添加合并信息
              if (mergeInfo) {
                if (mergeInfo.colspan > 1) cellObj.colspan = mergeInfo.colspan;
                if (mergeInfo.rowspan > 1) cellObj.rowspan = mergeInfo.rowspan;
              }
              
              // 添加单元格样式（如果有字体样式的话）
              if (cellStyle && Object.keys(cellStyle).length > 0) {
                cellObj.style = {
                  // 可以根据需要添加更多样式
                };
              }
              
              return cellObj;
            })
          ),
          style: {
            borderStyle: tableData.style?.borderStyle || 'solid',
            borderWidth: tableData.style?.borderWidth || 1,
            borderColor: tableData.style?.borderColor || '#000000',
            cellPadding: tableData.style?.cellPadding || 8,
            cellSpacing: tableData.style?.cellSpacing || 0,
            width: tableData.style?.width || 'full',
            headerRows: 0, // 默认没有标题行
            headerStyle: {
              backgroundColor: '#f0f0f0',
              fontBold: true,
              textAlign: 'center'
            }
          }
        } as TableContent;
      } else {
        // 创建文本或AI内容块
        blockType = group.suggestedType;
        blockContent = combinedHtml;
      }
      
      // 使用建议的标题，如果为空则使用默认值
      let blockTitle = group.suggestedTitle;
      if (!blockTitle && blockType === 'image') {
        // 如果图片没有标题，使用空字符串或默认值
        blockTitle = '';
      } else if (!blockTitle && blockType === 'table') {
        // 如果表格没有标题，使用默认标题
        blockTitle = '表格';
      }
      
      const block: ContentBlock = {
        id: generateId(),
        type: blockType,
        title: blockTitle,
        content: blockContent,
        format: {
          useGlobalFormat: false, // 默认使用自定义格式
          font: extractedStyles.font,
          paragraph: extractedStyles.paragraph
        },
        position: position++
      };
      

      // 如果是AI生成块，添加默认提示词
      if (group.suggestedType === 'ai-generated') {
        block.aiPrompt = '请根据上下文生成相关内容';
      }

      contentBlocks.push(block);
    });

    // 创建模板
    const template: DocumentTemplate = {
      id: generateId(),
      name: templateName,
      description: templateDescription || '从Word文档导入',
      format: {
        font: {
          family: globalFontFamily,
          size: globalFontSize,
          color: globalFontColor,
          // 不设置默认的格式属性
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
            top: 72,
            bottom: 72,
            left: 72,
            right: 72,
          },
          orientation: 'portrait',
        },
      },
      content: contentBlocks,
      createdAt: new Date(),
      updatedAt: new Date(),
    };


    res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    console.error('生成模板失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '生成模板时发生错误'
    });
  }
});

export default router;