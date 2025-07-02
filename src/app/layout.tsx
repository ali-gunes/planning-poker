import './globals.css'
import '../styles/themes.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Planning Poker',
  description: 'Real-time Planning Poker for agile teams',
  icons: {
    icon: [
      {
        url: '/planning-poker.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/planning-poker.svg',
    apple: '/planning-poker.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <main className="flex-grow">
              {children}
            </main>
            <footer className="w-full text-center p-4 mt-8 text-gray-500">
              C&I ekibi için ❤️ ve ☕️ ile yapıldı.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}