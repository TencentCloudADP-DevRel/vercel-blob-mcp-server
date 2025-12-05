export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4 text-center">
          🎨 S3-Compatible 3D Storage MCP Server
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Supports Cloudflare R2, AWS S3, MinIO, and more
        </p>
        
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
              <strong>s3_upload_file</strong> - Upload files to S3-compatible storage
            </li>
            <li>
              <strong>s3_list_files</strong> - List all uploaded files
            </li>
            <li>
              <strong>s3_get_presigned_url</strong> - Generate temporary access URLs
            </li>
            <li>
              <strong>generate_3d_viewer</strong> - Create interactive 3D viewer pages
            </li>
          </ul>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">☁️ Supported Storage</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded">
              <strong className="text-orange-400">Cloudflare R2</strong>
              <p className="text-sm text-gray-400">Free 10GB, no egress fees</p>
            </div>
            <div className="bg-gray-900 p-4 rounded">
              <strong className="text-yellow-400">AWS S3</strong>
              <p className="text-sm text-gray-400">Industry standard</p>
            </div>
            <div className="bg-gray-900 p-4 rounded">
              <strong className="text-blue-400">MinIO</strong>
              <p className="text-sm text-gray-400">Self-hosted solution</p>
            </div>
            <div className="bg-gray-900 p-4 rounded">
              <strong className="text-purple-400">DigitalOcean</strong>
              <p className="text-sm text-gray-400">Simple & affordable</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">🚀 Quick Start</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Get S3-compatible credentials (R2, S3, etc.)</li>
            <li>Configure environment variables in Vercel</li>
            <li>Add MCP server URL to your AI client</li>
            <li>Start uploading and sharing 3D models!</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
