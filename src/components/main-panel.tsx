
'use client';

import { useAppContext } from '@/lib/app-context';
import { WelcomeScreen } from '@/components/welcome-screen';
import { ExplanationView } from '@/components/explanation-view';
import { QuizView } from '@/components/quiz-view';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppLogo } from './app-logo';
import { AboutView } from './about-view';
import { ContactView } from './contact-view';
import { ProMembershipView } from './pro-membership-view';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sparkles } from 'lucide-react';

export function MainPanel() {
  const { view, setView, studentProfile } = useAppContext();
  const isMobile = useIsMobile();

  const renderView = () => {
    switch(view) {
      case 'explanation':
        return <ExplanationView />;
      case 'quiz':
        return <QuizView />;
      case 'about':
        return <AboutView />;
      case 'contact':
        return <ContactView />;
      case 'pro-membership':
        return <ProMembershipView />;
      case 'welcome':
      default:
        return <WelcomeScreen />;
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b flex items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
         <div className='flex items-center gap-4'>
            <SidebarTrigger className="md:hidden"/>
            <div className="md:hidden">
                <AppLogo />
            </div>
         </div>
         
         <h2 className="hidden md:block text-2xl font-headline text-foreground">
            Your Personal AI Tutor
         </h2>

         {isMobile && !studentProfile.isPro && (
            <Button size="sm" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:opacity-90" onClick={() => setView('pro-membership')}>
                <Sparkles className="mr-2 h-4 w-4"/>
                Upgrade
            </Button>
         )}
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 h-full">
            {renderView()}
        </div>
      </main>
    </div>
  );
}
