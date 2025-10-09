# TinyLingo 服务启动脚本
# Start Services Script for TinyLingo

param(
    [switch]$PythonOnly,
    [switch]$NextOnly,
    [switch]$Check,
    [switch]$Stop
)

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    switch ($Color) {
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message }
    }
}

# 检查服务状态
function Test-ServiceStatus {
    Write-ColorOutput "正在检查服务状态..." "Blue"
    
    # 检查Python服务
    try {
        $pythonResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
        Write-ColorOutput "✓ Python背景去除服务：运行中 (端口8000)" "Green"
        $pythonRunning = $true
    } catch {
        Write-ColorOutput "✗ Python背景去除服务：未运行 (端口8000)" "Red"
        $pythonRunning = $false
    }
    
    # 检查Next.js服务
    try {
        $nextResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
        Write-ColorOutput "✓ Next.js前端服务：运行中 (端口3000)" "Green"
        $nextRunning = $true
    } catch {
        Write-ColorOutput "✗ Next.js前端服务：未运行 (端口3000)" "Red"
        $nextRunning = $false
    }
    
    return @{
        Python = $pythonRunning
        Next = $nextRunning
    }
}

# 停止服务
function Stop-Services {
    Write-ColorOutput "正在停止服务..." "Yellow"
    
    # 停止端口8000上的进程（Python服务）
    try {
        $pythonProcesses = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | 
                          ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
        
        if ($pythonProcesses) {
            $pythonProcesses | Stop-Process -Force
            Write-ColorOutput "✓ Python服务已停止" "Green"
        } else {
            Write-ColorOutput "- Python服务未运行" "Yellow"
        }
    } catch {
        Write-ColorOutput "✗ 停止Python服务失败：$($_.Exception.Message)" "Red"
    }
    
    # 停止端口3000上的进程（Next.js服务）
    try {
        $nextProcesses = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
                        ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
        
        if ($nextProcesses) {
            $nextProcesses | Stop-Process -Force
            Write-ColorOutput "✓ Next.js服务已停止" "Green"
        } else {
            Write-ColorOutput "- Next.js服务未运行" "Yellow"
        }
    } catch {
        Write-ColorOutput "✗ 停止Next.js服务失败：$($_.Exception.Message)" "Red"
    }
}

# 启动Python服务
function Start-PythonService {
    Write-ColorOutput "正在启动Python背景去除服务..." "Blue"
    
    # 检查是否已在运行
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 3
        Write-ColorOutput "✓ Python服务已在运行" "Green"
        return $true
    } catch {
        # 服务未运行，继续启动
    }
    
    # 检查python-service目录
    $pythonServicePath = "tinylingo\python-service"
    if (-not (Test-Path $pythonServicePath)) {
        Write-ColorOutput "✗ 找不到python-service目录：$pythonServicePath" "Red"
        return $false
    }
    
    # 检查main.py文件
    $mainPyPath = Join-Path $pythonServicePath "main.py"
    if (-not (Test-Path $mainPyPath)) {
        Write-ColorOutput "✗ 找不到main.py文件：$mainPyPath" "Red"
        return $false
    }
    
    # 启动服务
    try {
        Write-ColorOutput "启动命令：cd $pythonServicePath && python main.py" "Cyan"
        
        # 在新窗口中启动Python服务
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "powershell.exe"
        $startInfo.Arguments = "-NoExit -Command `"cd '$pythonServicePath'; python main.py`""
        $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
        
        $process = [System.Diagnostics.Process]::Start($startInfo)
        
        # 等待服务启动
        Write-ColorOutput "等待服务启动..." "Yellow"
        Start-Sleep -Seconds 5
        
        # 验证服务是否启动成功
        for ($i = 1; $i -le 6; $i++) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 3
                Write-ColorOutput "✓ Python服务启动成功！" "Green"
                return $true
            } catch {
                if ($i -lt 6) {
                    Write-ColorOutput "等待服务响应... ($i/6)" "Yellow"
                    Start-Sleep -Seconds 2
                }
            }
        }
        
        Write-ColorOutput "✗ Python服务启动超时，请检查控制台输出" "Red"
        return $false
        
    } catch {
        Write-ColorOutput "✗ 启动Python服务失败：$($_.Exception.Message)" "Red"
        return $false
    }
}

# 启动Next.js服务
function Start-NextService {
    Write-ColorOutput "正在启动Next.js前端服务..." "Blue"
    
    # 检查是否已在运行
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 3
        Write-ColorOutput "✓ Next.js服务已在运行" "Green"
        return $true
    } catch {
        # 服务未运行，继续启动
    }
    
    # 检查tinylingo目录
    $nextServicePath = "tinylingo"
    if (-not (Test-Path $nextServicePath)) {
        Write-ColorOutput "✗ 找不到tinylingo目录：$nextServicePath" "Red"
        return $false
    }
    
    # 检查package.json文件
    $packageJsonPath = Join-Path $nextServicePath "package.json"
    if (-not (Test-Path $packageJsonPath)) {
        Write-ColorOutput "✗ 找不到package.json文件：$packageJsonPath" "Red"
        return $false
    }
    
    # 启动服务
    try {
        Write-ColorOutput "启动命令：cd $nextServicePath && npm run dev" "Cyan"
        
        # 在新窗口中启动Next.js服务
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "powershell.exe"
        $startInfo.Arguments = "-NoExit -Command `"cd '$nextServicePath'; npm run dev`""
        $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
        
        $process = [System.Diagnostics.Process]::Start($startInfo)
        
        # 等待服务启动
        Write-ColorOutput "等待服务启动..." "Yellow"
        Start-Sleep -Seconds 10
        
        # 验证服务是否启动成功
        for ($i = 1; $i -le 10; $i++) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 3
                Write-ColorOutput "✓ Next.js服务启动成功！" "Green"
                return $true
            } catch {
                if ($i -lt 10) {
                    Write-ColorOutput "等待服务响应... ($i/10)" "Yellow"
                    Start-Sleep -Seconds 3
                }
            }
        }
        
        Write-ColorOutput "✗ Next.js服务启动超时，请检查控制台输出" "Red"
        return $false
        
    } catch {
        Write-ColorOutput "✗ 启动Next.js服务失败：$($_.Exception.Message)" "Red"
        return $false
    }
}

# 主程序逻辑
Write-ColorOutput "=== TinyLingo 服务管理工具 ===" "Blue"
Write-ColorOutput ""

if ($Check) {
    # 仅检查状态
    $status = Test-ServiceStatus
    exit 0
}

if ($Stop) {
    # 停止所有服务
    Stop-Services
    exit 0
}

if ($PythonOnly) {
    # 仅启动Python服务
    $pythonOk = Start-PythonService
    if ($pythonOk) {
        Write-ColorOutput "🎉 Python服务启动完成！" "Green"
        Write-ColorOutput "访问地址：http://localhost:8000" "Cyan"
        Write-ColorOutput "健康检查：http://localhost:8000/health" "Cyan"
    }
    exit $(if ($pythonOk) { 0 } else { 1 })
}

if ($NextOnly) {
    # 仅启动Next.js服务
    $nextOk = Start-NextService
    if ($nextOk) {
        Write-ColorOutput "🎉 Next.js服务启动完成！" "Green"
        Write-ColorOutput "访问地址：http://localhost:3000" "Cyan"
    }
    exit $(if ($nextOk) { 0 } else { 1 })
}

# 启动所有服务
Write-ColorOutput "正在启动所有服务..." "Blue"
Write-ColorOutput ""

$pythonOk = Start-PythonService
Write-ColorOutput ""

$nextOk = Start-NextService
Write-ColorOutput ""

# 输出结果
Write-ColorOutput "=== 启动结果 ===" "Blue"
Write-ColorOutput "Python服务：$(if ($pythonOk) { '✓ 成功' } else { '✗ 失败' })" $(if ($pythonOk) { "Green" } else { "Red" })
Write-ColorOutput "Next.js服务：$(if ($nextOk) { '✓ 成功' } else { '✗ 失败' })" $(if ($nextOk) { "Green" } else { "Red" })
Write-ColorOutput ""

if ($pythonOk -and $nextOk) {
    Write-ColorOutput "🎉 所有服务启动成功！" "Green"
    Write-ColorOutput ""
    Write-ColorOutput "访问地址：" "Cyan"
    Write-ColorOutput "  前端应用：http://localhost:3000" "Cyan"
    Write-ColorOutput "  API文档：http://localhost:8000/docs" "Cyan"
    Write-ColorOutput "  健康检查：http://localhost:8000/health" "Cyan"
} else {
    Write-ColorOutput "❌ 部分服务启动失败，请检查错误信息。" "Red"
}

exit $(if ($pythonOk -and $nextOk) { 0 } else { 1 })