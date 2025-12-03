

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { StudentProfile, AppView, ChatMessage, Quiz, HistoryItem } from '@/lib/types';
import { isToday, isPast } from 'date-fns';
import { useFirebase, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface AdContent {
    title: string;
    description: string;
}

interface AppContextType {
  studentProfile: StudentProfile;
  setStudentProfile: (profile: Partial<StudentProfile>) => void;
  saveProfileToFirestore: (profile: Partial<StudentProfile>) => void;
  incrementUsage: () => void;
  view: AppView;
  setView: (view: AppView) => void;
  chat: ChatMessage[];
  setChat: (chat: ChatMessage[]) => void;
  addToChat: (message: ChatMessage, currentChat: ChatMessage[]) => void;
  quiz: Quiz | null;
  setQuiz: (quiz: Quiz | null) => void;
  history: HistoryItem[];
  loadChatFromHistory: (messages: ChatMessage[]) => void;
  deleteFromHistory: (id: string) => void;
  clearHistory: () => void;
  isProfileComplete: boolean;
  isProfileOpen: boolean;
  setIsProfileOpen: (isOpen: boolean) => void;
  isAdOpen: boolean;
  showAd: (content?: Partial<AdContent>) => void;
  hideAd: () => void;
  adContent: Partial<AdContent>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const sortHistory = (history: HistoryItem[]) => {
  return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const defaultProfile: StudentProfile = {
    name: '',
    email: '',
    classLevel: '',
    board: '',
    weakSubjects: '',
    isPro: false,
    dailyUsage: 0,
    lastUsageDate: new Date().toISOString(),
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, firestore, isUserLoading } = useFirebase();
  const [studentProfile, setStudentProfileState] = useState<StudentProfile>(defaultProfile);
  const [view, setView] = useState<AppView>('welcome');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [adContent, setAdContent] = useState<Partial<AdContent>>({});

  const getHistoryKey = useCallback(() => user ? `explanationHistory_${user.uid}` : null, [user]);
  const getProfileDraftKey = useCallback(() => user ? `profileDraft_${user.uid}` : null, [user]);

  const showAd = (content: Partial<AdContent> = {}) => {
    setAdContent(content);
    setIsAdOpen(true);
  };

  const hideAd = () => {
    setIsAdOpen(false);
    setAdContent({});
  };

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: firestoreProfile, isLoading: isProfileLoading } = useDoc<any>(userProfileRef);

  // Effect to load data from localStorage on user change
  useEffect(() => {
    if (isUserLoading) return;
    
    if (user) {
      // Load History from Local Storage
      const historyKey = getHistoryKey();
      if (historyKey) {
        try {
          const storedHistory = localStorage.getItem(historyKey);
          if (storedHistory) {
            setHistory(sortHistory(JSON.parse(storedHistory)));
          } else {
            setHistory([]);
          }
        } catch (error) {
          console.error("Failed to parse history from localStorage", error);
          localStorage.removeItem(historyKey);
          setHistory([]);
        }
      }

      // Load Profile Draft from Local Storage
      const profileDraftKey = getProfileDraftKey();
      if (profileDraftKey) {
        try {
          const storedDraft = localStorage.getItem(profileDraftKey);
          if (storedDraft) {
            const draftProfile = JSON.parse(storedDraft);
            setStudentProfileState(prev => ({...prev, ...draftProfile}));
          }
        } catch (error) {
          console.error("Failed to parse profile draft from localStorage", error);
        }
      }
    } else {
      // Clear all local data on logout
      setChat([]);
      setQuiz(null);
      setHistory([]);
      setStudentProfileState(defaultProfile);
      setView('welcome');
    }
  }, [user, isUserLoading, getHistoryKey, getProfileDraftKey]);


  // Effect to sync Firestore profile with local state
  useEffect(() => {
    if (firestoreProfile) {
        let isPro = firestoreProfile.isPro || false;
        
        if (isPro && firestoreProfile.proExpiresAt) {
            if (isPast(new Date(firestoreProfile.proExpiresAt))) {
                isPro = false;
                if (userProfileRef) {
                    setDocumentNonBlocking(userProfileRef, { isPro: false }, { merge: true });
                }
            }
        }
        
        const serverProfile: StudentProfile = {
            id: firestoreProfile.id,
            name: firestoreProfile.name,
            email: firestoreProfile.email,
            classLevel: firestoreProfile.gradeLevel,
            board: firestoreProfile.board,
            weakSubjects: (firestoreProfile.weakSubjects || []).join(', '),
            isPro: isPro,
            proExpiresAt: firestoreProfile.proExpiresAt,
            dailyUsage: firestoreProfile.dailyUsage || 0,
            lastUsageDate: firestoreProfile.lastUsageDate || new Date().toISOString(),
        };

        setStudentProfileState(prev => ({ ...prev, ...serverProfile }));

        // Daily usage reset logic
        if (!isToday(new Date(serverProfile.lastUsageDate))) {
            const updatedUsage = {
                dailyUsage: 0,
                lastUsageDate: new Date().toISOString()
            };
            setStudentProfileState(prev => ({ ...prev, ...updatedUsage}));
            if (userProfileRef) {
                setDocumentNonBlocking(userProfileRef, updatedUsage, { merge: true });
            }
        }
    } else if (user && !isProfileLoading) {
        const newProfile = {
            ...studentProfile, // Keep draft if exists
            id: user.uid,
            email: user.email!,
            name: user.displayName || studentProfile.name || '',
        };
        setStudentProfileState(newProfile);
        setIsProfileOpen(true); 
    }
  }, [firestoreProfile, user, isProfileLoading, userProfileRef]);


  useEffect(() => {
    const { name, classLevel, board } = studentProfile;
    setIsProfileComplete(!!name && !!classLevel && !!board);
  }, [studentProfile]);

  useEffect(() => {
      if(user && !isProfileComplete) {
          setIsProfileOpen(true);
      } else {
          setIsProfileOpen(false);
      }
  }, [user, isProfileComplete]);
  
  const setStudentProfile = (profile: Partial<StudentProfile>) => {
    const profileDraftKey = getProfileDraftKey();
    if (profileDraftKey) {
        try {
            const currentDraft = JSON.parse(localStorage.getItem(profileDraftKey) || '{}');
            const newDraft = {...currentDraft, ...profile};
            localStorage.setItem(profileDraftKey, JSON.stringify(newDraft));
        } catch (e) {
            console.error("Failed to save profile draft to localStorage", e);
        }
    }
    setStudentProfileState(prev => ({...prev, ...profile}));
  };

  const saveProfileToFirestore = (values: Partial<StudentProfile>) => {
    if (!user || !firestore) return;
    const profileRef = doc(firestore, 'users', user.uid);
    const dataToSave = {
        name: values.name,
        gradeLevel: values.classLevel,
        board: values.board,
        weakSubjects: values.weakSubjects?.split(',').map(s => s.trim()).filter(Boolean) || [],
    };
    setDocumentNonBlocking(profileRef, dataToSave, { merge: true });

    // Clear the draft from local storage after successful save
    const profileDraftKey = getProfileDraftKey();
    if (profileDraftKey) {
        localStorage.removeItem(profileDraftKey);
    }
  }


  const incrementUsage = () => {
    if (!userProfileRef) return;
    
    const newUsage = studentProfile.dailyUsage + 1;
    
    setStudentProfileState(prev => ({
        ...prev,
        dailyUsage: newUsage
    }));
    
    setDocumentNonBlocking(userProfileRef, { dailyUsage: newUsage }, { merge: true });
  }
  
  const updateAndSaveHistory = (newHistory: HistoryItem[]) => {
    const historyKey = getHistoryKey();
    if (!historyKey) return;
    const sorted = sortHistory(newHistory);
    setHistory(sorted);
    try {
        localStorage.setItem(historyKey, JSON.stringify(sorted));
    } catch (error) {
        console.error("Failed to save history to localStorage", error);
    }
  };

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newHistoryItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
    };
    const updatedHistory = [newHistoryItem, ...history];
    updateAndSaveHistory(updatedHistory);
  };
  
  const addToChat = (message: ChatMessage, currentChat: ChatMessage[]) => {
      const updatedChat = [...currentChat, message];
      setChat(updatedChat);

      if (updatedChat.length === 2 && updatedChat[0].role === 'user' && updatedChat[1].role === 'assistant') {
        const firstUserMessage = updatedChat[0];
        const topicContent = firstUserMessage.content;
        let topic = '';

        if (typeof topicContent === 'string') {
          topic = topicContent.substring(0, 50);
        } else if (typeof topicContent === 'object' && 'text' in topicContent) {
          topic = topicContent.text.substring(0,50);
        }
        
        addToHistory({ topic, messages: updatedChat });
      } else {
        const firstMessage = updatedChat[0];
        if (!firstMessage) return;

        const updatedHistory = history.map(item => {
            if (item.messages[0] && JSON.stringify(item.messages[0].content) === JSON.stringify(firstMessage.content)) {
                return { ...item, messages: updatedChat, timestamp: new Date().toISOString() };
            }
            return item;
        });
        updateAndSaveHistory(updatedHistory);
      }
  };
  
  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    updateAndSaveHistory(newHistory);
  };
  
  const clearHistory = () => {
    updateAndSaveHistory([]);
  };

  const loadChatFromHistory = (messages: ChatMessage[]) => {
    setChat(messages);
    setView('explanation');
  };
  
  useEffect(() => {
    if (studentProfile.email && !studentProfile.isPro) {
      const adShownKey = `adShown_${user?.uid}`;
      const adShown = sessionStorage.getItem(adShownKey);
      if (!adShown) {
        const timer = setTimeout(() => {
          showAd();
          sessionStorage.setItem(adShownKey, 'true');
        }, 3000); 
        return () => clearTimeout(timer);
      }
    }
  }, [studentProfile.isPro, studentProfile.email, user?.uid]);

  const value = { 
    studentProfile, setStudentProfile, saveProfileToFirestore, incrementUsage, view, setView, chat, setChat, addToChat, 
    quiz, setQuiz, history, loadChatFromHistory, deleteFromHistory, clearHistory, isProfileComplete, 
    isProfileOpen, setIsProfileOpen, isAdOpen, showAd, hideAd, adContent 
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
