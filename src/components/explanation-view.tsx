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
import { AlertCircle, BookText, BrainCircuit, Codesandbox, Globe, PenSquare, Send, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage, Explanation } from '@/lib/types';
import { WelcomeScreen } from './welcome-screen';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const explanationSchema = z.object({
  prompt: z.string().min(1, { message: 'Please ask a question.' }),
});

const AssistantMessage = ({ explanation }: { explanation: Explanation }) => {
  const renderContent = (content: string) => {
    if (!content || content === 'N/A') {
      return <p className="text-muted-foreground">No content available for this section.</p>;
    }
    return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />;
  };

  return (
    <div className="flex items-start gap-4">
        <Avatar className="bg-primary flex-shrink-0">
          <AvatarFallback><BrainCircuit className="text-primary-foreground h-6 w-6" /></AvatarFallback>
        </Avatar>
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
                <CardContent>{renderContent(explanation.explanation)}</CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="roughWork">
            <Card>
                <CardHeader><CardTitle>Rough Work</CardTitle></CardHeader>
                <CardContent>{renderContent(explanation.roughWork)}</CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="realWorld">
            <Card>
                <CardHeader><CardTitle>Real-World Examples</CardTitle></CardHeader>
                <CardContent>{renderContent(explanation.realWorldExamples)}</CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="fairWork">
            <Card>
                <CardHeader><CardTitle>Fair Work (Notebook-ready)</CardTitle></CardHeader>
                <CardContent>{renderContent(explanation.fairWork)}</CardContent>
            </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
};

const UserMessage = ({ content }: { content: string }) => {
  const { studentProfile } = useAppContext();
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  }
  return (
    <div className="flex items-start gap-4 justify-end">
      <Card className="bg-muted">
        <CardContent className="p-3">
          <p className="font-semibold">{content}</p>
        </CardContent>
      </Card>
      <Avatar>
          <AvatarImage src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${studentProfile.name}`} />
          <AvatarFallback>{getInitials(studentProfile.name)}</AvatarFallback>
      </Avatar>
    </div>
  );
}


export function ExplanationView() {
  const { studentProfile, chat, setChat, addToChat, isProfileComplete } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof explanationSchema>>({
    resolver: zodResolver(explanationSchema),
    defaultValues: { prompt: '' },
  });
  
  useEffect(() => {
    if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chat, error, isLoading]);


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
    
    const userMessage: ChatMessage = { role: 'user', content: values.prompt };
    const newChatHistory = [...(chat || []), userMessage];
    setChat(newChatHistory); // Optimistically update UI
    form.reset();


    const input = {
      chatHistory: newChatHistory,
      studentProfile: {
        classLevel: studentProfile.classLevel,
        board: studentProfile.board,
        weakSubjects: studentProfile.weakSubjects,
      },
    };

    const result = await getExplanation(input as any);

    if (result && 'error' in result) {
      setError(result.error);
       // If there was an error, remove the optimistic user message
       setChat(chat);
    } else if (result) {
      const assistantMessage: ChatMessage = { role: 'assistant', content: result };
      addToChat(assistantMessage, newChatHistory); // Use special function to add assistant message
    } else {
       setError("An unexpected error occurred and the AI did not return a response.");
       // If there was an error, remove the optimistic user message
       setChat(chat);
    }
    setIsLoading(false);
  }

  const renderMessage = (message: ChatMessage, index: number) => {
    if (message.role === 'user') {
      return <UserMessage key={index} content={message.content as string} />;
    }
    if (message.role === 'assistant') {
      return <AssistantMessage key={index} explanation={message.content as Explanation} />;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.32))]">
       <div className="flex-1 overflow-y-auto p-1 space-y-8">
        {chat && chat.length === 0 && !isLoading && <WelcomeScreen />}
        {chat && chat.map(renderMessage)}
        <div ref={resultsRef}>
            {isLoading && (
              <div className='flex items-start gap-4'>
                <Avatar className="bg-primary flex-shrink-0">
                  <AvatarFallback><BrainCircuit className="text-primary-foreground h-6 w-6" /></AvatarFallback>
                </Avatar>
                <Card className='w-full'>
                    <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
                  name="prompt"
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
