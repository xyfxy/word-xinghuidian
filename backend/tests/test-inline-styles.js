// 测试内联样式解析
const { EnhancedWordParserService } = require('./dist/services/enhancedWordParserService');
const fs = require('fs');
const path = require('path');

async function testInlineStyles() {
  try {
    // 检查测试文档是否存在
    const testDocPath = path.join(__dirname, 'test-docs', 'inline-styles-test.docx');
    if (!fs.existsSync(testDocPath)) {
      console.log('请创建测试文档：test-docs/inline-styles-test.docx');
      console.log('文档内容建议：');
      console.log('1. 包含一段文字，其中部分文字有不同颜色（如红色、蓝色）');
      console.log('2. 包含一段文字，其中部分文字有不同格式（如加粗、斜体）');
      console.log('3. 包含一段文字，其中部分文字有不同字号');
      console.log('4. 包含混合格式的段落（如部分文字既有颜色又有加粗）');
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
    
    // 显示每个元素的内容和HTML
    result.elements.forEach((element, index) => {
      console.log(`\n===== 元素 ${index + 1} =====`);
      console.log(`类型: ${element.type}`);
      console.log(`纯文本内容: ${element.content}`);
      console.log(`\nHTML内容:`);
      console.log(element.html);
      
      // 显示是否检测到内联样式
      if (element.html && element.html.includes('style=')) {
        console.log('\n✓ 检测到内联样式');
        
        // 提取并显示所有内联样式
        const styleMatches = element.html.match(/style="([^"]+)"/g);
        if (styleMatches) {
          console.log('内联样式列表:');
          styleMatches.forEach(match => {
            console.log(`  - ${match}`);
          });
        }
      }
      
      // 检测格式标签
      const formatTags = [];
      if (element.html && element.html.includes('<strong>')) formatTags.push('加粗');
      if (element.html && element.html.includes('<em>')) formatTags.push('斜体');
      if (element.html && element.html.includes('<u>')) formatTags.push('下划线');
      
      if (formatTags.length > 0) {
        console.log(`\n✓ 检测到格式标签: ${formatTags.join(', ')}`);
      }
      
      console.log('\n' + '-'.repeat(50));
    });
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testInlineStyles();