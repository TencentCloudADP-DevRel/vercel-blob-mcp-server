# 🎨 3D File Storage MCP Server

一个部署在 Vercel 上的 MCP 服务器，用于 3D 文件存储和网页发布。

## ✨ 功能

- **上传 3D 文件**: 上传 GLB/GLTF 模型到 Vercel Blob 存储
- **生成预览页面**: 自动生成交互式 3D 模型查看器
- **云端托管**: 完全托管在 Vercel，自动扩容

## 🚀 部署步骤

### 1. 安装依赖

```bash
cd mcp-3d-server
npm install
```

### 2. 配置环境变量

在 Vercel 项目设置中添加环境变量（或本地创建 `.env.local`）：

```env
# Vercel Blob 存储（部署后自动生成）
BLOB_READ_WRITE_TOKEN=<your-token>
```

### 3. 本地测试

```bash
npm run dev
```

访问 `http://localhost:3000` 查看首页

使用 MCP Inspector 测试：
```bash
npx @modelcontextprotocol/inspector@latest http://localhost:3000 undefined
```

### 4. 部署到 Vercel

#### 方式一：通过 CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

#### 方式二：通过 GitHub
1. 推送代码到 GitHub
2. 在 Vercel 控制台导入项目
3. 关联 GitHub 仓库并部署

## 📡 MCP 端点

部署后获取的 MCP 服务器地址：
```
https://your-project.vercel.app/api/mcp
```

## 🛠️ 可用工具

### 1. upload_3d_file
上传 3D 模型文件到云存储

**参数**：
- `fileName`: 文件名（如 model.glb）
- `fileData`: Base64 编码的文件数据
- `metadata`: 可选元数据（标题、描述）

**返回**：
```json
{
  "success": true,
  "url": "https://...",
  "downloadUrl": "https://...",
  "id": "xxx"
}
```

### 2. generate_3d_viewer
生成 3D 模型预览网页

**参数**：
- `modelUrl`: 3D 模型文件 URL
- `title`: 页面标题（默认 "3D Model Viewer"）
- `backgroundColor`: 背景颜色（默认 "#111"）
- `cameraOrbit`: 相机角度（默认 "45deg 75deg auto"）

**返回**：
```json
{
  "success": true,
  "pageUrl": "https://...",
  "pageId": "xxx"
}
```

### 3. list_3d_files
列出已上传的文件（需要 Vercel Blob list API）

## 🔧 客户端配置

在你的 MCP 客户端（如 Cursor）中添加配置：

```json
{
  "mcpServers": {
    "3d-storage": {
      "url": "https://your-project.vercel.app/api/mcp"
    }
  }
}
```

## 📝 使用示例

1. **上传模型**：
   ```
   调用 upload_3d_file，传入 Base64 编码的 GLB 文件
   ```

2. **生成预览**：
   ```
   使用返回的 URL 调用 generate_3d_viewer
   ```

3. **分享链接**：
   ```
   获得的 pageUrl 可直接分享给他人查看
   ```

## 🔐 安全注意

- Vercel Blob 文件默认为公开访问
- 如需私有存储，请配置 OAuth 认证
- 生产环境建议添加速率限制

## 📚 技术栈

- **Framework**: Next.js 14 + App Router
- **MCP**: mcp-handler
- **Storage**: Vercel Blob
- **Validation**: Zod
- **Deployment**: Vercel

## 🐛 故障排除

1. **上传失败**：检查 `BLOB_READ_WRITE_TOKEN` 是否配置正确
2. **CORS 错误**：确认 `vercel.json` 中的 CORS 配置
3. **超时**：增加 `vercel.json` 中的函数超时时间

## 📖 相关文档

- [Vercel MCP 文档](https://vercel.com/docs/mcp)
- [Vercel Blob 存储](https://vercel.com/docs/storage/vercel-blob)
- [MCP 协议规范](https://modelcontextprotocol.io)
