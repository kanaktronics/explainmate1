
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Loader2, BookOpen, CheckSquare, Dumbbell, Clock, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/lib/app-context';
import { generateExamPlan } from '@/lib/actions';
import { GenerateExamPlanOutput } from '@/ai/flows/generate-exam-plan';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import ReactMarkdown from 'react-markdown';

const examPrepSchema = z.object({
  subject: z.string().min(3, { message: 'Subject must be at least 3 characters long.' }),
  examDate: z.date({
    required_error: 'Exam date is required.',
  }),
});

const getIconForTask = (type: 'explanation' | 'quiz' | 'revision' | 'practice') => {
    switch (type) {
        case 'explanation': return <BookOpen className="h-5 w-5 text-blue-500" />;
        case 'quiz': return <CheckSquare className="h-5 w-5 text-orange-500" />;
        case 'practice': return <Dumbbell className="h-5 w-5 text-green-500" />;
        case 'revision': return <BookOpen className="h-5 w-5 text-purple-500" />;
    }
};

export function ExamPrepView() {
  const { toast } = useToast();
  const { studentProfile } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [examPlan, setExamPlan] = useState<GenerateExamPlanOutput | null>(null);

  const form = useForm<z.infer<typeof examPrepSchema>>({
    resolver: zodResolver(examPrepSchema),
    defaultValues: {
      subject: '',
      examDate: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof examPrepSchema>) {
    setIsLoading(true);
    setExamPlan(null);

    const result = await generateExamPlan({
      subject: values.subject,
      examDate: values.examDate.toISOString(),
      currentDate: new Date().toISOString(),
      studentProfile: {
        classLevel: studentProfile.classLevel,
        board: studentProfile.board,
      },
    });

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Failed to generate plan',
        description: result.error,
      });
    } else {
      setExamPlan(result);
    }

    setIsLoading(false);
  }

  const handleDownload = () => {
    if (!examPlan) return;

    const { title, totalMarks, duration, sections } = examPlan.samplePaper;

    const sectionsHtml = sections.map(section => `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
            <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">${section.title}</h3>
            <div style="space-y: 24px;">
                ${section.questions.map((q, qIndex) => `
                    <div style="margin-bottom: 24px; page-break-inside: avoid;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <p style="font-weight: 500; flex: 1;">Q${qIndex + 1}. ${q.question}</p>
                            <span style="margin-left: 16px; font-size: 0.875rem; font-weight: 600; color: #6b7280;">(${q.marks} Marks)</span>
                        </div>
                        ${q.answer ? `
                            <div style="margin-top: 8px; font-size: 0.875rem; border: 1px solid #e5e7eb; padding: 12px; border-radius: 6px; background-color: #f9fafb;">
                                <strong style="display: block; margin-bottom: 4px;">Model Answer:</strong>
                                <div>${q.answer.replace(/\n/g, '<br/>')}</div>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    const printContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                position: relative;
              }
              body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url('/favicon.ico');
                background-repeat: repeat;
                opacity: 0.08;
                z-index: -1;
              }
            }
            .prose { max-width: none; }
            .prose-sm { font-size: 0.875rem; line-height: 1.625; }
            /* Basic markdown styles */
            h1, h2, h3, h4 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
            p { margin-top: 0; margin-bottom: 1em; }
            ul, ol { margin-top: 1em; margin-bottom: 1em; padding-left: 1.5em; }
            li > ul, li > ol { margin-top: 0.5em; margin-bottom: 0.5em; }
            code { background-color: #f3f4f6; padding: 0.2em 0.4em; margin: 0; font-size: 85%; border-radius: 3px; }
            pre { background-color: #f3f4f6; padding: 1em; border-radius: 6px; overflow-x: auto; }
            strong, b { font-weight: 600; }
          </style>
        </head>
        <body>
          <header style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 2.25rem; font-weight: 700; color: #F97316;">${title}</h1>
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #4b5563;">
              <span>Total Marks: ${totalMarks}</span>
              <span>Duration: ${duration} minutes</span>
            </div>
          </header>
          <main>${sectionsHtml}</main>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-headline text-primary">Generating Your Exam Plan...</h2>
        <p className="text-muted-foreground">This may take a minute. The AI is crafting a personalized roadmap and sample paper for you.</p>
      </div>
    );
  }

  if (examPlan) {
    return (
      <ScrollArea className="h-full">
        <div className="container mx-auto p-4 space-y-8">
            <header className="text-center">
                <h1 className="text-4xl font-headline text-primary">Your Exam Prep Roadmap</h1>
                <p className="text-muted-foreground">Follow this plan to ace your {examPlan.samplePaper.title.replace('Sample Paper', 'Exam')}.</p>
            </header>

            {/* Roadmap Section */}
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

            {/* Sample Paper Section */}
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
                 <Button onClick={() => setExamPlan(null)}>Create Another Plan</Button>
            </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Exam Prep Mode</CardTitle>
          <CardDescription>
            Enter your exam details to generate a personalized study roadmap and a full-length sample paper.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Plan'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
