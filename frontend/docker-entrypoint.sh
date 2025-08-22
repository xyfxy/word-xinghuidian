#!/bin/sh

# 处理布尔值环境变量
if [ "$VITE_ENABLE_DINGTALK_AUTH" = "true" ]; then
  DINGTALK_AUTH_VALUE="true"
else
  DINGTALK_AUTH_VALUE="false"
fi

# 生成运行时配置文件
cat > /usr/share/nginx/html/config.js << EOF
// 运行时配置 - 由docker-entrypoint.sh生成
// 从环境变量动态读取
window.APP_CONFIG = {
  VITE_ENABLE_DINGTALK_AUTH: ${DINGTALK_AUTH_VALUE},
  VITE_API_BASE_URL: '${VITE_API_BASE_URL:-/api}'
};
EOF

echo "配置文件已生成:"
cat /usr/share/nginx/html/config.js

# 启动nginx
exec nginx -g "daemon off;"