# 钉钉H5微应用调试指南

## 远程调试工具配置

### 1. 远程调试脚本已配置

我已经在 `frontend/index.html` 中添加了钉钉远程调试脚本：

```javascript
<script src="https://g.alicdn.com/code/npm/@ali/dingtalk-h5-remote-debug/0.3.3/index.js"></script>
```

脚本会在以下情况自动加载：
- 本地开发环境（localhost）
- URL包含 `dingtalk-debug=true` 参数

### 2. 使用钉钉开发者工具

#### 下载地址
- [钉钉开发者工具下载](https://open.dingtalk.com/document/resourcedownload/micro-application-four-terminal-debugging-tool-web-edition)

#### 使用步骤

1. **启动本地开发服务器**
   ```bash
   npm run dev
   ```
   前端运行在: http://localhost:3000
   后端运行在: http://localhost:3001

2. **打开钉钉开发者工具**
   - 选择"H5微应用"
   - 输入本地地址: `http://localhost:3000`
   - 配置企业信息

3. **配置企业参数**
   ```
   CorpId: 你的企业ID
   AgentId: 你的应用ID
   ```

4. **开始调试**
   - 点击"开始调试"按钮
   - 工具会模拟钉钉环境
   - 可以查看控制台输出

## 真机调试方法

### 方法一：内网穿透（推荐）

1. **使用ngrok或花生壳**
   ```bash
   # 安装ngrok
   npm install -g ngrok
   
   # 穿透前端端口
   ngrok http 3000
   ```

2. **获取公网地址**
   ```
   例如: https://abc123.ngrok.io
   ```

3. **配置钉钉应用**
   - 登录钉钉开放平台
   - 配置应用首页地址为ngrok地址
   - 添加到安全域名

4. **手机访问**
   - 在钉钉工作台找到应用
   - 点击进入即可调试

### 方法二：局域网调试

1. **确保手机和电脑在同一网络**

2. **获取电脑IP地址**
   ```bash
   ipconfig
   # 找到IPv4地址，如: 192.168.1.100
   ```

3. **修改前端配置**
   ```javascript
   // 临时修改 vite.config.ts
   server: {
     host: '0.0.0.0', // 允许外部访问
     port: 3000
   }
   ```

4. **手机访问**
   ```
   http://192.168.1.100:3000
   ```

## 调试技巧

### 1. 查看环境信息

在控制台执行：
```javascript
// 查看是否在钉钉环境
console.log('UserAgent:', navigator.userAgent);
console.log('是否钉钉:', navigator.userAgent.includes('DingTalk'));

// 查看钉钉版本
if (typeof dd !== 'undefined') {
  dd.runtime.info({
    onSuccess: function(info) {
      console.log('钉钉信息:', info);
    }
  });
}
```

### 2. 调试JSAPI鉴权

```javascript
// 查看配置信息
console.log('钉钉配置:', {
  corpId: config.corpId,
  agentId: config.agentId,
  timestamp: config.timeStamp,
  signature: config.signature
});

// 监听配置结果
dd.ready(() => {
  console.log('✅ 钉钉配置成功');
});

dd.error((err) => {
  console.error('❌ 钉钉配置失败:', err);
});
```

### 3. 开发环境快捷方式

#### 跳过钉钉环境检测
```
http://localhost:3000?debug=dingtalk
```

#### 启用远程调试
```
http://localhost:3000?dingtalk-debug=true
```

#### 同时启用两者
```
http://localhost:3000?debug=dingtalk&dingtalk-debug=true
```

## 常见问题

### Q1: 提示"请在钉钉中打开"
**解决方案**：
1. 确认在钉钉客户端内访问
2. 开发时添加 `?debug=dingtalk` 参数
3. 检查UserAgent是否包含"DingTalk"

### Q2: JSAPI鉴权失败
**可能原因**：
1. **签名错误**：检查URL参数（不含#）
2. **配置未完成**：检查.env文件配置
3. **域名未备案**：添加到安全域名列表

### Q3: 获取用户信息失败
**排查步骤**：
1. 检查授权码是否过期
2. 确认用户在企业通讯录
3. 查看后端日志错误信息

### Q4: 加载很慢
**优化方案**：
1. 使用优化版组件（已实现）
2. 检查网络连接
3. 查看控制台是否有超时

## 生产环境注意事项

### 1. 移除调试代码

部署前检查：
- [ ] 移除远程调试脚本
- [ ] 关闭调试模式
- [ ] 删除console.log
- [ ] 更新环境变量

### 2. 配置检查

```env
# 生产环境 .env
VITE_ENABLE_DINGTALK_AUTH=true
ENABLE_DINGTALK_AUTH=true
NODE_ENV=production

# 确保配置真实的钉钉参数
DINGTALK_CORP_ID=真实企业ID
DINGTALK_AGENT_ID=真实应用ID
DINGTALK_APP_KEY=真实AppKey
DINGTALK_APP_SECRET=真实AppSecret
```

### 3. 域名配置

在钉钉开放平台配置：
- 应用首页地址
- 服务器出口IP
- 安全域名白名单

## 调试流程图

```
1. 本地开发
   ├── npm run dev
   ├── 访问 localhost:3000?debug=dingtalk
   └── 开发调试
   
2. 钉钉开发者工具
   ├── 配置企业信息
   ├── 输入本地地址
   └── 模拟调试
   
3. 真机测试
   ├── 内网穿透/局域网
   ├── 配置钉钉应用
   └── 手机访问测试
   
4. 生产部署
   ├── 移除调试代码
   ├── 配置生产环境
   └── 发布上线
```

## 有用的链接

- [钉钉开放平台](https://open.dingtalk.com/)
- [JSAPI文档](https://open.dingtalk.com/document/orgapp/jsapi-overview)
- [H5微应用开发指南](https://open.dingtalk.com/document/org/develop-org-h5-micro-applications)
- [调试工具下载](https://open.dingtalk.com/document/resourcedownload/micro-application-four-terminal-debugging-tool-web-edition)

## 联系支持

如遇到问题：
1. 查看浏览器控制台错误
2. 检查后端日志输出
3. 参考钉钉官方文档
4. 联系技术支持团队