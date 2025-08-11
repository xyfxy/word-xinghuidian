// 测试图片分组标题生成
const { EnhancedWordParserService } = require('./dist/services/enhancedWordParserService');
const { RuleMatcher, ContentGrouper } = require('./dist/services/wordParserHelpers');
const fs = require('fs');

async function testImageGroups() {
  console.log('=== 测试图片分组标题生成 ===\n');
  
  // 创建模拟的解析文档，包含多个图片
  const mockDocument = {
    elements: [
      {
        id: '1',
        type: 'paragraph',
        content: '这是第一段文字',
        html: '<p>这是第一段文字</p>'
      },
      {
        id: '2',
        type: 'image',
        content: '',
        html: '',
        imageData: {
          src: 'data:image/png;base64,mock1',
          width: 100,
          height: 100,
          alt: ''
        }
      },
      {
        id: '3',
        type: 'paragraph',
        content: '这是第二段文字',
        html: '<p>这是第二段文字</p>'
      },
      {
        id: '4',
        type: 'image',
        content: '',
        html: '',
        imageData: {
          src: 'data:image/png;base64,mock2',
          width: 100,
          height: 100,
          alt: ''
        }
      }
    ]
  };
  
  // 使用默认规则进行分组
  const rules = [];
  const matcher = new RuleMatcher();
  const grouper = new ContentGrouper(matcher);
  
  console.log('原始元素:');
  mockDocument.elements.forEach((elem, idx) => {
    console.log(`  ${idx + 1}. ${elem.type}: ${elem.content || '(图片)'}`);
  });
  
  console.log('\n生成的内容组:');
  const groups = grouper.group(mockDocument.elements, rules);
  
  groups.forEach((group, idx) => {
    console.log(`\n组 ${idx + 1}:`);
    console.log(`  ID: ${group.id}`);
    console.log(`  建议标题: "${group.suggestedTitle}"`);
    console.log(`  类型: ${group.suggestedType}`);
    console.log(`  包含元素:`);
    group.elements.forEach(elem => {
      console.log(`    - ${elem.type}: ${elem.content || '(图片)'}`);
    });
  });
  
  // 测试实际的Word文档
  const testFile = './test-docs/test-with-images.docx';
  if (fs.existsSync(testFile)) {
    console.log('\n\n=== 测试实际Word文档 ===\n');
    const buffer = fs.readFileSync(testFile);
    const parser = new EnhancedWordParserService();
    const parsed = await parser.parseDocument(buffer);
    
    console.log(`解析出 ${parsed.elements.length} 个元素`);
    
    const realGroups = grouper.group(parsed.elements, rules);
    console.log(`\n生成 ${realGroups.length} 个内容组:`);
    
    realGroups.forEach((group, idx) => {
      console.log(`\n组 ${idx + 1}:`);
      console.log(`  建议标题: "${group.suggestedTitle}"`);
      console.log(`  类型: ${group.suggestedType}`);
      console.log(`  元素数量: ${group.elements.length}`);
    });
  }
}

testImageGroups().catch(console.error);