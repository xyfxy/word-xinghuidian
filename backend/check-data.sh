#!/bin/sh
# 数据完整性检查脚本 - 用于健康检查和监控

check_models() {
    if [ ! -d "/app/data/models" ]; then
        return 1
    fi
    count=$(find /app/data/models -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$count" -eq 0 ]; then
        return 1
    fi
    return 0
}

check_templates() {
    if [ ! -d "/app/data/templates" ]; then
        return 1
    fi
    count=$(find /app/data/templates -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$count" -eq 0 ]; then
        return 1
    fi
    return 0
}

# 执行检查
if check_models && check_templates; then
    exit 0
else
    # 尝试自动修复
    if [ -d "/app/preset-data" ]; then
        if ! check_models; then
            mkdir -p /app/data/models
            cp -r /app/preset-data/models/* /app/data/models/ 2>/dev/null || true
        fi
        if ! check_templates; then
            mkdir -p /app/data/templates
            cp -r /app/preset-data/templates/* /app/data/templates/ 2>/dev/null || true
        fi
        # 再次检查
        if check_models && check_templates; then
            exit 0
        fi
    fi
    exit 1
fi