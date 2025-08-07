import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shortener - Clean URL Management",
  description: "Simple, fast, and beautiful way to manage your shortened URLs. Clean and minimal design for everyone.",
  keywords: "url shortener, link management, short links, url redirect",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`}>
      <head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} bg-gray-50/50 min-h-screen antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
          {children}
        </div>
      </body>
    </html>
  );
}
