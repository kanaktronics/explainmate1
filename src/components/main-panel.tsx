
'use client';

import React from 'react';
import { useAppContext } from '@/lib/app-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppLogo } from './app-logo';
import { Button } from './ui/button';
import { Sparkles, LogIn } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';
import { usePathname } from 'next/navigation';

export function MainPanel({ children }: { children: React.ReactNode }) {
  const { studentProfile, user } = useAppContext();
  const pathname = usePathname();

  const legalPages = [
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms-conditions',
    '/refund-policy',
    '/service-delivery-policy',
    '/pricing',
  ];

  const needsScroll = legalPages.includes(pathname);

  const ContentWrapper = needsScroll ? ScrollArea : React.Fragment;
  const contentWrapperProps = needsScroll ? { className: 'h-full' } : {};
  const innerDivClass = needsScroll ? "container mx-auto p-4 sm:p-6 md:p-8" : "h-full";

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b flex items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
         <div className='flex items-center gap-4'>
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="md:hidden">
              <Link href="/">
                <AppLogo />
              </Link>
            </div>
         </div>
         
         <h2 className="hidden md:block text-2xl font-headline text-foreground">
            Your Personal AI Tutor
         </h2>

         <div className="flex items-center gap-2">
            {user && !studentProfile.isPro && (
                <Button size="sm" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:opacity-90" asChild>
                    <Link href="/pricing">
                      <Sparkles className="mr-2 h-4 w-4"/>
                      Upgrade to Pro
                    </Link>
                </Button>
            )}
            {!user && (
                <Button size="sm" variant="outline" asChild>
                    <Link href="/auth">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                </Button>
            )}
         </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <ContentWrapper {...contentWrapperProps}>
            <div className={innerDivClass}>
                {children}
            </div>
        </ContentWrapper>
      </main>
    </div>
  );
}
