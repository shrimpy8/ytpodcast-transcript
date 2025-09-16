import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YouTube Transcript Downloader',
  description: 'Download and process YouTube video transcripts with advanced deduplication, speaker detection, and multiple export formats. Perfect for podcast analysis and content research.',
  keywords: [
    'YouTube',
    'transcript',
    'download',
    'podcast',
    'speaker detection',
    'deduplication',
    'export',
    'SRT',
    'WebVTT',
    'JSON'
  ],
  authors: [{ name: 'YouTube Transcript Downloader' }],
  creator: 'YouTube Transcript Downloader',
  publisher: 'YouTube Transcript Downloader',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ytpodcast-transcript.vercel.app'),
  openGraph: {
    title: 'YouTube Transcript Downloader',
    description: 'Download and process YouTube video transcripts with advanced deduplication, speaker detection, and multiple export formats.',
    url: 'https://ytpodcast-transcript.vercel.app',
    siteName: 'YouTube Transcript Downloader',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YouTube Transcript Downloader',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Transcript Downloader',
    description: 'Download and process YouTube video transcripts with advanced deduplication, speaker detection, and multiple export formats.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}