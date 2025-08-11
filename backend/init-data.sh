#!/bin/sh
set -e

echo "🔍 Word新汇点数据初始化 v2.0"

# 核心文件检查函数
check_data_integrity() {
    local dir=$1
    local type=$2
    
    if [ ! -d "$dir" ]; then
        echo "⚠️  $type 目录不存在"
        return 1
    fi
    
    local count=$(find "$dir" -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$count" -eq 0 ]; then
        echo "⚠️  $type 目录为空"
        return 1
    fi
    
    echo "✅ $type 数据正常 ($count 个文件)"
    return 0
}

# 创建必要目录
mkdir -p /app/data/models /app/data/templates /app/uploads

# 等待挂载稳定
sleep 1

# 智能数据恢复
echo "📊 检查数据完整性..."

# 检查模型数据
if ! check_data_integrity "/app/data/models" "模型"; then
    echo "🔧 修复模型数据..."
    mkdir -p /app/data/models
    if [ -d /app/preset-data/models ] && [ "$(ls -A /app/preset-data/models 2>/dev/null)" ]; then
        cp -r /app/preset-data/models/* /app/data/models/ 2>/dev/null || true
        echo "✅ 模型数据已恢复"
    fi
fi

# 检查模板数据
if ! check_data_integrity "/app/data/templates" "模板"; then
    echo "🔧 修复模板数据..."
    mkdir -p /app/data/templates
    if [ -d /app/preset-data/templates ] && [ "$(ls -A /app/preset-data/templates 2>/dev/null)" ]; then
        cp -r /app/preset-data/templates/* /app/data/templates/ 2>/dev/null || true
        echo "✅ 模板数据已恢复"
    fi
fi

# 最终验证
echo "📋 最终检查..."
check_data_integrity "/app/data/models" "模型"
check_data_integrity "/app/data/templates" "模板"

echo "🚀 启动应用..."
exec "$@"