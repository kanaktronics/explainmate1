
'use client';

import { ProgressEngineOutput } from '@/ai/flows/run-progress-engine';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock, Target } from 'lucide-react';

interface ProgressStatsProps {
  stats: Omit<ProgressEngineOutput, 'progressGrowth' | 'weakTopics' | 'sevenDayPlan' | 'topTopics' | 'computedAt' | 'notes'>;
}

export function ProgressStats({ stats }: ProgressStatsProps) {
  const timeData = [
    { name: 'Last 7 Days', minutes: stats.minutesLast7Days },
    { name: 'All Time', minutes: stats.totalMinutesAllTime },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Spent (Last 7 Days)</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(stats.minutesLast7Days)} min</div>
          <p className="text-xs text-muted-foreground">
            vs {Math.round(stats.totalMinutesAllTime)} min all time
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.overallAccuracyPercent.toFixed(1)}%</div>
           <p className="text-xs text-muted-foreground">Based on quiz attempts</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Topics</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <ul className='text-sm text-muted-foreground list-disc pl-4'>
                {stats.topTopics.map((topic, i) => <li key={i} className='font-bold'>{topic}</li>)}
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
