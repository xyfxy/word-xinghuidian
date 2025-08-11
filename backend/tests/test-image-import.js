// 测试图片导入功能
const fs = require('fs');
const path = require('path');
const { EnhancedWordParserService } = require('./dist/services/enhancedWordParserService');

async function testImageImport() {
  try {
    console.log('开始测试Word图片导入功能...\n');
    
    // 检查是否有测试文档
    const testDocPath = path.join(__dirname, 'test-docs', 'test-with-images.docx');
    
    if (!fs.existsSync(testDocPath)) {
      console.log('请创建测试文档: test-docs/test-with-images.docx');
      console.log('该文档应包含：');
      console.log('1. 一些文本内容');
      console.log('2. 至少一张图片');
      console.log('3. 图片后的更多文本');
      return;
    }
    
    // 读取文档
    const buffer = fs.readFileSync(testDocPath);
    const parser = new EnhancedWordParserService();
    
    console.log('解析文档...');
    const result = await parser.parseDocument(buffer);
    
    console.log('\n解析结果：');
    console.log(`- 元素总数: ${result.elements.length}`);
    console.log(`- 元数据:`, result.metadata);
    
    // 统计各类型元素
    const typeCounts = {};
    result.elements.forEach(elem => {
      typeCounts[elem.type] = (typeCounts[elem.type] || 0) + 1;
    });
    
    console.log('\n元素类型统计:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}个`);
    });
    
    // 查找图片元素
    const imageElements = result.elements.filter(elem => elem.type === 'image');
    
    if (imageElements.length > 0) {
      console.log(`\n找到 ${imageElements.length} 张图片:`);
      imageElements.forEach((img, index) => {
        console.log(`\n图片 ${index + 1}:`);
        console.log(`  - ID: ${img.id}`);
        console.log(`  - 类型: ${img.type}`);
        if (img.imageData) {
          console.log(`  - 尺寸: ${img.imageData.width || '未知'} x ${img.imageData.height || '未知'}`);
          console.log(`  - Alt文本: ${img.imageData.alt || '无'}`);
          console.log(`  - 数据大小: ${img.imageData.src.length} 字符`);
          console.log(`  - 数据前缀: ${img.imageData.src.substring(0, 50)}...`);
        }
      });
      
      // 保存第一张图片用于验证
      if (imageElements[0].imageData && imageElements[0].imageData.src.startsWith('data:')) {
        const base64Data = imageElements[0].imageData.src.split(',')[1];
        const imgBuffer = Buffer.from(base64Data, 'base64');
        const outputPath = path.join(__dirname, 'test-output-image.png');
        fs.writeFileSync(outputPath, imgBuffer);
        console.log(`\n第一张图片已保存到: ${outputPath}`);
      }
    } else {
      console.log('\n未找到图片元素');
    }
    
    // 显示前几个元素
    console.log('\n前5个元素预览:');
    result.elements.slice(0, 5).forEach((elem, index) => {
      console.log(`\n${index + 1}. ${elem.type}${elem.level ? ` (级别${elem.level})` : ''}`);
      if (elem.type === 'image') {
        console.log(`   图片: ${elem.imageData ? '已加载' : '未加载'}`);
      } else {
        console.log(`   内容: ${elem.content.substring(0, 100)}${elem.content.length > 100 ? '...' : ''}`);
      }
      if (elem.style) {
        console.log(`   样式:`, elem.style);
      }
    });
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testImageImport();