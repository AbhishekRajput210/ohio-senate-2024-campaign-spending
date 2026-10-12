import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ohio 2024 Senate Race: Campaign Spending Analysis',
  description: "Interactive dashboard on campaign and outside spending in Ohio's 2024 U.S. Senate race (Brown vs Moreno), from FEC filings.",
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
