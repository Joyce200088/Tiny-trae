# 贡献指南

感谢您对 TinyLingo 项目的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、设计、测试和反馈。

## 🤝 如何贡献

### 报告问题

如果您发现了 bug 或有功能建议，请：

1. 首先搜索现有的 [Issues](https://github.com/yourusername/tinylingo/issues) 确保问题未被报告
2. 如果是新问题，请创建详细的 Issue，包括：
   - 清晰的标题和描述
   - 重现步骤（对于 bug）
   - 期望的行为
   - 实际的行为
   - 环境信息（操作系统、浏览器、Node.js 版本等）
   - 相关的截图或错误日志

### 提交代码

1. **Fork 项目**
   ```bash
   # 点击 GitHub 页面上的 Fork 按钮
   git clone https://github.com/yourusername/tinylingo.git
   cd tinylingo
   ```

2. **设置开发环境**
   ```bash
   npm install
   cd python-service
   pip install -r requirements.txt
   ```

3. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

4. **进行开发**
   - 遵循项目的代码风格
   - 添加必要的测试
   - 更新相关文档

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 填写 PR 模板
   - 等待代码审查

## 📝 代码规范

### TypeScript/JavaScript

- 使用 TypeScript 进行类型安全
- 遵循 ESLint 和 Prettier 配置
- 使用有意义的变量和函数名
- 添加适当的注释

```typescript
// ✅ 好的示例
interface UserProfile {
  id: string
  name: string
  email: string
  createdAt: Date
}

const getUserProfile = async (userId: string): Promise<UserProfile> => {
  // 实现逻辑
}

// ❌ 避免的示例
const getData = (id: any) => {
  // 缺乏类型安全和清晰的命名
}
```

### React 组件

- 使用函数组件和 Hooks
- 遵循组件命名约定（PascalCase）
- 合理拆分组件，保持单一职责

```tsx
// ✅ 好的示例
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
```

### CSS/Tailwind

- 优先使用 Tailwind CSS 类
- 保持响应式设计
- 使用语义化的类名

```tsx
// ✅ 好的示例
<div className="flex flex-col md:flex-row gap-4 p-6 bg-white rounded-lg shadow-md">
  <div className="flex-1">
    <h2 className="text-xl font-semibold text-gray-900 mb-2">标题</h2>
    <p className="text-gray-600">描述内容</p>
  </div>
</div>
```

### Python

- 遵循 PEP 8 风格指南
- 使用类型提示
- 添加适当的文档字符串

```python
# ✅ 好的示例
from typing import List, Optional
from fastapi import HTTPException

async def process_image(
    image_data: bytes,
    format: str = "PNG"
) -> Optional[bytes]:
    """
    处理图像数据并返回处理后的结果
    
    Args:
        image_data: 原始图像数据
        format: 输出格式，默认为 PNG
        
    Returns:
        处理后的图像数据，如果处理失败则返回 None
        
    Raises:
        HTTPException: 当图像格式不支持时
    """
    if format not in ["PNG", "JPEG", "WEBP"]:
        raise HTTPException(status_code=400, detail="不支持的图像格式")
    
    # 处理逻辑
    return processed_data
```

## 🧪 测试

### 前端测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- Button.test.tsx

# 生成覆盖率报告
npm run test:coverage
```

### 测试编写指南

```tsx
// 组件测试示例
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button onClick={() => {}}>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### 后端测试

```python
# API 测试示例
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_upload_image():
    with open("test_image.png", "rb") as f:
        response = client.post(
            "/api/upload",
            files={"file": ("test.png", f, "image/png")}
        )
    
    assert response.status_code == 200
    assert "processed_image" in response.json()
```

## 📋 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 类型说明

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 代码重构
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

### 示例

```
feat(canvas): add drag and drop functionality for stickers

- Implement drag and drop for sticker placement
- Add collision detection
- Update canvas state management

Closes #123
```

## 🔍 代码审查

### 审查清单

**功能性**
- [ ] 代码实现了预期的功能
- [ ] 边界情况得到处理
- [ ] 错误处理适当

**代码质量**
- [ ] 代码清晰易读
- [ ] 遵循项目的编码规范
- [ ] 没有重复代码
- [ ] 变量和函数命名有意义

**性能**
- [ ] 没有明显的性能问题
- [ ] 适当使用缓存和优化

**测试**
- [ ] 包含适当的测试
- [ ] 测试覆盖主要功能
- [ ] 所有测试通过

**文档**
- [ ] 更新了相关文档
- [ ] 添加了必要的注释
- [ ] README 或 API 文档已更新

## 🏷️ 发布流程

### 版本号规范

遵循 [Semantic Versioning](https://semver.org/)：

- `MAJOR.MINOR.PATCH`
- `1.0.0` → `1.0.1` (补丁)
- `1.0.0` → `1.1.0` (小版本)
- `1.0.0` → `2.0.0` (大版本)

### 发布步骤

1. **更新版本号**
   ```bash
   npm version patch  # 或 minor, major
   ```

2. **更新 CHANGELOG**
   ```markdown
   ## [1.0.1] - 2024-01-15
   
   ### Added
   - 新增拖拽功能
   
   ### Fixed
   - 修复画布渲染问题
   
   ### Changed
   - 优化性能
   ```

3. **创建发布标签**
   ```bash
   git tag -a v1.0.1 -m "Release version 1.0.1"
   git push origin v1.0.1
   ```

## 🎯 开发优先级

### 高优先级
- 核心功能 bug 修复
- 安全问题修复
- 性能优化
- 用户体验改进

### 中优先级
- 新功能开发
- 代码重构
- 测试覆盖率提升

### 低优先级
- 文档改进
- 代码风格调整
- 开发工具优化

## 🌟 贡献者认可

我们重视每一位贡献者的努力：

- 所有贡献者将在 README 中得到认可
- 重要贡献者将获得项目维护者权限
- 定期发布贡献者统计和感谢

## 📞 联系方式

如有任何问题，请通过以下方式联系：

- 创建 [Issue](https://github.com/yourusername/tinylingo/issues)
- 发送邮件至 [your-email@example.com]
- 加入我们的 Discord 社区 [邀请链接]

## 📄 许可证

通过贡献代码，您同意您的贡献将在与项目相同的 [MIT 许可证](LICENSE) 下发布。

---

再次感谢您的贡献！让我们一起让 TinyLingo 变得更好！ 🚀