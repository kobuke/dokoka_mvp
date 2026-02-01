import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "ドコカ - 今日だけ、はぐれない。",
  description:
    "インストール不要の使い捨て位置共有Webアプリ。フェスや花火大会ではぐれた仲間とすぐに合流できます。",
  keywords: ["位置共有", "位置情報", "合流", "フェス", "花火大会", "GPS"],
  openGraph: {
    title: "ドコカ - 今日だけ、はぐれない。",
    description: "インストール不要の使い捨て位置共有Webアプリ",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1419" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
