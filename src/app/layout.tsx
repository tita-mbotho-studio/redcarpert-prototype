import type { Metadata } from "next";
import { siteMetadata } from "@/data/metadata";
import "./globals.css";

export const metadata: Metadata = {
  ...siteMetadata,
  icons: { icon: "/seo/cropped-logo-2-1-32x32.png", apple: "/seo/cropped-logo-2-1-180x180.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
