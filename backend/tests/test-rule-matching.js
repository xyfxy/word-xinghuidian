// 测试规则匹配
const { RuleMatcher, ContentGrouper } = require('./dist/services/wordParserHelpers');
const { DEFAULT_RULES } = require('./dist/constants/wordImportRules');

// 模拟解析后的文档
const testElements = [
  {
    id: '1',
    type: 'paragraph',
    content: '二、调研流程',
    style: {}
  },
  {
    id: '2',
    type: 'paragraph',
    content: '这是调研流程的详细内容',
    style: {}
  }
];

console.log('测试元素:', testElements);
console.log('\n启用的规则:');

const enabledRules = DEFAULT_RULES.filter(r => r.enabled);
enabledRules.forEach(rule => {
  console.log(`- ${rule.name} (${rule.type}): ${rule.enabled ? '启用' : '禁用'}`);
  if (rule.type === 'heading-pattern') {
    console.log(`  模式: ${rule.config.pattern}`);
  }
});

// 测试规则匹配
const matcher = new RuleMatcher();
const grouper = new ContentGrouper(matcher);

console.log('\n开始测试规则匹配...');

// 直接测试规则匹配
const chineseHeadingRule = enabledRules.find(r => r.id === 'rule-chinese-heading-1');
if (chineseHeadingRule) {
  console.log('\n测试中文数字一级标题规则:');
  console.log('规则配置:', chineseHeadingRule.config);
  
  testElements.forEach(elem => {
    const isMatch = matcher.match(elem, chineseHeadingRule);
    console.log(`元素 "${elem.content}" 匹配结果: ${isMatch}`);
  });
}

// 测试分组
console.log('\n测试内容分组...');
const groups = grouper.group(testElements, enabledRules);
console.log(`生成了 ${groups.length} 个内容组:`);
groups.forEach((group, index) => {
  console.log(`\n组 ${index + 1}:`);
  console.log(`- 标题: ${group.suggestedTitle}`);
  console.log(`- 类型: ${group.suggestedType}`);
  console.log(`- 匹配的规则: ${group.matchedRule || '无'}`);
  console.log(`- 包含元素数: ${group.elements.length}`);
  group.elements.forEach(elem => {
    console.log(`  - ${elem.type}: "${elem.content}"`);
  });
});