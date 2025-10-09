# AI贴纸背景去除功能故障排除指南

## 问题描述
当AI生成贴纸的背景去除功能不工作时，通常是由于Python背景去除服务未启动或配置问题导致的。

## 故障排除步骤

### 1. 检查Python服务状态

#### 1.1 检查服务是否运行
```powershell
# 检查端口8000是否被占用
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

# 或者测试服务健康状态
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET
```

**预期结果：**
- 如果服务正常运行，应该返回：`{"status":"healthy","service":"background-removal"}`
- 如果服务未运行，会显示连接错误

#### 1.2 启动Python服务
如果服务未运行，按以下步骤启动：

```powershell
# 1. 切换到python-service目录
cd tinylingo/python-service

# 2. 检查Python版本（需要Python 3.8+）
python --version

# 3. 检查依赖是否安装
pip show fastapi rembg uvicorn

# 4. 如果依赖缺失，安装依赖
pip install -r requirements.txt

# 5. 启动服务
python main.py
```

**服务启动成功标志：**
- 控制台显示：`INFO: Uvicorn running on http://0.0.0.0:8000`
- 访问 http://localhost:8000/health 返回健康状态

### 2. 检查环境配置

#### 2.1 验证环境变量
检查 `.env.local` 文件中的配置：

```env
# Python 微服务地址
PYTHON_SERVICE_URL=http://localhost:8000
```

#### 2.2 验证前端API路由
确认以下API端点存在且配置正确：
- `/api/bg/remove` - 主要背景去除端点
- `/api/upload` - 备用上传端点

### 3. 测试API连通性

#### 3.1 测试健康检查端点
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET
```

#### 3.2 测试背景去除功能
```powershell
# 使用curl测试（需要准备测试图片）
$form = @{
    file = Get-Item "path/to/test-image.jpg"
}
Invoke-WebRequest -Uri "http://localhost:8000/remove-background" -Method POST -Form $form
```

### 4. 常见问题及解决方案

#### 4.1 Python依赖问题
**问题：** `ModuleNotFoundError: No module named 'fastapi'`
**解决：**
```powershell
pip install fastapi uvicorn rembg pillow python-multipart
```

#### 4.2 端口占用问题
**问题：** `OSError: [Errno 48] Address already in use`
**解决：**
```powershell
# 查找占用端口8000的进程
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess

# 终止进程（谨慎操作）
Stop-Process -Id <进程ID>
```

#### 4.3 CORS跨域问题
**问题：** 前端调用API时出现CORS错误
**解决：** 确认Python服务的CORS配置包含Next.js开发服务器地址：
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 4.4 文件上传大小限制
**问题：** 大图片上传失败
**解决：** 检查文件大小限制（默认10MB）：
- 前端限制：`/api/bg/remove/route.ts`
- Python服务限制：`main.py`

### 5. 调试工具和日志

#### 5.1 启用详细日志
在Python服务中启用调试模式：
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### 5.2 前端调试
在浏览器开发者工具中检查：
- Network标签页：查看API请求状态
- Console标签页：查看JavaScript错误

#### 5.3 服务状态监控
创建简单的监控脚本：
```powershell
# monitor-service.ps1
while ($true) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
        Write-Host "$(Get-Date): Service OK - $($response.StatusCode)"
    } catch {
        Write-Host "$(Get-Date): Service DOWN - $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 30
}
```

## 快速修复检查清单

当背景去除功能不工作时，按以下顺序检查：

- [ ] Python服务是否运行？(`http://localhost:8000/health`)
- [ ] 环境变量PYTHON_SERVICE_URL是否正确？
- [ ] Python依赖是否完整安装？
- [ ] 端口8000是否被其他程序占用？
- [ ] 前端API路由是否正确配置？
- [ ] 图片文件大小是否超过限制？
- [ ] 浏览器控制台是否有错误信息？

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：
1. Python版本：`python --version`
2. 依赖包版本：`pip list | findstr "fastapi rembg uvicorn"`
3. 错误日志：浏览器控制台和Python服务日志
4. 操作系统版本
5. 具体的错误复现步骤

---

**最后更新：** 2025年1月8日
**版本：** 1.0.0