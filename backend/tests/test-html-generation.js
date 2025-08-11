// 测试HTML生成问题
const fs = require('fs');
const path = require('path');

// 模拟enhancedWordParserService的HTML生成逻辑
function generateParagraphHtml(runs) {
  const htmlRuns = [];
  
  runs.forEach(run => {
    let htmlFragment = run.text;
    
    // 应用样式
    if (run.bold) {
      htmlFragment = `<strong>${htmlFragment}</strong>`;
    }
    if (run.italic) {
      htmlFragment = `<em>${htmlFragment}</em>`;
    }
    if (run.underline) {
      htmlFragment = `<u>${htmlFragment}</u>`;
    }
    
    htmlRuns.push(htmlFragment);
  });
  
  // 问题在这里：所有runs被合并
  const html = htmlRuns.join('');
  return `<p>${html}</p>`;
}

// 测试数据
const testRuns = [
  { text: '赴张家港市凤凰科创园', bold: true, italic: true, underline: true },
  { text: '调研式教学学习报告', bold: false, italic: false, underline: false }
];

console.log('测试HTML生成问题：\n');

// 当前的生成方式（有问题）
const currentHtml = generateParagraphHtml(testRuns);
console.log('当前生成的HTML（问题）:');
console.log(currentHtml);
console.log('\n预期效果:');
console.log('<p><u><em><strong>赴张家港市凤凰科创园</strong></em></u>调研式教学学习报告</p>');

console.log('\n分析:');
console.log('如果这些runs属于同一个段落，HTML应该正确反映每个run的独立样式。');
console.log('但如果它们是不同的段落，应该生成独立的<p>标签。');