
'use client';

import { useAppContext } from '@/lib/app-context';
import { ExplanationView } from '@/components/explanation-view';
import { QuizView } from '@/components/quiz-view';
import { WelcomeScreen } from '@/components/welcome-screen';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Home() {
  const { view } = useAppContext();
  
  const renderView = () => {
    switch(view) {
      case 'explanation':
        return <ExplanationView />;
      case 'quiz':
        return <QuizView />;
      case 'welcome':
      default:
        // Welcome is part of ExplanationView now, but we keep this for routing logic
        return <ExplanationView />;
    }
  }

  if (view === 'explanation' || view === 'welcome') {
    return (
       <div className={cn("h-full")}>
          <ExplanationView />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className={cn("container mx-auto p-2 sm:p-4 md:p-6")}>
          {renderView()}
      </div>
    </ScrollArea>
  );
}
