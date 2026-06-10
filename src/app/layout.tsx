import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '팬 굿즈 도안 생성',
  description: 'AI로 쉽고 빠르게 팬 굿즈 도안을 만들어보세요.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  )
}
