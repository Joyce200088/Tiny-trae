# 🔧 Supabase 邮件发送问题修复指南

## 问题诊断
根据测试结果，Supabase 注册请求成功但用户未收到验证邮件。这通常是邮件服务配置问题。

## 🚀 立即解决方案

### 1. 检查 Supabase 邮件配置

登录 [Supabase 控制台](https://supabase.com/dashboard) 并按以下步骤检查：

#### A. 基础邮件设置
1. 进入您的项目：`knizbnlzwcuniceqvmvd`
2. 导航到 **Authentication** → **Settings**
3. 检查 **Email** 部分：
   - ✅ 确保 **Enable email confirmations** 已启用
   - ✅ 确保 **Enable email change confirmations** 已启用
   - ✅ 检查 **Site URL** 是否正确设置为 `http://localhost:3000`

#### B. SMTP 配置检查
在 **Authentication** → **Settings** → **SMTP Settings**：

**选项1：使用 Supabase 默认邮件服务（推荐）**
- 如果 SMTP 设置为空或使用默认设置，这是最简单的方案
- Supabase 免费版每小时限制 3 封邮件，每天 30 封

**选项2：配置自定义 SMTP**
如果您想使用自定义 SMTP，需要配置：
```
SMTP Host: smtp.gmail.com (Gmail 示例)
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password
```

### 2. 邮件模板检查

在 **Authentication** → **Email Templates**：

#### A. 确认邮件模板
检查 **Confirm signup** 模板：
- 确保模板已启用
- 检查 **Subject** 和 **Body** 内容
- 确保包含 `{{ .ConfirmationURL }}` 变量

#### B. 重置默认模板（如果有问题）
点击 **Reset to default** 恢复默认模板。

### 3. 域名和 URL 配置

在 **Authentication** → **URL Configuration**：
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: 添加 `http://localhost:3000/auth/callback`

## 🔍 常见问题和解决方案

### 问题1：邮件进入垃圾邮件文件夹
**解决方案：**
- 检查垃圾邮件/促销邮件文件夹
- 将 `noreply@mail.supabase.co` 添加到联系人

### 问题2：Gmail 等邮箱服务商屏蔽
**解决方案：**
- 尝试使用其他邮箱服务（如 Outlook、Yahoo）
- 配置自定义 SMTP 使用您自己的邮箱

### 问题3：Supabase 免费版限制
**解决方案：**
- 免费版每小时限制 3 封邮件
- 等待 1 小时后重试
- 或升级到 Pro 版本

### 问题4：邮件模板损坏
**解决方案：**
- 重置邮件模板到默认设置
- 检查模板中的变量是否正确

## 🛠️ 立即修复步骤

### 步骤1：重置邮件模板
1. 进入 **Authentication** → **Email Templates**
2. 选择 **Confirm signup**
3. 点击 **Reset to default**
4. 保存更改

### 步骤2：检查 URL 配置
1. 进入 **Authentication** → **URL Configuration**
2. 设置 **Site URL**: `http://localhost:3000`
3. 在 **Redirect URLs** 中添加: `http://localhost:3000/auth/callback`
4. 保存更改

### 步骤3：启用邮件确认
1. 进入 **Authentication** → **Settings**
2. 确保 **Enable email confirmations** 已勾选
3. 保存更改

### 步骤4：测试不同邮箱
尝试使用以下邮箱服务测试：
- Gmail: `test@gmail.com`
- Outlook: `test@outlook.com`
- Yahoo: `test@yahoo.com`

## 🚨 紧急解决方案

如果以上方法都不行，可以临时禁用邮件验证：

### 临时禁用邮件验证（仅用于开发测试）
1. 进入 **Authentication** → **Settings**
2. **取消勾选** **Enable email confirmations**
3. 保存更改

**注意：** 这只适用于开发环境，生产环境必须启用邮件验证！

## 📞 获取帮助

如果问题仍然存在：
1. 检查 Supabase 项目的 **Logs** 部分查看错误信息
2. 联系 Supabase 支持团队
3. 在 Supabase Discord 社区寻求帮助

## ✅ 验证修复

修复后，使用我们的测试工具重新测试：
1. 打开 `http://localhost:8080/test-email-verification.html`
2. 输入测试邮箱
3. 点击"测试注册邮件发送"
4. 检查邮箱（包括垃圾邮件文件夹）

---

**最后更新：** 2025年10月6日
**适用版本：** Supabase v2.x