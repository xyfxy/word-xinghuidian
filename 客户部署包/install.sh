#!/bin/bash
set -e

echo "🚀 Word星辉点 一键安装脚本"
echo "=================================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 用户运行此脚本"
    exit 1
fi

# 检查系统
if command -v apt-get >/dev/null 2>&1; then
    PACKAGE_MANAGER="apt-get"
    INSTALL_CMD="apt-get update && apt-get install -y"
elif command -v yum >/dev/null 2>&1; then
    PACKAGE_MANAGER="yum"
    INSTALL_CMD="yum install -y"
else
    echo "❌ 不支持的系统，请手动安装 Docker"
    exit 1
fi

echo "📦 检测到包管理器: $PACKAGE_MANAGER"

# 1. 安装 Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "🐳 安装 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker 安装完成"
else
    echo "✅ Docker 已安装"
fi

# 2. 安装 Docker Compose
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "🔧 安装 Docker Compose..."
    if [ "$PACKAGE_MANAGER" = "apt-get" ]; then
        $INSTALL_CMD docker-compose-plugin
    else
        # CentOS/RHEL
        curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
    echo "✅ Docker Compose 安装完成"
else
    echo "✅ Docker Compose 已安装"
fi

# 3. 获取脚本所在目录
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# 4. 创建项目目录
PROJECT_DIR="/opt/word-xinghuidian"
echo "📁 创建项目目录: $PROJECT_DIR"
mkdir -p $PROJECT_DIR

# 5. 复制部署文件
echo "📋 复制部署文件..."
cp $SCRIPT_DIR/docker-compose.yml $PROJECT_DIR/
cp $SCRIPT_DIR/update.sh $PROJECT_DIR/
chmod +x $PROJECT_DIR/update.sh

# 6. 切换到项目目录
cd $PROJECT_DIR

# 7. 创建环境配置
echo "⚙️ 创建环境配置..."
cat > $PROJECT_DIR/.env << EOF
# 版本配置
VERSION=latest

# 千问 AI 配置（可选）
# QIANWEN_API_KEY=your_qianwen_api_key_here
# QIANWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation

# 模型加密密钥
MODEL_ENCRYPTION_KEY=666888

# 后端端口配置
PORT=3003
NODE_ENV=production

# CORS 配置
CORS_ORIGIN=http://localhost:3000
EOF

# 8. 创建数据目录
echo "📂 创建数据目录..."
mkdir -p $PROJECT_DIR/backend/data
mkdir -p $PROJECT_DIR/backend/uploads

# 9. 拉取镜像并启动
echo "🚢 拉取Docker镜像..."
docker-compose pull

echo "🚀 启动服务..."
docker-compose up -d

# 10. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 11. 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 12. 健康检查
echo "🏥 检查服务健康状态..."

# 检查curl是否可用
if ! command -v curl >/dev/null 2>&1; then
    echo "⚠️ curl未安装，跳过健康检查"
    echo "✅ 服务已启动（请手动验证）"
else
    # 尝试健康检查
    if curl -f http://localhost:3003/api/health > /dev/null 2>&1; then
        echo "✅ 后端服务健康检查通过"
    else
        # 检查Docker健康状态
        HEALTH_STATUS=$(docker-compose ps --format "table {{.Name}}\t{{.Status}}" | grep backend | grep -o "healthy\|unhealthy" || echo "unknown")
        if [[ "$HEALTH_STATUS" == "healthy" ]]; then
            echo "✅ 后端服务Docker健康检查通过"
            echo "ℹ️ 可能是网络配置问题，但服务运行正常"
        else
            echo "❌ 后端服务启动异常，请检查日志："
            docker-compose logs --tail 20 backend
        fi
    fi
fi

# 13. 显示结果
echo ""
echo "🎉 安装完成！"
echo "=================================="
echo "📊 服务信息："
echo "   项目目录: $PROJECT_DIR"
echo "   前端地址: http://$(hostname -I | awk '{print $1}'):3000"
echo "   后端地址: http://$(hostname -I | awk '{print $1}'):3003"
echo ""
echo "📋 管理命令："
echo "   查看状态: cd $PROJECT_DIR && docker-compose ps"
echo "   查看日志: cd $PROJECT_DIR && docker-compose logs -f"
echo "   重启服务: cd $PROJECT_DIR && docker-compose restart"
echo "   停止服务: cd $PROJECT_DIR && docker-compose down"
echo "   更新应用: cd $PROJECT_DIR && ./update.sh"
echo ""
echo "🔧 如需启用AI功能，请编辑 $PROJECT_DIR/.env 文件，取消注释并配置 QIANWEN_API_KEY"
echo ""
echo "✨ 安装完成，请在浏览器访问前端地址开始使用！"