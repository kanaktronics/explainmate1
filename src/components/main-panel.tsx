
'use client';

import { useAppContext } from '@/lib/app-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppLogo } from './app-logo';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sparkles, LogIn } from 'lucide-react';
import Link from 'next/link';

export function MainPanel({ children }: { children: React.ReactNode }) {
  const { studentProfile, user } = useAppContext();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b flex items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
         <div className='flex items-center gap-4'>
            <SidebarTrigger className="md:hidden"/>
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
            {isMobile && user && !studentProfile.isPro && (
                <Button size="sm" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:opacity-90" asChild>
                    <Link href="/pricing">
                      <Sparkles className="mr-2 h-4 w-4"/>
                      Upgrade
                    </Link>
                </Button>
            )}
            {isMobile && !user && (
                <Button size="sm" variant="outline" asChild>
                    <Link href="/auth">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                </Button>
            )}
         </div>
      </header>
      {children}
    </div>
  );
}
