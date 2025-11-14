'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAppContext } from '@/lib/app-context';
import { getExplanation } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, BookText, BrainCircuit, Codesandbox, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const explanationSchema = z.object({
  query: z.string().min(5, { message: 'Please ask a question with at least 5 characters.' }),
});

export function ExplanationView() {
  const { studentProfile, explanation, setExplanation, isProfileComplete } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof explanationSchema>>({
    resolver: zodResolver(explanationSchema),
    defaultValues: { query: '' },
  });

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

    const input = {
      ...values,
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
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Get a New Explanation</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ask a question</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Explain the steps of photosynthesis, or how does the pythagorean theorem work?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Explain It!'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
