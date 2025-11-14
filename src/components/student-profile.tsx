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
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { StudentProfile as StudentProfileType } from '@/lib/types';
import { Save } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  classLevel: z.string().min(1, { message: 'Class is required.' }),
  board: z.string().min(1, { message: 'Board is required.' }),
  weakSubjects: z.string().optional(),
});

export function StudentProfile() {
  const { studentProfile, setStudentProfile, setIsProfileOpen } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: studentProfile,
  });

  useEffect(() => {
    form.reset(studentProfile);
  }, [studentProfile, form]);

  function onSubmit(values: z.infer<typeof profileSchema>) {
    setStudentProfile(values as StudentProfileType);
    toast({
      title: 'Profile Saved!',
      description: 'Your information has been updated.',
    });
    setIsProfileOpen(false);
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
