// 调试[object Object]问题
const fs = require('fs');
const path = require('path');

// 直接加载源文件
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

const { EnhancedWordParserService } = require('./src/services/enhancedWordParserService');

async function debugParse() {
  try {
    const parser = new EnhancedWordParserService();
    
    // 使用提供的测试文档或命令行参数
    let docPath = process.argv[2];
    if (!docPath) {
      const testDocs = [
        './test-docs/simple-test.docx',
        './test-docs/complex-test.docx'
      ];
      
      for (const testDoc of testDocs) {
        if (fs.existsSync(path.join(__dirname, testDoc))) {
          docPath = path.join(__dirname, testDoc);
          break;
        }
      }
    }
    
    if (!docPath || !fs.existsSync(docPath)) {
      console.error('请提供一个Word文档路径');
      process.exit(1);
    }
    
    console.log('解析文档:', docPath);
    const buffer = fs.readFileSync(docPath);
    
    // 解析文档
    const result = await parser.parseDocument(buffer, { ignoreWordStyles: false });
    
    console.log('\n===== 解析结果 =====');
    console.log('元素总数:', result.elements.length);
    
    // 查找包含[object Object]的元素
    let foundObjectIssue = false;
    result.elements.forEach((elem, idx) => {
      // 检查内容中是否包含[object Object]
      if (elem.content && elem.content.includes('[object Object]')) {
        foundObjectIssue = true;
        console.log(`\n!!! 发现问题 - 元素 ${idx + 1} 内容包含 [object Object]`);
        console.log('内容:', elem.content);
        console.log('类型:', elem.type);
        console.log('样式:', JSON.stringify(elem.style, null, 2));
      }
      
      // 检查HTML中是否包含[object Object]
      if (elem.html && elem.html.includes('[object Object]')) {
        foundObjectIssue = true;
        console.log(`\n!!! 发现问题 - 元素 ${idx + 1} HTML包含 [object Object]`);
        console.log('HTML:', elem.html);
      }
      
      // 检查样式中的字体
      if (elem.style && elem.style.fontFamily && elem.style.fontFamily.includes('[object Object]')) {
        foundObjectIssue = true;
        console.log(`\n!!! 发现问题 - 元素 ${idx + 1} 字体包含 [object Object]`);
        console.log('字体:', elem.style.fontFamily);
      }
    });
    
    if (!foundObjectIssue) {
      console.log('\n✓ 没有发现 [object Object] 问题');
      
      // 显示前3个元素的详细信息
      console.log('\n前3个元素的详细信息:');
      result.elements.slice(0, 3).forEach((elem, idx) => {
        console.log(`\n--- 元素 ${idx + 1} ---`);
        console.log('类型:', elem.type);
        console.log('内容 (前50字符):', elem.content.substring(0, 50) + '...');
        if (elem.style) {
          console.log('样式:', {
            fontFamily: elem.style.fontFamily,
            fontSize: elem.style.fontSize,
            color: elem.style.color,
            bold: elem.style.bold
          });
        }
        if (elem.html) {
          console.log('HTML (前100字符):', elem.html.substring(0, 100) + '...');
        }
      });
    }
    
  } catch (error) {
    console.error('解析错误:', error);
    console.error('错误堆栈:', error.stack);
  }
}

debugParse();