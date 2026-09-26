import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Бюджет VF",
  description:
    "iPhone-приложение бюджета по таблице Budget VF: расходы, зарплата, банки и сканы чеков.",
  applicationName: "Бюджет VF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Бюджет",
  },
  icons: {
    apple: "/icon-180.png",
    icon: [
      { url: "/icon-192.png", sizes: "192x192" },
      { url: "/icon-512.png", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1B4D3E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-muted font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
