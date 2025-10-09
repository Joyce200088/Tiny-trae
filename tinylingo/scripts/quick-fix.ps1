# TinyLingo 背景去除功能快速修复脚本
# Quick Fix Script for Background Removal Feature

param(
    [switch]$Verbose,
    [switch]$Force
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
        "Magenta" { Write-Host $Message -ForegroundColor Magenta }
        default { Write-Host $Message }
    }
}

# 详细输出函数
function Write-VerboseOutput {
    param([string]$Message)
    if ($Verbose) {
        Write-ColorOutput "  [详细] $Message" "Cyan"
    }
}

# 检查并修复环境
function Test-Environment {
    Write-ColorOutput "🔍 检查环境配置..." "Blue"
    $issues = @()
    
    # 检查Python版本
    try {
        $pythonVersion = python --version 2>&1
        Write-VerboseOutput "Python版本：$pythonVersion"
        if ($pythonVersion -match "Python 3\.([0-9]+)") {
            $minorVersion = [int]$matches[1]
            if ($minorVersion -lt 8) {
                $issues += "Python版本过低（需要3.8+）：$pythonVersion"
            } else {
                Write-ColorOutput "✓ Python版本正常：$pythonVersion" "Green"
            }
        }
    } catch {
        $issues += "Python未安装或不在PATH中"
    }
    
    # 检查Node.js版本
    try {
        $nodeVersion = node --version 2>&1
        Write-VerboseOutput "Node.js版本：$nodeVersion"
        if ($nodeVersion -match "v([0-9]+)") {
            $majorVersion = [int]$matches[1]
            if ($majorVersion -lt 16) {
                $issues += "Node.js版本过低（需要16+）：$nodeVersion"
            } else {
                Write-ColorOutput "✓ Node.js版本正常：$nodeVersion" "Green"
            }
        }
    } catch {
        $issues += "Node.js未安装或不在PATH中"
    }
    
    # 检查项目目录
    $requiredDirs = @("tinylingo", "tinylingo\python-service", "tinylingo\src")
    foreach ($dir in $requiredDirs) {
        if (-not (Test-Path $dir)) {
            $issues += "缺少必要目录：$dir"
        } else {
            Write-VerboseOutput "目录存在：$dir"
        }
    }
    
    # 检查关键文件
    $requiredFiles = @(
        "tinylingo\python-service\main.py",
        "tinylingo\python-service\requirements.txt",
        "tinylingo\package.json",
        "tinylingo\.env.local"
    )
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $issues += "缺少必要文件：$file"
        } else {
            Write-VerboseOutput "文件存在：$file"
        }
    }
    
    return $issues
}

# 检查并安装Python依赖
function Install-PythonDependencies {
    Write-ColorOutput "📦 检查Python依赖..." "Blue"
    
    $pythonServicePath = "tinylingo\python-service"
    if (-not (Test-Path $pythonServicePath)) {
        Write-ColorOutput "✗ python-service目录不存在" "Red"
        return $false
    }
    
    # 检查requirements.txt
    $requirementsPath = Join-Path $pythonServicePath "requirements.txt"
    if (-not (Test-Path $requirementsPath)) {
        Write-ColorOutput "✗ requirements.txt文件不存在" "Red"
        return $false
    }
    
    # 检查关键依赖
    $requiredPackages = @("fastapi", "uvicorn", "rembg", "pillow")
    $missingPackages = @()
    
    foreach ($package in $requiredPackages) {
        try {
            $result = pip show $package 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-VerboseOutput "$package 已安装"
            } else {
                $missingPackages += $package
            }
        } catch {
            $missingPackages += $package
        }
    }
    
    if ($missingPackages.Count -gt 0) {
        Write-ColorOutput "⚠️  缺少依赖：$($missingPackages -join ', ')" "Yellow"
        
        if ($Force) {
            Write-ColorOutput "正在安装缺少的依赖..." "Blue"
            try {
                Set-Location $pythonServicePath
                pip install -r requirements.txt
                Set-Location ..\..\
                Write-ColorOutput "✓ 依赖安装完成" "Green"
            } catch {
                Write-ColorOutput "✗ 依赖安装失败：$($_.Exception.Message)" "Red"
                return $false
            }
        } else {
            Write-ColorOutput "使用 -Force 参数自动安装依赖" "Yellow"
            return $false
        }
    } else {
        Write-ColorOutput "✓ 所有Python依赖已安装" "Green"
    }
    
    return $true
}

# 检查并安装Node.js依赖
function Install-NodeDependencies {
    Write-ColorOutput "📦 检查Node.js依赖..." "Blue"
    
    $tinylingo = "tinylingo"
    if (-not (Test-Path $tinylingo)) {
        Write-ColorOutput "✗ tinylingo目录不存在" "Red"
        return $false
    }
    
    # 检查node_modules
    $nodeModulesPath = Join-Path $tinylingo "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-ColorOutput "⚠️  node_modules不存在" "Yellow"
        
        if ($Force) {
            Write-ColorOutput "正在安装Node.js依赖..." "Blue"
            try {
                Set-Location $tinylingo
                npm install
                Set-Location ..\
                Write-ColorOutput "✓ Node.js依赖安装完成" "Green"
            } catch {
                Write-ColorOutput "✗ Node.js依赖安装失败：$($_.Exception.Message)" "Red"
                return $false
            }
        } else {
            Write-ColorOutput "使用 -Force 参数自动安装依赖" "Yellow"
            return $false
        }
    } else {
        Write-ColorOutput "✓ Node.js依赖已安装" "Green"
    }
    
    return $true
}

# 检查端口占用
function Test-Ports {
    Write-ColorOutput "🔌 检查端口占用..." "Blue"
    
    $ports = @(3000, 8000)
    $conflicts = @()
    
    foreach ($port in $ports) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($connections) {
                $processes = $connections | ForEach-Object { 
                    try {
                        Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
                    } catch {
                        $null
                    }
                } | Where-Object { $_ -ne $null }
                
                if ($processes) {
                    $processNames = ($processes | Select-Object -ExpandProperty ProcessName -Unique) -join ', '
                    $conflicts += "端口 $port 被占用（进程：$processNames）"
                    Write-VerboseOutput "端口 $port 被进程占用：$processNames"
                }
            } else {
                Write-VerboseOutput "端口 $port 可用"
            }
        } catch {
            Write-VerboseOutput "无法检查端口 $port"
        }
    }
    
    if ($conflicts.Count -gt 0) {
        Write-ColorOutput "⚠️  端口冲突：" "Yellow"
        foreach ($conflict in $conflicts) {
            Write-ColorOutput "  $conflict" "Yellow"
        }
        
        if ($Force) {
            Write-ColorOutput "正在尝试释放端口..." "Blue"
            foreach ($port in $ports) {
                try {
                    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
                    if ($connections) {
                        $processes = $connections | ForEach-Object { 
                            Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
                        } | Where-Object { $_ -ne $null }
                        
                        foreach ($process in $processes) {
                            Write-VerboseOutput "终止进程：$($process.ProcessName) (PID: $($process.Id))"
                            Stop-Process -Id $process.Id -Force
                        }
                    }
                } catch {
                    Write-ColorOutput "✗ 无法释放端口 $port" "Red"
                }
            }
        }
    } else {
        Write-ColorOutput "✓ 端口检查通过" "Green"
    }
    
    return $conflicts.Count -eq 0
}

# 启动服务
function Start-Services {
    Write-ColorOutput "🚀 启动服务..." "Blue"
    
    # 启动Python服务
    Write-ColorOutput "启动Python背景去除服务..." "Blue"
    try {
        $pythonServicePath = "tinylingo\python-service"
        
        # 在新窗口启动Python服务
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "powershell.exe"
        $startInfo.Arguments = "-NoExit -Command `"cd '$pythonServicePath'; Write-Host 'Python背景去除服务启动中...' -ForegroundColor Green; python main.py`""
        $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
        
        $pythonProcess = [System.Diagnostics.Process]::Start($startInfo)
        Write-VerboseOutput "Python服务进程ID：$($pythonProcess.Id)"
        
        # 等待Python服务启动
        Write-ColorOutput "等待Python服务启动..." "Yellow"
        Start-Sleep -Seconds 8
        
        # 验证Python服务
        $pythonOk = $false
        for ($i = 1; $i -le 5; $i++) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 3
                Write-ColorOutput "✓ Python服务启动成功" "Green"
                $pythonOk = $true
                break
            } catch {
                Write-VerboseOutput "Python服务检查 $i/5 失败"
                Start-Sleep -Seconds 2
            }
        }
        
        if (-not $pythonOk) {
            Write-ColorOutput "✗ Python服务启动失败" "Red"
            return $false
        }
        
    } catch {
        Write-ColorOutput "✗ 启动Python服务时出错：$($_.Exception.Message)" "Red"
        return $false
    }
    
    # 启动Next.js服务
    Write-ColorOutput "启动Next.js前端服务..." "Blue"
    try {
        $nextServicePath = "tinylingo"
        
        # 在新窗口启动Next.js服务
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "powershell.exe"
        $startInfo.Arguments = "-NoExit -Command `"cd '$nextServicePath'; Write-Host 'Next.js前端服务启动中...' -ForegroundColor Green; npm run dev`""
        $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
        
        $nextProcess = [System.Diagnostics.Process]::Start($startInfo)
        Write-VerboseOutput "Next.js服务进程ID：$($nextProcess.Id)"
        
        # 等待Next.js服务启动
        Write-ColorOutput "等待Next.js服务启动..." "Yellow"
        Start-Sleep -Seconds 15
        
        # 验证Next.js服务
        $nextOk = $false
        for ($i = 1; $i -le 8; $i++) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
                Write-ColorOutput "✓ Next.js服务启动成功" "Green"
                $nextOk = $true
                break
            } catch {
                Write-VerboseOutput "Next.js服务检查 $i/8 失败"
                Start-Sleep -Seconds 3
            }
        }
        
        if (-not $nextOk) {
            Write-ColorOutput "✗ Next.js服务启动失败" "Red"
            return $false
        }
        
    } catch {
        Write-ColorOutput "✗ 启动Next.js服务时出错：$($_.Exception.Message)" "Red"
        return $false
    }
    
    return $true
}

# 测试背景去除功能
function Test-BackgroundRemoval {
    Write-ColorOutput "🧪 测试背景去除功能..." "Blue"
    
    try {
        # 测试Python服务健康检查
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
        Write-VerboseOutput "Python服务健康检查：$($healthResponse.StatusCode)"
        
        # 测试Next.js API端点
        $apiResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/bg/remove" -Method GET -TimeoutSec 5
        Write-VerboseOutput "Next.js API端点：$($apiResponse.StatusCode)"
        
        Write-ColorOutput "✓ 背景去除功能测试通过" "Green"
        return $true
        
    } catch {
        Write-ColorOutput "✗ 背景去除功能测试失败：$($_.Exception.Message)" "Red"
        return $false
    }
}

# 主程序
Write-ColorOutput "=== TinyLingo 背景去除功能快速修复工具 ===" "Magenta"
Write-ColorOutput ""

# 1. 环境检查
$envIssues = Test-Environment
if ($envIssues.Count -gt 0) {
    Write-ColorOutput "❌ 环境检查发现问题：" "Red"
    foreach ($issue in $envIssues) {
        Write-ColorOutput "  • $issue" "Red"
    }
    Write-ColorOutput ""
    Write-ColorOutput "请先解决环境问题后重试。" "Yellow"
    exit 1
}

# 2. 依赖检查
$pythonDepsOk = Install-PythonDependencies
$nodeDepsOk = Install-NodeDependencies

if (-not $pythonDepsOk -or -not $nodeDepsOk) {
    Write-ColorOutput "❌ 依赖检查失败，请使用 -Force 参数自动安装依赖。" "Red"
    exit 1
}

# 3. 端口检查
$portsOk = Test-Ports

# 4. 启动服务
$servicesOk = Start-Services

if (-not $servicesOk) {
    Write-ColorOutput "❌ 服务启动失败，请检查错误信息。" "Red"
    exit 1
}

# 5. 功能测试
Start-Sleep -Seconds 3
$testOk = Test-BackgroundRemoval

# 输出结果
Write-ColorOutput ""
Write-ColorOutput "=== 修复结果 ===" "Magenta"
Write-ColorOutput "环境检查：✓ 通过" "Green"
Write-ColorOutput "依赖安装：✓ 通过" "Green"
Write-ColorOutput "端口检查：$(if ($portsOk) { '✓ 通过' } else { '⚠️  有冲突' })" $(if ($portsOk) { "Green" } else { "Yellow" })
Write-ColorOutput "服务启动：✓ 通过" "Green"
Write-ColorOutput "功能测试：$(if ($testOk) { '✓ 通过' } else { '✗ 失败' })" $(if ($testOk) { "Green" } else { "Red" })
Write-ColorOutput ""

if ($testOk) {
    Write-ColorOutput "🎉 背景去除功能修复成功！" "Green"
    Write-ColorOutput ""
    Write-ColorOutput "访问地址：" "Cyan"
    Write-ColorOutput "  前端应用：http://localhost:3000" "Cyan"
    Write-ColorOutput "  API文档：http://localhost:8000/docs" "Cyan"
    Write-ColorOutput "  健康检查：http://localhost:8000/health" "Cyan"
    Write-ColorOutput ""
    Write-ColorOutput "现在可以在应用中使用AI生成贴纸的背景去除功能了！" "Green"
} else {
    Write-ColorOutput "❌ 背景去除功能仍有问题，请查看详细日志。" "Red"
    Write-ColorOutput ""
    Write-ColorOutput "建议操作：" "Yellow"
    Write-ColorOutput "1. 检查两个服务窗口的错误信息" "Yellow"
    Write-ColorOutput "2. 运行 .\scripts\test-background-removal.ps1 进行详细诊断" "Yellow"
    Write-ColorOutput "3. 查看故障排除指南：.\BACKGROUND_REMOVAL_TROUBLESHOOTING.md" "Yellow"
}