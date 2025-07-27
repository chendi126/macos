# GitHub 仓库设置指南

## 方案 1：推送到现有仓库（如果您是 Violet2314）

### 步骤 1：创建 Personal Access Token
1. 登录 GitHub，访问 Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 设置 token 名称，如 "VCTime-Build"
4. 勾选以下权限：
   - `repo` (完整仓库访问权限)
   - `workflow` (GitHub Actions 权限)
5. 点击 "Generate token" 并复制生成的 token

### 步骤 2：配置 Git 认证
```bash
# 使用 token 推送（将 YOUR_TOKEN 替换为实际的 token）
git push https://YOUR_TOKEN@github.com/Violet2314/VCTime.git master
```

## 方案 2：创建新的仓库

### 步骤 1：在 GitHub 创建新仓库
1. 登录您的 GitHub 账号
2. 点击右上角的 "+" → "New repository"
3. 仓库名称：`VCTime`
4. 描述：`VCTime - 桌面时间管理助手`
5. 选择 "Public" 或 "Private"
6. 不要初始化 README（我们已经有了）
7. 点击 "Create repository"

### 步骤 2：更改远程仓库地址
```bash
# 将 YOUR_USERNAME 替换为您的 GitHub 用户名
git remote set-url origin https://github.com/YOUR_USERNAME/VCTime.git
git push -u origin master
```

## 触发构建

推送成功后，创建版本标签来触发 GitHub Actions 构建：

```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0
```

## 查看构建状态

1. 访问您的 GitHub 仓库
2. 点击 "Actions" 标签页
3. 查看构建进度和结果
4. 构建完成后，在 "Artifacts" 中下载各平台的安装包

## 注意事项

- GitHub Actions 免费账户每月有 2000 分钟的构建时间
- macOS 构建消耗的分钟数是 Linux/Windows 的 10 倍
- 建议只在发布版本时触发完整构建
