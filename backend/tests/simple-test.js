// 简单测试正则表达式匹配
const pattern = '^[一二三四五六七八九十]+[、．.]\\s*';
const regex = new RegExp(pattern);

const testString = '二、调研流程';
console.log('测试字符串:', testString);
console.log('正则表达式:', pattern);
console.log('匹配结果:', regex.test(testString));

// 测试更多情况
console.log('\n更多测试:');
const moreTests = [
  '二、调研流程',
  '二、 调研流程',
  '　二、调研流程', // 全角空格
  ' 二、调研流程',  // 前面有空格
  '\t二、调研流程', // 前面有制表符
];

moreTests.forEach(test => {
  console.log(`"${test}" -> ${regex.test(test)}`);
});

// 测试字符编码
console.log('\n字符编码测试:');
console.log('测试字符串的长度:', testString.length);
console.log('字符编码:');
for (let i = 0; i < testString.length; i++) {
  console.log(`  ${i}: "${testString[i]}" (Unicode: ${testString.charCodeAt(i)})`);
}