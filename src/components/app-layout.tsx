

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
  SidebarSeparator,
  SidebarInset,
} from '@/components/ui/sidebar';
import { useAppContext } from '@/lib/app-context';
import { AppLogo } from '@/components/app-logo';
import { StudentProfile } from '@/components/student-profile';
import { MainPanel } from '@/components/main-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Contact, HelpCircle, Info, ChevronDown, History, Trash2, X, Sparkles, Zap, LogOut, Shield, FileText, Receipt, Truck, LogIn } from 'lucide-react';
import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HistoryItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { DeleteHistoryDialog } from '@/components/delete-history-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirebase } from '@/firebase';
import { AdPopup } from '@/components/ad-popup';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function HistorySection() {
  const { history, loadChatFromHistory, deleteFromHistory, clearHistory, user } = useAppContext();
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

  if (history.length === 0 || !user) {
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
      <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} className='px-2'>
        <div className="flex justify-between items-center px-2 py-1">
            <CollapsibleTrigger asChild>
                <div className='flex flex-1 items-center gap-2 cursor-pointer'>
                  <div className='flex items-center gap-2 font-medium text-sm text-sidebar-foreground/70'>
                    <History />
                    History
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`} />
                </div>
            </CollapsibleTrigger>
            <Button variant="ghost" size="icon" className='h-6 w-6' onClick={() => setShowClearConfirm(true)}>
                <X className='w-4 h-4'/>
            </Button>
        </div>
          <CollapsibleContent>
            <SidebarMenu>
              {history.map(item => (
                <SidebarMenuItem key={item.id} className="group/item">
                  <SidebarMenuButton variant="ghost" onClick={() => handleHistoryClick(item)} className="h-auto items-start justify-between relative">
                    <div className="flex w-full justify-between items-center">
                        <span className="font-semibold text-sm truncate">{item.topic}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                    </div>
                  </SidebarMenuButton>
                  <button onClick={(e) => handleDeleteClick(e, item)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </CollapsibleContent>
      </Collapsible>
    </>
  )
}

function ProSection() {
    const { studentProfile, user } = useAppContext();

    if (!user) return null;

    if (studentProfile.isPro) {
        return (
            <div className="px-4 py-2 text-sm font-medium text-center text-primary bg-yellow-400/20 rounded-lg mx-2 border border-yellow-400/50">
                You are using ExplainMate Pro ✨
            </div>
        )
    }

    return (
        <div className="p-2">
            <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:opacity-90" asChild>
              <Link href="/pricing">
                <Sparkles className="mr-2 h-4 w-4"/>
                Upgrade to Pro
              </Link>
            </Button>
        </div>
    )
}

function UserProfileSection() {
    const { studentProfile, user } = useAppContext();
    const { auth } = useFirebase();
    const [isProfileOpen, setIsProfileOpen] = useState(true);

    const getInitials = (name?: string | null) => {
        if (!name || typeof name !== 'string') return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    }
    
    const handleLogout = () => {
        auth?.signOut();
    }

    if (!user) {
        return (
            <div className='p-2'>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/auth">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign Up / Login
                  </Link>
                </Button>
            </div>
        );
    }

    return (
        <>
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
             <SidebarSeparator/>
            <div className="flex items-center gap-3 px-2">
                <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${studentProfile.name}`} />
                    <AvatarFallback>{getInitials(studentProfile.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <div className='flex items-center gap-2'>
                        <span className="font-semibold text-sm truncate">{studentProfile.name || "Student"}</span>
                        {studentProfile.isPro && <Badge variant="destructive" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0"><Zap className='w-3 h-3 fill-white'/>Pro</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{studentProfile.email || "Not signed in"}</span>
                </div>
            </div>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton variant="ghost" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/>Logout</SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    )
}

export function AppLayout({children}: {children: React.ReactNode}) {
  const { setChat, setQuiz, isAdOpen, hideAd, adContent, user, setView } = useAppContext();
  const { toast } = useToast();

  const handleNewExplanation = () => {
    if (!user) {
        setView('auth');
        toast({ title: 'Login Required', description: 'Please sign in to start a new chat.' });
        return;
    }
    setChat([]);
    setView('explanation');
  };

  const handleNewQuiz = () => {
    if (!user) {
        setView('auth');
        toast({ title: 'Login Required', description: 'Please sign in to start a new quiz.' });
        return;
    }
    setQuiz(null);
    setView('quiz');
  };
  
  return (
      <>
        <AdPopup isOpen={isAdOpen} onClose={hideAd} title={adContent.title} description={adContent.description} />
        <Sidebar>
            <SidebarHeader>
              <Link href="/" className='block'>
                <AppLogo />
              </Link>
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNewExplanation}>
                    <BookOpen />
                    New Chat
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNewQuiz}>
                    <HelpCircle />
                    New Quiz
                </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator />
            <ProSection />
            <SidebarSeparator />
            <HistorySection />
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton variant="ghost" href="/about"><Info/>About</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton variant="ghost" href="/contact"><Contact/>Contact</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton variant="ghost" href="/pricing"><Sparkles/>Pricing</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton variant="ghost" href="/privacy-policy"><Shield/>Privacy Policy</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton variant="ghost" href="/terms-conditions"><FileText/>Terms & Conditions</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton variant="ghost" href="/refund-policy"><Receipt/>Refund & Cancellation</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton variant="ghost" href="/service-delivery-policy"><Truck/>Service Delivery</SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarSeparator/>
                <UserProfileSection />
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <MainPanel>
              {children}
            </MainPanel>
        </SidebarInset>
      </>
  );
}
