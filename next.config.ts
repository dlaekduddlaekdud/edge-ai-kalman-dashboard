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
      // /realtime 페이지를 /results로 통합. 기존 링크 유지를 위해 영구 이동으로 처리
      {
        source: "/realtime",
        destination: "/results",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;