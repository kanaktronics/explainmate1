'use client';

import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAppContext } from '@/lib/app-context';
import { getExplanation, getAudioForText } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, BookText, BrainCircuit, Codesandbox, Globe, Image as ImageIcon, Mic, PenSquare, Send, User, Volume2, X, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage, Explanation } from '@/lib/types';
import { WelcomeScreen } from './welcome-screen';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';

const MAX_PROMPT_LENGTH_FREE = 500;
const MAX_PROMPT_LENGTH_PRO = 2000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const FREE_TIER_EXPLANATION_LIMIT = 5;

const explanationSchema = z.object({
  prompt: z.string().min(1, { message: 'Please ask a question.' }),
  image: z.string().optional(),
});

const AssistantMessage = ({ explanation }: { explanation: Explanation }) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const renderContent = (content: string) => {
    if (!content || content === 'N/A') {
      return <p className="text-muted-foreground">No content available for this section.</p>;
    }
    return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />;
  };

  const handleListen = async (text: string) => {
    setIsAudioLoading(true);
    setAudioError(null);
    setAudioSrc(null);
    try {
        const result = await getAudioForText({ text });
        if (result.error) {
            throw new Error(result.error);
        }
        setAudioSrc(result.audioDataUri);
    } catch(e: any) {
        setAudioError(e.message || "Failed to generate audio.");
    } finally {
        setIsAudioLoading(false);
    }
  };
  
  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.play();
    }
  }, [audioSrc]);

  const hasMultipleTabs = explanation.roughWork !== 'N/A' || explanation.realWorldExamples !== 'N/A' || explanation.fairWork !== 'N/A';

  return (
    <div className="flex items-start gap-4">
        <Avatar className="bg-primary flex-shrink-0">
          <AvatarFallback><BrainCircuit className="text-primary-foreground h-6 w-6" /></AvatarFallback>
        </Avatar>
        {hasMultipleTabs ? (
            <Tabs defaultValue="explanation" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="explanation"><BookText className="mr-2" />Explanation</TabsTrigger>
                    <TabsTrigger value="roughWork"><Codesandbox className="mr-2" />Rough Work</TabsTrigger>
                    <TabsTrigger value="realWorld"><Globe className="mr-2" />Real-World</TabsTrigger>
                    <TabsTrigger value="fairWork"><PenSquare className="mr-2" />Fair Work</TabsTrigger>
                </TabsList>
                <TabsContent value="explanation">
                <Card>
                    <CardHeader className='flex-row items-center justify-between'>
                      <CardTitle>Explanation</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => handleListen(explanation.explanation)} disabled={isAudioLoading}>
                        {isAudioLoading ? <LoaderCircle className="animate-spin" /> : <Volume2 />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {audioSrc && <audio ref={audioRef} src={audioSrc} controls className='w-full mb-4' />}
                      {audioError && <Alert variant="destructive" className="mb-4"><AlertCircle/><AlertDescription>{audioError}</AlertDescription></Alert>}
                      {renderContent(explanation.explanation)}
                    </CardContent>
                </Card>
                </TabsContent>
                <TabsContent value="roughWork">
                <Card>
                    <CardHeader className='flex-row items-center justify-between'>
                      <CardTitle>Rough Work</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => handleListen(explanation.roughWork)} disabled={isAudioLoading}>
                        {isAudioLoading ? <LoaderCircle className="animate-spin" /> : <Volume2 />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {audioSrc && <audio ref={audioRef} src={audioSrc} controls className='w-full mb-4' />}
                      {audioError && <Alert variant="destructive" className="mb-4"><AlertCircle/><AlertDescription>{audioError}</AlertDescription></Alert>}
                      {renderContent(explanation.roughWork)}
                    </CardContent>
                </Card>
                </TabsContent>
                <TabsContent value="realWorld">
                <Card>
                    <CardHeader className='flex-row items-center justify-between'>
                      <CardTitle>Real-World Examples</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => handleListen(explanation.realWorldExamples)} disabled={isAudioLoading}>
                        {isAudioLoading ? <LoaderCircle className="animate-spin" /> : <Volume2 />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                       {audioSrc && <audio ref={audioRef} src={audioSrc} controls className='w-full mb-4' />}
                      {audioError && <Alert variant="destructive" className="mb-4"><AlertCircle/><AlertDescription>{audioError}</AlertDescription></Alert>}
                      {renderContent(explanation.realWorldExamples)}
                    </CardContent>
                </Card>
                </TabsContent>
                <TabsContent value="fairWork">
                <Card>
                    <CardHeader className='flex-row items-center justify-between'>
                      <CardTitle>Fair Work (Notebook-ready)</CardTitle>
                       <Button variant="ghost" size="icon" onClick={() => handleListen(explanation.fairWork)} disabled={isAudioLoading}>
                        {isAudioLoading ? <LoaderCircle className="animate-spin" /> : <Volume2 />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                       {audioSrc && <audio ref={audioRef} src={audioSrc} controls className='w-full mb-4' />}
                      {audioError && <Alert variant="destructive" className="mb-4"><AlertCircle/><AlertDescription>{audioError}</AlertDescription></Alert>}
                      {renderContent(explanation.fairWork)}
                    </CardContent>
                </Card>
                </TabsContent>
            </Tabs>
        ) : (
             <Card className='w-full'>
                <CardHeader className='flex-row items-center justify-between'>
                  <CardTitle>Explanation</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleListen(explanation.explanation)} disabled={isAudioLoading}>
                    {isAudioLoading ? <LoaderCircle className="animate-spin" /> : <Volume2 />}
                  </Button>
                </CardHeader>
                <CardContent>
                    {audioSrc && <audio ref={audioRef} src={audioSrc} controls className='w-full mb-4' />}
                    {audioError && <Alert variant="destructive" className="mb-4"><AlertCircle/><AlertDescription>{audioError}</AlertDescription></Alert>}
                    {renderContent(explanation.explanation)}
                </CardContent>
            </Card>
        )}
    </div>
  );
};

const UserMessage = ({ content }: { content: ChatMessage['content'] }) => {
  const { studentProfile } = useAppContext();
  const getInitials = (name?: string | null) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'S';
  }

  const textPart = typeof content === 'string' ? content : (content as { text?: string }).text;
  const imageUrl = typeof content === 'object' && content !== null && 'imageUrl' in content ? content.imageUrl : undefined;

  return (
    <div className="flex items-start gap-4 justify-end">
      <Card className="bg-muted">
        <CardContent className="p-3">
          {imageUrl && (
            <Image src={imageUrl} alt="Uploaded diagram" width={200} height={200} className="rounded-md mb-2" />
          )}
          {textPart && <p className="font-semibold">{textPart}</p>}
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
  const { user, studentProfile, setStudentProfile, chat, setChat, addToChat, isProfileComplete, incrementUsage, setView, showAd } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const maxPromptLength = studentProfile.isPro ? MAX_PROMPT_LENGTH_PRO : MAX_PROMPT_LENGTH_FREE;

  const form = useForm<z.infer<typeof explanationSchema>>({
    resolver: zodResolver(explanationSchema),
    defaultValues: { prompt: '', image: undefined },
  });

  const promptValue = form.watch('prompt');
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, isLoading, error]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            form.setValue('prompt', form.getValues('prompt') + transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            toast({
                variant: 'destructive',
                title: 'Voice Recognition Error',
                description: event.error === 'not-allowed' 
                    ? 'Microphone access was denied. Please allow it in your browser settings.'
                    : 'An error occurred during voice recognition.',
            });
            setIsListening(false);
        };
    }

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, [form, toast]);


  const handleListen = () => {
      if (!recognitionRef.current) {
          toast({
              variant: 'destructive',
              title: 'Not Supported',
              description: 'Your browser does not support voice-to-text.',
          });
          return;
      }

      if (isListening) {
          recognitionRef.current.stop();
      } else {
          recognitionRef.current.start();
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > MAX_FILE_SIZE) {
            toast({ variant: 'destructive', title: 'File too large', description: 'Please select an image smaller than 5MB.' });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            form.setValue('image', dataUrl);
            setImagePreview(dataUrl);
        };
        reader.readAsDataURL(file);
    }
  }

  const handleImageButtonClick = () => {
    if (!user) {
        setView('auth');
        toast({ title: 'Login Required', description: 'Please sign in to upload images.' });
        return;
    }
    if (studentProfile.isPro) {
        fileInputRef.current?.click();
    } else {
        showAd({ title: 'Unlock Image Uploads', description: 'Upgrade to Pro to upload images and diagrams for analysis.' });
    }
  }


  async function onSubmit(values: z.infer<typeof explanationSchema>) {
    if (!user) {
        setView('auth');
        toast({ title: 'Login Required', description: 'Please sign in to get explanations.' });
        return;
    }

    if (!studentProfile.isPro && (studentProfile.dailyUsage || 0) >= FREE_TIER_EXPLANATION_LIMIT) {
        showAd({
            title: "Daily Limit Reached",
            description: "You've used all your free explanations for today. Upgrade to Pro for unlimited access."
        });
        return;
    }
    
    if (!isProfileComplete) {
      toast({
        variant: 'destructive',
        title: 'Profile Incomplete',
        description: 'Please complete your student profile in the sidebar for personalized explanations.',
      });
      return;
    }

    if (values.prompt.length > maxPromptLength) {
        toast({
            variant: 'destructive',
            title: 'Question Too Long',
            description: `Your question exceeds the ${maxPromptLength} character limit. Pro users have a higher limit.`,
        });
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const userMessageContent: ChatMessage['content'] = { text: values.prompt };
    if (values.image) {
      userMessageContent.imageUrl = values.image;
    }
    const userMessage: ChatMessage = { role: 'user', content: userMessageContent };
    
    addToChat(userMessage); 
    
    const currentChat = [...chat, userMessage];

    form.reset();
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }

    incrementUsage('explanation');

    const input = {
      chatHistory: currentChat,
      studentProfile: studentProfile,
    };

    const result = await getExplanation(input);

    if (result && 'error' in result) {
      let friendlyError = 'An unexpected error occurred. Please try again.';
      switch (result.error) {
        case 'DAILY_LIMIT_REACHED':
          showAd({
            title: "Daily Limit Reached",
            description: "You've used all your free explanations for today. Upgrade to Pro for unlimited access."
          });
          setChat(chat); // Revert optimistic update
          break;
        case 'PRO_RATE_LIMIT':
            friendlyError = "It looks like you're sending requests faster than normal learning activity. To protect ExplainMate and ensure fair usage for everyone, we've temporarily paused your requests. Please wait a moment and try again.";
            setChat(chat);
            break;
        case 'PRO_DAILY_LIMIT':
            friendlyError = "You're learning really fast! To keep ExplainMate running smoothly for everyone, we slow things down after extremely long study sessions. Please take a short break and try again a little later. If you feel you reached this limit by mistake, or you genuinely need more usage today, please contact ExplainMate Support and we’ll unlock additional access for you.";
            setChat(chat);
            break;
        case 'ACCOUNT_BLOCKED':
            friendlyError = "Your account is currently on hold due to unusual activity. If you believe this is a mistake, please contact ExplainMate Support and we will review it.";
            setChat(chat);
            break;
        default:
          friendlyError = result.error;
          setChat(chat);
          break;
      }
      if(result.error !== 'DAILY_LIMIT_REACHED') {
          setError(friendlyError);
      }
    } else if (result) {
      const assistantMessage: ChatMessage = { role: 'assistant', content: result };
      addToChat(assistantMessage);
    } else {
       setError("An unexpected error occurred and the AI did not return a response.");
       setChat(chat); // Revert optimistic update
    }
    setIsLoading(false);
  }

  const renderMessage = (message: ChatMessage, index: number) => {
    if (message.role === 'user') {
      return <UserMessage key={index} content={message.content} />;
    }
    if (message.role === 'assistant') {
      return <AssistantMessage key={index} explanation={message.content as Explanation} />;
    }
    return null;
  };

  return (
    <div className='flex flex-col h-full'>
      <div className="flex-1 overflow-y-auto">
        <div className="p-1 sm:p-2 md:p-4 space-y-8">
            {chat.length === 0 && !isLoading && !error && <WelcomeScreen />}
            {chat.map(renderMessage)}
            
            {isLoading && (
               <div className='flex items-start gap-4'>
                <Avatar className="bg-primary flex-shrink-0 animate-pulse">
                  <AvatarFallback><BrainCircuit className="text-primary-foreground h-6 w-6" /></AvatarFallback>
                </Avatar>
                <div className='w-full space-y-2'>
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-8 w-3/4" />
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
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleImageButtonClick}
                    title="Upload Image (Pro)"
                    >
                    <ImageIcon />
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

                <div className="flex-1 relative">
                    {imagePreview && (
                        <div className="absolute bottom-full left-0 mb-2 p-1 bg-muted rounded-md border">
                            <Image src={imagePreview} alt="preview" width={60} height={60} className="rounded-md" />
                            <button 
                                type="button" 
                                onClick={() => {
                                    setImagePreview(null);
                                    form.setValue('image', undefined);
                                    if(fileInputRef.current) fileInputRef.current.value = '';
                                }} 
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                                <X className="h-3 w-3"/>
                            </button>
                        </div>
                    )}
                    <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                        <FormControl>
                            <Textarea 
                                placeholder="Explain the steps of photosynthesis..." 
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
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                        {promptValue.length} / {maxPromptLength}
                    </div>
                </div>

                 <Button 
                    type="button" 
                    variant={isListening ? "destructive" : "ghost"}
                    size="icon" 
                    onClick={handleListen}
                    title="Ask with your voice"
                    >
                    <Mic />
                </Button>
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
