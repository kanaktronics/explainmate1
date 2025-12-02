

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  incrementUsage: () => void;
  view: AppView;
  setView: (view: AppView) => void;
  chat: ChatMessage[];
  setChat: (chat: ChatMessage[]) => void;
  addToChat: (message: ChatMessage, currentChat: ChatMessage[]) => void;
  quiz: Quiz | null;
  setQuiz: (quiz: Quiz | null) => void;
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
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


  const showAd = (content: Partial<AdContent> = {}) => {
    setAdContent(content);
    setIsAdOpen(true);
  };

  const hideAd = () => {
    setIsAdOpen(false);
    setAdContent({});
  };

  const getHistoryKey = () => user ? `explanationHistory_${user.uid}` : null;
  const getUsageKey = () => user ? `usage_${user.uid}` : null;

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: firestoreProfile, isLoading: isProfileLoading } = useDoc<any>(userProfileRef);

  // Effect to sync Firestore profile with local state
  useEffect(() => {
    if (isUserLoading) return;

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
        
        let usage = { dailyUsage: 0, lastUsageDate: new Date().toISOString() };
        const usageKey = getUsageKey();
        if (usageKey) {
            try {
                const storedUsage = localStorage.getItem(usageKey);
                if (storedUsage) {
                    const parsedUsage = JSON.parse(storedUsage);
                    if (!isToday(new Date(parsedUsage.lastUsageDate))) {
                        usage.dailyUsage = 0;
                        localStorage.setItem(usageKey, JSON.stringify(usage));
                    } else {
                        usage = parsedUsage;
                    }
                } else {
                    localStorage.setItem(usageKey, JSON.stringify(usage));
                }
            } catch (e) {
                 console.error("Failed to read usage from localStorage", e);
            }
        }


        const profileData: StudentProfile = {
            id: firestoreProfile.id,
            name: firestoreProfile.name,
            email: firestoreProfile.email,
            classLevel: firestoreProfile.gradeLevel,
            board: firestoreProfile.board,
            weakSubjects: (firestoreProfile.weakSubjects || []).join(', '),
            isPro: isPro,
            proExpiresAt: firestoreProfile.proExpiresAt,
            dailyUsage: usage.dailyUsage,
            lastUsageDate: usage.lastUsageDate,
        };

        setStudentProfileState(profileData);
    } else if (user) {
        const newProfile = {
            ...defaultProfile,
            id: user.uid,
            email: user.email!,
            name: user.displayName || '',
        };
        setStudentProfileState(newProfile);
        setIsProfileOpen(true); 
    } else {
        setStudentProfileState(defaultProfile);
        setView('welcome'); 
    }
  }, [firestoreProfile, user, isUserLoading, userProfileRef]);


  useEffect(() => {
    if (user) {
      const historyKey = getHistoryKey();
      if (!historyKey) return;
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
  }, [user]);

  useEffect(() => {
    const { name, classLevel, board } = studentProfile;
    setIsProfileComplete(!!name && !!classLevel && !!board);
    if (user && isProfileLoading) {
        setIsProfileOpen(false);
    } else if (user && !isProfileComplete) {
        setIsProfileOpen(true);
    } else {
        setIsProfileOpen(false);
    }
  }, [studentProfile, user, isProfileLoading, isProfileComplete]);
  
  const setStudentProfile = (profile: Partial<StudentProfile>) => {
    setStudentProfileState(prev => ({...prev, ...profile}));
  };

  const incrementUsage = () => {
    setStudentProfileState(prev => {
        const newUsage = {
            dailyUsage: prev.dailyUsage + 1,
            lastUsageDate: new Date().toISOString(),
        };

        const usageKey = getUsageKey();
        if (usageKey) {
            localStorage.setItem(usageKey, JSON.stringify(newUsage));
        }

        return { ...prev, ...newUsage };
    });
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

        setHistory(prevHistory => {
            const newHistory = prevHistory.map(item => {
                if (item.messages[0] && JSON.stringify(item.messages[0].content) === JSON.stringify(firstMessage.content)) {
                    return { ...item, messages: updatedChat, timestamp: new Date().toISOString() };
                }
                return item;
            });
            updateAndSaveHistory(newHistory);
            return sortHistory(newHistory);
        });
      }
  };

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newHistoryItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
    };
    setHistory(prevHistory => {
        const updatedHistory = [newHistoryItem, ...prevHistory];
        updateAndSaveHistory(updatedHistory);
        return updatedHistory;
    });
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
    if (!user && !isUserLoading) {
        setChat([]);
        setQuiz(null);
        setHistory([]);
        setView('welcome');
        // Usage data is keyed by UID so no need to clear it on logout
    }
  }, [user, isUserLoading]);

  useEffect(() => {
    if (studentProfile.email && !studentProfile.isPro) {
      const adShown = sessionStorage.getItem('adShown');
      if (!adShown) {
        const timer = setTimeout(() => {
          showAd();
          sessionStorage.setItem('adShown', 'true');
        }, 3000); 
        return () => clearTimeout(timer);
      }
    }
  }, [studentProfile.isPro, studentProfile.email]);

  return (
    <AppContext.Provider value={{ studentProfile, setStudentProfile, incrementUsage, view, setView, chat, setChat, addToChat, quiz, setQuiz, history, addToHistory, deleteFromHistory, clearHistory, isProfileComplete, isProfileOpen, setIsProfileOpen, loadChatFromHistory, isAdOpen, showAd, hideAd, adContent }}>
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
