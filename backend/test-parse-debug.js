const fs = require('fs');
const path = require('path');
const { EnhancedWordParserService } = require('./dist/services/enhancedWordParserService');

async function testParse() {
  try {
    const parser = new EnhancedWordParserService();
    
    // 读取测试文档
    const testDocPath = path.join(__dirname, 'test-docs/simple-test.docx');
    if (!fs.existsSync(testDocPath)) {
      console.error('测试文档不存在:', testDocPath);
      return;
    }
    
    const buffer = fs.readFileSync(testDocPath);
    console.log('开始解析文档...');
    
    // 解析文档
    const result = await parser.parseDocument(buffer, { ignoreWordStyles: false });
    
    console.log('解析结果:');
    console.log('元素数量:', result.elements.length);
    
    // 打印前5个元素的详细信息
    result.elements.slice(0, 5).forEach((elem, index) => {
      console.log(`\n元素 ${index + 1}:`);
      console.log('类型:', elem.type);
      console.log('内容:', elem.content.substring(0, 100) + (elem.content.length > 100 ? '...' : ''));
      console.log('样式:', JSON.stringify(elem.style, null, 2));
      if (elem.html) {
        console.log('HTML:', elem.html.substring(0, 200) + (elem.html.length > 200 ? '...' : ''));
      }
    });
    
  } catch (error) {
    console.error('解析失败:', error);
  }
}

testParse();