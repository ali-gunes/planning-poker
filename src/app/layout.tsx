import './globals.css'
import '../styles/themes.css'
import type { Metadata } from 'next'
import { Inter, Orbitron, Space_Mono } from 'next/font/google'
import { AudioPlayer } from '@/components/AudioPlayer'
import { ClientProviders } from '@/components/ClientProviders'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap'
})

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Planning Poker',
  description: 'Real-time Planning Poker for agile teams',
  icons: {
    icon: [
      {
        url: '/favicon.png',
        href: '/favicon.png',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${spaceMono.variable}`}>
      <body>
        <ClientProviders>
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <main className="flex-grow">
              {children}
            </main>
            <footer className="w-full text-center p-4 mt-8 text-gray-500">
              C&I ekibi için ❤️ ve ☕️ ile yapıldı.
            </footer>
            {/* Hidden audio player that actually plays the audio */}
            <div className="hidden">
              <AudioPlayer isMainPlayer={true} />
            </div>
          </div>
        </ClientProviders>
      </body>
    </html>
  )
}