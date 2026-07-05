import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QuestXLM - Learn to Earn on Stellar',
  description: 'Decentralized learn-to-earn protocol where users earn XLM for completing verified educational modules about Stellar and blockchain technology.',
  keywords: 'Stellar, Soroban, Blockchain, Education, Learn-to-Earn, XLM, DeFi, Smart Contracts',
  authors: [{ name: 'QuestXLM Team' }],
  creator: 'QuestXLM',
  publisher: 'QuestXLM',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://questxlm.org'),
  openGraph: {
    title: 'QuestXLM - Learn to Earn on Stellar',
    description: 'Earn XLM while learning about Stellar and blockchain technology. Complete educational modules, take quizzes, and build your reputation in the ecosystem.',
    url: 'https://questxlm.org',
    siteName: 'QuestXLM',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QuestXLM - Learn to Earn on Stellar',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuestXLM - Learn to Earn on Stellar',
    description: 'Earn XLM while learning about Stellar and blockchain technology.',
    creator: '@QuestXLM',
    images: ['/twitter-image.png'],
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
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}