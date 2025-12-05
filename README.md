# 🎨 S3-Compatible 3D Storage MCP Server

一个部署在 Vercel 上的 MCP 服务器，使用 **S3 兼容 API** 存储和发布 3D 文件。支持 Cloudflare R2、AWS S3、MinIO 等所有 S3 兼容存储。

## ✨ 特性

- ✅ **S3 兼容存储**: 支持 Cloudflare R2、AWS S3、MinIO、DigitalOcean Spaces 等
- ✅ **简单易用**: 基于标准 S3 API，无需复杂配置
- ✅ **自动生成预览**: 自动创建交互式 3D 模型查看器
- ✅ **预签名 URL**: 支持生成临时访问链接
- ✅ **文件管理**: 列出、上传、获取文件

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 S3 存储

创建 `.env.local` 文件并配置 S3 凭据：

#### 使用 Cloudflare R2（推荐）

```bash
# 1. 登录 Cloudflare Dashboard
# 2. 进入 R2 -> Create Bucket -> 创建名为 "3d-models" 的存储桶
# 3. 进入 R2 -> Manage R2 API Tokens -> Create API Token
# 4. 复制 Account ID、Access Key ID 和 Secret Access Key

R2_ENDPOINT=https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<YOUR_ACCESS_KEY_ID>
R2_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY>
R2_BUCKET_NAME=3d-models

# 可选：配置 R2 自定义域名（用于公开访问）
S3_PUBLIC_URL=https://your-custom-domain.com
```

#### 使用 AWS S3

```bash
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY>
S3_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_KEY>
S3_BUCKET_NAME=3d-models
```

### 3. 本地测试

```bash
npm run dev
```

访问 http://localhost:3000 查看服务器信息

### 4. 部署到 Vercel

```bash
# 方式一：命令行部署
vercel --prod

# 方式二：GitHub 自动部署（推荐）
git push origin main
```

**重要**：部署后在 Vercel 项目设置中添加环境变量：
- 进入项目 Settings → Environment Variables
- 添加 `R2_ENDPOINT`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY` 等
- 重新部署

## 📡 MCP 端点

部署后的 MCP 服务器地址：
```
https://your-project.vercel.app/api/mcp
```

## 🛠️ 可用工具

### 1. s3_upload_file
上传 3D 模型文件到 S3 兼容存储

**参数**：
```json
{
  "fileName": "model.glb",
  "fileData": "base64_encoded_data",
  "contentType": "model/gltf-binary",
  "metadata": {
    "title": "My 3D Model",
    "description": "A beautiful 3D model"
  }
}
```

**返回**：
```json
{
  "success": true,
  "key": "3d-models/abc123-model.glb",
  "url": "https://your-domain.com/3d-models/abc123-model.glb",
  "id": "abc123",
  "bucket": "3d-models"
}
```

### 2. s3_list_files
列出 S3 存储中的所有文件

**参数**：
```json
{
  "prefix": "3d-models/",
  "maxKeys": 100
}
```

**返回**：
```json
{
  "success": true,
  "bucket": "3d-models",
  "count": 5,
  "files": [
    {
      "key": "3d-models/abc123-model.glb",
      "size": 1048576,
      "lastModified": "2024-12-04T10:30:00Z"
    }
  ]
}
```

### 3. s3_get_presigned_url
获取文件的预签名 URL（临时访问链接）

**参数**：
```json
{
  "fileName": "3d-models/abc123-model.glb",
  "expiresIn": 3600
}
```

**返回**：
```json
{
  "success": true,
  "url": "https://...presigned-url...",
  "expiresIn": 3600
}
```

### 4. generate_3d_viewer
生成 3D 模型预览网页

**参数**：
```json
{
  "modelUrl": "https://your-domain.com/3d-models/model.glb",
  "title": "My 3D Model",
  "backgroundColor": "#111",
  "cameraOrbit": "45deg 75deg auto"
}
```

## 🔧 MCP 客户端配置

在 Cursor 或其他 MCP 客户端中配置：

```json
{
  "mcpServers": {
    "3d-storage": {
      "url": "https://your-project.vercel.app/api/mcp"
    }
  }
}
```

## 💡 使用示例

### Agent 调用示例

```
用户: 帮我上传这个 3D 模型文件到云端

Agent:
1. 调用 s3_upload_file 上传文件
   → 获得文件 URL: https://domain.com/3d-models/abc123-model.glb

2. 调用 generate_3d_viewer 生成预览页面
   → 获得预览页面: https://domain.com/3d-pages/xyz789.html

3. 返回给用户可访问的链接
```

### 完整工作流

```bash
# 1. 上传 GLB 文件
s3_upload_file({
  fileName: "awesome-model.glb",
  fileData: "<base64_data>"
})

# 2. 生成预览页面
generate_3d_viewer({
  modelUrl: "返回的URL",
  title: "Awesome 3D Model"
})

# 3. 分享预览页面链接
```

## 🌍 支持的 S3 兼容存储

- ✅ **Cloudflare R2** - 免费 10GB 存储，无流量费用
- ✅ **AWS S3** - 业界标准
- ✅ **MinIO** - 自托管方案
- ✅ **DigitalOcean Spaces** - 简单易用
- ✅ **Backblaze B2** - 低成本
- ✅ **阿里云 OSS** - 支持 S3 兼容模式
- ✅ **腾讯云 COS** - 支持 S3 兼容模式

## 🔐 安全配置

### Cloudflare R2 自定义域名（推荐）

1. 在 R2 Bucket 设置中绑定自定义域名
2. 配置 `S3_PUBLIC_URL` 环境变量
3. 文件将通过自定义域名公开访问

### AWS S3 公开访问

1. 配置 Bucket Policy 允许公开读取
2. 或使用预签名 URL（`s3_get_presigned_url`）

## 📚 技术栈

- **Framework**: Next.js 14 + App Router
- **Storage**: AWS SDK S3 Client (支持所有 S3 兼容存储)
- **Protocol**: Model Context Protocol (MCP)
- **Deployment**: Vercel

## 🐛 故障排除

### 上传失败：403 Forbidden
- 检查 Access Key 和 Secret Key 是否正确
- 确认 Bucket 存在且有写入权限

### 文件无法访问
- 配置 S3_PUBLIC_URL 环境变量
- 或使用 `s3_get_presigned_url` 生成临时链接

### 部署失败
- 确保在 Vercel 项目设置中添加了所有环境变量
- 查看 Vercel 部署日志定位问题

## 📖 相关文档

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [AWS S3 API 文档](https://docs.aws.amazon.com/s3/)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Vercel 部署文档](https://vercel.com/docs)

## 🎯 为什么选择 S3 兼容存储？

1. **灵活性**: 可以随时切换存储提供商
2. **成本**: Cloudflare R2 提供免费额度，无流量费用
3. **简单**: 标准 S3 API，易于集成
4. **可靠**: 业界标准，久经考验
5. **功能强大**: 支持预签名 URL、元数据、生命周期管理等

## 📝 开发路线图

- [ ] 支持多文件批量上传
- [ ] 添加文件删除功能
- [ ] 支持文件夹管理
- [ ] 集成 CDN 加速
- [ ] 添加使用统计
