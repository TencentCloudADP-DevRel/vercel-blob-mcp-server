import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';

// 创建 MCP 服务器实例
const server = new McpServer({
  name: '3D File Storage MCP Server',
  version: '1.0.0',
});

// 工具1: 上传 3D 文件到 Vercel Blob
server.tool(
  'upload_3d_file',
  'Upload a 3D model file (GLB/GLTF) to cloud storage',
  {
    fileName: z.string().describe('File name (e.g., model.glb)'),
    fileData: z.string().describe('Base64 encoded file data'),
    metadata: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    }).optional(),
  },
  async ({ fileName, fileData, metadata }) => {
    try {
      // 解码 Base64 并转换为 Blob
      const buffer = Buffer.from(fileData, 'base64');
      const blob = new Blob([buffer]);
      
      // 上传到 Vercel Blob
      const uniqueId = nanoid(10);
      const uploadedBlob = await put(
        `3d-models/${uniqueId}-${fileName}`,
        blob,
        {
          access: 'public',
          addRandomSuffix: false,
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              url: uploadedBlob.url,
              downloadUrl: uploadedBlob.downloadUrl,
              id: uniqueId,
              metadata: metadata || {},
            }),
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
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// 工具2: 生成 3D 预览网页
server.tool(
  'generate_3d_viewer',
  'Generate a 3D viewer web page for a GLB/GLTF file',
  {
    modelUrl: z.string().url().describe('URL of the 3D model file'),
    title: z.string().default('3D Model Viewer'),
    backgroundColor: z.string().default('#111'),
    cameraOrbit: z.string().default('45deg 75deg auto'),
    exposure: z.number().default(1),
    shadowIntensity: z.number().default(0.6),
  },
  async ({ modelUrl, title, backgroundColor, cameraOrbit, exposure, shadowIntensity }) => {
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

    // 保存 HTML 到 Blob
    const pageId = nanoid(10);
    const htmlBlob = await put(
      `3d-pages/${pageId}.html`,
      htmlContent,
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'text/html',
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            pageUrl: htmlBlob.url,
            pageId: pageId,
            modelUrl: modelUrl,
          }),
        },
      ],
    };
  }
);

// 工具3: 列出已上传的 3D 文件
server.tool(
  'list_3d_files',
  'List all uploaded 3D model files',
  {},
  async () => {
    try {
      // 注意：这需要 Vercel Blob 的 list 功能
      // 简化版本，返回提示信息
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'List functionality requires Vercel Blob list API. Please check Vercel dashboard for file management.',
              tip: 'Visit https://vercel.com/dashboard/stores/blob to manage your files',
            }),
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
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// 处理 Next.js API 路由请求
export async function POST(request: NextRequest) {
  const transport = new StreamableHTTPServerTransport('api/mcp', server);
  return transport.handleRequest(request);
}

export async function GET(request: NextRequest) {
  const transport = new StreamableHTTPServerTransport('api/mcp', server);
  return transport.handleRequest(request);
}
