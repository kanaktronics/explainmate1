
'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, Clock, Target } from 'lucide-react';
import { useAppContext } from '@/lib/app-context';

export function ProgressStats() {
  const { weeklyTimeSpent, progressData } = useAppContext();

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Spent (Last 7 Days)</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(weeklyTimeSpent)}</div>
          <p className="text-xs text-muted-foreground">
            Total time app has been open.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progressData?.overallAccuracyPercent.toFixed(1) ?? '...'}%</div>
           <p className="text-xs text-muted-foreground">Based on quiz attempts</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Topics</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {progressData?.topTopics && progressData.topTopics.length > 0 ? (
            <ul className='text-sm text-muted-foreground list-disc pl-4'>
                {progressData.topTopics.map((topic, i) => <li key={i} className='font-bold'>{topic}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No topics studied yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
