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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useFirebase } from '@/firebase';
import { FirebaseError } from 'firebase/app';
import { AppLogo } from './app-logo';
import { setDocumentNonBlocking } from '@/firebase';
import { doc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import { useAppContext } from '@/lib/app-context';
import { securityQuestions } from '@/lib/security-questions';

const signUpSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  securityQuestion: z.string().min(1, { message: 'Please select a security question.' }),
  securityAnswer: z.string().min(3, { message: 'Answer must be at least 3 characters long.' }),
});

const signInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function AuthView() {
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();
  const { setView } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', securityQuestion: '', securityAnswer: '' },
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleAuthError = (error: any) => {
    let title = 'Authentication Error';
    let description = 'An unexpected error occurred. Please try again.';

    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                title = 'Email Already Registered';
                description = 'This email is already in use. Please sign in or use a different email.';
                break;
            case 'auth/invalid-email':
                title = 'Invalid Email';
                description = 'The email address you entered is not valid.';
                break;
            case 'auth/wrong-password':
                title = 'Incorrect Password';
                description = 'The password you entered is incorrect. Please try again.';
                break;
            case 'auth/user-not-found':
                 title = 'User Not Found';
                description = 'No account found with this email. Please sign up first.';
                break;
             case 'auth/invalid-credential':
                title = 'Invalid Credentials';
                description = 'The email or password you entered is incorrect.';
                break;
            default:
                description = error.message;
        }
    }
    
    toast({
        variant: 'destructive',
        title,
        description,
    });
  }

  async function onSignUp(values: z.infer<typeof signUpSchema>) {
    setIsSubmitting(true);
    try {
        const userCredential = await initiateEmailSignUp(auth, values.email, values.password);
        const user = userCredential.user;
        const userProfile = {
            id: user.uid,
            email: user.email,
            name: user.displayName || '',
            gradeLevel: '',
            board: '',
            weakSubjects: [],
            isPro: false,
            securityQuestion: values.securityQuestion,
            securityAnswer: values.securityAnswer, // In a real app, this would be hashed
        };
        const profileRef = doc(firestore, 'users', user.uid);
        setDocumentNonBlocking(profileRef, userProfile, { merge: true });
        // The onAuthStateChanged listener will handle the redirect
    } catch (error) {
        handleAuthError(error);
    } finally {
        setIsSubmitting(false);
    }
  }
  
  async function onSignIn(values: z.infer<typeof signInSchema>) {
    setIsSubmitting(true);
    try {
        const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
        const auth = getAuth();
        await signInWithEmailAndPassword(auth, values.email, values.password);
        // The onAuthStateChanged listener will handle the redirect
    } catch (error) {
        handleAuthError(error);
    } finally {
        setIsSubmitting(false);
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className='mb-8'>
            <AppLogo />
        </div>
      <Tabs defaultValue="signin" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back!</CardTitle>
              <CardDescription>Sign in to access your Pro features.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                  </Button>
                   <Button variant="link" size="sm" className="w-full" onClick={() => setView('forgot-password')}>
                    Forgot Password?
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>Get started with ExplainMate.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Must be at least 8 characters" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="securityQuestion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Question</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a question" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {securityQuestions.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="securityAnswer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Answer</FormLabel>
                        <FormControl><Input type="password" placeholder="Your secret answer" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
