# Word星辉点 API接口文档

## 1. 概述

Word星辉点提供RESTful API接口，支持文档管理、AI内容生成、模板管理等功能。

### 1.1 基础信息
- **基础URL**: `http://localhost:3003/api` (开发环境)
- **生产URL**: `http://221.229.216.122:3003/api`
- **请求格式**: JSON
- **响应格式**: JSON
- **字符编码**: UTF-8

### 1.2 通用响应格式

成功响应：
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

错误响应：
```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## 2. AI内容生成接口

### 2.1 生成内容

**接口地址**: `POST /ai/generate`

**请求参数**:
```json
{
  "prompt": "string",        // 必需，生成提示词
  "context": "string",       // 可选，上下文信息
  "maxTokens": 1000,        // 可选，最大token数，默认1000
  "temperature": 0.7,       // 可选，温度参数，0-1之间，默认0.7
  "stream": false          // 可选，是否流式输出，默认false
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "content": "生成的内容文本",
    "usage": {
      "promptTokens": 100,
      "completionTokens": 200,
      "totalTokens": 300
    }
  }
}
```

**错误码**:
- `AI_SERVICE_ERROR`: AI服务调用失败
- `INVALID_API_KEY`: API密钥无效
- `RATE_LIMIT_EXCEEDED`: 超过速率限制

### 2.2 流式生成

**接口地址**: `POST /ai/generate-stream`

**请求参数**: 同2.1

**响应格式**: Server-Sent Events (SSE)
```
data: {"content": "生成的", "done": false}
data: {"content": "内容", "done": false}
data: {"content": "", "done": true}
```

## 3. 文档管理接口

### 3.1 导入Word文档

**接口地址**: `POST /documents/import`

**请求格式**: `multipart/form-data`

**请求参数**:
- `file`: Word文档文件（.docx格式）
- `extractStructure`: 是否提取文档结构（可选，默认true）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "content": "文档内容HTML格式",
    "structure": {
      "headings": ["标题1", "标题2"],
      "paragraphs": 10,
      "tables": 2,
      "images": 3
    },
    "metadata": {
      "title": "文档标题",
      "author": "作者",
      "createdDate": "2024-01-01",
      "modifiedDate": "2024-01-02"
    }
  }
}
```

### 3.2 导出Word文档

**接口地址**: `POST /documents/export`

**请求参数**:
```json
{
  "content": "string",        // 必需，HTML格式的文档内容
  "filename": "string",       // 可选，文件名，默认"document.docx"
  "metadata": {              // 可选，文档元数据
    "title": "string",
    "author": "string",
    "description": "string"
  }
}
```

**响应**: 二进制文件流（application/vnd.openxmlformats-officedocument.wordprocessingml.document）

### 3.3 预览文档

**接口地址**: `POST /documents/preview`

**请求参数**:
```json
{
  "content": "string",        // HTML格式的文档内容
  "format": "html"           // 预览格式，支持html/pdf
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "previewUrl": "/preview/temp_12345.html",
    "expiresIn": 3600  // 预览链接有效期（秒）
  }
}
```

## 4. 模板管理接口

### 4.1 获取模板列表

**接口地址**: `GET /templates`

**查询参数**:
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认10
- `category`: 模板分类筛选
- `search`: 关键词搜索

**响应示例**:
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_001",
        "name": "工作报告模板",
        "category": "report",
        "description": "适用于月度/季度工作报告",
        "thumbnail": "/thumbnails/template_001.png",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-02T00:00:00Z",
        "usageCount": 150
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### 4.2 获取模板详情

**接口地址**: `GET /templates/:id`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "template_001",
    "name": "工作报告模板",
    "category": "report",
    "description": "详细描述",
    "content": {
      "structure": [
        {
          "type": "fixed",
          "content": "# 工作报告\n\n## 一、本期工作总结"
        },
        {
          "type": "ai_generated",
          "prompt": "根据以下要点生成工作总结",
          "placeholder": "AI将在此生成内容"
        }
      ]
    },
    "variables": [
      {
        "name": "department",
        "label": "部门名称",
        "type": "text",
        "required": true
      }
    ]
  }
}
```

### 4.3 创建模板

**接口地址**: `POST /templates`

**请求参数**:
```json
{
  "name": "string",          // 必需，模板名称
  "category": "string",      // 必需，模板分类
  "description": "string",   // 可选，模板描述
  "content": {              // 必需，模板内容结构
    "structure": []
  },
  "variables": []           // 可选，模板变量定义
}
```

### 4.4 更新模板

**接口地址**: `PUT /templates/:id`

**请求参数**: 同创建模板

### 4.5 删除模板

**接口地址**: `DELETE /templates/:id`

**响应示例**:
```json
{
  "success": true,
  "message": "模板删除成功"
}
```

## 5. 钉钉认证接口

### 5.1 获取钉钉配置

**接口地址**: `GET /auth/dingtalk/config`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "corpId": "ding123456",
    "agentId": "789012",
    "enabled": true
  }
}
```

### 5.2 钉钉免登验证

**接口地址**: `POST /auth/dingtalk/login`

**请求参数**:
```json
{
  "authCode": "string"  // 钉钉免登授权码
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "user123",
      "name": "张三",
      "avatar": "https://xxx.png",
      "department": "技术部"
    },
    "token": "jwt_token_string",
    "expiresIn": 7200
  }
}
```

## 6. 系统配置接口

### 6.1 获取系统配置

**接口地址**: `GET /config`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "version": "1.6.2",
    "features": {
      "aiGeneration": true,
      "templateSystem": true,
      "dingTalkAuth": false
    },
    "limits": {
      "maxFileSize": 10485760,  // 10MB
      "maxContentLength": 100000
    }
  }
}
```

## 7. 错误处理

### 7.1 通用错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| INVALID_REQUEST | 400 | 请求参数无效 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| METHOD_NOT_ALLOWED | 405 | 请求方法不允许 |
| CONFLICT | 409 | 资源冲突 |
| RATE_LIMIT_EXCEEDED | 429 | 超过速率限制 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务暂时不可用 |

### 7.2 速率限制

- 默认限制：每IP每分钟60次请求
- AI生成接口：每IP每分钟10次请求
- 文档导出接口：每IP每分钟20次请求

响应头中包含速率限制信息：
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

## 8. 安全说明

### 8.1 认证方式

1. **开放模式**：无需认证（开发环境）
2. **钉钉认证**：通过钉钉免登获取JWT Token
3. **Token认证**：在请求头中携带JWT Token
   ```
   Authorization: Bearer <token>
   ```

### 8.2 CORS配置

开发环境允许所有来源，生产环境配置白名单：
```javascript
{
  origin: ['http://221.229.216.122:3000', 'https://yourdomain.com'],
  credentials: true
}
```

### 8.3 数据加密

- 敏感数据（如API密钥）使用AES-256-GCM加密存储
- HTTPS传输加密（生产环境）
- 密码使用bcrypt哈希存储

## 9. 示例代码

### 9.1 JavaScript/TypeScript

```typescript
// AI内容生成
async function generateContent(prompt: string) {
  const response = await fetch('http://localhost:3003/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      prompt: prompt,
      maxTokens: 1000,
      temperature: 0.7
    })
  });
  
  const result = await response.json();
  return result.data.content;
}

// 导出Word文档
async function exportDocument(content: string) {
  const response = await fetch('http://localhost:3003/api/documents/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: content,
      filename: 'my_document.docx'
    })
  });
  
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my_document.docx';
  a.click();
}
```

### 9.2 Python

```python
import requests
import json

# AI内容生成
def generate_content(prompt):
    url = "http://localhost:3003/api/ai/generate"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    data = {
        "prompt": prompt,
        "maxTokens": 1000,
        "temperature": 0.7
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    return result["data"]["content"]

# 获取模板列表
def get_templates(category=None):
    url = "http://localhost:3003/api/templates"
    params = {}
    if category:
        params["category"] = category
    
    response = requests.get(url, params=params)
    result = response.json()
    return result["data"]["templates"]
```

## 10. 更新日志

### v1.6.2 (2025-08-22)
- 支持钉钉认证动态切换
- 修复TypeScript编译错误
- 优化环境变量配置

### v1.6.0 (2025-08-20)
- 添加钉钉H5微应用支持
- 新增免登认证接口
- 优化API错误处理

### v1.5.0 (2025-08-15)
- 添加模板管理系统
- 支持AI内容流式输出
- 优化文档导入导出性能