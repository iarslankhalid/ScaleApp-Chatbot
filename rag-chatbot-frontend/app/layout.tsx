import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RAG Chatbot Tester',
  description: 'Test your RAG chatbot with Pinecone and OpenAI integration',
  keywords: ['RAG', 'chatbot', 'AI', 'Pinecone', 'OpenAI', 'NestJS'],
  authors: [{ name: 'RAG Chatbot Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  )
}