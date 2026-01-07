
'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Clock, CheckCircle } from 'lucide-react';
import { useAppContext } from '@/lib/app-context';
import { Badge } from './ui/badge';

export function ProgressStats() {
  const { weeklyTimeSpent, progressData } = useAppContext();

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Spent (7 days)</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(weeklyTimeSpent)}</div>
          <p className="text-xs text-muted-foreground">
            Total active time this week
          </p>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Topics</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap gap-2">
                {progressData?.topTopics && progressData.topTopics.length > 0 ? (
                    progressData.topTopics.slice(0, 3).map((topic, i) => <Badge key={i} variant="secondary">{topic}</Badge>)
                ) : (
                    <p className="text-sm text-muted-foreground">No topics studied yet.</p>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
