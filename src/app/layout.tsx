
import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from '@/components/client-layout';
import { Alegreya, Belleza } from 'next/font/google';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const fontBody = Alegreya({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = Belleza({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-headline',
});

const socialImage = PlaceHolderImages.find(p => p.id === 'social-share');

export const metadata: Metadata = {
  title: 'ExplainMate AI Tutor',
  description: 'Your personal AI-powered tutor for simplifying any topic. Get step-by-step explanations, rough work, real-world examples, and quizzes.',
  metadataBase: new URL('https://explainmate.ai'),
  openGraph: {
    title: 'ExplainMate AI Tutor',
    description: 'Your personal AI-powered tutor for simplifying any topic.',
    url: 'https://explainmate.ai',
    siteName: 'ExplainMate',
    images: [
      {
        url: socialImage?.imageUrl || 'https://picsum.photos/seed/social-share/1200/630',
        width: 1200,
        height: 630,
        alt: 'ExplainMate AI Tutor',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExplainMate AI Tutor',
    description: 'Your personal AI-powered tutor for simplifying any topic.',
    images: [socialImage?.imageUrl || 'https://picsum.photos/seed/social-share/1200/630'],
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
