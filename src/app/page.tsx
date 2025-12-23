
'use client';

import { useAppContext } from '@/lib/app-context';
import { ExplanationView } from '@/components/explanation-view';
import { QuizView } from '@/components/quiz-view';
import { WelcomeScreen } from '@/components/welcome-screen';
import { TeacherCompanionView } from '@/components/teacher-companion-view';
import { ExamPrepView } from '@/components/exam-prep-view';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit } from 'lucide-react';

function MainLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="relative mb-4">
            <div className="bg-primary p-4 rounded-lg animate-pulse">
                <BrainCircuit className="text-primary-foreground h-12 w-12" />
            </div>
        </div>
        <h2 className="text-2xl font-headline text-primary">Loading Your Learning Space...</h2>
        <p className="text-muted-foreground">Please wait a moment.</p>
    </div>
  );
}


export default function Home() {
  const { view, isUserLoading } = useAppContext();
  
  if (isUserLoading) {
    return <MainLoadingSkeleton />;
  }
  
  const renderView = () => {
    switch(view) {
      case 'explanation':
        return <ExplanationView />;
      case 'quiz':
        return (
          <ScrollArea className="h-full">
            <div className={cn("container mx-auto p-2 sm:p-4 md:p-6")}>
                <QuizView />
            </div>
          </ScrollArea>
        );
      case 'teacher-companion':
        return <TeacherCompanionView />;
      case 'exam-prep':
        return <ExamPrepView />;
      case 'welcome':
      default:
        return <ExplanationView />;
    }
  }

  return (
      <div className={cn("h-full")}>
        {renderView()}
      </div>
  );
}
