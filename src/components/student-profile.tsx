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
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/lib/app-context';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useFirebase } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  classLevel: z.string().min(1, { message: 'Class is required.' }),
  board: z.string().min(1, { message: 'Board is required.' }),
  weakSubjects: z.string().optional(),
});

export function StudentProfile() {
  const { studentProfile, setStudentProfile, saveProfileToFirestore, setIsProfileOpen, isProfileComplete } = useAppContext();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useFirebase();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      name: studentProfile.name,
      classLevel: studentProfile.classLevel,
      board: studentProfile.board,
      weakSubjects: studentProfile.weakSubjects,
    },
  });

  useEffect(() => {
    // Automatically enter edit mode if the profile is incomplete.
    if (user && !isProfileComplete) {
        setIsEditing(true);
    }
  }, [user, isProfileComplete]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setStudentProfile({ [name]: value });
  }

  function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to save your profile.',
      });
      return;
    }
    
    // The context already has the latest values, so we just trigger the save.
    saveProfileToFirestore(values);

    toast({
      title: 'Profile Saved!',
      description: 'Your information has been updated.',
    });
    setIsEditing(false);
    setIsProfileOpen(false); // Close the profile section after saving.
  }
  
  if (!isEditing) {
    return (
      <div className="space-y-3 p-2">
          <Card>
            <CardContent className="p-3 text-sm space-y-2">
                <div>
                    <p className="font-semibold">Name</p>
                    <p className="text-muted-foreground">{studentProfile.name || 'Not set'}</p>
                </div>
                 <div>
                    <p className="font-semibold">Class</p>
                    <p className="text-muted-foreground">{studentProfile.classLevel || 'Not set'}</p>
                </div>
                 <div>
                    <p className="font-semibold">Board</p>
                    <p className="text-muted-foreground">{studentProfile.board || 'Not set'}</p>
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
    <div className='p-2'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {!isProfileComplete && (
              <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Complete Your Profile</AlertTitle>
                  <AlertDescription>
                    Please fill out your details to get started.
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
                  <Input placeholder="Your Name" {...field} onChange={(e) => { field.onChange(e); handleFieldChange(e); }} />
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
                  <Input placeholder="e.g., 10th Grade" {...field} onChange={(e) => { field.onChange(e); handleFieldChange(e); }}/>
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
                  <Input placeholder="e.g., CBSE, ICSE" {...field} onChange={(e) => { field.onChange(e); handleFieldChange(e); }}/>
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
                  <Input placeholder="e.g., Physics, Algebra" {...field} onChange={(e) => { field.onChange(e); handleFieldChange(e); }}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            <Save />
            Save Profile
          </Button>
        </form>
      </Form>
    </div>
  );
}
