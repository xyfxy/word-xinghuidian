#!/bin/bash
set -e

# 获取要更新的版本，默认为 latest
VERSION=${1:-latest}

echo "🚀 开始更新 Word星辉点 到版本: $VERSION"

# 导出版本号供 docker-compose 使用
export VERSION

# 1. 备份数据
echo "📦 备份数据..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r backend/data $BACKUP_DIR/ 2>/dev/null || echo "⚠️ 后端数据目录不存在，跳过备份"
cp -r backend/uploads $BACKUP_DIR/ 2>/dev/null || echo "⚠️ 上传目录不存在，跳过备份"
echo "✅ 数据已备份到: $BACKUP_DIR"

# 2. 停止服务
echo "⏹️ 停止旧服务..."
docker-compose down

# 3. 拉取最新镜像
echo "📥 拉取镜像版本 $VERSION..."
docker-compose pull

# 4. 启动新服务
echo "▶️ 启动新服务..."
docker-compose up -d

# 5. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 6. 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 7. 验证后端健康状态
echo "🏥 检查后端健康状态..."
if curl -f http://localhost:3003/api/health > /dev/null 2>&1; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务异常，请检查日志"
    docker-compose logs backend
    echo ""
    echo "🔄 是否需要回滚到之前的版本？"
    echo "回滚命令: ./update.sh previous-version"
fi

# 8. 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

echo "🎉 更新完成！"
echo "📊 当前版本: $VERSION"
echo "🌐 访问地址: http://localhost:3000"
echo "📝 备份位置: $BACKUP_DIR"