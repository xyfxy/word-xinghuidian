// 增强版Word文档解析服务 - 使用docx库进行更精确的样式提取
const JSZip = require('jszip');
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { 
  ParsedDocument, 
  ParsedElement, 
  ContentBlockGroup,
  RecognitionRule
} from '../types/wordImport';
import { RuleMatcher, ContentGrouper } from './wordParserHelpers';

const parseXml = promisify(parseString);

export class EnhancedWordParserService {
  // 生成唯一ID
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
  
  // 安全地提取文本值
  private extractTextValue(value: any): string | null {
    if (!value) return null;
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'object') {
      // 新增：处理xml2js解析出的包含namespace信息的对象格式
      if (value.value !== undefined) {
        return String(value.value);
      }
      
      // 尝试各种可能的文本属性
      if (value._) return this.extractTextValue(value._);
      if (value['#text']) return this.extractTextValue(value['#text']);
      if (value.$t) return this.extractTextValue(value.$t);
      if (value.$) return this.extractTextValue(value.$);
      if (value.$ && typeof value.$ === 'object') {
        // 可能值在$属性的某个子属性中
        const keys = Object.keys(value.$);
        for (const key of keys) {
          const val = this.extractTextValue(value.$[key]);
          if (val) return val;
        }
      }
      
      // 如果是数组，取第一个元素
      if (Array.isArray(value) && value.length > 0) {
        return this.extractTextValue(value[0]);
      }
      
      console.warn('无法从对象中提取文本值:', JSON.stringify(value).substring(0, 100));
      return null;
    }
    
    return String(value);
  }
  
  // 解析Word文档，提取完整的样式信息
  async parseDocument(buffer: Buffer, options?: { ignoreWordStyles?: boolean }): Promise<ParsedDocument> {
    try {
      // 使用JSZip读取docx文件（docx本质上是zip文件）
      const zip = new JSZip();
      await zip.loadAsync(buffer);
      
      // 读取文档主体
      const documentXml = await zip.file('word/document.xml')?.async('string');
      if (!documentXml) {
        throw new Error('无法读取文档内容');
      }
      
      // 读取样式定义
      const stylesXml = await zip.file('word/styles.xml')?.async('string');
      
      // 读取文档关系
      const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string');
      
      // 解析XML，使用适当的选项
      const xmlOptions = {
        explicitArray: true,
        preserveChildrenOrder: true,
        charsAsChildren: true,
        includeWhiteChars: false,
        xmlns: true
      };
      
      const documentData = await parseXml(documentXml);
      const stylesData = stylesXml ? await parseXml(stylesXml) : null;
      const relsData = relsXml ? await parseXml(relsXml) : null;
      
      // 提取样式映射
      const styleMap = this.buildStyleMap(stylesData);
      
      // 构建关系映射（用于图片引用）
      const relationshipMap = this.buildRelationshipMap(relsData);
      
      // 提取所有图片资源
      const imageMap = await this.extractImagesWithRelationships(zip, relationshipMap);
      
      // 提取文档元素
      const elements = await this.extractElements(documentData, styleMap, imageMap, options);
      
      // 提取元数据
      const metadata = await this.extractMetadata(zip);
      
      return {
        elements,
        metadata,
        rawText: elements.map(e => e.content).join('\n'),
        html: '' // 增强版解析器不生成HTML
      };
    } catch (error: any) {
      throw new Error(`解析Word文档失败: ${error.message}`);
    }
  }
  
  // 构建样式映射表
  private buildStyleMap(stylesData: any): Map<string, any> {
    const styleMap = new Map<string, any>();
    
    if (!stylesData || !stylesData['w:styles'] || !stylesData['w:styles']['w:style']) {
      return styleMap;
    }
    
    const styles = Array.isArray(stylesData['w:styles']['w:style']) 
      ? stylesData['w:styles']['w:style'] 
      : [stylesData['w:styles']['w:style']];
    
    for (const style of styles) {
      const styleId = style.$?.['w:styleId'];
      if (!styleId) continue;
      
      const styleInfo: any = {
        name: style['w:name']?.[0]?.$?.['w:val'],
        type: style.$?.['w:type']
      };
      
      
      // 提取段落属性
      if (style['w:pPr']) {
        const pPr = style['w:pPr'][0];
        styleInfo.paragraph = this.extractParagraphProperties(pPr);
      }
      
      // 提取字符属性
      if (style['w:rPr']) {
        const rPr = style['w:rPr'][0];
        styleInfo.run = this.extractRunProperties(rPr);
        
      }
      
      styleMap.set(styleId, styleInfo);
    }
    
    return styleMap;
  }
  
  // 提取段落属性
  private extractParagraphProperties(pPr: any): any {
    const props: any = {};
    
    // 对齐方式
    if (pPr['w:jc']) {
      const alignment = this.extractTextValue(pPr['w:jc'][0]?.$?.['w:val']);
      if (alignment) {
        props.alignment = this.mapAlignment(alignment);
      }
    }
    
    // 缩进
    if (pPr['w:ind']) {
      const ind = pPr['w:ind'][0].$;
      if (ind && ind['w:firstLine']) {
        const val = this.extractTextValue(ind['w:firstLine']);
        if (val) {
          // 将twips转换为pt (1 twip = 1/20 pt)
          props.textIndent = Math.round(parseInt(val) / 20);
        }
      }
      if (ind && ind['w:left']) {
        const val = this.extractTextValue(ind['w:left']);
        if (val) {
          // 左缩进
          props.leftIndent = Math.round(parseInt(val) / 20);
        }
      }
      if (ind && ind['w:right']) {
        const val = this.extractTextValue(ind['w:right']);
        if (val) {
          // 右缩进
          props.rightIndent = Math.round(parseInt(val) / 20);
        }
      }
    }
    
    // 行距和段落间距
    if (pPr['w:spacing']) {
      const spacing = pPr['w:spacing'][0].$;
      
      // 行距
      if (spacing && spacing['w:line']) {
        const lineValueStr = this.extractTextValue(spacing['w:line']);
        const lineRule = this.extractTextValue(spacing['w:lineRule']);
        if (lineValueStr) {
          const lineValue = parseInt(lineValueStr);
          
          
          // 根据lineRule判断行距类型
          if (!lineRule || lineRule === 'auto') {
            // auto或未指定：倍数行距，Word中的行距值需要除以240得到倍数
            // 注意：WPS可能使用不同的基准值
            let multiplier = lineValue / 240;
            
            // 特殊处理常见的WPS值
            if (lineValue === 288) {
              // 288 / 240 = 1.2
              multiplier = 1.2;
            } else if (lineValue === 360) {
              // 360 / 240 = 1.5
              multiplier = 1.5;
            }
            
            props.lineHeight = parseFloat(multiplier.toFixed(1));
          } else if (lineRule === 'exact') {
            // exact：固定行距，转换为pt
            props.lineHeight = Math.round(lineValue / 20) + 'pt';
          } else if (lineRule === 'atLeast') {
            // atLeast：最小行距，转换为pt
            props.lineHeight = Math.round(lineValue / 20) + 'pt';
          }
        }
      }
      
      // 段前距
      if (spacing && spacing['w:before']) {
        const val = this.extractTextValue(spacing['w:before']);
        if (val) {
          // 将twips转换为pt (1 twip = 1/20 pt)
          props.spaceBefore = Math.round(parseInt(val) / 20);
        }
      }
      
      // 段后距
      if (spacing && spacing['w:after']) {
        const val = this.extractTextValue(spacing['w:after']);
        if (val) {
          // 将twips转换为pt (1 twip = 1/20 pt)
          props.spaceAfter = Math.round(parseInt(val) / 20);
        }
      }
    }
    
    return props;
  }
  
  // 提取字符属性（只提取run级别的样式，不强制设置默认值）
  private extractRunProperties(rPr: any): any {
    const props: any = {};
    
    // 字体
    if (rPr['w:rFonts']) {
      const fonts = rPr['w:rFonts'][0];
      // 检查是否有$属性
      const fontAttrs = fonts.$ || fonts;
      
      // 优先使用东亚字体
      const eastAsiaFont = this.extractTextValue(fontAttrs['w:eastAsia']);
      const asciiFont = this.extractTextValue(fontAttrs['w:ascii']);
      const hAnsiFont = this.extractTextValue(fontAttrs['w:hAnsi']);
      
      let rawFontName = eastAsiaFont || asciiFont || hAnsiFont;
      
      // 处理特殊的字体名称
      if (rawFontName) {
        props.fontFamily = this.normalizeFontName(rawFontName);
      }
    }
    
    // 字号
    if (rPr['w:sz']) {
      const sizeVal = this.extractTextValue(rPr['w:sz'][0]?.$?.['w:val']);
      if (sizeVal) {
        // Word中字号单位是半点，需要除以2
        props.fontSize = Math.round(parseInt(sizeVal) / 2);
      }
    }
    
    // 颜色
    if (rPr['w:color']) {
      const colorVal = this.extractTextValue(rPr['w:color'][0]?.$?.['w:val']);
      if (colorVal && colorVal !== 'auto') {
        props.color = '#' + colorVal;
      }
    }
    
    // 粗体 - 只有XML中存在w:b标签时才设置
    if (rPr['w:b']) {
      const bVal = rPr['w:b'][0]?.$?.['w:val'];
      // 如果值为'0'或'false'则明确设置为false，否则为true
      props.bold = (bVal === '0' || bVal === 'false') ? false : true;
    }
    
    // 斜体 - 只有XML中存在w:i标签时才设置
    if (rPr['w:i']) {
      const iVal = rPr['w:i'][0]?.$?.['w:val'];
      // 如果值为'0'或'false'则明确设置为false，否则为true
      props.italic = (iVal === '0' || iVal === 'false') ? false : true;
    }
    
    // 下划线 - 只有XML中存在w:u标签时才设置
    if (rPr['w:u']) {
      const underlineVal = rPr['w:u'][0]?.$?.['w:val'];
      // 如果值为'none'则设置为false，否则为true
      props.underline = underlineVal !== 'none';
    }
    
    return props;
  }
  
  // 提取文档元素
  private async extractElements(documentData: any, styleMap: Map<string, any>, imageMap: Map<string, { src: string; fileName: string }>, options?: { ignoreWordStyles?: boolean }): Promise<ParsedElement[]> {
    const elements: ParsedElement[] = [];
    
    if (!documentData['w:document'] || !documentData['w:document']['w:body']) {
      console.error('文档结构无效，找不到w:document或w:body');
      return elements;
    }
    
    const body = documentData['w:document']['w:body'][0];
    
    // 暂时只处理段落，以恢复基本功能
    const paragraphs = body['w:p'] || [];
    
    for (const paragraph of paragraphs) {
      const paragraphElements = await this.parseParagraph(paragraph, styleMap, imageMap, options);
      if (paragraphElements && paragraphElements.length > 0) {
        elements.push(...paragraphElements);
      }
    }
    
    // 如果有表格，单独处理并添加到末尾
    if (body['w:tbl']) {
      const tables = Array.isArray(body['w:tbl']) ? body['w:tbl'] : [body['w:tbl']];
      for (const table of tables) {
        const tableElement = await this.parseTable(table, styleMap, imageMap, options);
        if (tableElement) {
          elements.push(tableElement);
        }
      }
    }
    
    return elements;
  }
  
  // 解析段落（可能返回多个元素，比如文本+图片）
  private async parseParagraph(p: any, styleMap: Map<string, any>, imageMap: Map<string, { src: string; fileName: string }>, options?: { ignoreWordStyles?: boolean }): Promise<ParsedElement[]> {
    // 提取段落文本
    const textRuns: string[] = [];
    const htmlRuns: string[] = []; // 新增：存储带样式的HTML片段
    const elements: ParsedElement[] = [];
    let paragraphStyle: any = {};
    let runStyle: any = {};
    
    // 调试：打印段落结构
    // console.log('解析段落:', JSON.stringify(p, null, 2).substring(0, 500));
    
    // 获取段落样式
    if (p['w:pPr']) {
      const pPr = p['w:pPr'][0];
      
      // 从样式引用获取样式
      if (pPr['w:pStyle']) {
        const styleId = pPr['w:pStyle'][0]?.$?.['w:val'];
        const styleInfo = styleMap.get(styleId);
        if (styleInfo) {
          paragraphStyle = { ...styleInfo.paragraph };
          runStyle = { ...styleInfo.run };
          
        }
      }
      
      // 直接段落属性会覆盖样式中的属性
      const directProps = this.extractParagraphProperties(pPr);
      paragraphStyle = { ...paragraphStyle, ...directProps };
    }
    
    // 提取文本和字符样式
    if (p['w:r']) {
      for (const run of p['w:r']) {
        let runText = '';
        let currentRunStyle = { ...runStyle };
        
        // 获取运行时样式
        if (run['w:rPr']) {
          const rPr = run['w:rPr'][0];
          const directRunProps = this.extractRunProperties(rPr);
          currentRunStyle = { ...currentRunStyle, ...directRunProps };
        } else {
          // 如果没有rPr，说明没有直接设置样式
          // 不设置任何格式属性，让它们保持undefined
          // 这样在后续处理中不会被误认为是显式设置的格式
        }
        
        // 检查是否包含图片
        if (run['w:drawing']) {
          // 处理inline图片
          const drawings = Array.isArray(run['w:drawing']) ? run['w:drawing'] : [run['w:drawing']];
          for (const drawing of drawings) {
            const imageElement = this.extractImageFromDrawing(drawing, imageMap);
            if (imageElement) {
              // 如果段落已有文本，先添加文本元素
              if (textRuns.length > 0) {
                const textContent = textRuns.join('').trim();
                if (textContent) {
                  const htmlContent = htmlRuns.length > 0 ? htmlRuns.join('') : textContent;
                  elements.push({
                    id: this.generateId(),
                    type: 'paragraph',
                    content: textContent,
                    html: `<p>${htmlContent}</p>`,
                    style: { ...paragraphStyle, ...runStyle }
                  });
                  textRuns.length = 0; // 清空文本
                  htmlRuns.length = 0; // 清空HTML
                }
              }
              // 添加图片元素
              elements.push(imageElement);
            }
          }
        }
        
        // 检查是否包含图片（旧版Word格式）
        if (run['w:pict']) {
          const picts = Array.isArray(run['w:pict']) ? run['w:pict'] : [run['w:pict']];
          for (const pict of picts) {
            const imageElement = this.extractImageFromPict(pict, imageMap);
            if (imageElement) {
              // 如果段落已有文本，先添加文本元素
              if (textRuns.length > 0) {
                const textContent = textRuns.join('').trim();
                if (textContent) {
                  const htmlContent = htmlRuns.length > 0 ? htmlRuns.join('') : textContent;
                  elements.push({
                    id: this.generateId(),
                    type: 'paragraph',
                    content: textContent,
                    html: `<p>${htmlContent}</p>`,
                    style: { ...paragraphStyle, ...runStyle }
                  });
                  textRuns.length = 0; // 清空文本
                  htmlRuns.length = 0; // 清空HTML
                }
              }
              // 添加图片元素
              elements.push(imageElement);
            }
          }
        }
        
        // 提取文本
        if (run['w:t']) {
          const textElements = Array.isArray(run['w:t']) ? run['w:t'] : [run['w:t']];
          for (const t of textElements) {
            const extractedText = this.extractTextValue(t);
            if (extractedText) {
              runText += extractedText;
            }
          }
        }
        
        textRuns.push(runText);
        
        // 生成带样式的HTML片段
        if (runText) {
          let htmlFragment = runText;
          const inlineStyles: string[] = [];
          
          // 添加所有样式，不管是否与默认样式相同
          if (currentRunStyle.color && currentRunStyle.color !== '#000000') {
            inlineStyles.push(`color: ${currentRunStyle.color}`);
          }
          if (currentRunStyle.fontSize) {
            inlineStyles.push(`font-size: ${currentRunStyle.fontSize}pt`);
          }
          if (currentRunStyle.fontFamily) {
            // 处理字体名称，确保正确的格式
            const fontFamily = currentRunStyle.fontFamily;
            if (fontFamily.includes(' ') && !fontFamily.startsWith('"')) {
              inlineStyles.push(`font-family: "${fontFamily}"`);
            } else {
              inlineStyles.push(`font-family: ${fontFamily}`);
            }
          }
          
          // 应用格式标签
          if (currentRunStyle.bold) {
            htmlFragment = `<strong>${htmlFragment}</strong>`;
          }
          if (currentRunStyle.italic) {
            htmlFragment = `<em>${htmlFragment}</em>`;
          }
          if (currentRunStyle.underline) {
            htmlFragment = `<u>${htmlFragment}</u>`;
          }
          
          // 如果有内联样式，包裹在span中
          if (inlineStyles.length > 0) {
            htmlFragment = `<span style="${inlineStyles.join('; ')}">${htmlFragment}</span>`;
          }
          
          htmlRuns.push(htmlFragment);
        }
        
        // 如果这是第一个文本运行，使用它的样式作为段落的主要样式
        if (textRuns.length === 1) {
          runStyle = currentRunStyle;
        }
      }
    }
    
    const content = textRuns.join('').trim();
    
    
    // 如果没有w:r元素，尝试直接获取段落文本
    if (!content && p['w:t']) {
      const directText = p['w:t'][0];
      if (directText) {
        const text = typeof directText === 'string' ? directText : (directText._ || directText['#text'] || '');
        if (text.trim()) {
          return [{
            id: this.generateId(),
            type: 'paragraph',
            content: text.trim(),
            style: paragraphStyle,
            html: ''
          }];
        }
      }
    }
    
    if (!content && elements.length === 0) {
      return [];
    }
    
    // 确定元素类型
    let type: ParsedElement['type'] = 'paragraph';
    let level: number | undefined;
    
    
    // 如果选项指定忽略Word样式，则所有内容都作为普通段落处理
    if (!options?.ignoreWordStyles) {
      // 检查是否是标题
      // 方法1: 通过outlineLvl属性判断（这是Word中标题的标准标记）
      if (p['w:pPr']?.[0]?.['w:outlineLvl']) {
        const outlineLvlVal = this.extractTextValue(p['w:pPr'][0]['w:outlineLvl'][0]?.$?.['w:val']);
        if (outlineLvlVal) {
          type = 'heading';
          level = parseInt(outlineLvlVal) + 1;
        }
      }
      // 方法2: 通过样式名称判断
      else if (p['w:pPr']?.[0]?.['w:pStyle']) {
        const styleId = this.extractTextValue(p['w:pPr'][0]['w:pStyle'][0]?.$?.['w:val']);
        if (styleId) {
          const styleInfo = styleMap.get(styleId);
          if (styleInfo && styleInfo.name) {
            // 检查样式名是否包含"Heading"或"标题"
            if (styleInfo.name.includes('Heading') || styleInfo.name.includes('标题')) {
              type = 'heading';
              // 尝试从样式名中提取级别
              const levelMatch = styleInfo.name.match(/(\d+)/);
              if (levelMatch) {
                level = parseInt(levelMatch[1]);
              }
            }
          }
        }
      }
    }
    
    // 合并段落样式，但不包括run级别的格式化属性
    const style = {
      ...paragraphStyle,
      // 只从runStyle中提取字体相关的属性，不包括bold/italic/underline
      fontSize: runStyle.fontSize || paragraphStyle.fontSize,
      fontFamily: runStyle.fontFamily || paragraphStyle.fontFamily,
      color: runStyle.color || paragraphStyle.color
    };
    
    
    
    // 如果还有剩余的文本内容，添加到elements
    if (content) {
      // 生成完整的HTML内容
      let html = htmlRuns.length > 0 ? htmlRuns.join('') : content;
      
      
      // 根据元素类型包装HTML
      if (type === 'heading' && level) {
        html = `<h${level}>${html}</h${level}>`;
      } else {
        // 为段落添加样式
        const paragraphStyles: string[] = [];
        
        // 段落对齐
        if (paragraphStyle.alignment && paragraphStyle.alignment !== 'left') {
          paragraphStyles.push(`text-align: ${paragraphStyle.alignment}`);
        }
        
        // 段落缩进
        if (paragraphStyle.textIndent && paragraphStyle.textIndent > 0) {
          paragraphStyles.push(`text-indent: ${paragraphStyle.textIndent}pt`);
        }
        if (paragraphStyle.leftIndent && paragraphStyle.leftIndent > 0) {
          paragraphStyles.push(`padding-left: ${paragraphStyle.leftIndent}pt`);
        }
        if (paragraphStyle.rightIndent && paragraphStyle.rightIndent > 0) {
          paragraphStyles.push(`padding-right: ${paragraphStyle.rightIndent}pt`);
        }
        
        // 行高
        if (paragraphStyle.lineHeight) {
          if (typeof paragraphStyle.lineHeight === 'string') {
            paragraphStyles.push(`line-height: ${paragraphStyle.lineHeight}`);
          } else {
            paragraphStyles.push(`line-height: ${paragraphStyle.lineHeight}`);
          }
        }
        
        // 段前段后间距
        if (paragraphStyle.spaceBefore && paragraphStyle.spaceBefore > 0) {
          paragraphStyles.push(`margin-top: ${paragraphStyle.spaceBefore}pt`);
        }
        if (paragraphStyle.spaceAfter && paragraphStyle.spaceAfter > 0) {
          paragraphStyles.push(`margin-bottom: ${paragraphStyle.spaceAfter}pt`);
        }
        
        // 如果段落级别没有字体样式，但run级别有，添加默认字体样式
        if (!html.includes('font-family') && style.fontFamily) {
          paragraphStyles.push(`font-family: "${style.fontFamily}"`);
        }
        if (!html.includes('font-size') && style.fontSize) {
          paragraphStyles.push(`font-size: ${style.fontSize}pt`);
        }
        if (!html.includes('color:') && style.color && style.color !== '#000000') {
          paragraphStyles.push(`color: ${style.color}`);
        }
        
        const styleAttr = paragraphStyles.length > 0 ? ` style="${paragraphStyles.join('; ')}"` : '';
        html = `<p${styleAttr}>${html}</p>`;
        
      }
      
      elements.push({
        id: this.generateId(),
        type,
        content,
        style: style,
        level,
        html: html
      });
    }
    
    return elements;
  }
  
  // 标准化字体名称
  private normalizeFontName(fontName: string): string {
    const fontMap: { [key: string]: string } = {
      // 仿宋系列 - 保持仿宋和仿宋_GB2312的区别
      'FangSong': '仿宋',  // 保持仿宋不变
      '仿宋': '仿宋',
      'FangSong_GB2312': '仿宋_GB2312',
      'FangSong-GB2312': '仿宋_GB2312',
      'FZFSJW--GB1-0': '仿宋_GB2312',
      '仿宋_GB2312': '仿宋_GB2312',
      
      // 宋体系列
      '宋体': '宋体',
      'SimSun': '宋体',
      '新宋体': '新宋体',
      'NSimSun': '新宋体',
      
      // 黑体系列
      '黑体': '黑体',
      'SimHei': '黑体',
      
      // 楷体系列
      '楷体': '楷体',
      'KaiTi': '楷体',
      '楷体_GB2312': '楷体_GB2312',
      'KaiTi_GB2312': '楷体_GB2312',
      
      // 微软字体系列
      '微软雅黑': '微软雅黑',
      'Microsoft YaHei': '微软雅黑',
      '微软雅黑 Light': '微软雅黑 Light',
      'Microsoft YaHei Light': '微软雅黑 Light',
      '微软雅黑 UI': '微软雅黑 UI',
      'Microsoft YaHei UI': '微软雅黑 UI',
      
      // 华文字体系列
      '华文细黑': '华文细黑',
      'STXihei': '华文细黑',
      '华文黑体': '华文黑体',
      'STHeiti': '华文黑体',
      '华文楷体': '华文楷体',
      'STKaiti': '华文楷体',
      '华文宋体': '华文宋体',
      'STSong': '华文宋体',
      '华文仿宋': '华文仿宋',
      'STFangsong': '华文仿宋',
      '华文中宋': '华文中宋',
      'STZhongsong': '华文中宋',
      '华文彩云': '华文彩云',
      'STCaiyun': '华文彩云',
      '华文琥珀': '华文琥珀',
      'STHupo': '华文琥珀',
      '华文新魏': '华文新魏',
      'STXinwei': '华文新魏',
      '华文隶书': '华文隶书',
      'STLiti': '华文隶书',
      '华文行楷': '华文行楷',
      'STXingkai': '华文行楷',
      
      // 方正字体系列
      '方正姚体': '方正姚体',
      'FZYaoti': '方正姚体',
      '方正舒体': '方正舒体',
      'FZShuTi': '方正舒体',
      '方正粗黑宋简体': '方正粗黑宋简体',
      
      // 其他中文字体
      '隶书': '隶书',
      'LiSu': '隶书',
      '幼圆': '幼圆',
      'YouYuan': '幼圆',
      '等线': '等线',
      'DengXian': '等线',
      '等线 Light': '等线 Light',
      'DengXian Light': '等线 Light',
      
      // 英文字体
      'Times New Roman': 'Times New Roman',
      'Arial': 'Arial',
      'Calibri': 'Calibri',
      'Cambria': 'Cambria',
      'Georgia': 'Georgia',
      'Verdana': 'Verdana',
      'Trebuchet MS': 'Trebuchet MS',
      'Tahoma': 'Tahoma',
      'Helvetica': 'Helvetica',
      'Courier New': 'Courier New',
      'Consolas': 'Consolas',
      'Century': 'Century',
      'Garamond': 'Garamond',
      'Palatino Linotype': 'Palatino Linotype',
      'Book Antiqua': 'Book Antiqua'
    };
    
    return fontMap[fontName] || fontName;
  }
  
  // 映射对齐方式
  private mapAlignment(alignment: string): string {
    const alignMap: { [key: string]: string } = {
      'left': 'left',
      'center': 'center',
      'right': 'right',
      'both': 'justify',
      'distribute': 'justify'
    };
    
    return alignMap[alignment] || 'left';
  }
  
  // 构建关系映射
  private buildRelationshipMap(relsData: any): Map<string, string> {
    const relationshipMap = new Map<string, string>();
    
    if (!relsData || !relsData.Relationships || !relsData.Relationships.Relationship) {
      return relationshipMap;
    }
    
    const relationships = Array.isArray(relsData.Relationships.Relationship)
      ? relsData.Relationships.Relationship
      : [relsData.Relationships.Relationship];
    
    for (const rel of relationships) {
      if (rel.$ && rel.$.Id && rel.$.Target) {
        relationshipMap.set(rel.$.Id, rel.$.Target);
      }
    }
    
    return relationshipMap;
  }
  
  // 提取图片资源并构建映射，包含文件名信息
  private async extractImagesWithRelationships(zip: any, relationshipMap: Map<string, string>): Promise<Map<string, { src: string; fileName: string }>> {
    const imageMap = new Map<string, { src: string; fileName: string }>();
    const mediaFolder = zip.folder('word/media');
    
    if (!mediaFolder) {
      return imageMap;
    }
    
    // 遍历关系映射，找出所有图片引用
    for (const [relId, target] of relationshipMap) {
      if (typeof target === 'string' && target.startsWith('media/')) {
        const fileName = `word/${target}`;
        const file = zip.file(fileName);
        
        if (file) {
          const content = await file.async('base64');
          const extension = target.split('.').pop()?.toLowerCase();
          const mimeType = this.getMimeType(extension || '');
          
          // 提取原始文件名（去掉路径）
          const originalFileName = target.split('/').pop() || '';
          
          imageMap.set(relId, {
            src: `data:${mimeType};base64,${content}`,
            fileName: originalFileName
          });
        }
      }
    }
    
    return imageMap;
  }
  
  // 提取图片（保留原方法以兼容）
  private async extractImages(zip: any): Promise<string[]> {
    const images: string[] = [];
    const mediaFolder = zip.folder('word/media');
    
    if (mediaFolder) {
      const files = Object.keys(mediaFolder.files);
      for (const fileName of files) {
        if (typeof fileName === 'string' && fileName.startsWith('word/media/') && !fileName.endsWith('/')) {
          const file = mediaFolder.files[fileName.substring('word/media/'.length)];
          if (file) {
            const content = await file.async('base64');
            const extension = fileName.split('.').pop()?.toLowerCase();
            const mimeType = this.getMimeType(extension || '');
            images.push(`data:${mimeType};base64,${content}`);
          }
        }
      }
    }
    
    return images;
  }
  
  // 获取MIME类型
  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml'
    };
    
    return mimeTypes[extension] || 'image/png';
  }
  
  // 提取文档元数据
  private async extractMetadata(zip: any): Promise<any> {
    const metadata: any = {};
    
    try {
      // 读取核心属性
      const coreXml = await zip.file('docProps/core.xml')?.async('string');
      if (coreXml) {
        const coreData: any = await parseXml(coreXml);
        const coreProps = coreData['cp:coreProperties'];
        
        if (coreProps['dc:title']) {
          metadata.title = coreProps['dc:title'][0];
        }
        if (coreProps['dc:creator']) {
          metadata.author = coreProps['dc:creator'][0];
        }
        if (coreProps['dcterms:created']) {
          metadata.createdAt = new Date(coreProps['dcterms:created'][0]);
        }
        if (coreProps['dcterms:modified']) {
          metadata.modifiedAt = new Date(coreProps['dcterms:modified'][0]);
        }
      }
    } catch (error) {
      console.error('提取元数据失败:', error);
    }
    
    // 如果没有创建时间，使用当前时间
    if (!metadata.createdAt) {
      metadata.createdAt = new Date();
    }
    
    return metadata;
  }
  
  // 从drawing元素提取图片
  private extractImageFromDrawing(drawing: any, imageMap: Map<string, { src: string; fileName: string }>): ParsedElement | null {
    try {
      // 查找blip元素（包含图片引用）
      const inline = drawing['wp:inline']?.[0] || drawing['wp:anchor']?.[0];
      if (!inline) return null;
      
      const graphic = inline['a:graphic']?.[0];
      const graphicData = graphic?.['a:graphicData']?.[0];
      const pic = graphicData?.['pic:pic']?.[0];
      const blipFill = pic?.['pic:blipFill']?.[0];
      const blip = blipFill?.['a:blip']?.[0];
      
      if (!blip || !blip.$) return null;
      
      // 获取图片关系ID
      const embedId = blip.$['r:embed'];
      if (!embedId || !imageMap.has(embedId)) return null;
      
      // 获取图片尺寸
      const spPr = pic?.['pic:spPr']?.[0];
      const xfrm = spPr?.['a:xfrm']?.[0];
      const ext = xfrm?.['a:ext']?.[0]?.$;
      
      let width: number | undefined;
      let height: number | undefined;
      
      if (ext) {
        // EMU转像素 (1 inch = 914400 EMUs = 96 pixels)
        width = ext.cx ? Math.round(parseInt(ext.cx) / 9525) : undefined;
        height = ext.cy ? Math.round(parseInt(ext.cy) / 9525) : undefined;
      }
      
      // 获取图片描述
      const docPr = inline['wp:docPr']?.[0]?.$;
      const imageInfo = imageMap.get(embedId)!;
      
      // 只使用Word文档中的描述，不使用自动生成的名称
      const alt = docPr?.descr || '';
      
      return {
        id: this.generateId(),
        type: 'image',
        content: '',
        html: '',
        imageData: {
          src: imageInfo.src,
          width,
          height,
          alt,
          relationshipId: embedId,
          fileName: imageInfo.fileName
        }
      };
    } catch (error) {
      console.error('提取drawing图片失败:', error);
      return null;
    }
  }
  
  // 从pict元素提取图片（旧版Word格式）
  private extractImageFromPict(pict: any, imageMap: Map<string, { src: string; fileName: string }>): ParsedElement | null {
    try {
      // 查找imagedata元素
      const shape = pict['v:shape']?.[0];
      const imagedata = shape?.['v:imagedata']?.[0];
      
      if (!imagedata || !imagedata.$) return null;
      
      // 获取图片关系ID
      const relId = imagedata.$['r:id'];
      if (!relId || !imageMap.has(relId)) return null;
      
      // 获取图片尺寸（从style属性解析）
      let width: number | undefined;
      let height: number | undefined;
      
      if (shape.$ && shape.$.style) {
        const styleMatch = shape.$.style.match(/width:(\d+(?:\.\d+)?)(pt|px)?;height:(\d+(?:\.\d+)?)(pt|px)?/);
        if (styleMatch) {
          // 转换为像素
          width = Math.round(parseFloat(styleMatch[1]) * (styleMatch[2] === 'pt' ? 1.333 : 1));
          height = Math.round(parseFloat(styleMatch[3]) * (styleMatch[4] === 'pt' ? 1.333 : 1));
        }
      }
      
      // 获取图片描述
      const imageInfo = imageMap.get(relId)!;
      // 只使用alt或title属性，这些通常是用户添加的描述
      const alt = shape.$?.alt || imagedata.$?.title || '';
      
      return {
        id: this.generateId(),
        type: 'image',
        content: '',
        html: '',
        imageData: {
          src: imageInfo.src,
          width,
          height,
          alt,
          relationshipId: relId,
          fileName: imageInfo.fileName
        }
      };
    } catch (error) {
      console.error('提取pict图片失败:', error);
      return null;
    }
  }

  // 解析表格
  private async parseTable(tbl: any, styleMap: Map<string, any>, imageMap: Map<string, { src: string; fileName: string }>, options?: { ignoreWordStyles?: boolean }): Promise<ParsedElement | null> {
    try {
      const rows: string[][] = [];
      const cellStyles: any[][] = []; // 存储每个单元格的样式
      const cellMergeInfo: any[][] = []; // 存储单元格合并信息
      const tableStyles: any = {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#000000',
        cellPadding: 8,
        cellSpacing: 0,
        width: 'full'
      };

      // 解析表格属性
      if (tbl['w:tblPr']) {
        const tblPr = tbl['w:tblPr'][0];
        
        // 解析表格宽度
        if (tblPr['w:tblW']) {
          const tblW = tblPr['w:tblW'][0].$;
          if (tblW && tblW['w:type'] === 'pct') {
            // 百分比宽度
            const pct = parseInt(tblW['w:val']) / 50; // Word使用5000表示100%
            tableStyles.width = pct >= 100 ? 'full' : 'auto';
          } else if (tblW && tblW['w:type'] === 'dxa') {
            // 固定宽度 (twips转像素)
            tableStyles.width = Math.round(parseInt(tblW['w:val']) / 20);
          }
        }

        // 解析表格边框
        if (tblPr['w:tblBorders']) {
          const borders = tblPr['w:tblBorders'][0];
          // 取顶部边框作为代表
          if (borders['w:top']) {
            const topBorder = borders['w:top'][0].$;
            if (topBorder) {
              // 边框样式
              if (topBorder['w:val'] === 'none' || topBorder['w:val'] === 'nil') {
                tableStyles.borderStyle = 'none';
              } else if (topBorder['w:val'] === 'dotted') {
                tableStyles.borderStyle = 'dotted';
              } else if (topBorder['w:val'] === 'dashed') {
                tableStyles.borderStyle = 'dashed';
              }
              
              // 边框宽度 (eighths of a point)
              if (topBorder['w:sz']) {
                tableStyles.borderWidth = Math.round(parseInt(topBorder['w:sz']) / 8);
              }
              
              // 边框颜色
              if (topBorder['w:color'] && topBorder['w:color'] !== 'auto') {
                tableStyles.borderColor = '#' + topBorder['w:color'];
              }
            }
          }
        }

        // 解析单元格间距
        if (tblPr['w:tblCellSpacing']) {
          const spacing = tblPr['w:tblCellSpacing'][0].$;
          if (spacing && spacing['w:val']) {
            tableStyles.cellSpacing = Math.round(parseInt(spacing['w:val']) / 20);
          }
        }
      }

      // 解析表格行
      const tblRows = tbl['w:tr'] || [];
      for (let rowIndex = 0; rowIndex < tblRows.length; rowIndex++) {
        const tr = tblRows[rowIndex];
        const row: string[] = [];
        const rowStyles: any[] = [];
        const rowMergeInfo: any[] = [];
        
        // 解析单元格
        const cells = tr['w:tc'] || [];
        for (const tc of cells) {
          // 检查单元格合并信息
          let colspan = 1;
          let rowspan = 1;
          
          if (tc['w:tcPr']) {
            const tcPr = tc['w:tcPr'][0];
            
            // 列合并
            if (tcPr['w:gridSpan']) {
              colspan = parseInt(tcPr['w:gridSpan'][0].$?.['w:val'] || '1');
            }
            
            // 行合并 - 检查垂直合并
            if (tcPr['w:vMerge']) {
              const vMerge = tcPr['w:vMerge'][0];
              if (vMerge.$?.['w:val'] === 'restart') {
                // 这是合并的开始单元格，需要计算rowspan
                rowspan = 1;
                // 向下查找连续的vMerge单元格
                for (let i = rowIndex + 1; i < tblRows.length; i++) {
                  const nextRow = tblRows[i];
                  const nextCells = nextRow['w:tc'] || [];
                  if (nextCells[cells.indexOf(tc)]?.['w:tcPr']?.[0]?.['w:vMerge']) {
                    rowspan++;
                  } else {
                    break;
                  }
                }
              } else {
                // 这是被合并的单元格，跳过
                continue;
              }
            }
          }
          
          // 提取单元格文本和样式
          let cellText = '';
          let cellStyle: any = {};
          const paragraphs = tc['w:p'] || [];
          
          // 收集所有文本运行的样式
          const runStyles: any[] = [];
          
          for (const p of paragraphs) {
            const runs = p['w:r'] || [];
            for (const r of runs) {
              // 提取运行样式
              if (r['w:rPr'] && !options?.ignoreWordStyles) {
                const runProps = this.extractRunProperties(r['w:rPr'][0]);
                runStyles.push(runProps);
              }
              
              if (r['w:t']) {
                const texts = Array.isArray(r['w:t']) ? r['w:t'] : [r['w:t']];
                for (const t of texts) {
                  if (typeof t === 'string') {
                    cellText += t;
                  } else if (t._ || t['#text']) {
                    cellText += t._ || t['#text'];
                  }
                }
              }
            }
            cellText += ' '; // 段落之间加空格
          }
          
          // 如果有样式信息，取最常见的样式
          if (runStyles.length > 0 && !options?.ignoreWordStyles) {
            // 简单起见，使用第一个样式
            cellStyle = runStyles[0];
          }
          
          row.push(cellText.trim());
          rowStyles.push(cellStyle);
          rowMergeInfo.push({ colspan, rowspan });
        }
        
        if (row.length > 0) {
          rows.push(row);
          cellStyles.push(rowStyles);
          cellMergeInfo.push(rowMergeInfo);
        }
      }

      if (rows.length === 0) {
        return null;
      }

      // 构建表格HTML
      let html = '<table';
      if (tableStyles.borderStyle !== 'none') {
        html += ` style="border-collapse: collapse; border: ${tableStyles.borderWidth}px ${tableStyles.borderStyle} ${tableStyles.borderColor};"`;
      }
      html += '>';
      
      for (const row of rows) {
        html += '<tr>';
        for (const cell of row) {
          html += `<td style="padding: ${tableStyles.cellPadding}px; border: ${tableStyles.borderStyle !== 'none' ? `${tableStyles.borderWidth}px ${tableStyles.borderStyle} ${tableStyles.borderColor}` : 'none'};">${cell}</td>`;
        }
        html += '</tr>';
      }
      html += '</table>';

      return {
        id: this.generateId(),
        type: 'table',
        content: rows.map(row => row.join(' | ')).join('\n'),
        html,
        tableData: {
          rows,
          style: tableStyles,
          cellStyles,
          cellMergeInfo
        }
      };
    } catch (error) {
      console.error('解析表格失败:', error);
      return null;
    }
  }
  
  // 应用识别规则（复用原有逻辑）
  async applyRecognitionRules(
    parsedDoc: ParsedDocument,
    rules: RecognitionRule[]
  ): Promise<ContentBlockGroup[]> {
    const matcher = new RuleMatcher();
    const grouper = new ContentGrouper(matcher);
    
    const enabledRules = rules.filter(r => r.enabled);
    const groups = grouper.group(parsedDoc.elements, enabledRules);
    
    return groups;
  }
}