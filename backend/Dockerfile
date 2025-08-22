# 使用官方 Node.js 18 Alpine 镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制后端源代码
COPY . .

# 编译 TypeScript
RUN npm run build

# 创建所需目录
RUN mkdir -p preset-data/models preset-data/templates data/models data/templates uploads

# 复制预设的模板和模型配置到预设目录（作为备份）
COPY data/templates/ preset-data/templates/
COPY data/models/ preset-data/models/

# 同时复制到data目录作为默认数据（镜像内置）
COPY data/templates/ data/templates/
COPY data/models/ data/models/

# 复制增强版初始化脚本
COPY init-data.sh /app/
RUN chmod +x /app/init-data.sh

# 创建数据完整性检查脚本
COPY check-data.sh /app/
RUN chmod +x /app/check-data.sh

# 暴露端口
EXPOSE 3003

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3003/api/health || exit 1

# 使用初始化脚本启动
ENTRYPOINT ["/app/init-data.sh"]
CMD ["npm", "start"]