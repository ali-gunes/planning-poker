import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

// Re-triggering CSS build
const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "C&I Planlama Pokeri",
  description: "Gerçek zamanlı planlama pokeri uygulaması",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>{children}</body>
    </html>
  );
}
