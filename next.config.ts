import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // serverExternalPackages: ['chromadb', '@chroma-core/default-embed', '@chroma-core/ai-embeddings-common', 'onnxruntime-node'],
  serverExternalPackages: ['chromadb', 'onnxruntime-node'],

  output: 'standalone',
  env: {
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    CHROMA_API_KEY: process.env.CHROMA_API_KEY ?? '',
    CHROMA_TENANT: process.env.CHROMA_TENANT ?? '',
    CHROMA_DATABASE: process.env.CHROMA_DATABASE ?? '',
  },
};

export default nextConfig;
