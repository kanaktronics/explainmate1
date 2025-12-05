
'use client';

import { useAppContext } from '@/lib/app-context';
import { ExplanationView } from '@/components/explanation-view';
import { QuizView } from '@/components/quiz-view';
import { WelcomeScreen } from '@/components/welcome-screen';

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
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 h-full">
            {renderView()}
        </div>
      </main>
    </div>
  );
}
