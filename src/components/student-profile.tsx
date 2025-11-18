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
import type { StudentProfile as StudentProfileType } from '@/lib/types';
import { Edit, Save } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  classLevel: z.string().min(1, { message: 'Class is required.' }),
  board: z.string().min(1, { message: 'Board is required.' }),
  weakSubjects: z.string().optional(),
});

export function StudentProfile() {
  const { studentProfile, setStudentProfile, setIsProfileOpen, isProfileComplete } = useAppContext();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(!isProfileComplete);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: studentProfile,
  });

  useEffect(() => {
    form.reset(studentProfile);
    setIsEditing(!isProfileComplete);
  }, [studentProfile, form, isProfileComplete]);

  function onSubmit(values: z.infer<typeof profileSchema>) {
    setStudentProfile(values as StudentProfileType);
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
        <Button type="submit" className="w-full">
          <Save />
          Save Profile
        </Button>
      </form>
    </Form>
  );
}
