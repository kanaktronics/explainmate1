
'use client';

import { ProgressEngineOutput } from '@/ai/flows/run-progress-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';

interface WeakTopicsViewProps {
  topics: ProgressEngineOutput['weakTopics'];
}

export function WeakTopicsView({ topics }: WeakTopicsViewProps) {
  if (!topics || topics.length === 0) {
    return null; // Or a message saying "No weak topics identified!"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Areas for Improvement</CardTitle>
        <CardDescription>Here are a few topics where you could focus your efforts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topics.map((topic, index) => (
          <div key={index} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                 <AlertTriangle className="h-5 w-5 text-destructive" />
                 <h4 className="font-semibold text-lg">{topic.topic}</h4>
              </div>
              <p className="text-sm text-muted-foreground ml-7">{topic.suggestion}</p>
            </div>
             <div className='flex items-center gap-4 ml-7 md:ml-0'>
                <Badge variant="destructive">Accuracy: {topic.accuracy.toFixed(0)}%</Badge>
                <Button size="sm">Practice Topic</Button>
             </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
