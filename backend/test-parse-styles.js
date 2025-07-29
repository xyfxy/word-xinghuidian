const fs = require('fs');
const path = require('path');
const { EnhancedWordParserService } = require('./src/services/enhancedWordParserService');

async function testParseStyles() {
  try {
    const parser = new EnhancedWordParserService();
    
    // 使用一个测试文档
    const testDocPath = path.join(__dirname, 'test-docs/simple-test.docx');
    
    // 如果测试文档不存在，使用任何可用的docx文件
    let buffer;
    if (fs.existsSync(testDocPath)) {
      buffer = fs.readFileSync(testDocPath);
    } else {
      console.log('请提供一个Word文档路径作为参数');
      return;
    }
    
    console.log('开始解析文档...\n');
    
    // 解析文档
    const result = await parser.parseDocument(buffer, { ignoreWordStyles: false });
    
    console.log('解析结果:');
    console.log('元素数量:', result.elements.length);
    console.log('\n详细元素信息:\n');
    
    // 打印每个元素的详细信息
    result.elements.forEach((elem, index) => {
      console.log(`========== 元素 ${index + 1} ==========`);
      console.log('类型:', elem.type);
      console.log('内容:', elem.content.substring(0, 100) + (elem.content.length > 100 ? '...' : ''));
      console.log('样式:', JSON.stringify(elem.style, null, 2));
      console.log('HTML:', elem.html ? elem.html.substring(0, 300) + (elem.html.length > 300 ? '...' : '') : '无');
      console.log('');
    });
    
  } catch (error) {
    console.error('解析失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

// 如果提供了命令行参数，使用指定的文件
if (process.argv[2]) {
  const { EnhancedWordParserService } = require('./src/services/enhancedWordParserService');
  const parser = new EnhancedWordParserService();
  const buffer = fs.readFileSync(process.argv[2]);
  
  parser.parseDocument(buffer, { ignoreWordStyles: false }).then(result => {
    console.log('解析结果:');
    result.elements.slice(0, 5).forEach((elem, index) => {
      console.log(`\n元素 ${index + 1}:`);
      console.log('内容:', elem.content.substring(0, 50) + '...');
      console.log('HTML:', elem.html ? elem.html.substring(0, 150) + '...' : '无');
      console.log('样式:', JSON.stringify(elem.style, null, 2));
    });
  }).catch(err => {
    console.error('解析错误:', err);
  });
} else {
  testParseStyles();
}