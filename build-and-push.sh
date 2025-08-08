#!/bin/bash
set -e

# 检查必要的环境变量
if [ -z "$DOCKER_USERNAME" ]; then
    echo "❌ 错误: 请设置 DOCKER_USERNAME 环境变量"
    echo "示例: export DOCKER_USERNAME=your-dockerhub-username"
    exit 1
fi

# 获取版本号（从git tag或参数）
VERSION=${1:-$(git describe --tags --always 2>/dev/null || echo "latest")}
echo "📦 构建版本: $VERSION"

# 导出环境变量供docker-compose使用
export VERSION
export DOCKER_USERNAME

echo "🚀 开始构建和推送 Word星辉点 镜像..."
echo "👤 Docker Hub 用户名: $DOCKER_USERNAME"
echo "🏷️ 版本标签: $VERSION"

# 1. 登录 Docker Hub
echo "🔐 登录 Docker Hub..."
docker login

# 2. 构建镜像
echo "🔨 构建镜像..."
docker-compose -f docker-compose.build.yml build --no-cache

# 3. 如果不是latest，也创建latest标签
if [ "$VERSION" != "latest" ]; then
    echo "🏷️ 创建 latest 标签..."
    docker tag ${DOCKER_USERNAME}/word-xinghuidian-backend:${VERSION} ${DOCKER_USERNAME}/word-xinghuidian-backend:latest
    docker tag ${DOCKER_USERNAME}/word-xinghuidian-frontend:${VERSION} ${DOCKER_USERNAME}/word-xinghuidian-frontend:latest
fi

# 4. 推送镜像
echo "⬆️ 推送后端镜像..."
docker push ${DOCKER_USERNAME}/word-xinghuidian-backend:${VERSION}

echo "⬆️ 推送前端镜像..."
docker push ${DOCKER_USERNAME}/word-xinghuidian-frontend:${VERSION}

# 5. 如果创建了latest标签，也推送latest
if [ "$VERSION" != "latest" ]; then
    echo "⬆️ 推送 latest 标签..."
    docker push ${DOCKER_USERNAME}/word-xinghuidian-backend:latest
    docker push ${DOCKER_USERNAME}/word-xinghuidian-frontend:latest
fi

# 6. 清理本地镜像（可选）
echo "🧹 清理构建镜像..."
docker-compose -f docker-compose.build.yml down --rmi all 2>/dev/null || true

echo "✅ 构建和推送完成！"
echo ""
echo "🎯 镜像信息:"
echo "   后端: ${DOCKER_USERNAME}/word-xinghuidian-backend:${VERSION}"
echo "   前端: ${DOCKER_USERNAME}/word-xinghuidian-frontend:${VERSION}"
echo ""
echo "📋 用户部署命令:"
echo "   export DOCKER_USERNAME=${DOCKER_USERNAME}"
echo "   export VERSION=${VERSION}"
echo "   docker-compose pull"
echo "   docker-compose up -d"