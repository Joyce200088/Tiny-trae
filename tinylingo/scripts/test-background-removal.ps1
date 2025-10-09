# 背景去除功能测试脚本
# Test Background Removal Service

param(
    [string]$ImagePath = "",
    [switch]$HealthCheck,
    [switch]$Monitor,
    [int]$MonitorInterval = 30
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
        default { Write-Host $Message }
    }
}

# 检查服务健康状态
function Test-ServiceHealth {
    Write-ColorOutput "正在检查Python背景去除服务状态..." "Blue"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            Write-ColorOutput "✓ 服务状态：正常运行" "Green"
            Write-ColorOutput "  服务名称：$($content.service)" "Green"
            Write-ColorOutput "  状态：$($content.status)" "Green"
            return $true
        } else {
            Write-ColorOutput "✗ 服务响应异常：HTTP $($response.StatusCode)" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "✗ 无法连接到服务：$($_.Exception.Message)" "Red"
        Write-ColorOutput "  请确认Python服务是否已启动" "Yellow"
        return $false
    }
}

# 检查依赖和环境
function Test-Environment {
    Write-ColorOutput "正在检查环境配置..." "Blue"
    
    # 检查Python版本
    try {
        $pythonVersion = python --version 2>&1
        Write-ColorOutput "✓ Python版本：$pythonVersion" "Green"
    } catch {
        Write-ColorOutput "✗ Python未安装或不在PATH中" "Red"
        return $false
    }
    
    # 检查关键依赖
    $dependencies = @("fastapi", "rembg", "uvicorn", "pillow")
    $missingDeps = @()
    
    foreach ($dep in $dependencies) {
        try {
            $result = pip show $dep 2>&1
            if ($LASTEXITCODE -eq 0) {
                $version = ($result | Select-String "Version:").ToString().Split(":")[1].Trim()
                Write-ColorOutput "✓ $dep : $version" "Green"
            } else {
                $missingDeps += $dep
            }
        } catch {
            $missingDeps += $dep
        }
    }
    
    if ($missingDeps.Count -gt 0) {
        Write-ColorOutput "✗ 缺少依赖包：$($missingDeps -join ', ')" "Red"
        Write-ColorOutput "  运行以下命令安装：pip install $($missingDeps -join ' ')" "Yellow"
        return $false
    }
    
    return $true
}

# 测试背景去除功能
function Test-BackgroundRemoval {
    param([string]$ImagePath)
    
    if (-not $ImagePath -or -not (Test-Path $ImagePath)) {
        Write-ColorOutput "✗ 请提供有效的图片路径" "Red"
        return $false
    }
    
    Write-ColorOutput "正在测试背景去除功能..." "Blue"
    Write-ColorOutput "  输入图片：$ImagePath" "Blue"
    
    try {
        # 准备表单数据
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        
        $fileBytes = [System.IO.File]::ReadAllBytes($ImagePath)
        $fileName = [System.IO.Path]::GetFileName($ImagePath)
        
        $bodyLines = (
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
            "Content-Type: image/jpeg$LF",
            [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
            "--$boundary--$LF"
        ) -join $LF
        
        $response = Invoke-WebRequest -Uri "http://localhost:8000/remove-background" `
                                    -Method POST `
                                    -ContentType "multipart/form-data; boundary=$boundary" `
                                    -Body $bodyLines `
                                    -TimeoutSec 60
        
        if ($response.StatusCode -eq 200) {
            $outputPath = "removed_bg_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"
            [System.IO.File]::WriteAllBytes($outputPath, $response.Content)
            
            Write-ColorOutput "✓ 背景去除成功！" "Green"
            Write-ColorOutput "  输出文件：$outputPath" "Green"
            Write-ColorOutput "  文件大小：$([math]::Round($response.Content.Length / 1KB, 2)) KB" "Green"
            return $true
        } else {
            Write-ColorOutput "✗ 背景去除失败：HTTP $($response.StatusCode)" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "✗ 背景去除测试失败：$($_.Exception.Message)" "Red"
        return $false
    }
}

# 监控服务状态
function Start-ServiceMonitor {
    param([int]$Interval = 30)
    
    Write-ColorOutput "开始监控服务状态（每 $Interval 秒检查一次，按 Ctrl+C 停止）..." "Blue"
    
    while ($true) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
            Write-ColorOutput "[$timestamp] ✓ 服务正常 (HTTP $($response.StatusCode))" "Green"
        } catch {
            Write-ColorOutput "[$timestamp] ✗ 服务异常：$($_.Exception.Message)" "Red"
        }
        
        Start-Sleep -Seconds $Interval
    }
}

# 主程序逻辑
Write-ColorOutput "=== TinyLingo 背景去除服务测试工具 ===" "Blue"
Write-ColorOutput ""

if ($HealthCheck) {
    # 仅检查健康状态
    $healthOk = Test-ServiceHealth
    exit $(if ($healthOk) { 0 } else { 1 })
}

if ($Monitor) {
    # 监控模式
    Start-ServiceMonitor -Interval $MonitorInterval
    exit 0
}

# 完整测试流程
Write-ColorOutput "开始完整测试流程..." "Blue"
Write-ColorOutput ""

# 1. 环境检查
$envOk = Test-Environment
Write-ColorOutput ""

# 2. 服务健康检查
$healthOk = Test-ServiceHealth
Write-ColorOutput ""

# 3. 功能测试（如果提供了图片路径）
$funcOk = $true
if ($ImagePath) {
    $funcOk = Test-BackgroundRemoval -ImagePath $ImagePath
    Write-ColorOutput ""
}

# 输出测试结果
Write-ColorOutput "=== 测试结果汇总 ===" "Blue"
Write-ColorOutput "环境检查：$(if ($envOk) { '✓ 通过' } else { '✗ 失败' })" $(if ($envOk) { "Green" } else { "Red" })
Write-ColorOutput "服务状态：$(if ($healthOk) { '✓ 正常' } else { '✗ 异常' })" $(if ($healthOk) { "Green" } else { "Red" })

if ($ImagePath) {
    Write-ColorOutput "功能测试：$(if ($funcOk) { '✓ 成功' } else { '✗ 失败' })" $(if ($funcOk) { "Green" } else { "Red" })
}

Write-ColorOutput ""

if ($envOk -and $healthOk -and $funcOk) {
    Write-ColorOutput "🎉 所有测试通过！背景去除服务工作正常。" "Green"
    exit 0
} else {
    Write-ColorOutput "❌ 测试失败，请检查上述错误信息。" "Red"
    Write-ColorOutput ""
    Write-ColorOutput "常见解决方案：" "Yellow"
    Write-ColorOutput "1. 启动Python服务：cd tinylingo/python-service && python main.py" "Yellow"
    Write-ColorOutput "2. 安装依赖：pip install -r requirements.txt" "Yellow"
    Write-ColorOutput "3. 检查端口占用：Get-NetTCPConnection -LocalPort 8000" "Yellow"
    exit 1
}