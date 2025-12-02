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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAppContext } from '@/lib/app-context';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

type Step = 'email' | 'question' | 'reset';

const emailSchema = z.object({
  email: z.string().email(),
});

const answerSchema = z.object({
  answer: z.string().min(1, 'Please provide an answer.'),
});

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

export function ForgotPasswordView() {
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [userDoc, setUserDoc] = useState<any>(null);
  const { setView } = useAppContext();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const emailForm = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) });
  const answerForm = useForm<z.infer<typeof answerSchema>>({ resolver: zodResolver(answerSchema) });
  const resetForm = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    try {
      const q = query(collection(firestore, 'users'), where('email', '==', values.email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        toast({ variant: 'destructive', title: 'Error', description: 'No user found with this email.' });
      } else {
        const doc = querySnapshot.docs[0];
        setUserDoc({ id: doc.id, ...doc.data() });
        setStep('question');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to find user.' });
    }
    setIsLoading(false);
  };

  const handleAnswerSubmit = (values: z.infer<typeof answerSchema>) => {
    // In a real app, you would compare a hash of the answer.
    // For this prototype, we'll do a simple string comparison.
    if (values.answer.toLowerCase() === userDoc.securityAnswer.toLowerCase()) {
      setStep('reset');
    } else {
      toast({ variant: 'destructive', title: 'Incorrect Answer', description: 'The security answer is not correct.' });
    }
  };

  const handleResetSubmit = async (values: z.infer<typeof resetSchema>) => {
    setIsLoading(true);
    try {
      // To update a password, the user must be recently signed in.
      // This is a tricky flow without a backend. We'll re-authenticate them with their old credentials (which we don't have)
      // or use a different method. For this client-side example, the most straightforward (but less secure) way
      // is to ask for their current password. Since that's what they forgot, this flow is difficult on the client.
      // The most common approach is to send a password reset link via email, which we are avoiding.
      // The second best is a custom auth flow with a backend.
      
      // As a client-side-only workaround, we'll show a success message and guide the user.
      // NOTE: Firebase Auth SDK does not allow password updates without recent sign-in for security reasons.
      // This part of the UI is illustrative of the flow. A real implementation would require a backend function
      // to generate a custom token or handle the reset.
      
      toast({
        title: 'Password "Reset"!',
        description: 'In a real app, your password would now be reset. For now, please contact support or re-create your account.',
      });
      
      setView('welcome');

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      {step === 'email' && (
        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>Enter your email to begin the recovery process.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField control={emailForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Searching...' : 'Continue'}
                </Button>
                <Button variant="link" size="sm" className="w-full" onClick={() => setView('welcome')}>
                    Back to Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 'question' && userDoc && (
        <Card>
          <CardHeader>
            <CardTitle>Security Question</CardTitle>
            <CardDescription>{userDoc.securityQuestion}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...answerForm}>
              <form onSubmit={answerForm.handleSubmit(handleAnswerSubmit)} className="space-y-4">
                <FormField control={answerForm.control} name="answer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Answer</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full">Verify</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 'reset' && (
        <Card>
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>Enter a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
                <FormField control={resetForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Resetting...' : 'Set New Password'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
