
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAppContext } from '@/lib/app-context';
import { getQuiz } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { QuizQuestion } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';

const quizSetupSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  numQuestions: z.number().min(1).max(15).default(5),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
});

type UserAnswers = { [key: number]: { selected: string; isCorrect: boolean } };

export function QuizView() {
  const { user, studentProfile, quiz, setQuiz, isProfileComplete, incrementUsage, showAd, setView } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof quizSetupSchema>>({
    resolver: zodResolver(quizSetupSchema),
    defaultValues: { topic: '', numQuestions: 5, difficulty: 'Medium' },
  });

  const numQuestionsValue = form.watch('numQuestions');

  async function onSubmit(values: z.infer<typeof quizSetupSchema>) {
    if (!user) {
        setView('auth');
        toast({ title: 'Login Required', description: 'Please sign in to start a new quiz.' });
        return;
    }
    if (!isProfileComplete) {
      toast({
        variant: 'destructive',
        title: 'Profile Incomplete',
        description: 'Please complete your student profile for a tailored quiz.',
      });
      return;
    }

    if (!studentProfile.isPro && (studentProfile.dailyQuizUsage || 0) >= 1) {
        showAd({
            title: "Daily Quiz Limit Reached",
            description: "You've used your free quiz for today. Upgrade to Pro for unlimited quizzes."
        });
        return;
    }

    setIsLoading(true);
    setError(null);
    setQuiz(null);
    setUserAnswers({});
    setShowResults(false);

    if (!studentProfile.isPro) {
        incrementUsage('quiz');
    }

    const input = {
      topic: values.topic,
      studentProfile: studentProfile,
      numQuestions: studentProfile.isPro ? values.numQuestions : 5,
      difficulty: studentProfile.isPro ? values.difficulty : 'Medium',
    };

    const result = await getQuiz(input as any);
    if (result && 'error' in result) {
      if (result.error === 'DAILY_LIMIT_REACHED') {
         showAd({
            title: "Daily Quiz Limit Reached",
            description: "You've used your free quiz for today. Upgrade to Pro for unlimited quizzes."
        });
      } else {
        setError(result.error);
      }
    } else if (result) {
      setQuiz(result);
    } else {
      setError("An unexpected error occurred and the AI did not return a response.");
    }
    setIsLoading(false);
  }

  const handleAnswerChange = (questionIndex: number, selectedOption: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: { selected: selectedOption, isCorrect: false } }));
  };

  const checkAnswers = () => {
    if (!quiz) return;
    let score = 0;
    const updatedAnswers = { ...userAnswers };
    quiz.quiz.forEach((q, index) => {
        if(updatedAnswers[index]?.selected === q.correctAnswer) {
            updatedAnswers[index].isCorrect = true;
            score++;
        }
    });
    setUserAnswers(updatedAnswers);
    setShowResults(true);
    toast({
        title: "Quiz Finished!",
        description: `You scored ${score} out of ${quiz.quiz.length}.`
    })
  };
  
  const score = Object.values(userAnswers).filter(a => a.isCorrect).length;
  const progress = quiz ? (Object.keys(userAnswers).length / quiz.quiz.length) * 100 : 0;

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

  if (!quiz) {
    return (
      <div className='p-4'>
        <Card className="max-w-lg mx-auto">
            <CardHeader>
            <CardTitle className="font-headline text-2xl">Create a New Quiz</CardTitle>
            <CardDescription>Enter a topic to test your knowledge. Free users get 1 quiz per day.</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., The Solar System" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {studentProfile.isPro && (
                    <>
                    <FormField
                    control={form.control}
                    name="numQuestions"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Number of Questions: {numQuestionsValue}</FormLabel>
                        <FormControl>
                            <Slider
                            min={1}
                            max={15}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Difficulty</FormLabel>
                            <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                            >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="Easy" /></FormControl>
                                    <FormLabel className="font-normal">Easy</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="Medium" /></FormControl>
                                    <FormLabel className="font-normal">Medium</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="Hard" /></FormControl>
                                    <FormLabel className="font-normal">Hard</FormLabel>
                                </FormItem>
                            </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </>
                )}
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Generating Quiz...' : 'Start Quiz'}
                </Button>
                </form>
            </Form>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
        <div className='py-4 bg-background/80 backdrop-blur-sm z-10'>
          <h2 className="text-3xl font-headline text-center mb-2">Quiz: {form.getValues('topic')}</h2>
          {showResults && <h3 className="text-xl font-semibold text-center text-primary">Your Score: {score}/{quiz.quiz.length}</h3>}
          {!showResults && <Progress value={progress} className="w-full max-w-2xl mx-auto" />}
        </div>
      {quiz.quiz.map((q, index) => (
        <QuizCard 
            key={index} 
            q={q} 
            index={index} 
            userAnswer={userAnswers[index]} 
            onAnswerChange={handleAnswerChange}
            showResult={showResults}
        />
      ))}
      <div className="flex justify-center gap-4">
        {!showResults ? (
             <Button onClick={checkAnswers} disabled={Object.keys(userAnswers).length !== quiz.quiz.length}>Check Answers</Button>
        ) : (
            <Button onClick={() => { setQuiz(null); form.reset({ topic: '', numQuestions: 5, difficulty: 'Medium' }); }}>Try Another Quiz</Button>
        )}
      </div>
    </div>
  );
}

const QuizCard = ({ q, index, userAnswer, onAnswerChange, showResult }: { q: QuizQuestion, index: number, userAnswer: {selected: string, isCorrect: boolean} | undefined, onAnswerChange: (index: number, option: string) => void, showResult: boolean }) => {
    const isAnswered = !!userAnswer;
    const isCorrect = isAnswered && userAnswer.isCorrect;
    const selected = isAnswered && userAnswer.selected;
    
    // Each QuizCard is its own form now
    const form = useForm();

    return (
        <Card key={index} className={`${showResult && isAnswered ? (isCorrect ? 'border-green-500' : 'border-red-500') : ''}`}>
          <Form {...form}>
            <form>
              <CardHeader>
                <CardTitle>{index + 1}. {q.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name={`question_${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup onValueChange={(value) => onAnswerChange(index, value)} disabled={showResult} value={selected || ''}>
                          {q.options.map((option, i) => {
                            const isSelected = selected === option;
                            const isCorrectAnswer = q.correctAnswer === option;
                            
                            let indicatorClass = "";
                            if (showResult && isCorrectAnswer) indicatorClass = "text-green-500";
                            if (showResult && isSelected && !isCorrectAnswer) indicatorClass = "text-red-500";

                            return (
                              <FormItem key={i} className={`flex items-center space-x-3 space-y-0 p-3 rounded-md border transition-colors ${showResult && isCorrectAnswer ? 'bg-green-500/10' : ''} ${showResult && isSelected && !isCorrectAnswer ? 'bg-red-500/10' : ''}`}>
                                <FormControl>
                                  <RadioGroupItem value={option} />
                                </FormControl>
                                <FormLabel className={`font-normal flex-1 ${indicatorClass}`}>
                                  {option}
                                </FormLabel>
                                {showResult && isCorrectAnswer && <CheckCircle className="text-green-500" />}
                                {showResult && isSelected && !isCorrectAnswer && <XCircle className="text-red-500" />}
                              </FormItem>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </form>
          </Form>
          {showResult && (
            <CardFooter>
                <Alert variant={isCorrect ? 'default' : 'destructive'} className={`${isCorrect ? 'bg-green-500/10 border-green-500/50' : ''}`}>
                    <AlertTitle className='flex items-center gap-2'>{isCorrect ? <CheckCircle /> : <XCircle />} Correct Answer</AlertTitle>
                    <AlertDescription>{q.explanation}</AlertDescription>
                </Alert>
            </CardFooter>
          )}
        </Card>
    );
};

const LoadingSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-10 w-1/3 mx-auto" />
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);
