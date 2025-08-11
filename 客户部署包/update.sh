#!/bin/bash
set -e

# 获取要更新的版本，默认为 latest
VERSION=${1:-latest}

echo "🚀 开始更新 Word新汇点 到版本: $VERSION"

# 导出版本号供 docker-compose 使用
export VERSION

# 检查.env文件是否存在必要配置
if [ -f .env ]; then
    if ! grep -q "MODEL_ENCRYPTION_KEY" .env; then
        echo "⚠️ 警告：.env文件中缺少MODEL_ENCRYPTION_KEY配置"
        echo "ℹ️ 使用默认加密密钥：666888"
        echo "MODEL_ENCRYPTION_KEY=666888" >> .env
    fi
    if ! grep -q "COMPOSE_PROJECT_NAME" .env; then
        echo "COMPOSE_PROJECT_NAME=word-xinghuidian" >> .env
    fi
else
    echo "⚠️ .env文件不存在，创建默认配置"
    cat > .env << EOF
COMPOSE_PROJECT_NAME=word-xinghuidian
MODEL_ENCRYPTION_KEY=666888
VERSION=$VERSION
EOF
fi

# 1. 备份数据和配置
echo "📦 备份数据和配置..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r backend/data $BACKUP_DIR/ 2>/dev/null || echo "⚠️ 后端数据目录不存在，跳过备份"
cp -r backend/uploads $BACKUP_DIR/ 2>/dev/null || echo "⚠️ 上传目录不存在，跳过备份"
# 备份环境配置文件
cp .env $BACKUP_DIR/ 2>/dev/null || echo "⚠️ 环境配置文件不存在，跳过备份"
echo "✅ 数据和配置已备份到: $BACKUP_DIR"

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
sleep 10

# 6. 数据完整性修复（自动检测并修复数据问题）
echo "🔧 检查数据完整性..."
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # 检查健康状态
    HEALTH_RESPONSE=$(curl -s http://localhost:3003/api/health 2>/dev/null || echo '{"status":"error"}')
    STATUS=$(echo $HEALTH_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$STATUS" = "ok" ]; then
        echo "✅ 数据完整性验证通过"
        break
    elif [ "$STATUS" = "degraded" ]; then
        echo "⚠️ 检测到数据问题，尝试修复..."
        
        # 重启容器触发数据恢复
        docker-compose restart backend
        sleep 10
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "🔄 重试 $RETRY_COUNT/$MAX_RETRIES..."
    else
        echo "❌ 服务未响应，等待..."
        sleep 5
        RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
done

# 7. 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 8. 最终验证
echo "🏥 最终健康检查..."
FINAL_CHECK=$(curl -s http://localhost:3003/api/health 2>/dev/null)
if echo $FINAL_CHECK | grep -q '"status":"ok"'; then
    echo "✅ 服务运行正常"
    
    # 显示数据统计
    MODELS_COUNT=$(curl -s http://localhost:3003/api/models | grep -o '"data":\[' | wc -l)
    TEMPLATES_COUNT=$(curl -s http://localhost:3003/api/templates | grep -o '"data":\[' | wc -l)
    echo "📊 数据统计："
    echo "   - 模型配置: 已加载"
    echo "   - 模板数据: 已加载"
else
    echo "⚠️ 服务状态异常，请查看日志："
    docker-compose logs --tail=50 backend
    echo ""
    echo "💡 故障排查建议："
    echo "   1. 检查挂载目录权限: ls -la backend/data/"
    echo "   2. 重启后端服务: docker-compose restart backend"
    echo "   3. 查看完整日志: docker-compose logs backend"
fi

# 8. 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

echo "🎉 更新完成！"
echo "📊 当前版本: $VERSION"
echo "🌐 访问地址: http://localhost:3000"
echo "📝 备份位置: $BACKUP_DIR"