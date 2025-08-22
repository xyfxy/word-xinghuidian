# 生产环境部署指南

## 1. 环境变量配置

### 方法一：使用 .env 文件（推荐）

1. **创建环境配置文件**
```bash
# 复制模板文件
cp .env.production.example .env

# 编辑配置文件
nano .env
```

2. **填入实际配置值**
- `QIANWEN_API_KEY`: 从阿里云控制台获取的千问API密钥
- `MODEL_ENCRYPTION_KEY`: 自定义的加密密钥（用于加密存储的模型配置）
- `DINGTALK_CORP_ID`: 钉钉企业ID
- `DINGTALK_AGENT_ID`: 钉钉应用Agent ID
- `DINGTALK_APP_KEY`: 钉钉应用App Key
- `DINGTALK_APP_SECRET`: 钉钉应用App Secret
- `VITE_API_BASE_URL`: 后端API地址（例如: http://221.229.216.122:3003/api）

### 方法二：使用 Docker Compose 环境变量

在 `docker-compose.yml` 中直接配置：

```yaml
services:
  backend:
    image: xieyifanxyf/word-xinghuidian-backend:v1.5.9
    environment:
      - NODE_ENV=production
      - PORT=3003
      - QIANWEN_API_KEY=${QIANWEN_API_KEY}
      - MODEL_ENCRYPTION_KEY=${MODEL_ENCRYPTION_KEY}
      - ENABLE_DINGTALK_AUTH=true
      - DINGTALK_CORP_ID=${DINGTALK_CORP_ID}
      - DINGTALK_AGENT_ID=${DINGTALK_AGENT_ID}
      - DINGTALK_APP_KEY=${DINGTALK_APP_KEY}
      - DINGTALK_APP_SECRET=${DINGTALK_APP_SECRET}
```

### 方法三：使用系统环境变量

在服务器上设置环境变量：

```bash
# 编辑环境变量文件
sudo nano /etc/environment

# 添加配置
QIANWEN_API_KEY="your_key"
MODEL_ENCRYPTION_KEY="your_encryption_key"
# ... 其他配置

# 重新加载环境变量
source /etc/environment
```

## 2. 部署步骤

### 使用 Docker Compose 部署

1. **准备部署文件**
```bash
# 创建项目目录
mkdir -p /opt/word-xinghuidian
cd /opt/word-xinghuidian

# 下载 docker-compose.yml
wget https://raw.githubusercontent.com/your-repo/word-xinghuidian/main/docker-compose.yml

# 创建 .env 文件
nano .env
```

2. **配置数据持久化目录**
```bash
# 创建数据目录
mkdir -p backend/data
mkdir -p backend/uploads
```

3. **启动服务**
```bash
# 拉取最新镜像
docker-compose pull

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 直接使用 Docker 部署

```bash
# 启动后端
docker run -d \
  --name word-backend \
  --env-file .env \
  -p 3003:3003 \
  -v $(pwd)/backend/data:/app/data \
  -v $(pwd)/backend/uploads:/app/uploads \
  xieyifanxyf/word-xinghuidian-backend:v1.5.9

# 启动前端
docker run -d \
  --name word-frontend \
  -p 3000:80 \
  xieyifanxyf/word-xinghuidian-frontend:v1.5.9
```

## 3. 配置说明

### 必需配置项

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| QIANWEN_API_KEY | 千问API密钥 | sk-xxx |
| MODEL_ENCRYPTION_KEY | 模型配置加密密钥 | 任意字符串 |
| DINGTALK_CORP_ID | 钉钉企业ID | dingxxx |
| DINGTALK_AGENT_ID | 钉钉应用ID | 数字ID |
| DINGTALK_APP_KEY | 钉钉应用Key | dingxxx |
| DINGTALK_APP_SECRET | 钉钉应用Secret | 长字符串 |

### 可选配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 后端服务端口 | 3003 |
| NODE_ENV | 运行环境 | production |
| LOG_LEVEL | 日志级别 | info |
| DINGTALK_VERIFY_USER | 是否验证用户详细信息 | false |
| SESSION_SECRET | Session签名密钥 | 随机生成 |

## 4. 钉钉配置

### 获取钉钉配置信息

1. 登录[钉钉开发者后台](https://open-dev.dingtalk.com/)
2. 进入应用管理，找到您的H5微应用
3. 获取以下信息：
   - CorpId: 基础信息 > 企业ID
   - AgentId: 应用信息 > AgentId  
   - AppKey: 应用信息 > AppKey
   - AppSecret: 应用信息 > AppSecret

### 配置H5微应用

1. **应用首页地址**: 设置为 `http://your-domain:3000`
2. **服务器出口IP**: 添加服务器公网IP
3. **接口权限**: 确保开通以下权限：
   - 通讯录只读权限
   - 身份验证

## 5. 验证部署

### 检查服务状态

```bash
# 查看容器状态
docker-compose ps

# 检查后端健康状态
curl http://localhost:3003/api/health

# 查看日志
docker-compose logs backend
docker-compose logs frontend
```

### 测试钉钉集成

1. 在钉钉工作台打开应用
2. 应该自动完成钉钉认证
3. 检查浏览器控制台无错误

## 6. 故障排查

### 常见问题

1. **钉钉认证失败**
   - 检查钉钉配置是否正确
   - 确认服务器IP已添加到白名单
   - 查看后端日志获取详细错误信息

2. **API调用失败**
   - 确认QIANWEN_API_KEY配置正确
   - 检查网络连接
   - 查看后端日志

3. **数据无法保存**
   - 检查数据目录权限
   - 确认挂载目录正确
   - 查看磁盘空间

### 日志位置

- Docker日志: `docker-compose logs [service]`
- 应用日志: 容器内 `/app/logs/`
- 数据目录: 挂载的 `./backend/data/`

## 7. 更新部署

```bash
# 停止服务
docker-compose down

# 拉取新版本
docker-compose pull

# 启动新版本
docker-compose up -d

# 清理旧镜像
docker image prune
```

## 8. 备份与恢复

### 备份

```bash
# 备份数据
tar -czf backup-$(date +%Y%m%d).tar.gz backend/data backend/uploads

# 备份配置
cp .env .env.backup
```

### 恢复

```bash
# 恢复数据
tar -xzf backup-20240121.tar.gz

# 恢复配置
cp .env.backup .env

# 重启服务
docker-compose restart
```