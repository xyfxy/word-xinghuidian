// 测试段落样式解析
const { EnhancedWordParserService } = require('./dist/services/enhancedWordParserService');
const fs = require('fs');
const path = require('path');

async function testParagraphStyles() {
  try {
    // 检查测试文档是否存在
    const testDocPath = path.join(__dirname, 'test-docs', 'paragraph-styles-test.docx');
    if (!fs.existsSync(testDocPath)) {
      console.log('请创建测试文档：test-docs/paragraph-styles-test.docx');
      console.log('文档内容建议：');
      console.log('1. 包含不同缩进的段落（首行缩进、左缩进、右缩进）');
      console.log('2. 包含不同段间距的段落（段前距、段后距）');
      console.log('3. 包含不同行距的段落');
      return;
    }
    
    // 读取测试文档
    const buffer = fs.readFileSync(testDocPath);
    
    // 创建解析器实例
    const parser = new EnhancedWordParserService();
    
    console.log('开始解析文档...\n');
    
    // 解析文档
    const result = await parser.parseDocument(buffer);
    
    console.log(`解析完成，共提取 ${result.elements.length} 个元素\n`);
    
    // 显示每个元素的段落样式
    result.elements.forEach((element, index) => {
      console.log(`\n===== 元素 ${index + 1} =====`);
      console.log(`类型: ${element.type}`);
      console.log(`内容: ${element.content.substring(0, 50)}...`);
      
      if (element.style) {
        console.log('\n样式信息:');
        
        // 字体信息
        if (element.style.fontFamily) {
          console.log(`  字体: ${element.style.fontFamily}`);
        }
        if (element.style.fontSize) {
          console.log(`  字号: ${element.style.fontSize}pt`);
        }
        
        // 段落格式
        if (element.style.alignment) {
          console.log(`  对齐方式: ${element.style.alignment}`);
        }
        if (element.style.lineHeight) {
          console.log(`  行距: ${element.style.lineHeight}`);
        }
        
        // 缩进
        if (element.style.textIndent !== undefined) {
          console.log(`  首行缩进: ${element.style.textIndent}pt`);
        }
        if (element.style.leftIndent !== undefined) {
          console.log(`  左缩进: ${element.style.leftIndent}pt`);
        }
        if (element.style.rightIndent !== undefined) {
          console.log(`  右缩进: ${element.style.rightIndent}pt`);
        }
        
        // 段间距
        if (element.style.spaceBefore !== undefined) {
          console.log(`  段前距: ${element.style.spaceBefore}pt`);
        }
        if (element.style.spaceAfter !== undefined) {
          console.log(`  段后距: ${element.style.spaceAfter}pt`);
        }
      }
    });
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testParagraphStyles();