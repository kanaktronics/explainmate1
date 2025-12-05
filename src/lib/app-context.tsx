
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { StudentProfile, AppView, ChatMessage, Quiz, HistoryItem } from '@/lib/types';
import { isToday, isPast } from 'date-fns';
import { useFirebase, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

interface AdContent {
    title: string;
    description: string;
}

interface AppContextType {
  studentProfile: StudentProfile;
  setStudentProfile: (profile: Partial<StudentProfile>) => void;
  saveProfileToFirestore: (profile: Partial<StudentProfile>) => void;
  incrementUsage: (type?: 'explanation' | 'quiz') => void;
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
  isAdOpen: boolean;
  showAd: (content?: Partial<AdContent>) => void;
  hideAd: () => void;
  adContent: Partial<AdContent>;
  user: User | null;
  isUserLoading: boolean;
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
    dailyQuizUsage: 0,
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
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [adContent, setAdContent] = useState<Partial<AdContent>>({});

  const getHistoryKey = useCallback(() => user ? `explanationHistory_${user.uid}` : null, [user]);

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

  // Effect to load local data (history) on user change
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
      if (view === 'auth' || view === 'forgot-password') {
          setView('welcome');
      }
    } else {
      // Clear all data on logout
      setChat([]);
      setQuiz(null);
      setHistory([]);
      setStudentProfileState(defaultProfile);
    }
  }, [user, isUserLoading, getHistoryKey, view]);


  // Effect to sync Firestore profile with local state
  useEffect(() => {
    if (isUserLoading || isProfileLoading || !user) return;

    if (firestoreProfile) { // Only run if we have a user and their profile from Firestore
        let isPro = firestoreProfile.isPro || false;
        // Check for expired pro status
        if (isPro && firestoreProfile.proExpiresAt && isPast(new Date(firestoreProfile.proExpiresAt))) {
          isPro = false; // Downgrade locally
          if (userProfileRef) {
            // And update firestore in the background
            setDocumentNonBlocking(userProfileRef, { isPro: false }, { merge: true });
          }
        }

        let serverProfile: Partial<StudentProfile> = {
          ...firestoreProfile,
          id: firestoreProfile.id,
          name: firestoreProfile.name,
          email: firestoreProfile.email,
          classLevel: firestoreProfile.gradeLevel, // mapping from db field
          board: firestoreProfile.board,
          weakSubjects: (firestoreProfile.weakSubjects || []).join(', '),
          isPro: isPro,
        };

        // Daily usage reset logic
        if (serverProfile.lastUsageDate && !isToday(new Date(serverProfile.lastUsageDate))) {
          const updatedUsage = { dailyUsage: 0, dailyQuizUsage: 0, lastUsageDate: new Date().toISOString() };
          serverProfile = { ...serverProfile, ...updatedUsage };
          if (userProfileRef) {
            setDocumentNonBlocking(userProfileRef, updatedUsage, { merge: true });
          }
        }
        
        const finalProfile: StudentProfile = {
            ...defaultProfile,
            ...serverProfile,
            email: user.email!, 
            id: user.uid,
        };

        setStudentProfileState(finalProfile);

        const isComplete = !!finalProfile.name && !!finalProfile.classLevel && !!finalProfile.board;
        setIsProfileComplete(isComplete);
        
    } else if (!firestoreProfile && !isProfileLoading) {
      // This is a new user who doesn't have a firestore doc yet.
      // Prime the state from the auth object.
      const newProfile = {
        ...defaultProfile,
        id: user.uid,
        email: user.email!,
        name: user.displayName || '',
      };
      setStudentProfileState(newProfile);
      setIsProfileComplete(false);
    }
  }, [firestoreProfile, user, isUserLoading, isProfileLoading, userProfileRef]);

  
  const setStudentProfile = (profile: Partial<StudentProfile>) => {
    const updatedProfile = {...studentProfile, ...profile};
    setStudentProfileState(updatedProfile);
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

    const finalProfile = { ...studentProfile, ...values };
    setStudentProfileState(finalProfile);
    const isComplete = !!finalProfile.name && !!finalProfile.classLevel && !!finalProfile.board;
    setIsProfileComplete(isComplete);
  }


  const incrementUsage = (type: 'explanation' | 'quiz' = 'explanation') => {
    if (!userProfileRef || studentProfile.isPro) return;

    if (type === 'explanation') {
        const newUsage = (studentProfile.dailyUsage || 0) + 1;
        setStudentProfileState(prev => ({
            ...prev,
            dailyUsage: newUsage,
            lastUsageDate: new Date().toISOString(),
        }));
        setDocumentNonBlocking(userProfileRef, { dailyUsage: newUsage, lastUsageDate: new Date().toISOString() }, { merge: true });
    } else {
        const newQuizUsage = (studentProfile.dailyQuizUsage || 0) + 1;
        setStudentProfileState(prev => ({
            ...prev,
            dailyQuizUsage: newQuizUsage,
            lastUsageDate: new Date().toISOString(),
        }));
        setDocumentNonBlocking(userProfileRef, { dailyQuizUsage: newQuizUsage, lastUsageDate: new Date().toISOString() }, { merge: true });
    }
  }
  
  const updateAndSaveHistory = useCallback((newHistory: HistoryItem[]) => {
    const historyKey = getHistoryKey();
    if (!historyKey) return;
    const sorted = sortHistory(newHistory);
    setHistory(sorted);
    try {
        localStorage.setItem(historyKey, JSON.stringify(sorted));
    } catch (error) {
        console.error("Failed to save history to localStorage", error);
    }
  }, [getHistoryKey]);

  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newHistoryItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
    };
    // Use a function for state update to get the latest history state
    setHistory(prevHistory => {
        const updatedHistory = [newHistoryItem, ...prevHistory];
        updateAndSaveHistory(updatedHistory);
        return updatedHistory;
    });
  }, [updateAndSaveHistory]);
  
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
         setHistory(prevHistory => {
            const firstMessage = updatedChat[0];
            if (!firstMessage) return prevHistory;

            let historyUpdated = false;
            const updatedHistory = prevHistory.map(item => {
                if (item.messages[0] && JSON.stringify(item.messages[0].content) === JSON.stringify(firstMessage.content)) {
                    historyUpdated = true;
                    return { ...item, messages: updatedChat, timestamp: new Date().toISOString() };
                }
                return item;
            });
            
            if(historyUpdated) {
                updateAndSaveHistory(updatedHistory);
                return updatedHistory;
            }
            return prevHistory;
        });
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
    if (user && !studentProfile.isPro) {
      const adShownKey = `adShown_${user.uid}`;
      const adShown = sessionStorage.getItem(adShownKey);
      if (!adShown) {
        const timer = setTimeout(() => {
          showAd();
          sessionStorage.setItem(adShownKey, 'true');
        }, 30000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, studentProfile.isPro]);

  const value = { 
    studentProfile, setStudentProfile, saveProfileToFirestore, incrementUsage, view, setView, chat, setChat, addToChat, 
    quiz, setQuiz, history, loadChatFromHistory, deleteFromHistory, clearHistory, isProfileComplete, 
    isAdOpen, showAd, hideAd, adContent, user, isUserLoading
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
