'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { AppProvider, useAppContext } from '@/lib/app-context';
import { AppLogo } from '@/components/app-logo';
import { StudentProfile } from '@/components/student-profile';
import { MainPanel } from '@/components/main-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Contact, HelpCircle, Info } from 'lucide-react';
import React from 'react';

function AppLayout() {
  const { view, setView, studentProfile, setExplanation, setQuiz } = useAppContext();

  const handleNewExplanation = () => {
    setExplanation(null);
    setView('explanation');
  };

  const handleNewQuiz = () => {
    setQuiz(null);
    setView('quiz');
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <AppLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleNewExplanation} isActive={view === 'explanation'}>
                <BookOpen />
                New Explanation
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleNewQuiz} isActive={view === 'quiz'}>
                <HelpCircle />
                New Quiz
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Student Profile</SidebarGroupLabel>
            <StudentProfile />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton variant="ghost"><Info/>About</SidebarMenuButton>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton variant="ghost"><Contact/>Contact</SidebarMenuButton>
                 </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator/>
            <div className="flex items-center gap-3 px-2">
                <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${studentProfile.name}`} />
                    <AvatarFallback>{getInitials(studentProfile.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-sm truncate">{studentProfile.name || "Student"}</span>
                    <span className="text-xs text-muted-foreground truncate">{studentProfile.classLevel || "Learner"}</span>
                </div>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <MainPanel />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
