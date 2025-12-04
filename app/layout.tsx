import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '3D File Storage MCP Server',
  description: 'MCP Server for 3D model storage and web publishing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
