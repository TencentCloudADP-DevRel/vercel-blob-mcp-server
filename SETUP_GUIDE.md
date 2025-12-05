# 🚀 快速配置指南

## 选项 1: Cloudflare R2（推荐 - 免费）

### 步骤 1: 创建 R2 存储桶

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 导航到 **R2 Object Storage**
3. 点击 **Create bucket**，命名为 `3d-models`

### 步骤 2: 生成 API Token

1. 在 R2 页面，点击 **Manage R2 API Tokens**
2. 点击 **Create API token**
3. 选择权限：**Object Read & Write**
4. 复制生成的：
   - **Access Key ID**
   - **Secret Access Key**
   - 记下你的 **Account ID**（在 R2 overview 页面）

### 步骤 3: 配置 Vercel 环境变量

在 [Vercel 项目设置](https://vercel.com/tencentcloudadpdevrel-9224s-projects/vercel-blob-mcp-server/settings/environment-variables) 中添加：

```bash
R2_ENDPOINT=https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<YOUR_ACCESS_KEY_ID>
R2_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY>
R2_BUCKET_NAME=3d-models
```

### 步骤 4: 配置公开访问（可选）

如果需要通过自定义域名公开访问：

1. 在 R2 Bucket 设置中绑定自定义域名
2. 添加环境变量：
```bash
S3_PUBLIC_URL=https://your-custom-domain.com
```

---

## 选项 2: AWS S3

### 步骤 1: 创建 S3 Bucket

```bash
aws s3 mb s3://3d-models --region us-east-1
```

### 步骤 2: 创建 IAM 用户并获取密钥

1. 在 AWS Console 创建 IAM 用户
2. 附加策略：`AmazonS3FullAccess`
3. 生成 Access Key

### 步骤 3: 配置 Vercel 环境变量

```bash
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY>
S3_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_KEY>
S3_BUCKET_NAME=3d-models
```

---

## 选项 3: MinIO（自托管）

### 步骤 1: 部署 MinIO

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"
```

### 步骤 2: 创建 Bucket

访问 http://localhost:9001，创建名为 `3d-models` 的 bucket

### 步骤 3: 配置 Vercel 环境变量

```bash
S3_ENDPOINT=https://your-minio-server.com
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=3d-models
```

---

## 🧪 本地测试

创建 `.env.local` 文件：

```bash
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=3d-models
```

运行：

```bash
npm run dev
```

测试 API：

```bash
curl http://localhost:3000/api/mcp
```

---

## 📱 配置 MCP 客户端

在 Cursor、Claude Desktop 等客户端中添加：

```json
{
  "mcpServers": {
    "3d-storage": {
      "url": "https://vercel-blob-mcp-server-xxx.vercel.app/api/mcp"
    }
  }
}
```

---

## 🎯 测试 Agent 调用

### 示例 1: 上传文件

```
用户: 帮我上传这个 3D 模型到云端

Agent 调用:
{
  "tool": "s3_upload_file",
  "arguments": {
    "fileName": "model.glb",
    "fileData": "<base64_encoded_data>"
  }
}

返回:
{
  "success": true,
  "url": "https://your-domain.com/3d-models/abc123-model.glb",
  "key": "3d-models/abc123-model.glb"
}
```

### 示例 2: 列出文件

```
用户: 查看我上传的所有 3D 模型

Agent 调用:
{
  "tool": "s3_list_files",
  "arguments": {
    "prefix": "3d-models/"
  }
}
```

### 示例 3: 生成预览页面

```
用户: 为这个模型生成一个可分享的预览页面

Agent 调用:
{
  "tool": "generate_3d_viewer",
  "arguments": {
    "modelUrl": "https://your-domain.com/3d-models/abc123-model.glb",
    "title": "我的 3D 模型"
  }
}
```

---

## 🔧 常见问题

### Q: 上传失败，返回 403
**A**: 检查 Access Key 和 Secret Key 是否正确，确认 Bucket 有写入权限

### Q: 文件上传成功但无法访问
**A**: 配置 `S3_PUBLIC_URL` 或使用 `s3_get_presigned_url` 生成临时链接

### Q: 本地测试正常，部署后失败
**A**: 确认 Vercel 环境变量已正确配置，并重新部署

---

## 💰 成本对比

| 存储服务 | 免费额度 | 流量费用 | 适用场景 |
|---------|---------|---------|---------|
| **Cloudflare R2** | 10GB 存储 | **免费** | 推荐 |
| **AWS S3** | 5GB（12个月） | $0.09/GB | 企业级 |
| **MinIO** | 无限制（自托管） | 无 | 自建 |

---

## 📚 下一步

1. ✅ 配置存储凭据
2. ✅ 部署到 Vercel
3. ✅ 添加 MCP 客户端配置
4. 🎉 开始使用 Agent 管理 3D 文件！
