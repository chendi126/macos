# 创建 GitHub 仓库并推送代码

## 步骤 1：在 GitHub 创建新仓库

1. **登录 GitHub**
   - 访问 https://github.com
   - 使用您的账号登录

2. **创建新仓库**
   - 点击右上角的 "+" 按钮
   - 选择 "New repository"
   - 仓库名称：`VCTime`
   - 描述：`VCTime - 桌面时间管理助手`
   - 选择 "Public"（推荐，这样 GitHub Actions 免费）
   - **不要**勾选 "Add a README file"（我们已经有了）
   - **不要**勾选 "Add .gitignore"
   - **不要**勾选 "Choose a license"
   - 点击 "Create repository"

3. **复制仓库地址**
   - 创建后会显示仓库地址，类似：`https://github.com/YOUR_USERNAME/VCTime.git`
   - 复制这个地址

## 步骤 2：推送代码

创建仓库后，在命令行中执行以下命令：

```bash
# 更新远程仓库地址（将 YOUR_USERNAME 替换为您的实际 GitHub 用户名）
git remote set-url origin https://github.com/YOUR_USERNAME/VCTime.git

# 推送代码
git push -u origin master
```

## 步骤 3：创建版本标签触发构建

```bash
# 创建版本标签
git tag v1.0.0

# 推送标签
git push origin v1.0.0
```

## 步骤 4：查看构建结果

1. 访问您的 GitHub 仓库
2. 点击 "Actions" 标签页
3. 查看构建进度
4. 构建完成后，点击构建任务查看详情
5. 在 "Artifacts" 部分下载各平台的安装包：
   - `macos-build` - macOS DMG 安装包
   - `windows-build` - Windows EXE 安装包
   - `linux-build` - Linux AppImage

## 可能遇到的问题

### 权限问题
如果推送时提示权限错误，可能需要：
1. 配置 Personal Access Token
2. 或者使用 SSH 密钥

### 构建失败
如果 GitHub Actions 构建失败：
1. 检查 Actions 页面的错误日志
2. 确保所有依赖都在 package.json 中正确配置
3. 检查 Node.js 版本兼容性

## 下一步

创建仓库并推送成功后，您就可以：
- 自动构建所有平台的安装包
- 通过 GitHub Releases 分发应用
- 使用 GitHub Issues 跟踪问题
- 接受社区贡献
