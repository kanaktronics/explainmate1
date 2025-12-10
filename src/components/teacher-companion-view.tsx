
'use client';

import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAppContext } from '@/lib/app-context';
import { getTeacherCompanionResponse } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, BrainCircuit, Send, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage, TeacherCompanionResponse } from '@/lib/types';
import { Avatar, AvatarFallback } from './ui/avatar';
import Link from 'next/link';

const promptSchema = z.object({
  prompt: z.string().min(1, { message: 'Please enter a response.' }),
});

const AssistantMessage = ({ response }: { response: TeacherCompanionResponse }) => {
    return (
        <div className="flex items-start gap-4">
            <Avatar className="bg-primary flex-shrink-0">
                <AvatarFallback><BrainCircuit className="text-primary-foreground h-6 w-6" /></AvatarFallback>
            </Avatar>
            <Card className="w-full">
                <CardContent className="p-4">
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: response.response.replace(/\n/g, '<br />') }} />
                </CardContent>
            </Card>
        </div>
    );
};

const UserMessage = ({ content }: { content: ChatMessage['content'] }) => {
  const { studentProfile } = useAppContext();
  const getInitials = (name?: string | null) => {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'T';
  }

  const textPart = typeof content === 'string' ? content : (content as { text?: string }).text;

  return (
    <div className="flex items-start gap-4 justify-end">
      <Card className="bg-muted">
        <CardContent className="p-3">
          {textPart && <p className="font-semibold">{textPart}</p>}
        </CardContent>
      </Card>
      <Avatar>
          <AvatarFallback>{getInitials(studentProfile.name)}</AvatarFallback>
      </Avatar>
    </div>
  );
}


export function TeacherCompanionView() {
  const { user, studentProfile, chat, setChat, addToChat, showAd, incrementUsage } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [initialMessageFetched, setInitialMessageFetched] = useState(false);

  const form = useForm<z.infer<typeof promptSchema>>({
    resolver: zodResolver(promptSchema),
    defaultValues: { prompt: '' },
  });

  // Reset flag when chat is cleared or view changes
  useEffect(() => {
    if (chat.length === 0) {
      setInitialMessageFetched(false);
    }
  }, [chat.length]);

  // Initial message from AI when chat is empty
  useEffect(() => {
    if (chat.length === 0 && user && studentProfile.isPro && !initialMessageFetched) {
        setIsLoading(true);
        setInitialMessageFetched(true); // Set flag immediately to prevent re-runs
        getTeacherCompanionResponse({ studentProfile, chatHistory: [] })
            .then(result => {
                if (result && 'error' in result) {
                    setError(result.error);
                } else if (result) {
                    const assistantMessage: ChatMessage = { role: 'assistant', content: result };
                    addToChat(assistantMessage, 'teacher-companion');
                }
            })
            .finally(() => setIsLoading(false));
    }
  }, [chat.length, user, studentProfile, addToChat, initialMessageFetched]);

  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, isLoading, error]);


  async function onSubmit(values: z.infer<typeof promptSchema>) {
    if (!user || !studentProfile.isPro) return;
    
    setIsLoading(true);
    setError(null);
    
    const userMessage: ChatMessage = { role: 'user', content: { text: values.prompt } };
    addToChat(userMessage, 'teacher-companion'); 
    
    const currentChat = [...chat, userMessage];

    form.reset();
    incrementUsage('teacher-companion');

    const result = await getTeacherCompanionResponse({ studentProfile, chatHistory: currentChat });

    if (result && 'error' in result) {
        let friendlyError = 'An unexpected error occurred. Please try again.';
        switch (result.error) {
            case 'PRO_RATE_LIMIT':
                friendlyError = "It looks like you're sending requests faster than normal learning activity. To protect ExplainMate and ensure fair usage for everyone, we've temporarily paused your requests. Please wait a moment and try again.";
                setChat(chat);
                break;
            case 'PRO_DAILY_LIMIT':
                friendlyError = "You've had a long and productive session! To keep ExplainMate running smoothly for everyone, we apply a fair usage limit. Please take a short break and try again a little later. If you need more usage today, please contact support.";
                setChat(chat);
                break;
            case 'ACCOUNT_BLOCKED':
                friendlyError = "Your account is currently on hold due to unusual activity. If you believe this is a mistake, please contact ExplainMate Support.";
                setChat(chat);
                break;
            default:
                friendlyError = result.error;
                setChat(chat);
                break;
        }
        setError(friendlyError);
    } else if (result) {
      const assistantMessage: ChatMessage = { role: 'assistant', content: result };
      addToChat(assistantMessage, 'teacher-companion');
    } else {
       setError("An unexpected error occurred and the AI did not return a response.");
       setChat(chat);
    }
    setIsLoading(false);
  }

  const renderMessage = (message: ChatMessage, index: number) => {
    if (message.role === 'user') {
      return <UserMessage key={index} content={message.content} />;
    }
    if (message.role === 'assistant') {
      return <AssistantMessage key={index} response={message.content as TeacherCompanionResponse} />;
    }
    return null;
  };
  
  if (!studentProfile.isPro) {
    return (
         <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-lg">
                <CardContent className="p-8">
                    <AlertCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h2 className="text-3xl font-headline mb-4">Pro Feature Locked</h2>
                    <p className="text-muted-foreground mb-6">
                        Teacher Companion Mode is an exclusive feature for our Pro members. Upgrade your plan to access this powerful teaching assistant.
                    </p>
                    <Button asChild>
                        <Link href="/pricing">Upgrade to Pro</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className='flex flex-col h-full'>
      <div className="flex-1 overflow-y-auto">
        <div className="p-1 sm:p-2 md:p-4 space-y-8">
            {chat.map(renderMessage)}
            
            {isLoading && (
              <div className="flex items-start gap-4">
                  <Avatar className="bg-primary flex-shrink-0 animate-pulse">
                      <AvatarFallback>
                          <BrainCircuit className="text-primary-foreground h-6 w-6" />
                      </AvatarFallback>
                  </Avatar>
                  <div className="w-full space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                  </div>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div ref={chatEndRef} />
        </div>
      </div>

      <div className="flex-shrink-0 p-4 bg-background/80 backdrop-blur-sm">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                <div className="flex-1 relative">
                    <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                        <FormControl>
                            <Textarea 
                                placeholder="Respond to the assistant..." 
                                {...field}
                                className="bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring resize-none text-sm"
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
                </div>
                <Button type="submit" disabled={isLoading || form.formState.isSubmitting} size="icon">
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
