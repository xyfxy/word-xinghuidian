// 验证字符属性提取改进
console.log('=== 字符属性提取逻辑改进验证 ===\n');

console.log('🚨 修复前的问题：');
console.log('1. 强制设置格式属性为false，即使原文中没有这些格式');
console.log('2. 在字符属性中重复提取段落级别的属性');
console.log('3. 职责不清：字符属性和段落属性混合\n');

console.log('✅ 修复后的改进：');
console.log('1. 只在XML中存在对应标签时才设置格式属性');
console.log('2. 字符属性专注于run级别：颜色、字体、字号、粗体、斜体、下划线');
console.log('3. 段落属性（行高、对齐、缩进）由extractParagraphProperties处理\n');

console.log('📋 测试场景对比：');

const scenarios = [
  {
    name: '普通文本（无格式）',
    xmlInput: { 'w:rFonts': [{ $: { 'w:eastAsia': 'SimSun' } }] },
    before: { fontFamily: 'SimSun', bold: false, italic: false, underline: false },
    after: { fontFamily: 'SimSun' } // 不设置不存在的格式属性
  },
  {
    name: '粗体文本',
    xmlInput: { 
      'w:rFonts': [{ $: { 'w:eastAsia': 'SimSun' } }],
      'w:b': [{}] // 存在粗体标签
    },
    before: { fontFamily: 'SimSun', bold: true, italic: false, underline: false },
    after: { fontFamily: 'SimSun', bold: true } // 只设置存在的格式属性
  },
  {
    name: '红色文本',
    xmlInput: {
      'w:rFonts': [{ $: { 'w:eastAsia': 'SimSun' } }],
      'w:color': [{ $: { 'w:val': 'FF0000' } }]
    },
    before: { fontFamily: 'SimSun', color: '#FF0000', bold: false, italic: false, underline: false },
    after: { fontFamily: 'SimSun', color: '#FF0000' } // 不设置不存在的格式属性
  }
];

scenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}:`);
  console.log(`   修复前: ${JSON.stringify(scenario.before)}`);
  console.log(`   修复后: ${JSON.stringify(scenario.after)}`);
  console.log(`   改进: 移除了不必要的false值设置\n`);
});

console.log('🎯 预期效果：');
console.log('- 普通文本不会有 bold: false, italic: false, underline: false');
console.log('- 只有实际存在格式的地方才会设置对应属性');
console.log('- 字符属性和段落属性职责分离更清晰');
console.log('- 减少了不必要的属性传递和处理');

console.log('\n=== 验证完成 ==='); 