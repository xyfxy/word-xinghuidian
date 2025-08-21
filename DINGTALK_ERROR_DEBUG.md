# 钉钉前端错误调试完整指南

## 🔧 已配置的调试工具

### 1. vConsole（移动端调试神器）✅
我已经配置了vConsole，它会在以下情况自动显示：
- 在钉钉环境中自动显示
- URL包含 `?vconsole=true`
- URL包含 `?debug=true`

**特点**：
- 直接在手机上看到控制台
- 查看网络请求
- 查看错误信息
- 查看本地存储

### 2. 远程调试脚本 ✅
已在 `index.html` 添加钉钉官方远程调试脚本

### 3. 全局错误捕获 ✅
自动捕获并显示：
- JavaScript错误
- Promise拒绝错误
- 钉钉JSAPI错误

## 📱 查看错误的5种方法

### 方法1：vConsole（最方便）

**在手机钉钉中**：
1. 打开应用
2. 右下角会出现绿色的 "vConsole" 按钮
3. 点击查看：
   - Console：控制台日志
   - Network：网络请求
   - Element：页面元素
   - Storage：存储数据
   - 钉钉：钉钉环境信息

**手动开启vConsole**：
```
访问URL添加参数：
http://your-app.com?vconsole=true
```

### 方法2：钉钉开发者工具

1. **下载工具**
   - [Windows版](https://open.dingtalk.com/document/resourcedownload/micro-application-four-terminal-debugging-tool-web-edition)
   - [Mac版](https://open.dingtalk.com/document/resourcedownload/micro-application-four-terminal-debugging-tool-web-edition)

2. **使用步骤**
   ```
   1. 打开钉钉开发者工具
   2. 选择 "H5微应用"
   3. 输入地址：http://localhost:3000
   4. 输入企业ID和应用ID
   5. 点击 "开始调试"
   6. 查看右侧控制台面板
   ```

### 方法3：Chrome远程调试

1. **手机端设置**
   - Android：设置 > 开发者选项 > USB调试
   - iOS：需要Mac + Safari

2. **Chrome调试**
   ```
   1. 手机连接电脑
   2. Chrome访问：chrome://inspect
   3. 找到钉钉应用
   4. 点击 inspect
   ```

### 方法4：使用alert查看错误

在代码中临时添加：
```javascript
try {
  // 你的代码
} catch (error) {
  alert('错误：' + JSON.stringify(error));
}
```

### 方法5：钉钉内置日志

```javascript
// 使用钉钉的日志API
dd.device.notification.alert({
  message: "错误信息：" + error.message,
  title: "调试信息",
  buttonName: "确定"
});
```

## 🐛 常见错误及解决方案

### 1. "dd is not defined"
**原因**：钉钉JSAPI未加载
**解决**：
```javascript
// 检查是否在钉钉环境
if (typeof dd !== 'undefined') {
  // 使用dd
}
```

### 2. "签名验证失败"
**查看方法**：
```javascript
// 在vConsole中查看
console.log('签名参数:', {
  url: location.href.split('#')[0],
  timestamp: config.timeStamp,
  nonceStr: config.nonceStr,
  signature: config.signature
});
```

### 3. "网络请求失败"
**在vConsole Network面板查看**：
- 请求URL是否正确
- 状态码
- 响应内容

### 4. "权限不足"
**调试代码**：
```javascript
dd.runtime.permission.requestAuthCode({
  corpId: corpId,
  onSuccess: function(result) {
    console.log('授权码:', result.code);
  },
  onFail: function(err) {
    console.error('授权失败:', err);
    alert('错误代码：' + err.errorCode + '\n错误信息：' + err.errorMessage);
  }
});
```

## 🎯 快速调试技巧

### 1. 一键查看所有信息
在控制台执行：
```javascript
// 查看完整环境信息
(function debugInfo() {
  const info = {
    '是否钉钉': navigator.userAgent.includes('DingTalk'),
    'UserAgent': navigator.userAgent,
    'URL': location.href,
    '环境': process.env.NODE_ENV,
    'dd是否存在': typeof dd !== 'undefined',
    '本地存储': {
      'dingTalkUser': sessionStorage.getItem('dingTalkUser'),
      'localStorage数量': localStorage.length
    }
  };
  console.table(info);
  return info;
})();
```

### 2. 监控所有API请求
```javascript
// 拦截所有axios请求
const originalRequest = axios.request;
axios.request = function(...args) {
  console.log('📤 API请求:', args[0]);
  return originalRequest.apply(this, args)
    .then(res => {
      console.log('📥 API响应:', res);
      return res;
    })
    .catch(err => {
      console.error('❌ API错误:', err);
      throw err;
    });
};
```

### 3. 钉钉JSAPI调试
```javascript
// 监听所有钉钉事件
dd.ready(() => console.log('✅ DD Ready'));
dd.error(e => console.error('❌ DD Error:', e));

// 测试基本功能
dd.device.notification.toast({
  text: '调试测试',
  duration: 3
});
```

## 📊 错误日志收集

### 前端错误上报
```javascript
window.addEventListener('error', (event) => {
  const errorInfo = {
    message: event.message,
    source: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack,
    userAgent: navigator.userAgent,
    url: location.href,
    time: new Date().toISOString()
  };
  
  // 发送到后端
  fetch('/api/log/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorInfo)
  });
});
```

## 🚀 调试URL参数总结

| 参数 | 作用 | 示例 |
|------|------|------|
| `debug=dingtalk` | 跳过钉钉环境检测 | `?debug=dingtalk` |
| `vconsole=true` | 显示vConsole | `?vconsole=true` |
| `debug=true` | 启用所有调试 | `?debug=true` |
| `dingtalk-debug=true` | 启用远程调试 | `?dingtalk-debug=true` |

**组合使用**：
```
http://localhost:3000?debug=true&vconsole=true
```

## 📝 调试检查清单

开发时检查：
- [ ] vConsole是否显示
- [ ] 控制台是否有错误
- [ ] 网络请求是否正常
- [ ] 钉钉配置是否成功
- [ ] 用户信息是否获取

发布前移除：
- [ ] 移除alert调试
- [ ] 移除多余的console.log
- [ ] 关闭vConsole（生产环境）
- [ ] 移除调试参数

## 💡 Pro Tips

1. **保存错误截图**：在vConsole中长按可以复制日志

2. **批量调试**：
   ```javascript
   // 创建调试函数
   window.debug = {
     showAll: () => { /* 显示所有信息 */ },
     testAPI: () => { /* 测试API */ },
     testDD: () => { /* 测试钉钉 */ }
   };
   ```

3. **使用断点调试**：
   在代码中添加 `debugger;`，配合开发者工具使用

4. **性能监控**：
   ```javascript
   console.time('加载时间');
   // ... 代码
   console.timeEnd('加载时间');
   ```

## 🆘 还是看不到错误？

1. **确认vConsole已加载**：
   - 刷新页面
   - 检查右下角绿色按钮
   - 或在URL加 `?vconsole=true`

2. **检查网络**：
   - 确保能访问后端
   - 检查代理配置

3. **清除缓存**：
   - 清除浏览器缓存
   - 清除钉钉缓存

4. **联系支持**：
   - 提供错误截图
   - 提供操作步骤
   - 提供环境信息