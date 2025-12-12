
'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/lib/app-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ProgressStats } from './progress-stats';
import { LearningPlanView } from './learning-plan-view';
import { WeakTopicsView } from './weak-topics-view';
import { ScrollArea } from './ui/scroll-area';

export function ProgressView() {
  const { progressData, progressError, isProgressLoading } = useAppContext();

  if (isProgressLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-headline text-primary">Analyzing Your Progress...</h2>
        <p className="text-muted-foreground">This might take a moment.</p>
      </div>
    );
  }
  
  if (progressError) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {progressError}
          </AlertDescription>
        </Alert>
       </div>
    );
  }

  if (!progressData) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center">
        <Alert className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Enough Data</AlertTitle>
          <AlertDescription>
            We don't have enough interaction data to generate your progress report yet. Start a chat or take a quiz to get started!
          </AlertDescription>
        </Alert>
       </div>
    );
  }

  return (
    <ScrollArea className="h-full">
        <div className="container mx-auto p-4 space-y-8">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
                <h1 className="text-4xl font-headline text-primary">Your Progress Dashboard</h1>
                <p className="text-muted-foreground">A summary of your learning journey, updated automatically.</p>
            </div>
        </header>

        <ProgressStats stats={progressData} />
        
        <WeakTopicsView topics={progressData.weakTopics} />

        <LearningPlanView plan={progressData.sevenDayPlan} />

        {progressData.notes && (
            <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note from the Analyst</AlertTitle>
                <AlertDescription>{progressData.notes}</AlertDescription>
            </Alert>
        )}
        </div>
    </ScrollArea>
  );
}
