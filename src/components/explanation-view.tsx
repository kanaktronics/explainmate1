

'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useCallback }from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAppContext } from '@/lib/app-context';
import { getExplanation, getTextToSpeech } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, BookText, BrainCircuit, Check, ChevronDown, Clipboard, Codesandbox, Globe, Image as ImageIcon, Mic, MoreVertical, PenSquare, Send, User, Volume2, X, Pause, Loader2, Play, GitMerge } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage, Explanation } from '@/lib/types';
import { WelcomeScreen } from './welcome-screen';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from './ui/dropdown-menu';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { MindMapView } from './mind-map-view';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from './ui/scroll-area';


const MAX_PROMPT_LENGTH_FREE = 500;
const MAX_PROMPT_LENGTH_PRO = 2000;
const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB

const explanationSchema = z.object({
  prompt: z.string().min(1, { message: 'Please ask a question.' }),
  image: z.string().optional(),
});

interface ExplanationCardProps {
  cardId: string;
  title: string;
  icon: React.ReactNode;
  text: string;
  isOnlyCard?: boolean;
}

const ExplanationCard = ({ cardId, title, text, icon, isOnlyCard = false }: ExplanationCardProps) => {
  const { toast } = useToast();
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleListen = useCallback(async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && audioRef.current.src) {
        audioRef.current.play();
        setIsPlaying(true);
        return;
    }

    setIsLoadingAudio(true);
    try {
        const result = await getTextToSpeech({ text });
        if (result && 'error' in result) {
            throw new Error(result.error);
        }
        
        if (result.audioDataUri) {
            if (!audioRef.current) {
                audioRef.current = new Audio();
            }
            audioRef.current.src = result.audioDataUri;
            audioRef.current.playbackRate = playbackRate;
            audioRef.current.play();
            setIsPlaying(true);

            audioRef.current.onended = () => {
                setIsPlaying(false);
            };
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Text-to-Speech Failed',
            description: error.message || 'Could not generate audio for this text.',
        });
    } finally {
        setIsLoadingAudio(false);
    }
  }, [text, isPlaying, playbackRate, toast]);


  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  }

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
        audioRef.current.playbackRate = rate;
    }
  };

  const renderContent = (content: string) => {
    if (!content || content === 'N/A') {
      return <p className="text-muted-foreground">No content available for this section.</p>;
    }
    
    if (cardId === 'mindMap') {
      return (
        <div className="w-full overflow-hidden">
          <div className="overflow-x-auto w-full">
            <MindMapView markdown={content} />
          </div>
        </div>
      );
    }

    return (
      <div className="prose dark:prose-invert max-w-none md:prose-sm lg:prose-base prose-li:my-1 prose-p:leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {content}
        </ReactMarkdown>
      </div>
    );
  };

  const getButtonIcon = () => {
    if (isLoadingAudio) return <Loader2 className="animate-spin" />;
    if (isPlaying) return <Pause />;
    return <Volume2 />;
  }

  return (
    <Card className='md:border-faint border-transparent shadow-none md:shadow-sm bg-transparent md:bg-card md:border'>
        {!isOnlyCard && (
          <CardHeader className='flex-row items-center justify-between p-4 md:p-6'>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">{icon} {title}</CardTitle>
              <div className='flex items-center gap-1 md:gap-2'>
                <Button variant="ghost" size="icon" onClick={handleListen} disabled={!text || text === 'N/A' || isLoadingAudio} className="focus-visible:ring-0 focus-visible:ring-offset-0 h-8 w-8 md:h-9 md:w-9">
                    {getButtonIcon()}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9"><MoreVertical/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleSpeedChange(0.8)}>0.8x {playbackRate === 0.8 && <Check className='ml-auto'/>}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleSpeedChange(1)}>1x {playbackRate === 1 && <Check className='ml-auto'/>}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleSpeedChange(1.25)}>1.25x {playbackRate === 1.25 && <Check className='ml-auto'/>}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleSpeedChange(1.5)}>1.5x {playbackRate === 1.5 && <Check className='ml-auto'/>}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleCopy}>
                            {isCopied ? <><Check className="mr-2"/>Copied!</> : <><Clipboard className="mr-2"/>Download (Copy Text)</>}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </CardHeader>
        )}
        <CardContent className={cn("p-4 md:p-6", {"pt-0 md:pt-0": !isOnlyCard})}>
            {renderContent(text)}
        </CardContent>
    </Card>
  )
}

const explanationTabs = [
    { id: 'explanation', title: 'Explanation', icon: <BookText /> },
    { id: 'roughWork', title: 'Rough Work', icon: <Codesandbox /> },
    { id: 'realWorldExamples', title: 'Real-World', icon: <Globe /> },
    { id: 'fairWork', title: 'Fair Work', icon: <PenSquare /> },
    { id: 'mindMap', title: 'Mind Map', icon: <GitMerge /> },
];

const AssistantMessage = ({ explanation }: { explanation: Explanation }) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('explanation');

  const getTabContent = (tabId: string) => {
    switch (tabId) {
      case 'explanation': return explanation.explanation;
      case 'roughWork': return explanation.roughWork;
      case 'realWorldExamples': return explanation.realWorldExamples;
      case 'fairWork': return explanation.fairWork;
      case 'mindMap': return explanation.mindMap;
      default: return '';
    }
  };

  const hasMultipleTabs = explanation.roughWork !== 'N/A' || explanation.realWorldExamples !== 'N/A' || explanation.fairWork !== 'N/A' || explanation.mindMap !== 'N/A';
  
  if (!hasMultipleTabs) {
      return (
          <div className="flex items-start gap-2 md:gap-4">
              <Avatar className="bg-primary flex-shrink-0">
                <AvatarFallback><BrainCircuit className="text-primary-foreground h-6 w-6" /></AvatarFallback>
              </Avatar>
              <ExplanationCard cardId="explanation" title="Explanation" icon={<BookText/>} text={explanation.explanation} isOnlyCard={true}/>
          </div>
      )
  }

  if (isMobile) {
      const activeTabInfo = explanationTabs.find(t => t.id === activeTab);
      return (
           <div className="flex items-start gap-2 md:gap-4">
              <Avatar className="bg-primary flex-shrink-0">
                <AvatarFallback><BrainCircuit className="text-primary-foreground h-6 w-6" /></AvatarFallback>
              </Avatar>
              <div className="w-full space-y-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {activeTabInfo?.icon}
                        <span className="font-semibold">{activeTabInfo?.title}</span>
                        <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                      {explanationTabs.map(tab => {
                        if (getTabContent(tab.id) === 'N/A') return null;
                        return (
                          <DropdownMenuItem key={tab.id} onSelect={() => setActiveTab(tab.id)}>
                            {tab.icon}
                            <span>{tab.title}</span>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ExplanationCard 
                      cardId={activeTab} 
                      title={activeTabInfo?.title || ''} 
                      icon={activeTabInfo?.icon || <></>}
                      text={getTabContent(activeTab)} 
                      isOnlyCard={true}
                  />
              </div>
           </div>
      )
  }

  return (
    <div className="flex items-start gap-2 md:gap-4">
        <Avatar className="bg-primary flex-shrink-0">
          <AvatarFallback><BrainCircuit className="text-primary-foreground h-6 w-6" /></AvatarFallback>
        </Avatar>
        <Tabs defaultValue="explanation" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                {explanationTabs.map(tab => {
                    const content = getTabContent(tab.id);
                    if (content === 'N/A') return null;
                    return <TabsTrigger key={tab.id} value={tab.id}>{React.cloneElement(tab.icon, {className: "mr-2"})} {tab.title}</TabsTrigger>
                })}
            </TabsList>
            {explanationTabs.map(tab => {
                 const content = getTabContent(tab.id);
                 if (content === 'N/A') return null;
                 return (
                    <TabsContent key={tab.id} value={tab.id}>
                      <ExplanationCard cardId={tab.id} title={tab.title} icon={tab.icon} text={content} />
                    </TabsContent>
                 )
            })}
        </Tabs>
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
  const dataUrl = typeof content === 'object' && content !== null && 'dataUrl' in content ? content.dataUrl : undefined;

  return (
    <div className="flex items-start gap-2 md:gap-4 justify-end">
      <Card className="bg-muted">
        <CardContent className="p-3">
          {dataUrl && (
            <Image src={dataUrl} alt="Uploaded diagram" width={200} height={200} className="rounded-md mb-2 object-cover" />
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
  const { user, studentProfile, chat, addToChat, isProfileComplete, incrementUsage, setView, showAd } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
            toast({ variant: 'destructive', title: 'File too large', description: `Please select an image smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
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

    if (!studentProfile.isPro && (studentProfile.dailyUsage || 0) >= 5) {
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
    
    const userMessageContent: { text: string; dataUrl?: string } = { text: values.prompt };
    if (values.image) {
      userMessageContent.dataUrl = values.image;
      console.log("explanation-view.tsx: Image dataUrl attached to user message.", values.image.substring(0, 50) + "...");
    }
    const userMessage: ChatMessage = { role: 'user', content: userMessageContent };
    
    const updatedChatHistory = [...chat, userMessage];
    addToChat(userMessage); 
    
    form.reset();
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }

    incrementUsage('explanation');

    const result = await getExplanation({
      chatHistory: updatedChatHistory,
      studentProfile: studentProfile,
    });

    if (result && 'error' in result) {
      let friendlyError = 'An unexpected error occurred. Please try again.';
      switch (result.error) {
        case 'DAILY_LIMIT_REACHED':
          showAd({
            title: "Daily Limit Reached",
            description: "You've used your free explanations for today. Upgrade to Pro for unlimited access."
          });
          break;
        case 'PRO_RATE_LIMIT':
            friendlyError = "It looks like you're sending requests faster than normal learning activity. To protect ExplainMate and ensure fair usage for everyone, we've temporarily paused your requests. Please wait a moment and try again.";
            break;
        case 'PRO_DAILY_LIMIT':
            friendlyError = "You're learning really fast! To keep ExplainMate running smoothly for everyone, we slow things down after extremely long study sessions. To keep ExplainMate running smoothly for everyone, we slow things down after extremely long study sessions. Please take a short break and try again a little later. If you feel you reached this limit by mistake, or you genuinely need more usage today, please contact ExplainMate Support and we’ll unlock additional access for you.";
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
      console.error("explanation-view.tsx: Received error from getExplanation:", result.error);
    } else if (result) {
      const assistantMessage: ChatMessage = { role: 'assistant', content: result };
      addToChat(assistantMessage);
    } else {
       setError("An unexpected error occurred and the AI did not return a response.");
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
      <ScrollArea className="flex-1" id="chat-scroll-area">
        <div className="p-2 md:p-6 space-y-4 md:space-y-6">
            {chat.length === 0 && !isLoading && !error && <WelcomeScreen />}
            {chat.map(renderMessage)}
            
            {isLoading && (
               <div className="flex items-start gap-2 md:gap-4 animate-in fade-in duration-500">
                <Avatar className="bg-primary flex-shrink-0">
                  <AvatarFallback><BrainCircuit className="text-primary-foreground h-6 w-6" /></AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 pt-2">
                    <div className="bg-muted p-2 rounded-full animate-pulse">
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                    </div>
                    <p className="text-sm font-semibold text-primary">ExplainMate is thinking...</p>
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
      </ScrollArea>

      <div className="flex-shrink-0 p-2 md:p-4 bg-background/80 backdrop-blur-sm">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-2 md:p-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleImageButtonClick}
                    title="Upload Image (Pro)"
                    className='h-12 w-12 md:h-12 md:w-12 flex-shrink-0'
                    >
                    <ImageIcon />
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

                <div className="flex-1 relative">
                    {imagePreview && (
                        <div className="absolute bottom-full left-0 mb-2 p-1 bg-muted rounded-md border w-16 h-16">
                            <Image src={imagePreview} alt="preview" fill className="rounded-md object-cover" />
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
                                className="bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring resize-none text-base md:text-base p-3 md:p-4 min-h-[52px] md:min-h-[52px]"
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
                    className='h-12 w-12 md:h-12 md:w-12 flex-shrink-0'
                    >
                    <Mic />
                </Button>
                <Button type="submit" disabled={isLoading || form.formState.isSubmitting} size="icon" className='h-12 w-12 md:h-12 md:w-12 flex-shrink-0'>
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
