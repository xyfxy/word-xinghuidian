# 钉钉访问控制集成说明

## 功能概述

本功能实现了Word星辉点项目的钉钉专属访问控制，确保应用只能通过钉钉客户端访问，提高安全性和企业内部应用的管控能力。

## 实现原理

### 双重验证机制

1. **环境检测**：通过检测 `navigator.userAgent` 判断是否在钉钉环境
2. **JSAPI鉴权**：使用钉钉JSAPI进行身份认证，获取用户信息

## 配置步骤

### 1. 钉钉开放平台配置

1. 登录[钉钉开放平台](https://open.dingtalk.com/)
2. 创建企业内部应用
3. 获取以下配置信息：
   - Corp ID（企业ID）
   - Agent ID（应用ID）
   - App Key
   - App Secret

### 2. 环境变量配置

复制配置模板并填入实际值：

```bash
cp .env.dingtalk.example .env
```

编辑 `.env` 文件：

```env
# 前端配置
VITE_ENABLE_DINGTALK_AUTH=true

# 后端配置
ENABLE_DINGTALK_AUTH=true
DINGTALK_CORP_ID=your_corp_id
DINGTALK_AGENT_ID=your_agent_id
DINGTALK_APP_KEY=your_app_key
DINGTALK_APP_SECRET=your_app_secret
```

### 3. 安装依赖

前端已安装 `dingtalk-jsapi` 依赖，无需额外操作。

## 项目结构

### 前端组件

```
frontend/src/components/DingTalkAuth/
├── DingTalkGuard.tsx    # 环境检测组件
├── DingTalkAuth.tsx     # JSAPI鉴权组件
└── AccessDenied.tsx     # 访问拒绝提示页

frontend/src/services/
└── dingTalkService.ts   # 钉钉服务封装
```

### 后端模块

```
backend/src/
├── routes/dingtalk.ts           # 钉钉API路由
├── services/dingTalkService.ts  # 钉钉服务实现
└── middleware/dingTalkAuth.ts   # 认证中间件
```

## 功能特性

### 访问控制流程

1. 用户访问应用
2. 前端检测是否在钉钉环境
3. 非钉钉环境显示"请在钉钉中打开"提示
4. 钉钉环境执行JSAPI鉴权
5. 获取用户信息并存储
6. 所有API请求携带钉钉认证信息

### 开发调试

开发环境支持调试模式，添加URL参数 `?debug=dingtalk` 可绕过钉钉环境检测：

```
http://localhost:3000?debug=dingtalk
```

### 安全特性

- UserAgent 环境检测
- JSAPI 签名验证
- Token 有效期管理（2小时）
- API 请求来源验证
- 用户身份持续验证

## 部署注意事项

### 生产环境配置

1. 确保设置正确的环境变量
2. 配置钉钉应用的回调域名
3. 添加服务器IP到钉钉白名单（如有需要）

### CORS配置

后端需要允许钉钉域名的跨域请求：

```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'https://your-domain.com',
    'https://*.dingtalk.com'
  ],
  credentials: true,
}));
```

## API接口

### 获取JSAPI配置

```
GET /api/dingtalk/config?url=当前页面URL
```

返回：
```json
{
  "success": true,
  "data": {
    "agentId": "xxx",
    "corpId": "xxx",
    "timeStamp": 1234567890,
    "nonceStr": "xxx",
    "signature": "xxx"
  }
}
```

### 获取用户信息

```
POST /api/dingtalk/userinfo
{
  "authCode": "xxx"
}
```

返回：
```json
{
  "success": true,
  "data": {
    "userId": "xxx",
    "name": "张三",
    "avatar": "xxx",
    "department": ["部门1"],
    "mobile": "xxx",
    "email": "xxx@xxx.com"
  }
}
```

## 故障排查

### 常见问题

1. **"请在钉钉中打开"提示**
   - 确认是否在钉钉客户端内访问
   - 检查UserAgent是否包含"DingTalk"

2. **JSAPI鉴权失败**
   - 检查钉钉配置是否正确
   - 确认URL参数是否正确（不包含#后面部分）
   - 验证签名生成是否正确

3. **获取用户信息失败**
   - 检查Access Token是否有效
   - 确认授权码（authCode）是否过期
   - 验证用户是否在企业通讯录中

### 日志查看

后端日志会输出详细的错误信息：

```bash
# 查看后端日志
npm run dev:backend
```

前端可在浏览器控制台查看：
- 钉钉环境检测结果
- JSAPI配置状态
- 用户认证信息

## 测试方法

### 本地测试

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 使用钉钉开发者工具访问：
   - 下载[钉钉开发者工具](https://open.dingtalk.com/document/resourcedownload/http-debug)
   - 配置本地地址 `http://localhost:3000`

3. 真机测试：
   - 使用内网穿透工具（如ngrok）
   - 在钉钉工作台添加应用
   - 手机钉钉访问测试

### 功能验证清单

- [ ] 非钉钉环境无法访问
- [ ] 钉钉环境可正常访问
- [ ] JSAPI鉴权成功
- [ ] 用户信息获取正确
- [ ] API请求携带认证信息
- [ ] 开发调试模式正常

## 禁用功能

如需临时禁用钉钉访问控制：

1. 修改环境变量：
   ```env
   VITE_ENABLE_DINGTALK_AUTH=false
   ENABLE_DINGTALK_AUTH=false
   ```

2. 重启应用

## 分支管理

该功能在 `feature/dingtalk-access-control` 分支开发，合并前请确保：

1. 所有测试通过
2. 生产环境配置正确
3. 文档更新完整
4. Code Review通过

## 联系支持

如有问题，请联系技术支持团队或查阅钉钉开放平台文档。