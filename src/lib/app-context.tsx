

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { StudentProfile, ChatMessage, Quiz, HistoryItem, Interaction, ProgressData } from '@/lib/types';
import { isToday, isPast } from 'date-fns';
import { useFirebase, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

interface AdContent {
    title: string;
    description: string;
}

type AppView = 'welcome' | 'explanation' | 'quiz' | 'auth' | 'forgot-password' | 'teacher-companion' | 'progress';

type PostLoginAction = 'upgrade' | null;

interface AppContextType {
  studentProfile: StudentProfile;
  setStudentProfile: (profile: Partial<StudentProfile>) => void;
  saveProfileToFirestore: (profile: Partial<StudentProfile>) => void;
  incrementUsage: (type?: 'explanation' | 'quiz' | 'teacher-companion') => void;
  view: AppView;
  setView: (view: AppView) => void;
  chat: ChatMessage[];
  setChat: (chat: ChatMessage[]) => void;
  addToChat: (message: ChatMessage, historyType?: 'explanation' | 'teacher-companion') => void;
  quiz: Quiz | null;
  setQuiz: (quiz: Quiz | null) => void;
  history: HistoryItem[];
  teacherHistory: HistoryItem[];
  loadChatFromHistory: (historyItem: HistoryItem, historyType: 'explanation' | 'teacher-companion') => void;
  deleteFromHistory: (id: string, historyType: 'explanation' | 'teacher-companion') => void;
  clearHistory: (historyType: 'explanation' | 'teacher-companion') => void;
  isProfileComplete: boolean;
  isAdOpen: boolean;
  showAd: (content?: Partial<AdContent>) => void;
  hideAd: () => void;
  adContent: Partial<AdContent>;
  user: User | null;
  isUserLoading: boolean;
  activeHistoryId: string | null;
  setActiveHistoryId: (id: string | null) => void;
  postLoginAction: PostLoginAction;
  setPostLoginAction: (action: PostLoginAction) => void;
  clearPostLoginAction: () => void;
  interactions: Interaction[];
  addInteraction: (interaction: Omit<Interaction, 'id' | 'timestamp'>) => void;
  progressData: ProgressData | null;
  setProgressData: (data: ProgressData | null) => void;
  progressError: string | null;
  setProgressError: (error: string | null) => void;
  isProgressLoading: boolean;
  setIsProgressLoading: (loading: boolean) => void;
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
    proDailyRequests: 0,
    proRequestTimestamps: [],
    isBlocked: false,
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, firestore, isUserLoading } = useFirebase();
  const [studentProfile, setStudentProfileState] = useState<StudentProfile>(defaultProfile);
  const [view, setViewState] = useState<AppView>('explanation');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [teacherHistory, setTeacherHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [adContent, setAdContent] = useState<Partial<AdContent>>({});
  const [hasShownFirstAdToday, setHasShownFirstAdToday] = useState(false);
  const [postLoginAction, setPostLoginAction] = useState<PostLoginAction>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  const clearPostLoginAction = useCallback(() => {
    setPostLoginAction(null);
  }, []);

  const setView = (view: AppView) => {
    const mainViews: AppView[] = ['welcome', 'explanation', 'quiz', 'teacher-companion', 'progress'];
    if (mainViews.includes(view)) {
      if (pathname !== '/' && view !== 'progress') {
        router.push('/');
      } else if (view === 'progress' && pathname !== '/progress') {
        router.push('/progress');
      }
      setViewState(view);
    } else {
      router.push(`/${view}`);
    }
  };


  const getHistoryKey = useCallback((type: 'explanation' | 'teacher-companion') => {
      if (!user) return null;
      return type === 'explanation' ? `explanationHistory_${user.uid}` : `teacherCompanionHistory_${user.uid}`;
  }, [user]);

  const getInteractionsKey = useCallback(() => {
    if (!user) return null;
    return `interactions_${user.uid}`;
  }, [user]);

  const addInteraction = useCallback((interaction: Omit<Interaction, 'id' | 'timestamp'>) => {
    const interactionsKey = getInteractionsKey();
    if (!interactionsKey) return;

    const newInteraction: Interaction = {
      ...interaction,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
    };

    setInteractions(prev => {
        const updatedInteractions = [...prev, newInteraction];
        try {
            localStorage.setItem(interactionsKey, JSON.stringify(updatedInteractions));
        } catch (e) {
            console.error("Failed to save interactions to localStorage", e);
        }
        return updatedInteractions;
    });
  }, [getInteractionsKey]);


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

  // Effect to load local data (history, interactions) on user change
  useEffect(() => {
    if (isUserLoading) return;
    
    if (user) {
      const explanationHistoryKey = getHistoryKey('explanation');
      if (explanationHistoryKey) {
        try {
          const stored = localStorage.getItem(explanationHistoryKey);
          if (stored) setHistory(sortHistory(JSON.parse(stored)));
          else setHistory([]);
        } catch (error) {
          console.error("Failed to parse explanation history", error);
          localStorage.removeItem(explanationHistoryKey);
          setHistory([]);
        }
      }

      const teacherHistoryKey = getHistoryKey('teacher-companion');
       if (teacherHistoryKey) {
        try {
          const stored = localStorage.getItem(teacherHistoryKey);
          if (stored) setTeacherHistory(sortHistory(JSON.parse(stored)));
          else setTeacherHistory([]);
        } catch (error) {
          console.error("Failed to parse teacher history", error);
          localStorage.removeItem(teacherHistoryKey);
          setTeacherHistory([]);
        }
      }

      const interactionsKey = getInteractionsKey();
      if (interactionsKey) {
          try {
              const stored = localStorage.getItem(interactionsKey);
              if (stored) setInteractions(JSON.parse(stored));
              else setInteractions([]);
          } catch (e) {
              console.error("Failed to parse interactions", e);
              localStorage.removeItem(interactionsKey);
              setInteractions([]);
          }
      }

      if (pathname === '/auth' || pathname === '/forgot-password') {
          if(!postLoginAction) {
            router.push('/');
          }
      }
    } else {
      // Clear all data on logout
      setChat([]);
      setQuiz(null);
      setHistory([]);
      setTeacherHistory([]);
      setInteractions([]);
      setProgressData(null);
      setActiveHistoryId(null);
      setStudentProfileState(defaultProfile);
    }
  }, [user, isUserLoading, getHistoryKey, pathname, router, postLoginAction, getInteractionsKey]);


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
          proDailyRequests: firestoreProfile.proDailyRequests,
          proRequestTimestamps: firestoreProfile.proRequestTimestamps,
          isBlocked: firestoreProfile.isBlocked,
        };
        
        let isNewDay = serverProfile.lastUsageDate && !isToday(new Date(serverProfile.lastUsageDate));

        // Daily usage reset logic
        if (isNewDay) {
          const updatedUsage = { 
              dailyUsage: 0, 
              dailyQuizUsage: 0, 
              proDailyRequests: 0,
              lastUsageDate: new Date().toISOString() 
            };
          serverProfile = { ...serverProfile, ...updatedUsage };
          if (userProfileRef) {
            setDocumentNonBlocking(userProfileRef, { ...updatedUsage, proRequestTimestamps: [] }, { merge: true });
          }
          setHasShownFirstAdToday(false); // Reset ad flag for new day
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

    const finalProfile = { ...studentProfile, ...values };
    setStudentProfileState(finalProfile);
    const isComplete = !!finalProfile.name && !!finalProfile.classLevel && !!finalProfile.board;
    setIsProfileComplete(isComplete);
  }


  const incrementUsage = (type: 'explanation' | 'quiz' | 'teacher-companion' = 'explanation') => {
    if (!userProfileRef) return;
    
    const now = new Date().toISOString();
    
    if (studentProfile.isPro) {
        const newTimestamps = [...(studentProfile.proRequestTimestamps || []), now].slice(-100);
        setStudentProfileState(prev => ({
            ...prev,
            proDailyRequests: (prev.proDailyRequests || 0) + 1,
            proRequestTimestamps: newTimestamps,
            lastUsageDate: now
        }));

        setDocumentNonBlocking(userProfileRef, { 
            proDailyRequests: (studentProfile.proDailyRequests || 0) + 1,
            proRequestTimestamps: newTimestamps,
            lastUsageDate: now
        }, { merge: true });

    } else {
        // Free user usage tracking
        if (type === 'explanation') {
            const newUsage = (studentProfile.dailyUsage || 0) + 1;
            setStudentProfileState(prev => ({ ...prev, dailyUsage: newUsage, lastUsageDate: now }));
            setDocumentNonBlocking(userProfileRef, { dailyUsage: newUsage, lastUsageDate: now }, { merge: true });
        } else if (type === 'quiz') {
            const newQuizUsage = (studentProfile.dailyQuizUsage || 0) + 1;
            setStudentProfileState(prev => ({ ...prev, dailyQuizUsage: newQuizUsage, lastUsageDate: now }));
            setDocumentNonBlocking(userProfileRef, { dailyQuizUsage: newQuizUsage, lastUsageDate: now }, { merge: true });
        }
    }
  }
  
  const updateAndSaveHistory = useCallback((newHistory: HistoryItem[], historyType: 'explanation' | 'teacher-companion') => {
    const historyKey = getHistoryKey(historyType);
    if (!historyKey) return;

    const sorted = sortHistory(newHistory);
    if (historyType === 'explanation') {
      setHistory(sorted);
    } else {
      setTeacherHistory(sorted);
    }
    
    try {
        localStorage.setItem(historyKey, JSON.stringify(sorted));
    } catch (error) {
        console.error("Failed to save history to localStorage", error);
    }
  }, [getHistoryKey]);

  const addToChat = useCallback((message: ChatMessage, historyType: 'explanation' | 'teacher-companion' = 'explanation') => {
    setChat(prevChat => {
        const updatedChat = [...prevChat, message];
        const currentHistory = historyType === 'explanation' ? history : teacherHistory;
        
        let topic = '';
        if (prevChat.length > 0) {
            const firstUserMessage = prevChat[0];
            const topicContent = firstUserMessage.content;
            if (typeof topicContent === 'string') {
                topic = topicContent.substring(0, 50);
            } else if (typeof topicContent === 'object' && 'text' in topicContent) {
                topic = topicContent.text.substring(0, 50);
            }
        } else {
            const topicContent = message.content;
            if (message.role === 'user' && typeof topicContent === 'object' && 'text' in topicContent) {
                topic = topicContent.text.substring(0,50);
            }
        }

        if (message.role === 'user' && topic) {
            addInteraction({ type: 'explanation', topic });
        }

        if (activeHistoryId) {
             const newHistory = currentHistory.map(item => {
                if (item.id === activeHistoryId) {
                    return { ...item, messages: updatedChat, timestamp: new Date().toISOString() };
                }
                return item;
            });
            updateAndSaveHistory(newHistory, historyType);
        } else if (prevChat.length === 1 && message.role === 'assistant') { 
            
            const newHistoryItem: HistoryItem = {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              topic,
              messages: updatedChat,
            };

            setActiveHistoryId(newHistoryItem.id); 
            updateAndSaveHistory([newHistoryItem, ...currentHistory], historyType);
        }
        
        return updatedChat;
    });
  }, [activeHistoryId, history, teacherHistory, updateAndSaveHistory, addInteraction]);
  
  const deleteFromHistory = (id: string, historyType: 'explanation' | 'teacher-companion') => {
    const currentHistory = historyType === 'explanation' ? history : teacherHistory;
    const newHistory = currentHistory.filter(item => item.id !== id);
    updateAndSaveHistory(newHistory, historyType);
    if (activeHistoryId === id) {
        setChat([]);
        setActiveHistoryId(null);
    }
  };
  
  const clearHistory = (historyType: 'explanation' | 'teacher-companion') => {
    updateAndSaveHistory([], historyType);
    
    if (historyType === 'explanation' && view === 'explanation') {
      setChat([]);
      setActiveHistoryId(null);
    } else if (historyType === 'teacher-companion' && view === 'teacher-companion') {
      setChat([]);
      setActiveHistoryId(null);
    }
  };

  const loadChatFromHistory = (historyItem: HistoryItem, historyType: 'explanation' | 'teacher-companion') => {
    setChat(historyItem.messages);
    setActiveHistoryId(historyItem.id);
    setView(historyType);
  };
  
  useEffect(() => {
    let adInterval: NodeJS.Timeout | undefined;
    if (user && !studentProfile.isPro && !isAdOpen) {
      if (!hasShownFirstAdToday) {
        showAd();
        setHasShownFirstAdToday(true);
      } else {
        adInterval = setInterval(() => { showAd(); }, 3600 * 1000);
      }
    }
    return () => {
        if (adInterval) clearInterval(adInterval);
    };
  }, [user, studentProfile.isPro, isAdOpen, hasShownFirstAdToday]);

  const value: AppContextType = { 
    studentProfile, setStudentProfile, saveProfileToFirestore, incrementUsage, view, setView, chat, setChat, addToChat, 
    quiz, setQuiz, history, teacherHistory, loadChatFromHistory, deleteFromHistory, clearHistory, isProfileComplete, 
    isAdOpen, showAd, hideAd, adContent, user, isUserLoading, activeHistoryId, setActiveHistoryId,
    postLoginAction, setPostLoginAction, clearPostLoginAction,
    interactions, addInteraction, progressData, setProgressData, progressError, setProgressError, isProgressLoading, setIsProgressLoading,
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
