'use client';

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
import { useAppContext } from '@/lib/app-context';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { StudentProfile as StudentProfileType } from '@/lib/types';
import { Edit, Save, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { securityQuestions } from '@/lib/security-questions';


const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  classLevel: z.string().min(1, { message: 'Class is required.' }),
  board: z.string().min(1, { message: 'Board is required.' }),
  weakSubjects: z.string().optional(),
  securityQuestion: z.string().min(1, { message: 'Please select a security question.' }),
  securityAnswer: z.string().min(3, { message: 'Answer must be at least 3 characters long.' }),
});

export function StudentProfile() {
  const { studentProfile, setStudentProfile, setIsProfileOpen, isProfileComplete } = useAppContext();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(!isProfileComplete);
  const { firestore, user } = useFirebase();
  const isSecurityProfileIncomplete = !studentProfile.securityQuestion || !studentProfile.securityAnswer;

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: studentProfile.name,
      classLevel: studentProfile.classLevel,
      board: studentProfile.board,
      weakSubjects: studentProfile.weakSubjects,
      securityQuestion: studentProfile.securityQuestion || '',
      securityAnswer: '', // Don't pre-fill security answer
    },
  });

  useEffect(() => {
    form.reset({
      name: studentProfile.name,
      classLevel: studentProfile.classLevel,
      board: studentProfile.board,
      weakSubjects: studentProfile.weakSubjects,
      securityQuestion: studentProfile.securityQuestion || '',
      securityAnswer: '',
    });
    setIsEditing(!isProfileComplete || isSecurityProfileIncomplete);
  }, [studentProfile, form, isProfileComplete, isSecurityProfileIncomplete]);

  function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to save your profile.',
      });
      return;
    }
    
    const updatedProfile: StudentProfileType = {
      ...studentProfile,
      ...values,
      email: user.email!,
      id: user.uid,
    };
    
    setStudentProfile(updatedProfile);
    
    const profileRef = doc(firestore, 'users', user.uid);
    const dataToSave = {
        id: user.uid,
        name: values.name,
        email: user.email,
        gradeLevel: values.classLevel,
        board: values.board,
        weakSubjects: values.weakSubjects?.split(',').map(s => s.trim()).filter(Boolean) || [],
        isPro: studentProfile.isPro || false,
        securityQuestion: values.securityQuestion,
        securityAnswer: values.securityAnswer,
    };

    setDocumentNonBlocking(profileRef, dataToSave, { merge: true });

    toast({
      title: 'Profile Saved!',
      description: 'Your information has been updated.',
    });
    setIsEditing(false);
    setIsProfileOpen(false);
  }
  
  if (!isEditing) {
    return (
      <div className="space-y-3">
        {isSecurityProfileIncomplete && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Update Required</AlertTitle>
                <AlertDescription>
                   Please add a security question to enable password recovery.
                </AlertDescription>
            </Alert>
        )}
          <Card>
            <CardContent className="p-3 text-sm space-y-2">
                <div>
                    <p className="font-semibold">Name</p>
                    <p className="text-muted-foreground">{studentProfile.name}</p>
                </div>
                 <div>
                    <p className="font-semibold">Class</p>
                    <p className="text-muted-foreground">{studentProfile.classLevel}</p>
                </div>
                 <div>
                    <p className="font-semibold">Board</p>
                    <p className="text-muted-foreground">{studentProfile.board}</p>
                </div>
                 <div>
                    <p className="font-semibold">Weak Subjects</p>
                    <p className="text-muted-foreground">{studentProfile.weakSubjects || 'None'}</p>
                </div>
            </CardContent>
          </Card>
        <Button onClick={() => setIsEditing(true)} className="w-full" variant="outline">
          <Edit />
          Edit Profile
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isSecurityProfileIncomplete && (
             <Alert variant="destructive" className="text-destructive-foreground bg-destructive">
                <AlertTriangle className="h-4 w-4 text-destructive-foreground" />
                <AlertTitle>Account Security Update</AlertTitle>
                <AlertDescription>
                   To protect your account, please set a security question.
                </AlertDescription>
             </Alert>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="classLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 10th Grade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="board"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Board</FormLabel>
              <FormControl>
                <Input placeholder="e.g., CBSE, ICSE" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weakSubjects"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weak Subjects</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Physics, Algebra" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 space-y-4 border-t">
             <p className="text-sm font-medium">Security Question for Password Recovery</p>
            <FormField
                control={form.control}
                name="securityQuestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
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
                control={form.control}
                name="securityAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Secret Answer</FormLabel>
                    <FormControl><Input type="password" placeholder="Your secret answer" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
            />
        </div>

        <Button type="submit" className="w-full">
          <Save />
          Save Profile
        </Button>
      </form>
    </Form>
  );
}
