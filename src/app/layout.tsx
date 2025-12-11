
import type { Metadata } from 'next';
import './globals.css';
import 'react-katex/dist/katex.min.css';
import { ClientLayout } from '@/components/client-layout';
import { Alegreya, Belleza } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontBody = Alegreya({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = Belleza({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: 'ExplainMate AI Tutor',
  description: 'Your personal AI-powered tutor for simplifying any topic. Get step-by-step explanations, rough work, real-world examples, and quizzes.',
  metadataBase: new URL('https://explainmate.tech'),
  openGraph: {
    title: 'ExplainMate AI Tutor',
    description: 'Your personal AI-powered tutor for simplifying any topic.',
    url: 'https://explainmate.tech',
    siteName: 'ExplainMate',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ExplainMate AI Tutor Social Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExplainMate AI Tutor',
    description: 'Your personal AI-powered tutor for simplifying any topic.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('font-body antialiased', fontBody.variable, fontHeadline.variable)}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
