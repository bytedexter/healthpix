import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HealthPix Admin Dashboard',
  description: 'Admin dashboard for managing orders and inventory',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
