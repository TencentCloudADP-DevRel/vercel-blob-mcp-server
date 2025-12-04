export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🎨 3D File Storage MCP Server
        </h1>
        
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">📡 MCP Endpoint</h2>
          <code className="block bg-gray-900 p-4 rounded text-green-400 break-all">
            {process.env.NEXT_PUBLIC_VERCEL_URL 
              ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/mcp`
              : 'https://your-domain.vercel.app/api/mcp'}
          </code>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">🛠️ Available Tools</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>upload_3d_file</strong> - Upload GLB/GLTF files to cloud storage
            </li>
            <li>
              <strong>generate_3d_viewer</strong> - Generate interactive 3D viewer pages
            </li>
            <li>
              <strong>list_3d_files</strong> - List uploaded 3D models
            </li>
          </ul>
        </div>

        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">🚀 Quick Start</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Configure environment variables in Vercel</li>
            <li>Add MCP server URL to your client config</li>
            <li>Start uploading and publishing 3D content!</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
