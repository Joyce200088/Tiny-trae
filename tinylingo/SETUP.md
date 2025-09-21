# TinyLingo 开发环境设置指南

本指南将帮助您快速设置 TinyLingo 项目的开发环境。

## 📋 系统要求

### 必需软件
- **Node.js** 18.0.0 或更高版本
- **Python** 3.8 或更高版本
- **npm** 或 **yarn** 包管理器
- **Git** 版本控制系统

### 推荐软件
- **VS Code** 或其他现代代码编辑器
- **Postman** 或类似的 API 测试工具
- **Docker** (可选，用于容器化部署)

## 🚀 快速开始

### 1. 克隆项目

```bash
# 使用 HTTPS
git clone https://github.com/yourusername/tinylingo.git

# 或使用 SSH
git clone git@github.com:yourusername/tinylingo.git

cd tinylingo
```

### 2. 安装 Node.js 依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 设置 Python 微服务

```bash
# 进入 Python 服务目录
cd python-service

# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安装 Python 依赖
pip install -r requirements.txt
```

### 4. 环境变量配置

在项目根目录创建 `.env.local` 文件：

```env
# Python 微服务地址
PYTHON_SERVICE_URL=http://localhost:8000

# 开发模式
NODE_ENV=development

# 其他可选配置
NEXT_PUBLIC_APP_NAME=TinyLingo
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 5. 启动开发服务器

#### 方法一：分别启动服务

**终端 1 - 启动 Next.js 应用：**
```bash
npm run dev
```

**终端 2 - 启动 Python 服务：**
```bash
cd python-service
uvicorn main:app --reload --port 8000
```

#### 方法二：使用并发启动（推荐）

安装并发工具：
```bash
npm install -g concurrently
```

在 `package.json` 中添加脚本：
```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev\" \"cd python-service && uvicorn main:app --reload --port 8000\""
  }
}
```

然后运行：
```bash
npm run dev:all
```

## 🔧 开发工具配置

### VS Code 扩展推荐

创建 `.vscode/extensions.json`：
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### VS Code 设置

创建 `.vscode/settings.json`：
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Prettier 配置

创建 `.prettierrc`：
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### ESLint 配置

项目已包含 ESLint 配置，确保在 `next.config.js` 中启用：
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['src'],
  },
}

module.exports = nextConfig
```

## 🧪 测试设置

### 安装测试依赖

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Jest 配置

创建 `jest.config.js`：
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

创建 `jest.setup.js`：
```javascript
import '@testing-library/jest-dom'
```

## 🐳 Docker 设置（可选）

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  nextjs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PYTHON_SERVICE_URL=http://python-service:8000
    depends_on:
      - python-service

  python-service:
    build: ./python-service
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
```

## 🔍 故障排除

### 常见问题

#### 1. Python 依赖安装失败
```bash
# 升级 pip
pip install --upgrade pip

# 清除缓存
pip cache purge

# 重新安装
pip install -r requirements.txt
```

#### 2. Node.js 依赖冲突
```bash
# 清除 node_modules 和锁文件
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

#### 3. 端口被占用
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# 终止进程（Windows）
taskkill /PID <PID> /F

# 终止进程（macOS/Linux）
kill -9 <PID>
```

#### 4. Python 虚拟环境问题
```bash
# 删除现有虚拟环境
rm -rf venv

# 重新创建
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

### 性能优化建议

1. **启用 Turbopack**（实验性）：
   ```bash
   npm run dev -- --turbo
   ```

2. **使用 SWC 编译器**：
   确保 `next.config.js` 中启用 SWC：
   ```javascript
   module.exports = {
     swcMinify: true,
   }
   ```

3. **优化 Python 服务**：
   ```bash
   # 使用多个工作进程
   uvicorn main:app --workers 4 --port 8000
   ```

## 📚 开发工作流

### 1. 功能开发流程

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发和测试
npm run dev
npm run test

# 提交更改
git add .
git commit -m "feat: add new feature"

# 推送分支
git push origin feature/new-feature
```

### 2. 代码质量检查

```bash
# 运行 linting
npm run lint

# 运行类型检查
npm run type-check

# 运行测试
npm run test

# 构建检查
npm run build
```

### 3. 部署前检查

```bash
# 完整的质量检查
npm run lint && npm run type-check && npm run test && npm run build
```

## 🔗 有用的链接

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [React Konva 文档](https://konvajs.org/docs/react/)

## 💡 开发提示

1. **热重载**：保存文件时，Next.js 会自动重新加载页面
2. **API 路由**：在 `src/app/api/` 目录下的文件会自动成为 API 端点
3. **静态资源**：将图片等静态文件放在 `public/` 目录下
4. **环境变量**：以 `NEXT_PUBLIC_` 开头的变量可在客户端访问
5. **TypeScript**：充分利用类型检查来避免运行时错误

## 🆘 获取帮助

如果遇到问题，可以：

1. 查看项目的 [Issues](https://github.com/yourusername/tinylingo/issues)
2. 创建新的 Issue 描述问题
3. 查看相关文档和社区资源
4. 联系项目维护者

---

祝您开发愉快！🚀