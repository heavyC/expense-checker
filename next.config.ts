import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['chromadb', '@chroma-core/default-embed', '@chroma-core/ai-embeddings-common', 'onnxruntime-node'],

  output: 'standalone',
};

export default nextConfig;
