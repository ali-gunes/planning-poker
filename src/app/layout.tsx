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
    <html lang="tr">
      <body className={`${roboto.className} bg-gray-900 text-white`}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            {children}
          </main>
          <footer className="w-full text-center p-4 mt-8 text-gray-500">
            C&I ekibi için ❤️ ve ☕️ ile yapıldı.
          </footer>
        </div>
      </body>
    </html>
  );
}
