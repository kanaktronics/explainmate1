
'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from '@/lib/app-context';
import { ProgressEngineOutput } from '@/ai/flows/run-progress-engine';
import { runProgressEngineAction } from '@/lib/actions';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ProgressCircular } from './progress-circular';
import { ProgressStats } from './progress-stats';
import { ProgressChart } from './progress-chart';
import { LearningPlanView } from './learning-plan-view';
import { WeakTopicsView } from './weak-topics-view';
import { ScrollArea } from './ui/scroll-area';

export function ProgressView() {
  const { user, interactions, progressData, setProgressData, progressError, setProgressError, isProgressLoading, setIsProgressLoading } = useAppContext();

  const handleRefresh = async () => {
    if (!user) return;
    setIsProgressLoading(true);
    setProgressError(null);

    const result = await runProgressEngineAction({
      studentId: user.uid,
      interactions: interactions,
      languagePreference: 'en',
    });

    if (result && 'error' in result) {
      setProgressError(result.error);
    } else if (result) {
      setProgressData(result);
    }
    setIsProgressLoading(false);
  };

  useEffect(() => {
    // Fetch initial data if it doesn't exist
    if (!progressData && !isProgressLoading && user && interactions.length > 0) {
      handleRefresh();
    }
  }, [user, interactions, progressData, isProgressLoading]);


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
            <Button onClick={handleRefresh} className="mt-4">Try Again</Button>
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
             <Button onClick={handleRefresh} className="mt-4" disabled={isProgressLoading}>
                {isProgressLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Refresh
            </Button>
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
                <p className="text-muted-foreground">A summary of your learning journey.</p>
            </div>
            <Button onClick={handleRefresh} disabled={isProgressLoading}>
                {isProgressLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Refresh Progress
            </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-1 flex justify-center">
                <ProgressCircular progress={progressData.overallProgressPercent} />
            </div>
            <div className="lg:col-span-2">
                <ProgressStats stats={progressData} />
            </div>
        </div>

        <ProgressChart data={progressData.progressGrowth} />
        
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
