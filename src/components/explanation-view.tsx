'use client';

import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAppContext } from '@/lib/app-context';
import { getExplanation } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, BookText, Codesandbox, Globe, PenSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const explanationSchema = z.object({
  topic: z.string().min(5, { message: 'Please ask a question with at least 5 characters.' }),
});

export function ExplanationView() {
  const { studentProfile, explanation, setExplanation, isProfileComplete, addToHistory } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof explanationSchema>>({
    resolver: zodResolver(explanationSchema),
    defaultValues: { topic: '' },
  });
  
  useEffect(() => {
    if ((explanation || error || isLoading) && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [explanation, error, isLoading]);


  async function onSubmit(values: z.infer<typeof explanationSchema>) {
    if (!isProfileComplete) {
      toast({
        variant: 'destructive',
        title: 'Profile Incomplete',
        description: 'Please complete your student profile in the sidebar for personalized explanations.',
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setExplanation(null);
    form.reset();

    const input = {
      topic: values.topic,
      studentProfile: {
        classLevel: studentProfile.classLevel,
        board: studentProfile.board,
        weakSubjects: studentProfile.weakSubjects,
      },
    };

    const result = await getExplanation(input);

    if ('error' in result) {
      setError(result.error);
    } else {
      setExplanation(result);
      addToHistory({ topic: values.topic, explanation: result });
    }
    setIsLoading(false);
  }

  const renderContent = (content: string) => {
    if (!content || content === 'N/A') {
        return <p className="text-muted-foreground">No content available for this section.</p>;
    }
    return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.32))]">
      <div className="flex-1 overflow-y-auto p-1 space-y-4">
        {/* This div is the target for scrolling */}
        <div ref={resultsRef}>
            {isLoading && (
              <Card>
                  <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                  <CardContent className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                  </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {explanation && (
              <Tabs defaultValue="explanation" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                  <TabsTrigger value="explanation"><BookText className="mr-2" />Explanation</TabsTrigger>
                  <TabsTrigger value="roughWork"><Codesandbox className="mr-2" />Rough Work</TabsTrigger>
                  <TabsTrigger value="realWorld"><Globe className="mr-2" />Real-World</TabsTrigger>
                  <TabsTrigger value="fairWork"><PenSquare className="mr-2" />Fair Work</TabsTrigger>
                </TabsList>
                <TabsContent value="explanation">
                  <Card>
                    <CardHeader><CardTitle>Explanation</CardTitle></CardHeader>
                    <CardContent>
                      {renderContent(explanation.explanation)}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="roughWork">
                  <Card>
                    <CardHeader><CardTitle>Rough Work</CardTitle></CardHeader>
                    <CardContent>
                      {renderContent(explanation.roughWork)}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="realWorld">
                  <Card>
                    <CardHeader><CardTitle>Real-World Examples</CardTitle></CardHeader>
                    <CardContent>
                      {renderContent(explanation.realWorldExamples)}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="fairWork">
                  <Card>
                    <CardHeader><CardTitle>Fair Work (Notebook-ready)</CardTitle></CardHeader>
                    <CardContent>
                      {renderContent(explanation.fairWork)}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
        </div>
      </div>

      <div className="p-4 bg-background/80 backdrop-blur-sm sticky bottom-0">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea 
                            placeholder="Explain the steps of photosynthesis..." 
                            {...field}
                            className="bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    form.handleSubmit(onSubmit)();
                                }
                            }}
                        />
                      </FormControl>
                      <FormMessage className="absolute" />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} size="icon">
                  <Send />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
