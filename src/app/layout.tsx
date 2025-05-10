import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'India-Pakistan Monitor | Bloomberg-Style News',
  description: 'Latest updates on the India-Pakistan situation, bringing you news from Google and Twitter in real-time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  )
}
