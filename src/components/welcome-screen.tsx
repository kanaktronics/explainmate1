'use client';

import { useAppContext } from '@/lib/app-context';
import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';

export function WelcomeScreen() {
  const { studentProfile, setView, isProfileComplete } = useAppContext();
  const [name, setName] = useState('');

  useEffect(() => {
    setName(studentProfile.name);
  }, [studentProfile.name]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl md:text-5xl font-headline text-primary">
        {name ? `Welcome back, ${name}!` : "Welcome to ExplainMate!"}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Your personal AI tutor, ready to help you understand any topic. What would you like to do today?
      </p>
      
      {!isProfileComplete && (
         <Alert className="mt-8 max-w-lg text-left">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Complete Your Profile!</AlertTitle>
            <AlertDescription>
                For the best experience, please fill out your profile in the sidebar. This helps the AI tailor explanations just for you.
            </AlertDescription>
         </Alert>
      )}

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Card className="hover:shadow-lg hover:border-primary/50 transition-all">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <BookOpen className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-headline mb-2">Get an Explanation</h3>
            <p className="text-muted-foreground mb-6">
              Ask about any topic and get a detailed, personalized breakdown.
            </p>
            <Button onClick={() => setView('explanation')} className="w-full">Start Learning</Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg hover:border-primary/50 transition-all">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <HelpCircle className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-headline mb-2">Take a Quiz</h3>
            <p className="text-muted-foreground mb-6">
              Test your knowledge with an interactive, AI-generated quiz.
            </p>
            <Button onClick={() => setView('quiz')} className="w-full">Start Quiz</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
