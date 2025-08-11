// 测试增强版Word解析器
const fs = require('fs');
const path = require('path');

async function testEnhancedParser() {
  try {
    // 动态导入TypeScript模块
    const { EnhancedWordParserService } = require('./dist/services/enhancedWordParserService');
    
    // 创建一个简单的测试Word文档（如果有的话）
    const testDocPath = path.join(__dirname, 'test.docx');
    
    if (!fs.existsSync(testDocPath)) {
      console.log('请在backend目录下放置一个test.docx文件进行测试');
      return;
    }
    
    const buffer = fs.readFileSync(testDocPath);
    const parser = new EnhancedWordParserService();
    
    console.log('开始解析Word文档...');
    const result = await parser.parseDocument(buffer);
    
    console.log('\n解析结果:');
    console.log('元素数量:', result.elements.length);
    console.log('\n前3个元素:');
    result.elements.slice(0, 3).forEach((element, index) => {
      console.log(`\n元素 ${index + 1}:`);
      console.log('类型:', element.type);
      console.log('内容:', element.content.substring(0, 100) + (element.content.length > 100 ? '...' : ''));
      console.log('样式:', JSON.stringify(element.style, null, 2));
    });
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 先编译TypeScript
console.log('编译TypeScript代码...');
const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('编译完成\n');
  testEnhancedParser();
} catch (error) {
  console.error('编译失败:', error);
}