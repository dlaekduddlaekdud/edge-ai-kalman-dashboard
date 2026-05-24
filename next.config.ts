import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 브라우저가 자동으로 요청하는 /favicon.ico → Next.js 생성 /icon.png 으로 리다이렉트
      {
        source: "/favicon.ico",
        destination: "/icon.png",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
