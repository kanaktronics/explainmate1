
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Loader2, BookOpen, CheckSquare, Dumbbell, Clock, Download, ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/lib/app-context';
import { generateExamPlan, getSubjectTopics } from '@/lib/actions';
import { GenerateExamPlanOutput } from '@/ai/flows/generate-exam-plan';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import ReactMarkdown from 'react-markdown';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { SubjectTopics } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

const examPrepSchema = z.object({
  subject: z.string().min(1, { message: 'Please select a subject.' }),
  otherSubject: z.string().optional(),
  topics: z.array(z.string()).refine(value => value.length > 0, {
    message: 'You must select at least one topic.',
  }),
  examDate: z.date({
    required_error: 'Exam date is required.',
  }),
}).refine(data => {
    if (data.subject === 'Other' && !data.otherSubject) {
        return false;
    }
    return true;
}, {
    message: 'Please specify the subject.',
    path: ['otherSubject'],
});

const getIconForTask = (type: 'explanation' | 'quiz' | 'revision' | 'practice') => {
    switch (type) {
        case 'explanation': return <BookOpen className="h-5 w-5 text-blue-500" />;
        case 'quiz': return <CheckSquare className="h-5 w-5 text-orange-500" />;
        case 'practice': return <Dumbbell className="h-5 w-5 text-green-500" />;
        case 'revision': return <BookOpen className="h-5 w-5 text-purple-500" />;
    }
};

const subjects = ['Science', 'Maths', 'English', 'Hindi', 'Social Science', 'GK', 'Other'];

function Step1_SelectSubjectAndDate({ onNext, form }: { onNext: () => void, form: any }) {
    const subjectValue = form.watch('subject');
    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-headline">Exam Prep Mode</CardTitle>
                <CardDescription>
                    Select your subject and exam date to get started.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {subjectValue === 'Other' && (
                     <FormField
                        control={form.control}
                        name="otherSubject"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Please specify subject</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Computer Science" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="examDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Exam Date</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={'outline'}
                                className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                                )}
                            >
                                {field.value ? (
                                format(field.value, 'PPP')
                                ) : (
                                <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button onClick={onNext} className="w-full">
                    Next: Select Topics
                </Button>
            </CardContent>
        </Card>
    );
}

function Step2_SelectTopics({ onBack, form, setStep }: { onBack: () => void, form: any, setStep: any }) {
    const [topicsData, setTopicsData] = useState<SubjectTopics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { studentProfile } = useAppContext();
    const { toast } = useToast();

    const selectedSubject = form.watch('subject') === 'Other' ? form.watch('otherSubject') : form.watch('subject');

    useState(() => {
        const fetchTopics = async () => {
            setIsLoading(true);
            setError(null);
            const result = await getSubjectTopics({
                subject: selectedSubject,
                classLevel: studentProfile.classLevel,
                board: studentProfile.board,
            });
            if ('error' in result) {
                setError(result.error);
                toast({ variant: 'destructive', title: 'Could not fetch topics', description: result.error });
            } else {
                setTopicsData(result);
            }
            setIsLoading(false);
        };
        fetchTopics();
    });

    const isAllSelected = (groupTopics: string[]) => {
        const selected = form.watch('topics') || [];
        return groupTopics.every(topic => selected.includes(topic));
    }

    const handleSelectAll = (groupTopics: string[]) => {
        const selected = form.watch('topics') || [];
        const newSelected = [...new Set([...selected, ...groupTopics])];
        form.setValue('topics', newSelected);
    }

    const handleDeselectAll = (groupTopics: string[]) => {
        const selected = form.watch('topics') || [];
        const newSelected = selected.filter((topic: string) => !groupTopics.includes(topic));
        form.setValue('topics', newSelected);
    }
    
    return (
        <Card className="w-full max-w-2xl">
             <CardHeader>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft/></Button>
                    <div>
                        <CardTitle>Select Topics for {selectedSubject}</CardTitle>
                        <CardDescription>Choose the topics you want to include in your study plan.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && <TopicSkeleton />}
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                
                {topicsData && (
                    <Controller
                        control={form.control}
                        name="topics"
                        render={({ field }) => (
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                                {topicsData.topicGroups.map((group, groupIndex) => (
                                    <div key={groupIndex}>
                                        <div className='flex justify-between items-center mb-2'>
                                            <h3 className="font-semibold text-lg">{group.groupName}</h3>
                                            <Button variant='link' size='sm' className='p-0 h-auto' onClick={() => isAllSelected(group.topics) ? handleDeselectAll(group.topics) : handleSelectAll(group.topics)}>
                                                {isAllSelected(group.topics) ? 'Deselect All' : 'Select All'}
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {group.topics.map((topic, topicIndex) => (
                                                <FormItem key={topicIndex} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                         <Checkbox
                                                            checked={field.value?.includes(topic)}
                                                            onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), topic])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                    (value) => value !== topic
                                                                    )
                                                                )
                                                            }}
                                                        />
                                                    </FormControl>
                                                     <FormLabel className="font-normal flex-1 cursor-pointer">
                                                        {topic}
                                                    </FormLabel>
                                                </FormItem>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <FormMessage>{form.formState.errors.topics?.message}</FormMessage>
                            </div>
                        )}
                    />
                )}
                 <Button type="submit" className="w-full mt-8" disabled={isLoading}>
                    Generate Plan
                </Button>
            </CardContent>
        </Card>
    );
}

const TopicSkeleton = () => (
    <div className='space-y-4'>
        {[1,2,3].map(i => (
            <div key={i}>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        ))}
    </div>
)


export function ExamPrepView() {
  const { studentProfile } = useAppContext();
  const [step, setStep] = useState(1);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [examPlan, setExamPlan] = useState<GenerateExamPlanOutput | null>(null);

  const form = useForm<z.infer<typeof examPrepSchema>>({
    resolver: zodResolver(examPrepSchema),
    defaultValues: {
      subject: '',
      otherSubject: '',
      topics: [],
      examDate: undefined,
    },
  });

  const handleNext = async () => {
    const isValid = await form.trigger(['subject', 'otherSubject', 'examDate']);
    if (isValid) {
        setStep(2);
    }
  }

  async function onSubmit(values: z.infer<typeof examPrepSchema>) {
    setIsLoadingPlan(true);
    setExamPlan(null);

    const result = await generateExamPlan({
      subject: values.subject === 'Other' ? values.otherSubject! : values.subject,
      topics: values.topics,
      examDate: values.examDate.toISOString(),
      currentDate: new Date().toISOString(),
      studentProfile: {
        classLevel: studentProfile.classLevel,
        board: studentProfile.board,
      },
    });

    if ('error' in result) {
        form.setError('root', { type: 'manual', message: result.error });
    } else {
      setExamPlan(result);
      setStep(3);
    }

    setIsLoadingPlan(false);
  }
  
  const handleDownload = () => {
    // This functionality will be implemented later
  };

  const renderContent = () => {
    if (isLoadingPlan) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <h2 className="text-2xl font-headline text-primary">Generating Your Exam Plan...</h2>
            <p className="text-muted-foreground">This may take a minute. The AI is crafting a personalized roadmap and sample paper for you.</p>
          </div>
        );
    }

    if (step === 3 && examPlan) {
        return (
            <ScrollArea className="h-full">
                <div className="container mx-auto p-4 space-y-8">
                    <header className="text-center">
                        <h1 className="text-4xl font-headline text-primary">Your Exam Prep Roadmap</h1>
                        <p className="text-muted-foreground">Follow this plan to ace your {examPlan.samplePaper.title.replace('Sample Paper', 'Exam')}.</p>
                    </header>
                    <Card>
                        <CardHeader>
                            <CardTitle>Study Roadmap</CardTitle>
                            <CardDescription>A day-by-day guide to your exam.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible defaultValue="item-0">
                                {examPlan.roadmap.map((day, index) => (
                                    <AccordionItem value={`item-${index}`} key={index}>
                                        <AccordionTrigger>Day {day.day}: {day.dailyGoal}</AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="space-y-3">
                                                {day.tasks.map((task, taskIndex) => (
                                                    <li key={taskIndex} className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                                                        {getIconForTask(task.type)}
                                                        <div className="flex-1">
                                                            <p className="font-semibold capitalize">{task.type}: <span className="font-normal text-primary">{task.topic}</span></p>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Clock className="h-4 w-4" />
                                                            {task.duration} min
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{examPlan.samplePaper.title}</CardTitle>
                                <Button variant="outline" size="sm" onClick={handleDownload}><Download className="mr-2 h-4 w-4"/>Download</Button>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Total Marks: {examPlan.samplePaper.totalMarks}</span>
                                <span>Duration: {examPlan.samplePaper.duration} minutes</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {examPlan.samplePaper.sections.map((section, index) => (
                                <div key={index}>
                                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">{section.title}</h3>
                                    <div className="space-y-6">
                                        {section.questions.map((q, qIndex) => (
                                            <div key={qIndex}>
                                                <div className="flex justify-between items-start">
                                                    <p className="font-medium flex-1">Q{qIndex + 1}. {q.question}</p>
                                                    <span className="ml-4 text-sm font-semibold text-muted-foreground">({q.marks} Marks)</span>
                                                </div>
                                                {q.answer && (
                                                    <Alert className="mt-2 text-sm">
                                                        <AlertTitle>Model Answer</AlertTitle>
                                                        <AlertDescription>
                                                            <ReactMarkdown className="prose dark:prose-invert prose-sm max-w-none">
                                                                {q.answer}
                                                            </ReactMarkdown>
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <div className="text-center">
                        <Button onClick={() => setStep(1)}>Create Another Plan</Button>
                    </div>
                </div>
            </ScrollArea>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center justify-center h-full">
                {step === 1 && <Step1_SelectSubjectAndDate onNext={handleNext} form={form} />}
                {step === 2 && <Step2_SelectTopics onBack={() => setStep(1)} form={form} setStep={setStep} />}
            </form>
        </Form>
    );
  }

  return (
      <>
        {!studentProfile.isPro ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Card className="max-w-lg">
                    <CardContent className="p-8">
                        <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
                        <h2 className="text-3xl font-headline mb-4">Pro Feature Locked</h2>
                        <p className="text-muted-foreground mb-6">
                           Exam Prep Mode is an exclusive feature for our Pro members. Upgrade your plan to generate personalized study roadmaps and sample papers.
                        </p>
                        <Button asChild>
                            <a href="/pricing">Upgrade to Pro</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        ) : renderContent()}
      </>
  )
}
