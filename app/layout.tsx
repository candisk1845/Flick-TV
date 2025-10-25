import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlickTV - Web IPTV Player",
  description: "A modern web-based IPTV player with HLS support, channel management, and EPG",
  keywords: ["IPTV", "streaming", "HLS", "television", "web player"],
  authors: [{ name: "FlickTV" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#1f2937",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased bg-gray-900 text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
