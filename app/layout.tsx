import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "高雄宗教場所目錄",
  description: "收錄高雄市 1,600+ 間宗教場所的公開資料，支援搜尋、篩選與附近探索。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <nav style={{
          borderBottom: '1px solid #eee',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          maxWidth: 900,
          margin: '0 auto',
        }}>
          <Link href="/" style={{ fontWeight: 700 }}>首頁</Link>
          <Link href="/places">搜尋場所</Link>
          <Link href="/nearby">附近探索</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
