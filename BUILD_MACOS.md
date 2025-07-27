# macOS 构建指南

由于 electron-builder 的限制，macOS 应用只能在 macOS 系统上构建。以下是几种构建 macOS 版本的方法：

## 方法 1：使用 GitHub Actions（推荐）

1. 将代码推送到 GitHub 仓库
2. 创建一个 tag 来触发构建：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions 会自动构建所有平台的版本，包括 macOS
4. 构建完成后，可以在 Actions 页面下载构建产物

## 方法 2：在 macOS 设备上手动构建

如果您有 macOS 设备，可以按以下步骤操作：

1. 将项目代码复制到 macOS 设备
2. 安装 Node.js（推荐版本 18+）
3. 安装依赖：
   ```bash
   npm install
   ```
4. 构建 macOS 版本：
   ```bash
   npm run build:mac
   ```
5. 构建产物将在 `dist` 目录中

## 方法 3：使用云服务

可以使用以下云服务来构建 macOS 应用：
- GitHub Codespaces（macOS 环境）
- GitPod
- CircleCI
- Travis CI

## 构建配置说明

项目已经配置好了 macOS 构建：

- **图标**：使用 `resources/icon.ico`（已配置）
- **目标格式**：DMG 安装包
- **支持架构**：x64 和 ARM64（Apple Silicon）
- **应用分类**：生产力工具
- **签名**：配置了基本的 entitlements

## 注意事项

1. **代码签名**：如果需要分发到 App Store 或避免安全警告，需要 Apple 开发者账号进行代码签名
2. **公证**：macOS 10.15+ 需要应用公证才能正常运行
3. **图标优化**：建议创建 .icns 格式的图标文件以获得最佳效果

## 故障排除

如果构建失败，请检查：
- Node.js 版本是否为 18+
- 所有依赖是否正确安装
- macOS 版本是否支持（建议 macOS 10.15+）
- Xcode Command Line Tools 是否已安装
