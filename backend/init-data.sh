#!/bin/sh
set -e

echo "🔍 检查预设数据..."

# 创建数据目录
mkdir -p /app/data/models /app/data/templates /app/uploads

# 复制预设模板（如果挂载的目录为空）
if [ ! "$(ls -A /app/data/templates 2>/dev/null)" ] && [ -d /app/preset-data/templates ]; then
    echo "📄 复制预设模板..."
    cp -r /app/preset-data/templates/* /app/data/templates/ 2>/dev/null || true
    echo "✅ 模板复制完成"
else
    echo "ℹ️ 模板目录已存在，跳过复制"
fi

# 复制预设模型配置（如果挂载的目录为空）
if [ ! "$(ls -A /app/data/models 2>/dev/null)" ] && [ -d /app/preset-data/models ]; then
    echo "🤖 复制预设AI模型配置..."
    cp -r /app/preset-data/models/* /app/data/models/ 2>/dev/null || true
    echo "✅ 模型配置复制完成"
else
    echo "ℹ️ 模型配置目录已存在，跳过复制"
fi

echo "🚀 启动应用..."
exec "$@"