import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

// 初始化 S3 客户端（支持 Cloudflare R2、AWS S3 等）
function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('S3 configuration missing. Please set S3_ENDPOINT, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY');
  }

  return new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME || '3d-models';

// MCP 工具定义
const tools = [
  {
    name: 's3_upload_file',
    description: 'Upload a 3D model file (GLB/GLTF) to S3-compatible storage (Cloudflare R2, AWS S3, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
          description: 'File name (e.g., model.glb)',
        },
        fileData: {
          type: 'string',
          description: 'Base64 encoded file data',
        },
        contentType: {
          type: 'string',
          description: 'MIME type (default: model/gltf-binary)',
          default: 'model/gltf-binary',
        },
        metadata: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
      required: ['fileName', 'fileData'],
    },
  },
  {
    name: 's3_list_files',
    description: 'List all uploaded files in S3-compatible storage',
    inputSchema: {
      type: 'object',
      properties: {
        prefix: {
          type: 'string',
          description: 'Filter by prefix (e.g., "3d-models/")',
        },
        maxKeys: {
          type: 'number',
          description: 'Maximum number of files to return (default: 100)',
          default: 100,
        },
      },
    },
  },
  {
    name: 's3_get_presigned_url',
    description: 'Get a presigned URL for accessing a file (valid for 1 hour)',
    inputSchema: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
          description: 'File name or key',
        },
        expiresIn: {
          type: 'number',
          description: 'URL expiration time in seconds (default: 3600)',
          default: 3600,
        },
      },
      required: ['fileName'],
    },
  },
  {
    name: 'generate_3d_viewer',
    description: 'Generate a 3D viewer web page for a GLB/GLTF file',
    inputSchema: {
      type: 'object',
      properties: {
        modelUrl: {
          type: 'string',
          description: 'Public URL or presigned URL of the 3D model file',
        },
        title: {
          type: 'string',
          description: 'Page title',
          default: '3D Model Viewer',
        },
        backgroundColor: {
          type: 'string',
          default: '#111',
        },
        cameraOrbit: {
          type: 'string',
          default: '45deg 75deg auto',
        },
        exposure: {
          type: 'number',
          default: 1,
        },
        shadowIntensity: {
          type: 'number',
          default: 0.6,
        },
      },
      required: ['modelUrl'],
    },
  },
];

// 工具执行函数
async function executeTool(toolName: string, args: any) {
  switch (toolName) {
    case 's3_upload_file':
      return await s3UploadFile(args);
    case 's3_list_files':
      return await s3ListFiles(args);
    case 's3_get_presigned_url':
      return await s3GetPresignedUrl(args);
    case 'generate_3d_viewer':
      return await generateViewer(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// S3 上传文件
async function s3UploadFile(args: any) {
  try {
    const s3Client = getS3Client();
    
    // 解码 Base64
    const buffer = Buffer.from(args.fileData, 'base64');
    
    // 生成唯一文件名
    const uniqueId = nanoid(10);
    const key = `3d-models/${uniqueId}-${args.fileName}`;
    
    // 上传到 S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: args.contentType || 'model/gltf-binary',
      Metadata: args.metadata || {},
    });
    
    await s3Client.send(command);
    
    // 生成公开 URL
    const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT || '';
    const publicUrl = process.env.S3_PUBLIC_URL 
      ? `${process.env.S3_PUBLIC_URL}/${key}`
      : `${endpoint}/${BUCKET_NAME}/${key}`;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            key: key,
            url: publicUrl,
            id: uniqueId,
            bucket: BUCKET_NAME,
            metadata: args.metadata || {},
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

// S3 列出文件
async function s3ListFiles(args: any) {
  try {
    const s3Client = getS3Client();
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: args.prefix || '',
      MaxKeys: args.maxKeys || 100,
    });
    
    const response = await s3Client.send(command);
    
    const files = (response.Contents || []).map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified?.toISOString(),
      etag: item.ETag,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            bucket: BUCKET_NAME,
            count: files.length,
            files: files,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

// S3 获取预签名 URL
async function s3GetPresignedUrl(args: any) {
  try {
    const s3Client = getS3Client();
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: args.fileName,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: args.expiresIn || 3600,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            url: presignedUrl,
            expiresIn: args.expiresIn || 3600,
            key: args.fileName,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

// 生成 3D 查看器
async function generateViewer(args: any) {
  const {
    modelUrl,
    title = '3D Model Viewer',
    backgroundColor = '#111',
    cameraOrbit = '45deg 75deg auto',
    exposure = 1,
    shadowIntensity = 0.6,
  } = args;

  const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        background: ${backgroundColor};
        color: #fff;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .container {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      header {
        padding: 10px 16px;
        font-size: 14px;
        background: #181818;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .controls {
        display: flex;
        gap: 10px;
      }
      .controls button {
        padding: 6px 12px;
        font-size: 12px;
        background: #2a2a2a;
        color: #fff;
        border: 1px solid #444;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .controls button:hover {
        background: #3a3a3a;
      }
      model-viewer {
        flex: 1;
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <span>${title}</span>
        <div class="controls">
          <button onclick="resetCamera()">Reset</button>
          <button onclick="viewFromTop()">Top View</button>
          <button onclick="viewFromFront()">Front View</button>
          <button onclick="viewFromSide()">Side View</button>
        </div>
      </header>
      <model-viewer
        id="model-viewer"
        src="${modelUrl}"
        camera-controls
        touch-action="pan-y"
        camera-orbit="${cameraOrbit}"
        camera-target="auto auto auto"
        min-camera-orbit="auto auto 0.5m"
        max-camera-orbit="auto auto 10m"
        interpolation-decay="200"
        interaction-prompt="auto"
        exposure="${exposure}"
        shadow-intensity="${shadowIntensity}"
        style="background: radial-gradient(circle at top, #333 0, #000 60%);"
      ></model-viewer>
    </div>
    <script>
      const modelViewer = document.getElementById('model-viewer');
      function resetCamera() {
        modelViewer.cameraOrbit = '${cameraOrbit}';
        modelViewer.cameraTarget = 'auto auto auto';
      }
      function viewFromTop() {
        modelViewer.cameraOrbit = '0deg 0deg auto';
      }
      function viewFromFront() {
        modelViewer.cameraOrbit = '0deg 90deg auto';
      }
      function viewFromSide() {
        modelViewer.cameraOrbit = '90deg 90deg auto';
      }
    </script>
  </body>
</html>`;

  // 将 HTML 上传到 S3
  try {
    const s3Client = getS3Client();
    const pageId = nanoid(10);
    const key = `3d-pages/${pageId}.html`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: htmlContent,
      ContentType: 'text/html',
    });
    
    await s3Client.send(command);
    
    const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT || '';
    const pageUrl = process.env.S3_PUBLIC_URL 
      ? `${process.env.S3_PUBLIC_URL}/${key}`
      : `${endpoint}/${BUCKET_NAME}/${key}`;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            pageUrl: pageUrl,
            pageId: pageId,
            modelUrl: modelUrl,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
            html: htmlContent,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

// 处理 MCP 协议请求
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 处理 initialize 请求
    if (body.method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'S3-Compatible 3D Storage MCP Server',
            version: '2.0.0',
          },
        },
      });
    }

    // 处理 tools/list 请求
    if (body.method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          tools,
        },
      });
    }

    // 处理 tools/call 请求
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;
      const result = await executeTool(name, args || {});
      
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result,
      });
    }

    // 未知方法
    return NextResponse.json({
      jsonrpc: '2.0',
      id: body.id,
      error: {
        code: -32601,
        message: 'Method not found',
      },
    });
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: (error as Error).message,
      },
    });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'S3-Compatible 3D Storage MCP Server',
    version: '2.0.0',
    description: 'MCP Server for 3D model storage using S3-compatible APIs (Cloudflare R2, AWS S3, etc.)',
    storage: {
      type: 'S3-compatible',
      supports: ['Cloudflare R2', 'AWS S3', 'MinIO', 'DigitalOcean Spaces', 'Backblaze B2'],
    },
    tools: tools.map((t) => ({ name: t.name, description: t.description })),
    configuration: {
      required: [
        'S3_ENDPOINT or R2_ENDPOINT',
        'S3_ACCESS_KEY_ID or R2_ACCESS_KEY_ID',
        'S3_SECRET_ACCESS_KEY or R2_SECRET_ACCESS_KEY',
      ],
      optional: [
        'S3_BUCKET_NAME (default: 3d-models)',
        'S3_PUBLIC_URL (for custom domain)',
      ],
    },
  });
}
