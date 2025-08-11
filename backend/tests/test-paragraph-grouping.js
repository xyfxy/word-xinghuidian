const { EnhancedWordParserService } = require('./dist/services/enhancedWordParserService');
const { DEFAULT_RULES } = require('./dist/constants/wordImportRules');
const fs = require('fs');
const path = require('path');

async function testParagraphGrouping() {
  try {
    console.log('测试段落分组功能...\n');
    
    // 读取测试文档
    let testFile = path.join(__dirname, 'test-docs/test-table-fonts.docx');
    if (!fs.existsSync(testFile)) {
      // 尝试其他测试文件
      const altFile = path.join(__dirname, 'test-docs/testdoc-with-styles.docx');
      if (fs.existsSync(altFile)) {
        testFile = altFile;
      } else {
        console.error('测试文件不存在');
        return;
      }
    }
    
    const buffer = fs.readFileSync(testFile);
    
    // 解析文档
    const parser = new EnhancedWordParserService();
    const parsedDocument = await parser.parseDocument(buffer);
    
    console.log(`解析完成，共 ${parsedDocument.elements.length} 个元素\n`);
    
    // 显示前几个元素的样式
    console.log('解析的元素:');
    parsedDocument.elements.slice(0, 5).forEach((elem, idx) => {
      console.log(`元素${idx}:`);
      console.log(`  类型: ${elem.type}`);
      console.log(`  内容: "${elem.content?.substring(0, 50)}..."`);
      console.log(`  样式:`, elem.style);
      console.log('');
    });
    
    // 应用规则进行分组
    console.log('\n应用分组规则...');
    const contentGroups = await parser.applyRecognitionRules(parsedDocument, DEFAULT_RULES);
    
    console.log(`\n生成 ${contentGroups.length} 个内容块组\n`);
    
    // 显示分组结果
    contentGroups.slice(0, 5).forEach((group, idx) => {
      console.log(`内容块组${idx}:`);
      console.log(`  标题: "${group.suggestedTitle}"`);
      console.log(`  类型: ${group.suggestedType}`);
      console.log(`  元素数: ${group.elements.length}`);
      console.log(`  匹配规则: ${group.matchedRule}`);
      
      if (group.elements.length === 1) {
        console.log(`  单元素样式:`, group.elements[0].style);
      } else {
        console.log(`  包含多个元素:`);
        group.elements.forEach((elem, elemIdx) => {
          console.log(`    元素${elemIdx}: "${elem.content?.substring(0, 30)}..." 样式:`, elem.style);
        });
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testParagraphGrouping();