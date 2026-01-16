

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAppContext } from '@/lib/app-context';
import { getQuiz, gradeShortAnswer } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { AlertCircle, CheckCircle, Lightbulb, Loader2, MessageSquare, Mic, Pilcrow, Type, XCircle } from 'lucide-react';
import type { QuizQuestion } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const quizSetupSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  numQuestions: z.number().min(1).max(15).default(5),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
  questionType: z.enum(['Mixed', 'MCQ', 'TrueFalse', 'AssertionReason', 'FillInTheBlanks', 'ShortAnswer']).default('Mixed'),
});

type UserAnswers = { [key: number]: { selected: string; isCorrect: boolean, feedback?: string } };

// A Zod schema for a dynamic record of answers, which can be strings.
const quizAnswersSchema = z.object({
    answers: z.record(z.string()),
});

const FREE_TIER_QUIZ_LIMIT = 1;

export function QuizView() {
  const { user, studentProfile, setStudentProfile, quiz, setQuiz, isProfileComplete, incrementUsage, showAd, setView, addInteraction, quizTopic, setQuizTopic } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [showResults, setShowResults] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const { toast } = useToast();

  const setupForm = useForm<z.infer<typeof quizSetupSchema>>({
    resolver: zodResolver(quizSetupSchema),
    defaultValues: { topic: quizTopic || '', numQuestions: 5, difficulty: 'Medium', questionType: 'Mixed' },
  });

  const answersForm = useForm<z.infer<typeof quizAnswersSchema>>({
    resolver: zodResolver(quizAnswersSchema),
    defaultValues: { answers: {} },
  });

  const numQuestionsValue = setupForm.watch('numQuestions');

  useEffect(() => {
    if (quizTopic) {
      setupForm.setValue('topic', quizTopic);
      // Clear the topic so it doesn't persist on subsequent visits to the quiz page
      setQuizTopic('');
    }
  }, [quizTopic, setupForm, setQuizTopic]);


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
    if (!studentProfile.isPro && (studentProfile.dailyQuizUsage || 0) >= FREE_TIER_QUIZ_LIMIT) {
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
    answersForm.reset({ answers: {} });

    incrementUsage('quiz');
    addInteraction({ type: 'quiz_start', topic: values.topic });


    const input = {
      topic: values.topic,
      numQuestions: studentProfile.isPro ? values.numQuestions : 5,
      studentProfile: studentProfile,
      difficulty: studentProfile.isPro ? values.difficulty : 'Medium',
      questionType: studentProfile.isPro ? values.questionType : 'Mixed',
    };

    const result = await getQuiz(input as any);
    if (result && 'error' in result) {
      let friendlyError = 'An unexpected error occurred. Please try again.';
       switch (result.error) {
         case 'DAILY_LIMIT_REACHED':
           showAd({
             title: "Daily Quiz Limit Reached",
             description: "You've used your free quiz for today. Upgrade to Pro for unlimited quizzes."
           });
           break;
        case 'PRO_RATE_LIMIT':
          friendlyError = "It looks like you're sending requests faster than normal learning activity. To protect ExplainMate and ensure fair usage for everyone, we've temporarily paused your requests. Please wait a moment and try again.";
          break;
        case 'PRO_DAILY_LIMIT':
          friendlyError = "You're learning really fast! To keep ExplainMate running smoothly for everyone, we slow things down after extremely long study sessions. Please take a short break and try again a little later. If you feel you reached this limit by mistake, or you genuinely need more usage today, please contact ExplainMate Support.";
          break;
        case 'ACCOUNT_BLOCKED':
          friendlyError = "Your account is currently on hold due to unusual activity. If you believe this is a mistake, please contact ExplainMate Support.";
          break;
         default:
           friendlyError = result.error;
           break;
       }
       if(result.error !== 'DAILY_LIMIT_REACHED') {
          setError(friendlyError);
       }
    } else if (result) {
      setQuiz(result);
    } else {
      setError("An unexpected error occurred and the AI did not return a response.");
    }
    setIsLoading(false);
  }

  const checkAnswers = async (data: z.infer<typeof quizAnswersSchema>) => {
    if (!quiz) return;
    
    setIsGrading(true);
    let score = 0;
    const answered = data.answers;
    const evaluatedAnswers: UserAnswers = {};
    const shortAnswerPromises: Promise<void>[] = [];

    quiz.quiz.forEach((q, index) => {
        const selected = answered[String(index)];
        if (selected !== undefined) {
            let isCorrect: boolean;
            let feedback: string | undefined;

            if (q.type === 'ShortAnswer') {
                const promise = gradeShortAnswer({
                    question: q.question || '',
                    userAnswer: selected,
                    modelAnswer: q.correctAnswer
                }).then(gradingResult => {
                    if (gradingResult && !('error' in gradingResult)) {
                        isCorrect = gradingResult.isCorrect;
                        feedback = gradingResult.feedback;
                        if (isCorrect) score++;
                        evaluatedAnswers[index] = { selected, isCorrect, feedback };
                    } else {
                        // Fallback or error handling
                        isCorrect = false;
                        feedback = "Could not grade this answer automatically.";
                        evaluatedAnswers[index] = { selected, isCorrect, feedback };
                    }
                     const interactionPayload = {
                        correct: isCorrect,
                        question: q.question,
                        userAnswer: selected,
                        correctAnswer: q.correctAnswer,
                        feedback
                    };
                    addInteraction({ type: 'quiz_answer', topic: setupForm.getValues('topic'), payload: interactionPayload });
                });
                shortAnswerPromises.push(promise);
            } else {
                 // Case-insensitive comparison for fill-in-the-blanks
                if (q.type === 'FillInTheBlanks') {
                    isCorrect = selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                } else {
                    isCorrect = selected === q.correctAnswer;
                }
                
                if (isCorrect) score++;
                evaluatedAnswers[index] = { selected, isCorrect };

                 const interactionPayload = {
                    correct: isCorrect,
                    question: q.question || `${q.assertion} ${q.reason}`,
                    userAnswer: selected,
                    correctAnswer: q.correctAnswer,
                };
                addInteraction({ type: 'quiz_answer', topic: setupForm.getValues('topic'), payload: interactionPayload });
            }
        }
    });

    await Promise.all(shortAnswerPromises);
    
    setUserAnswers(evaluatedAnswers);
    setShowResults(true);
    setIsGrading(false);
    toast({
        title: "Quiz Finished!",
        description: `You scored ${score} out of ${quiz.quiz.length}.`
    })
  };
  
  const score = Object.values(userAnswers).filter(a => a.isCorrect).length;
  const answeredQuestions = Object.keys(answersForm.watch('answers') || {}).filter(key => !!answersForm.watch('answers')[key]).length;
  const progress = quiz ? (answeredQuestions / quiz.quiz.length) * 100 : 0;

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Heads up!</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

  if (!quiz) {
    return (
      <div className='p-4'>
        <Card className="max-w-lg mx-auto">
            <CardHeader>
            <CardTitle className="font-headline text-2xl">Create a New Quiz</CardTitle>
            <CardDescription>Enter a topic to test your knowledge. Free users get 1 quiz per day.</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...setupForm}>
                <form onSubmit={setupForm.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={setupForm.control}
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
                        control={setupForm.control}
                        name="questionType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Question Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a question type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Mixed">Mixed</SelectItem>
                                    <SelectItem value="MCQ">Multiple Choice</SelectItem>
                                    <SelectItem value="TrueFalse">True / False</SelectItem>
                                    <SelectItem value="AssertionReason">Assertion / Reason</SelectItem>
                                    <SelectItem value="FillInTheBlanks">Fill in the Blanks</SelectItem>
                                    <SelectItem value="ShortAnswer">Short Answer</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                    control={setupForm.control}
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
                        control={setupForm.control}
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
        <div className='py-4 bg-background/80 backdrop-blur-sm z-10 sticky top-0'>
          <h2 className="text-3xl font-headline text-center mb-2">Quiz: {setupForm.getValues('topic')}</h2>
          {showResults && <h3 className="text-xl font-semibold text-center text-primary">Your Score: {score}/{quiz.quiz.length}</h3>}
          {!showResults && <Progress value={progress} className="w-full max-w-2xl mx-auto" />}
        </div>
        <Form {...answersForm}>
            <form onSubmit={answersForm.handleSubmit(checkAnswers)} className="space-y-8">
              {quiz.quiz.map((q, index) => (
                <QuizCard 
                    key={index} 
                    q={q} 
                    index={index} 
                    userAnswer={userAnswers[index]} 
                    showResult={showResults}
                    control={answersForm.control}
                    disabled={showResults || isGrading}
                />
              ))}
              <div className="flex justify-center gap-4">
                {!showResults ? (
                    <Button type="submit" disabled={answeredQuestions !== quiz.quiz.length || isGrading}>
                        {isGrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isGrading ? 'Grading...' : 'Check Answers'}
                    </Button>
                ) : (
                    <Button onClick={() => { setQuiz(null); setQuizTopic(''); setupForm.reset({ topic: '', numQuestions: 5, difficulty: 'Medium', questionType: 'Mixed' }); }}>Try Another Quiz</Button>
                )}
              </div>
            </form>
        </Form>
    </div>
  );
}

function McqInput({ index, question, control, disabled, showResult, userAnswer }: { index: number; question: QuizQuestion; control: any; disabled: boolean; showResult: boolean; userAnswer: UserAnswers[number] | undefined; }) {
    
    const options = question.options || [];

    return (
        <FormField
            control={control}
            name={`answers.${index}`}
            defaultValue=""
            render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} disabled={disabled}>
                            {options.map((option, i) => {
                                const isSelected = field.value === option;
                                const isCorrectAnswer = question.correctAnswer === option;
                                
                                return (
                                    <FormItem key={i} className={cn("flex items-center space-x-3 space-y-0 p-3 rounded-md border transition-colors", showResult && isCorrectAnswer && "bg-green-500/10", showResult && isSelected && !isCorrectAnswer && "bg-red-500/10")}>
                                        <FormControl><RadioGroupItem value={option} /></FormControl>
                                        <FormLabel className={cn("font-normal flex-1", showResult && isCorrectAnswer && "text-green-700 dark:text-green-400", showResult && isSelected && !isCorrectAnswer && "text-red-700 dark:text-red-400")}>
                                            <ReactMarkdown components={{p: React.Fragment}} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                {option}
                                            </ReactMarkdown>
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
    );
}

function FillInTheBlanksInput({ index, question, control, disabled }: { index: number; question: QuizQuestion; control: any; disabled: boolean; }) {
    return (
        <FormField
            control={control}
            name={`answers.${index}`}
            defaultValue=""
            render={({ field }) => (
                <FormItem>
                     <div className="text-lg mb-4 prose dark:prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{question.question?.replace('___', '______')}</ReactMarkdown></div>
                    <FormControl>
                        <Input {...field} placeholder="Type your answer here" disabled={disabled} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function ShortAnswerInput({ index, control, question, disabled }: { index: number; control: any; question: QuizQuestion; disabled: boolean; }) {
    return (
        <FormField
            control={control}
            name={`answers.${index}`}
            defaultValue=""
            render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <Textarea {...field} placeholder="Type your answer here (2-3 lines)..." disabled={disabled} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

const getQuestionTypeIcon = (type: QuizQuestion['type']) => {
    switch (type) {
        case 'MCQ': return <Pilcrow />;
        case 'TrueFalse': return <Type />;
        case 'AssertionReason': return <MessageSquare />;
        case 'FillInTheBlanks': return <Pilcrow />;
        case 'ShortAnswer': return <MessageSquare />;
        default: return <Lightbulb />;
    }
}

const QuizCard = ({ q, index, userAnswer, showResult, control, disabled }: { q: QuizQuestion, index: number, userAnswer: UserAnswers[number] | undefined, showResult: boolean, control: any, disabled: boolean }) => {
    const isCorrect = userAnswer?.isCorrect;

    const renderQuestionInput = () => {
        // Gracefully handle malformed MCQs from the AI by treating them as Short Answer questions.
        if (q.type === 'MCQ' && (!q.options || q.options.length === 0)) {
            return <ShortAnswerInput question={q} control={control} disabled={disabled} index={index} />;
        }
        
        switch (q.type) {
            case 'MCQ':
            case 'TrueFalse':
            case 'AssertionReason':
                return <McqInput question={q} control={control} disabled={disabled} showResult={showResult} userAnswer={userAnswer} index={index} />;
            case 'FillInTheBlanks':
                return <FillInTheBlanksInput question={q} control={control} disabled={disabled} index={index} />;
            case 'ShortAnswer':
                return <ShortAnswerInput question={q} control={control} disabled={disabled} index={index} />;
            default:
                return <p>Unsupported question type</p>;
        }
    }
    
    return (
        <Card className={cn(showResult && (isCorrect ? 'border-green-500' : 'border-red-500'))}>
          <CardHeader>
            <CardTitle className="flex items-start gap-3">
              <span className="text-primary font-bold">{index + 1}.</span>
              <div className='flex-1 prose dark:prose-invert max-w-none prose-p:my-2'>
                {q.type === 'AssertionReason' ? (
                    <>
                        <ReactMarkdown components={{p: React.Fragment}} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`**Assertion (A):** ${q.assertion || ''}`}</ReactMarkdown>
                        <br/>
                        <ReactMarkdown components={{p: React.Fragment}} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`**Reason (R):** ${q.reason || ''}`}</ReactMarkdown>
                    </>
                ) : (
                   <ReactMarkdown components={{p: React.Fragment}} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.question}</ReactMarkdown>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderQuestionInput()}
          </CardContent>
          {showResult && (
            <CardFooter>
                <Alert variant={isCorrect ? 'default' : 'destructive'} className={cn(isCorrect ? 'bg-green-500/10 border-green-500/50' : '')}>
                    <AlertTitle className='flex items-center gap-2'>
                        {isCorrect ? <CheckCircle /> : <XCircle />} 
                        {isCorrect ? 'Correct!' : (q.type === 'ShortAnswer' ? 'Evaluation' : 'Correct Answer')}
                    </AlertTitle>
                    <AlertDescription>
                        {userAnswer?.feedback ? (
                            <p>{userAnswer.feedback}</p>
                        ) : (
                           <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown components={{p: React.Fragment}} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`**${q.correctAnswer}**`}</ReactMarkdown>
                                <ReactMarkdown components={{p: React.Fragment}} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`${q.explanation}`}</ReactMarkdown>
                           </div>
                        )}
                    </AlertDescription>
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
