
import type { Metadata } from 'next';
import './globals.css';
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
  description: 'Your personal AI-powered tutor',
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
