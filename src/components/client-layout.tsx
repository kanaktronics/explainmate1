
'use client';

import { FirebaseClientProvider } from '@/firebase';
import { AppProvider } from '@/lib/app-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppProvider>
        <SidebarProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </SidebarProvider>
        <Toaster />
      </AppProvider>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </FirebaseClientProvider>
  );
}
