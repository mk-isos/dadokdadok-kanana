import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dadokdadok-kanana.vercel.app"),
  title: "다독다독 × Kanana-o",
  description: "다독다독은 발달장애 아동이 그림책을 보고, 듣고, 말하며 감정을 이해하도록 돕는 AI 독서 친구입니다.",
  applicationName: "다독다독 × Kanana-o",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://dadokdadok-kanana.vercel.app",
    title: "다독다독 × Kanana-o",
    description: "그림책을 보고, 듣고, 말하며 감정을 이해하는 AI 독서 친구",
    siteName: "다독다독 × Kanana-o",
  },
  twitter: {
    card: "summary_large_image",
    title: "다독다독 × Kanana-o",
    description: "발달장애 아동을 위한 AI 독서 친구",
  },
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
