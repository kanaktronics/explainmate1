
'use client';

import { useAppContext } from '@/lib/app-context';
import { ExplanationView } from '@/components/explanation-view';
import { QuizView } from '@/components/quiz-view';
import { WelcomeScreen } from '@/components/welcome-screen';
import { cn } from '@/lib/utils';

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
        return <WelcomeScreen />;
    }
  }

  return (
    <div className={cn("container mx-auto p-2 sm:p-4 md:p-6", view === 'explanation' && 'h-full flex flex-col')}>
        {renderView()}
    </div>
  );
}
