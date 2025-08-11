const { EnhancedWordParserService } = require('./dist/services/enhancedWordParserService');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const parser = new EnhancedWordParserService();
    
    // 检查是否有测试文档
    const testDocsPath = './test-docs';
    if (fs.existsSync(testDocsPath)) {
      const files = fs.readdirSync(testDocsPath);
      const docxFile = files.find(f => f.endsWith('.docx'));
      if (docxFile) {
        console.log('测试解析文档:', docxFile);
        const buffer = fs.readFileSync(path.join(testDocsPath, docxFile));
        const result = await parser.parseDocument(buffer);
        console.log('\n解析结果:');
        console.log('元素数量:', result.elements.length);
        console.log('\n详细信息:');
        result.elements.forEach((elem, idx) => {
          console.log(`\n元素${idx + 1}:`);
          console.log('  类型:', elem.type);
          console.log('  内容长度:', elem.content?.length || 0);
          
          if (elem.type === 'image') {
            console.log('  图片信息:', elem.imageData ? '存在' : '不存在');
            if (elem.imageData) {
              console.log('    - 宽度:', elem.imageData.width);
              console.log('    - 高度:', elem.imageData.height);
              console.log('    - 文件名:', elem.imageData.fileName);
              console.log('    - 描述:', elem.imageData.alt);
            }
          }
          
          if (elem.style) {
            console.log('  样式信息:');
            console.log('    - 字体:', elem.style.fontFamily);
            console.log('    - 大小:', elem.style.fontSize);
            console.log('    - 粗体:', elem.style.bold);
            console.log('    - 斜体:', elem.style.italic);
            console.log('    - 下划线:', elem.style.underline);
          }
        });
      } else {
        console.log('未找到测试文档');
      }
    } else {
      console.log('test-docs目录不存在');
    }
  } catch (error) {
    console.error('测试失败:', error);
    console.error(error.stack);
  }
}

test();