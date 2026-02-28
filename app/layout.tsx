import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BPSR // Gear Architect',
  description: 'BPSR Gear Architect — Plan, optimize, and theorcraft your gear builds with the exact in-game math engine.',
  icons: {
    icon: [
      {
        url: 'https://icons8.com/icon/kRS0DXrl9AUk/machine',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="font-sans antialiased vc-init">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
