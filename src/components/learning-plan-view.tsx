
'use client';

import { ProgressEngineOutput } from '@/ai/flows/run-progress-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BookOpen, CheckSquare, Dumbbell, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useAppContext } from '@/lib/app-context';

interface LearningPlanViewProps {
  plan: ProgressEngineOutput['sevenDayPlan'];
}

const getIconForTask = (type: 'explain' | 'practice' | 'quiz') => {
  switch (type) {
    case 'explain':
      return <BookOpen className="h-5 w-5 text-blue-500" />;
    case 'practice':
      return <Dumbbell className="h-5 w-5 text-green-500" />;
    case 'quiz':
      return <CheckSquare className="h-5 w-5 text-orange-500" />;
  }
};

export function LearningPlanView({ plan }: LearningPlanViewProps) {
  const { setView, setQuizTopic, setChatTopic } = useAppContext();

  if (!plan || plan.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No learning plan available yet. Interact more to generate a plan!</p>
        </CardContent>
      </Card>
    );
  }

  const handleTaskStart = (type: 'explain' | 'practice' | 'quiz', topic: string) => {
    if (type === 'explain') {
        setChatTopic(topic);
        setView('explanation');
    } else {
        setQuizTopic(topic);
        setView('quiz');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your 7-Day Adaptive Plan</CardTitle>
        <CardDescription>A personalized plan to help you master your weak spots, one day at a time.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="day-1" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
            {plan.map((day) => (
              <TabsTrigger key={day.day} value={`day-${day.day}`}>
                Day {day.day}
              </TabsTrigger>
            ))}
          </TabsList>
          {plan.map((day) => (
            <TabsContent key={day.day} value={`day-${day.day}`} className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Day {day.day}: {day.tasks[0]?.topic || 'Review'}</CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {day.estimatedMinutes} mins
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {day.tasks.map((task, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="flex-shrink-0">{getIconForTask(task.type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold capitalize">{task.type}: <span className="font-normal text-primary">{task.topic}</span></p>
                        <p className="text-sm text-muted-foreground">{task.text}</p>
                      </div>
                       <Button size="sm" variant="outline" onClick={() => handleTaskStart(task.type, task.topic)}>Start</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
