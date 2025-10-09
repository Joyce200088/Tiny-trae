# TinyLingo - 微世界英语学习平台

TinyLingo 是一个创新的英语学习平台，通过创建和探索虚拟世界来学习英语。用户可以收集贴纸、创建场景，并通过互动的方式学习英语词汇和表达。

## 🌟 主要功能

### 🏠 主页
- 精美的英雄区域展示
- 世界卡片网格浏览
- 快速导航到各个功能模块

### 🔍 探索页面
- 搜索和发现新的世界和贴纸
- 瀑布流布局展示内容
- 分类标签筛选功能

### 🎯 我的贴纸
- 贴纸收藏管理
- 已收集/未收集分类
- 批量操作功能
- 搜索和筛选

### 🌍 我的世界
- 个人世界管理
- 创建新世界
- 世界统计和排序

### ✨ 创建世界
- 强大的画布编辑器（基于 react-konva）
- 拖拽式贴纸放置
- 背景选择和自定义
- 实时预览和保存

## 🛠 技术栈

### 前端
- **Next.js 15** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **React Konva** - 2D 画布库
- **Lucide React** - 图标库

### 后端
- **Next.js API Routes** - 服务端 API
- **Python FastAPI** - 背景移除微服务
- **rembg** - AI 背景移除库

### 核心算法
- **BFS 分割算法** - 连通组件检测
- **TTS 系统** - 文本转语音功能

## 📦 安装和运行

### 前置要求
- Node.js 18+ 
- Python 3.8+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd tinylingo
```

### 2. 安装前端依赖
```bash
npm install
```

### 3. 设置 Python 微服务
```bash
cd python-service
pip install -r requirements.txt
```

### 4. 启动开发服务器

#### 启动 Next.js 应用
```bash
npm run dev
```
应用将在 http://localhost:3000 运行

#### 启动 Python 背景移除服务
```bash
cd python-service
uvicorn main:app --reload --port 8000
```
Python 服务将在 http://localhost:8000 运行

## 🔧 环境配置

创建 `.env.local` 文件：
```env
# Python 微服务地址
PYTHON_SERVICE_URL=http://localhost:8000

# 其他配置...
```

## 📁 项目结构

```
tinylingo/
├── src/                       # 源代码目录
│   ├── app/                   # Next.js 应用路由
│   │   ├── api/              # API 路由
│   │   │   ├── upload/       # 文件上传和背景移除
│   │   │   ├── recognize/    # AI 物体识别
│   │   │   ├── stickers/     # 贴纸管理
│   │   │   ├── worlds/       # 世界管理
│   │   │   └── tts/          # 文本转语音
│   │   ├── create-world/     # 创建世界页面
│   │   ├── explore/          # 探索页面
│   │   ├── my-stickers/      # 我的贴纸页面
│   │   ├── my-worlds/        # 我的世界页面
│   │   └── layout.tsx        # 根布局
│   ├── components/           # React 组件
│   │   ├── Nav.tsx          # 导航栏
│   │   ├── Footer.tsx       # 页脚
│   │   └── SegmentationPreview.tsx # 分割预览
│   └── lib/                  # 工具库
│       ├── types.ts         # TypeScript 类型定义
│       ├── segmentation.ts  # BFS 分割算法
│       └── tts.ts           # TTS 功能库
├── python-service/           # Python 微服务
│   ├── main.py              # FastAPI 应用
│   ├── requirements.txt     # Python 依赖
│   └── README.md           # 服务文档
├── supabase/                # Supabase 配置
│   └── storage-setup.sql    # 存储桶设置
├── public/                  # 静态资源
├── docs/                    # 项目文档
│   ├── SETUP.md            # 安装指南
│   ├── STORAGE_SETUP_INSTRUCTIONS.md # 存储设置
│   ├── SUPABASE_SETUP_GUIDE.md      # Supabase 指南
│   └── *.md                # 其他文档
├── package.json            # Node.js 依赖配置
├── tsconfig.json          # TypeScript 配置
├── next.config.js         # Next.js 配置
├── tailwind.config.js     # Tailwind CSS 配置
├── CHANGELOG.md           # 更新日志
└── README.md             # 项目说明
```

## 🎨 核心功能详解

### 画布编辑器
- 基于 react-konva 构建的强大 2D 编辑器
- 支持拖拽、缩放、旋转操作
- 实时变换和选择功能
- 多层级对象管理

### 背景移除服务
- 使用 rembg 库进行智能背景移除
- 支持批量处理
- RESTful API 接口
- 错误处理和验证

### BFS 分割算法
- 连通组件检测
- 透明像素处理
- 可配置的容差和最小面积
- 高效的像素遍历

### TTS 系统
- 多语言支持
- 语音参数控制（语速、音调）
- 冷却机制防止滥用
- 音频缓存优化

## 🔌 API 接口

### 文件上传
```
POST /api/upload
Content-Type: multipart/form-data
```

### AI 识别
```
POST /api/recognize
Content-Type: multipart/form-data
```

### 贴纸管理
```
GET /api/stickers?category=animals&search=cat
POST /api/stickers
PUT /api/stickers
```

### 世界管理
```
GET /api/worlds?author=user123&public=true
POST /api/worlds
PUT /api/worlds
DELETE /api/worlds?id=123
```

### 文本转语音
```
POST /api/tts
{
  "text": "Hello World",
  "language": "en-US",
  "voice": "female",
  "speed": 1.0,
  "pitch": 1.0
}
```

## 🚀 部署

### Vercel 部署（推荐）
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

### Docker 部署
```bash
# 构建镜像
docker build -t tinylingo .

# 运行容器
docker run -p 3000:3000 tinylingo
```

### Python 服务部署
```bash
# 使用 gunicorn
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🧪 测试

```bash
# 运行测试
npm test

# 运行 E2E 测试
npm run test:e2e

# 代码覆盖率
npm run test:coverage
```

## 📈 性能优化

- **图片优化**: Next.js Image 组件自动优化
- **代码分割**: 动态导入和路由级分割
- **缓存策略**: API 响应缓存和静态资源缓存
- **懒加载**: 组件和图片懒加载

## 🔒 安全考虑

- **文件上传验证**: 文件类型和大小限制
- **API 限流**: 防止滥用和 DDoS 攻击
- **输入验证**: 所有用户输入严格验证
- **CORS 配置**: 跨域请求安全配置

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目链接: [https://github.com/yourusername/tinylingo](https://github.com/yourusername/tinylingo)
- 问题反馈: [Issues](https://github.com/yourusername/tinylingo/issues)

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 强大的 React 框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用的 CSS 框架
- [React Konva](https://konvajs.org/docs/react/) - 2D 画布库
- [rembg](https://github.com/danielgatis/rembg) - 背景移除库
- [Lucide](https://lucide.dev/) - 美观的图标库

---

**TinyLingo** - 让英语学习变得有趣和互动！ 🌟
