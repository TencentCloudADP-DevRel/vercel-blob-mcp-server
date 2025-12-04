import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

// MCP 工具定义
const tools = [
  {
    name: 'upload_3d_file',
    description: 'Upload a 3D model file (GLB/GLTF) to cloud storage',
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
    name: 'generate_3d_viewer',
    description: 'Generate a 3D viewer web page for a GLB/GLTF file',
    inputSchema: {
      type: 'object',
      properties: {
        modelUrl: {
          type: 'string',
          description: 'URL of the 3D model file',
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
  {
    name: 'list_3d_files',
    description: 'List all uploaded 3D model files',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// 工具执行函数
async function executeTool(toolName: string, args: any) {
  switch (toolName) {
    case 'upload_3d_file':
      return await uploadFile(args);
    case 'generate_3d_viewer':
      return await generateViewer(args);
    case 'list_3d_files':
      return await listFiles();
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function uploadFile(args: any) {
  try {
    // 解码 Base64 并转换为 Blob
    const buffer = Buffer.from(args.fileData, 'base64');
    const blob = new Blob([buffer]);
    
    // 上传到 Vercel Blob
    const uniqueId = nanoid(10);
    const uploadedBlob = await put(
      `3d-models/${uniqueId}-${args.fileName}`,
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
            id: uniqueId,
            metadata: args.metadata || {},
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

async function listFiles() {
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
            name: '3D File Storage MCP Server',
            version: '1.0.0',
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
    name: '3D File Storage MCP Server',
    version: '1.0.0',
    description: 'MCP Server for 3D model storage and web publishing',
    tools: tools.map((t) => ({ name: t.name, description: t.description })),
  });
}
