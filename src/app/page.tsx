
'use client';

import { useAppContext } from '@/lib/app-context';
import { ExplanationView } from '@/components/explanation-view';
import { QuizView } from '@/components/quiz-view';
import { WelcomeScreen } from '@/components/welcome-screen';
import { TeacherCompanionView } from '@/components/teacher-companion-view';
import { ExamPrepView } from '@/components/exam-prep-view';
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
      case 'teacher-companion':
        return <TeacherCompanionView />;
      case 'exam-prep':
        return <ExamPrepView />;
      case 'welcome':
      default:
        return <ExplanationView />;
    }
  }

  if (['explanation', 'welcome', 'teacher-companion', 'exam-prep'].includes(view)) {
    return (
       <div className={cn("h-full")}>
          {renderView()}
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
