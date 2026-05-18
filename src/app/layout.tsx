import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "다독다독 × Kanana-o",
  description: "다독다독은 발달장애 아동을 위한 따뜻한 AI 독서 친구 데모입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
