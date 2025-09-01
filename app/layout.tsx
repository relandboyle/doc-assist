import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { FooterWrapper } from "@/components/footer-wrapper";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Document Template Manager",
  description: "Create and manage professional document templates",
  generator: "v0.app",
  icons: {
    icon: "/icon.png",
  },
};

const bodyStyles = {
  display: "flex",
  FlexDirection: "column",
  justifyItems: "center",
  alignItems: "center",
  width: "100vw",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <Providers>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
            >
              <div className="min-h-screen flex flex-col transition-colors duration-300">
                {children}
                <FooterWrapper />
              </div>
            </ThemeProvider>
          </Providers>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
