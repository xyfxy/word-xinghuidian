// 调试样式继承问题
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');

async function debugStyleInheritance(docPath) {
  console.log(`分析文档样式继承: ${docPath}\n`);
  
  // 读取docx文件
  const zip = new AdmZip(docPath);
  
  // 1. 解析样式表
  const stylesXml = zip.readAsText('word/styles.xml');
  const documentXml = zip.readAsText('word/document.xml');
  
  const parser = new xml2js.Parser();
  const stylesData = await parser.parseStringPromise(stylesXml);
  const documentData = await parser.parseStringPromise(documentXml);
  
  // 2. 构建样式映射
  const styleMap = new Map();
  
  if (stylesData && stylesData['w:styles'] && stylesData['w:styles']['w:style']) {
    const styles = stylesData['w:styles']['w:style'];
    
    console.log('=== 样式表中的样式 ===');
    for (const style of styles) {
      const styleId = style.$?.['w:styleId'];
      const styleName = style['w:name']?.[0]?.$?.['w:val'];
      const styleType = style.$?.['w:type'];
      
      if (!styleId) continue;
      
      let lineHeightInfo = null;
      
      // 检查段落属性中的行高
      if (style['w:pPr'] && style['w:pPr'][0]['w:spacing']) {
        const spacing = style['w:pPr'][0]['w:spacing'][0].$;
        if (spacing && spacing['w:line']) {
          const lineValue = parseInt(spacing['w:line']);
          const lineRule = spacing['w:lineRule'] || 'auto';
          
          if (lineRule === 'auto') {
            const multiplier = lineValue / 240;
            lineHeightInfo = `${multiplier.toFixed(2)}倍 (${lineValue}/240)`;
          }
        }
      }
      
      if (lineHeightInfo) {
        console.log(`样式: ${styleId} ("${styleName}") - 行高: ${lineHeightInfo}`);
      }
      
      styleMap.set(styleId, {
        name: styleName,
        type: styleType,
        lineHeight: lineHeightInfo
      });
    }
  }
  
  // 3. 分析段落的样式引用
  console.log('\n=== 段落样式引用分析 ===');
  
  const paragraphs = documentData['w:document']['w:body'][0]['w:p'] || [];
  let paragraphIndex = 0;
  
  for (const p of paragraphs) {
    paragraphIndex++;
    
    // 获取段落文本
    let text = '';
    if (p['w:r']) {
      for (const r of p['w:r']) {
        if (r['w:t']) {
          const textNode = r['w:t'][0];
          text += typeof textNode === 'string' ? textNode : (textNode._ || textNode['#text'] || '');
        }
      }
    }
    text = text.trim();
    
    if (!text) continue;
    
    // 检查段落属性
    let styleReference = null;
    let directLineHeight = null;
    
    if (p['w:pPr']) {
      const pPr = p['w:pPr'][0];
      
      // 样式引用
      if (pPr['w:pStyle']) {
        const styleId = pPr['w:pStyle'][0]?.$?.['w:val'];
        styleReference = styleId;
      }
      
      // 直接行高设置
      if (pPr['w:spacing']) {
        const spacing = pPr['w:spacing'][0].$;
        if (spacing && spacing['w:line']) {
          const lineValue = parseInt(spacing['w:line']);
          const lineRule = spacing['w:lineRule'] || 'auto';
          
          if (lineRule === 'auto') {
            const multiplier = lineValue / 240;
            directLineHeight = `${multiplier.toFixed(2)}倍 (直接设置)`;
          }
        }
      }
    }
    
    // 输出分析结果
    if (styleReference || directLineHeight) {
      console.log(`\n段落 ${paragraphIndex}: "${text.substring(0, 50)}..."`);
      
      if (styleReference) {
        const styleInfo = styleMap.get(styleReference);
        console.log(`  样式引用: ${styleReference} ("${styleInfo?.name || '未知'}")`);
        if (styleInfo?.lineHeight) {
          console.log(`  样式中的行高: ${styleInfo.lineHeight}`);
        } else {
          console.log(`  样式中的行高: 未定义`);
        }
      }
      
      if (directLineHeight) {
        console.log(`  直接行高设置: ${directLineHeight}`);
      }
      
      // 最终行高（直接设置覆盖样式）
      const finalLineHeight = directLineHeight || styleMap.get(styleReference)?.lineHeight || '未定义';
      console.log(`  最终行高: ${finalLineHeight}`);
    }
  }
}

// 使用方法
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('使用方法: node debug-style-inheritance.js <文档路径>');
  console.log('例如: node debug-style-inheritance.js test-docs/example.docx');
  process.exit(1);
}

const docPath = args[0];
if (!fs.existsSync(docPath)) {
  console.error(`文件不存在: ${docPath}`);
  process.exit(1);
}

debugStyleInheritance(docPath).catch(console.error);