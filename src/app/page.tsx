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
import { BookOpen, Contact, HelpCircle, Info, ChevronDown, History } from 'lucide-react';
import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HistoryItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

function HistorySection() {
  const { history, loadChatFromHistory } = useAppContext();
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const handleHistoryClick = (item: HistoryItem) => {
    loadChatFromHistory(item.messages);
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
      <SidebarGroup>
          <CollapsibleTrigger className='w-full'>
              <SidebarGroupLabel className='flex justify-between items-center cursor-pointer'>
                  <div className='flex items-center gap-2'>
                    <History />
                    History
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
          </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu>
            {history.map(item => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton variant="ghost" onClick={() => handleHistoryClick(item)} className="h-auto flex-col items-start">
                  <span className="font-semibold text-sm truncate w-full">{item.topic}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function AppLayout() {
  const { view, setView, studentProfile, setChat, setQuiz, isProfileOpen, setIsProfileOpen } = useAppContext();

  const handleNewExplanation = () => {
    setChat([]);
    setView('explanation');
  };

  const handleNewQuiz = () => {
    setQuiz(null);
    setView('quiz');
  };

  const handleAbout = () => {
    setView('about');
  };

  const handleContact = () => {
    setView('contact');
  }
  
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
                New Chat
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
          <HistorySection />
          <SidebarSeparator />
          <Collapsible open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <SidebarGroup>
                <CollapsibleTrigger className='w-full'>
                    <SidebarGroupLabel className='flex justify-between items-center cursor-pointer'>
                        Student Profile
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </SidebarGroupLabel>
                </CollapsibleTrigger>
              <CollapsibleContent>
                <StudentProfile />
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton variant="ghost" onClick={handleAbout} isActive={view === 'about'}><Info/>About</SidebarMenuButton>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton variant="ghost" onClick={handleContact} isActive={view === 'contact'}><Contact/>Contact</SidebarMenuButton>
                 </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator/>
            <div className="flex items-center gap-3 px-2">
                <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${studentProfile.name}`} />
                    <AvatarFallback>{getInitials(studentProfile.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-sm truncate">{studentProfile.name || "Student"}</span>
                    <span className="text-xs text-muted-foreground">{studentProfile.classLevel || "Learner"}</span>
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
