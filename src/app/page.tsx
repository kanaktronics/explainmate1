'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppProvider, useAppContext } from '@/lib/app-context';
import { AppLogo } from '@/components/app-logo';
import { StudentProfile } from '@/components/student-profile';
import { MainPanel } from '@/components/main-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Contact, HelpCircle, Info, ChevronDown, History, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HistoryItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { DeleteHistoryDialog } from '@/components/delete-history-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function HistorySection() {
  const { history, loadChatFromHistory, deleteFromHistory, clearHistory } = useAppContext();
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleHistoryClick = (item: HistoryItem) => {
    loadChatFromHistory(item.messages);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    setItemToDelete(item);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteFromHistory(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const confirmClear = () => {
    clearHistory();
    setShowClearConfirm(false);
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <>
      <DeleteHistoryDialog
        isOpen={!!itemToDelete || showClearConfirm}
        onClose={() => { setItemToDelete(null); setShowClearConfirm(false); }}
        onConfirm={itemToDelete ? confirmDelete : confirmClear}
        isClearingAll={showClearConfirm}
      />
      <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SidebarGroup>
          <CollapsibleTrigger className='w-full'>
            <div className='flex justify-between items-center cursor-pointer px-2'>
              <div className='flex items-center gap-2 font-medium text-sm text-sidebar-foreground/70'>
                <History />
                History
              </div>
              <div className='flex items-center gap-1'>
                 <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); setShowClearConfirm(true);}}>
                    <X />
                 </Button>
                 <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenu>
              {history.map(item => (
                <SidebarMenuItem key={item.id} className="group/item">
                  <SidebarMenuButton variant="ghost" onClick={() => handleHistoryClick(item)} className="h-auto flex-col items-start justify-between relative">
                    <span className="font-semibold text-sm truncate w-full">{item.topic}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                  </SidebarMenuButton>
                  <button onClick={(e) => handleDeleteClick(e, item)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </>
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
