// 分析文档中的行高设置
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');

async function analyzeLineHeight(docPath) {
  console.log(`分析文档: ${docPath}\n`);
  
  // 读取docx文件
  const zip = new AdmZip(docPath);
  const documentXml = zip.readAsText('word/document.xml');
  
  // 解析XML
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(documentXml);
  
  // 查找所有段落
  const paragraphs = result['w:document']['w:body'][0]['w:p'] || [];
  
  console.log(`总段落数: ${paragraphs.length}\n`);
  
  // 统计行高设置
  const lineHeightStats = new Map();
  let paragraphIndex = 0;
  
  for (const p of paragraphs) {
    paragraphIndex++;
    
    // 获取段落文本
    let text = '';
    if (p['w:r']) {
      for (const r of p['w:r']) {
        if (r['w:t']) {
          text += r['w:t'][0]._ || r['w:t'][0];
        }
      }
    }
    text = text.trim();
    
    // 检查段落属性
    if (p['w:pPr'] && p['w:pPr'][0]['w:spacing']) {
      const spacing = p['w:pPr'][0]['w:spacing'][0].$;
      
      if (spacing && spacing['w:line']) {
        const lineValue = parseInt(spacing['w:line']);
        const lineRule = spacing['w:lineRule'] || 'auto';
        
        let lineHeightDesc = '';
        if (lineRule === 'auto' || lineRule === '') {
          const multiplier = lineValue / 240;
          lineHeightDesc = `${multiplier.toFixed(2)}倍 (${lineValue}/240)`;
        } else if (lineRule === 'exact') {
          const pt = lineValue / 20;
          lineHeightDesc = `固定 ${pt}pt`;
        } else if (lineRule === 'atLeast') {
          const pt = lineValue / 20;
          lineHeightDesc = `最小 ${pt}pt`;
        }
        
        // 统计
        const key = `${lineRule}:${lineValue}`;
        if (!lineHeightStats.has(key)) {
          lineHeightStats.set(key, {
            count: 0,
            desc: lineHeightDesc,
            examples: []
          });
        }
        const stat = lineHeightStats.get(key);
        stat.count++;
        if (stat.examples.length < 3 && text) {
          stat.examples.push({
            index: paragraphIndex,
            text: text.substring(0, 50) + (text.length > 50 ? '...' : '')
          });
        }
      }
    }
  }
  
  // 输出统计结果
  console.log('行高设置统计:');
  console.log('='.repeat(60));
  
  for (const [key, stat] of lineHeightStats) {
    console.log(`\n${stat.desc}`);
    console.log(`  出现次数: ${stat.count}`);
    console.log(`  示例段落:`);
    for (const example of stat.examples) {
      console.log(`    - 段落${example.index}: "${example.text}"`);
    }
  }
  
  // 查找有问题的段落（1.2倍被解析为1.5倍）
  console.log('\n\n可能有问题的段落:');
  console.log('='.repeat(60));
  
  paragraphIndex = 0;
  for (const p of paragraphs) {
    paragraphIndex++;
    
    if (p['w:pPr'] && p['w:pPr'][0]['w:spacing']) {
      const spacing = p['w:pPr'][0]['w:spacing'][0].$;
      
      if (spacing && spacing['w:line']) {
        const lineValue = parseInt(spacing['w:line']);
        const lineRule = spacing['w:lineRule'] || 'auto';
        
        // 检查是否是288（1.2倍）但可能被误解析
        if (lineRule === 'auto' && lineValue === 288) {
          // 获取段落文本
          let text = '';
          if (p['w:r']) {
            for (const r of p['w:r']) {
              if (r['w:t']) {
                text += r['w:t'][0]._ || r['w:t'][0];
              }
            }
          }
          text = text.trim();
          
          if (text) {
            console.log(`\n段落${paragraphIndex}: w:line=${lineValue} (应该是1.2倍)`);
            console.log(`  文本: "${text.substring(0, 80)}..."`);
          }
        }
      }
    }
  }
}

// 使用方法
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('使用方法: node analyze-line-height.js <文档路径>');
  console.log('例如: node analyze-line-height.js test-docs/example.docx');
  process.exit(1);
}

const docPath = args[0];
if (!fs.existsSync(docPath)) {
  console.error(`文件不存在: ${docPath}`);
  process.exit(1);
}

analyzeLineHeight(docPath).catch(console.error);