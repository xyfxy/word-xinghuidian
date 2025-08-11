// 测试行高解析
const fs = require('fs');
const path = require('path');
const { EnhancedWordParserService } = require('./dist/services/enhancedWordParserService');

async function testLineHeight() {
  const parser = new EnhancedWordParserService();
  
  // 读取测试文档列表
  const testDocsDir = path.join(__dirname, 'test-docs');
  const files = fs.readdirSync(testDocsDir).filter(f => f.endsWith('.docx'));
  
  console.log('=== 行高解析测试 ===\n');
  
  for (const file of files) {
    console.log(`\n测试文档: ${file}`);
    console.log('='.repeat(50));
    
    const filePath = path.join(testDocsDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    
    try {
      // 修改解析器，添加调试信息
      const originalExtractParagraphProperties = parser.extractParagraphProperties.bind(parser);
      parser.extractParagraphProperties = function(pPr) {
        const props = originalExtractParagraphProperties(pPr);
        
        // 输出原始的spacing信息
        if (pPr && pPr['w:spacing']) {
          const spacing = pPr['w:spacing'][0].$;
          if (spacing) {
            console.log('\n原始spacing属性:');
            console.log(`  w:line: ${spacing['w:line']}`);
            console.log(`  w:lineRule: ${spacing['w:lineRule'] || '(未设置，默认auto)'}`);
            
            if (spacing['w:line']) {
              const lineValue = parseInt(spacing['w:line']);
              console.log(`  计算: ${lineValue} / 240 = ${(lineValue / 240).toFixed(2)}`);
              console.log(`  结果行高: ${props.lineHeight}`);
            }
          }
        }
        
        return props;
      };
      
      const result = await parser.parseDocument(fileBuffer);
      
      // 输出每个段落的行高信息
      result.elements.forEach((elem, index) => {
        if (elem.type === 'paragraph' && elem.style && elem.style.lineHeight !== undefined) {
          console.log(`\n段落 ${index + 1}: "${elem.content.substring(0, 30)}..."`);
          console.log(`  行高: ${elem.style.lineHeight}`);
        }
      });
      
    } catch (error) {
      console.error(`解析失败: ${error.message}`);
    }
  }
}

// 检查dist目录是否存在
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('请先运行 npm run build 构建项目');
  process.exit(1);
}

testLineHeight().catch(console.error);