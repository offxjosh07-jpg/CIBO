import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CIBO — Good Food. Brighter Tomorrow.",
  description:
    "CIBO is a hyperlocal surplus-food rescue marketplace. Discover safe surplus meals from nearby events, restaurants and food businesses — at prices that make sense.",
  keywords: ["CIBO", "surplus food", "food rescue", "hyperlocal", "India", "sustainability", "affordable meals"],
  authors: [{ name: "CIBO" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "CIBO — Good Food. Brighter Tomorrow.",
    description: "Discover safe surplus meals near you at prices you'll love. Rescue · Share · Reduce.",
    siteName: "CIBO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CIBO — Good Food. Brighter Tomorrow.",
    description: "Hyperlocal surplus-food rescue marketplace.",
  },
};

export const viewport: Viewport = {
  themeColor: "#182E20",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
