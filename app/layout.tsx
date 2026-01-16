import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InstallPWA from "@/components/InstallPWA";
import UpdateNotification from "@/components/UpdateNotification";
import { AppEnvironmentProvider } from "@/components/providers";
import { LayoutSwitcher } from "@/components/LayoutSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FAIR - Reliable and Verifiable",
  description: "Creating a space where every decision and process is transparent, accountable, and trustworthy. Integrity built in from start to finish.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fair App",
  },
};

export const viewport = {
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8FAFC]`}>
        <AppEnvironmentProvider>
          <LayoutSwitcher>
            {children}
          </LayoutSwitcher>
          <InstallPWA />
          <UpdateNotification />
        </AppEnvironmentProvider>
      </body>
    </html>
  );
}

