import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
      <body>
        <nav className="site-nav">
          <div className="site-nav-inner">
            <Link href="/" className="site-nav-brand">高雄宗教場所目錄</Link>
            <Link href="/places" className="site-nav-link">搜尋場所</Link>
            <Link href="/nearby" className="site-nav-link">附近探索</Link>
          </div>
        </nav>
        {children}
        <footer className="site-footer">
          <span>資料來源：內政部全國宗教資訊系統</span>
          <span>insidehouse</span>
        </footer>
      </body>
    </html>
  );
}
