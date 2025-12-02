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
import { useAppContext } from '@/lib/app-context';
import { sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

export function ForgotPasswordView() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { setView } = useAppContext();
  const { auth } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    setIsEmailSent(false);

    try {
      await sendPasswordResetEmail(auth, values.email);
      setIsEmailSent(true);
      toast({
        title: 'Check Your Email',
        description: `A password reset link has been sent to ${values.email}.`,
      });
    } catch (error: any) {
        let title = "Error";
        let description = "An unknown error occurred.";
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/user-not-found') {
                title = "User Not Found";
                description = "There is no account associated with this email address.";
            } else if (error.code === 'auth/invalid-email') {
                title = "Invalid Email";
                description = "The email address is not valid.";
            }
        }
      toast({ variant: 'destructive', title, description });
    } finally {
        setIsLoading(false);
    }
  };
  
  if (isEmailSent) {
    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Email Sent</CardTitle>
                <CardDescription>
                    Please check your inbox for a password reset link. It might take a few minutes to arrive.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" onClick={() => setView('welcome')}>
                    Back to Sign In
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>Enter your email and we'll send you a link to reset your password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button variant="link" size="sm" className="w-full" onClick={() => setView('welcome')}>
                    Back to Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
    </div>
  );
}
