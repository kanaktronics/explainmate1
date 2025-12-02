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
import { useFirebase, initiatePasswordUpdate } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAppContext } from '@/lib/app-context';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });
  const answerForm = useForm<z.infer<typeof answerSchema>>({
    resolver: zodResolver(answerSchema),
    defaultValues: { answer: '' },
  });
  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '' },
  });

  const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    try {
      const q = query(collection(firestore, 'users'), where('email', '==', values.email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        toast({ variant: 'destructive', title: 'Error', description: 'No user found with this email.' });
      } else {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        if (!data.securityQuestion || !data.securityAnswer) {
             toast({ variant: 'destructive', title: 'Account Incomplete', description: 'This account does not have a security question set up. Please create a new account.' });
             setView('welcome');
        } else {
            setUserDoc({ id: doc.id, ...data });
            setStep('question');
        }
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
        // This is a workaround for client-side password reset.
        // It requires re-authentication, which we can't do since the user forgot their password.
        // The ideal solution is a backend function that generates a reset link.
        // As a client-side only alternative, we can update a flag in Firestore and
        // prompt the user to change password on next login.

        // For this demo, we'll re-authenticate with a temporary password (highly insecure, for demo only)
        // or simply show a success message.
        
        // This part won't work in a real scenario without a backend or email verification.
        // Firebase Auth SDK prevents password change without recent login.
        
        // Let's use a trick: we can't directly set the password. But since we are already "authenticated"
        // by the security question, we can let them log in temporarily to update the password.
        // This is a conceptual flow. A proper implementation would use Firebase Admin SDK on a server.
        
        // Since we cannot update the password directly on the client without recent auth,
        // we'll guide the user. The most secure client-side only approach is to
        // make them log in again.
        
        toast({
            title: 'Security Verified!',
            description: 'This feature is for demonstration. A real app would require a server to securely reset the password.',
        });

        // This is a UX dead-end for a pure client-side app.
        // Best we can do is send them back to login.
        setView('welcome');
        
    } catch (error: any) {
        console.error("Password reset error:", error);
        toast({ variant: 'destructive', title: 'Error', description: "Could not reset password. " + error.message });
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
