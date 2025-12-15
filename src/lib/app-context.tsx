

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import type { StudentProfile, ChatMessage, Quiz, HistoryItem, Interaction, ProgressData } from '@/lib/types';
import { isToday, isPast, differenceInDays } from 'date-fns';
import { useFirebase, useDoc, useCollection, setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { runProgressEngineAction } from './actions';

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
  loadChatFromHistory: (historyItem: HistoryItem) => void;
  deleteFromHistory: (id: string) => void;
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
  weeklyTimeSpent: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
    weeklyTimeSpent: 0,
    timeSpentLastReset: new Date().toISOString(),
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, firestore, isUserLoading } = useFirebase();
  const [studentProfile, setStudentProfileState] = useState<StudentProfile>(defaultProfile);
  const [view, setViewState] = useState<AppView>('explanation');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [adContent, setAdContent] = useState<Partial<AdContent>>({});
  const [hasShownFirstAdToday, setHasShownFirstAdToday] = useState(false);
  const [postLoginAction, setPostLoginAction] = useState<PostLoginAction>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(false);
  const [weeklyTimeSpent, setWeeklyTimeSpent] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const recentlySaved = useRef(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  // Firestore-based time tracking
  useEffect(() => {
      if (!user || !userProfileRef) return;

      const interval = setInterval(() => {
          setStudentProfileState(prev => {
              const newTime = (prev.weeklyTimeSpent || 0) + 5;
              setDocumentNonBlocking(userProfileRef, { weeklyTimeSpent: newTime }, { merge: true });
              return { ...prev, weeklyTimeSpent: newTime };
          });
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
  }, [user, userProfileRef]);


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


  const historyRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'history'), orderBy('timestamp', 'desc'), limit(100));
  }, [user, firestore]);
  
  const { data: allHistoryItems = [] } = useCollection<HistoryItem>(historyRef);

  const history = useMemo(() => allHistoryItems?.filter(item => item.type === 'explanation') || [], [allHistoryItems]);
  const teacherHistory = useMemo(() => allHistoryItems?.filter(item => item.type === 'teacher-companion') || [], [allHistoryItems]);
  
  const interactionsRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'interactions');
  }, [user, firestore]);
  
  const { data: interactions = [] } = useCollection<Interaction>(interactionsRef);


  const addInteraction = useCallback((interaction: Omit<Interaction, 'id' | 'timestamp'>) => {
    if (!interactionsRef) return;

    const newInteraction = {
      ...interaction,
      timestamp: new Date().toISOString(),
    };
    
    addDocumentNonBlocking(interactionsRef, newInteraction);

  }, [interactionsRef]);


  const showAd = useCallback((content: Partial<AdContent> = {}) => {
    setAdContent(content);
    setIsAdOpen(true);
  }, []);

  const hideAd = () => {
    setIsAdOpen(false);
    setAdContent({});
  };

  const { data: firestoreProfile, isLoading: isProfileLoading } = useDoc<any>(userProfileRef);
  
  const triggerProgressEngine = useCallback(async () => {
    if (!user || !interactions) {
        setProgressData(null);
        setProgressError(null);
        return;
    }
    
    if (interactions.length === 0) {
        setProgressData(null);
        setProgressError(null);
        return;
    }

    setIsProgressLoading(true);
    setProgressError(null);
    const result = await runProgressEngineAction({
      studentId: user.uid,
      interactions: interactions,
      languagePreference: 'en',
    });
    if (result && 'error' in result) {
      console.error("Progress engine failed:", result.error);
      setProgressError(result.error);
    } else if (result) {
      setProgressData(result as ProgressData);
    }
    setIsProgressLoading(false);
  }, [user, interactions]);


  useEffect(() => {
    if (pathname === '/progress' && !isUserLoading && interactions) {
      triggerProgressEngine();
    }
  }, [pathname, isUserLoading, interactions, triggerProgressEngine]);

  // Effect to handle user login/logout
  useEffect(() => {
    if (isUserLoading) return;
    
    if (user) {
       if (pathname === '/auth' || pathname === '/forgot-password') {
          if(!postLoginAction) {
            router.push('/');
          }
      }
    } else {
      // Clear all data on logout
      setChat([]);
      setQuiz(null);
      setProgressData(null);
      setActiveHistoryId(null);
      setStudentProfileState(defaultProfile);
    }
  }, [user, isUserLoading, pathname, router, postLoginAction]);


  // Effect to sync Firestore profile with local state
  useEffect(() => {
    if (isUserLoading || isProfileLoading || !user) return;
    
    if (recentlySaved.current) {
        recentlySaved.current = false;
        return;
    }

    if (firestoreProfile) { // Only run if we have a user and their profile from Firestore
        let isPro = firestoreProfile.proExpiresAt && !isPast(new Date(firestoreProfile.proExpiresAt));
        
        const isProInDb = firestoreProfile.isPro === true; 
        if (isPro !== isProInDb) {
            if (userProfileRef && typeof isPro === 'boolean') {
                setDocumentNonBlocking(userProfileRef, { isPro: isPro }, { merge: true });
            }
        }
        
        let serverProfile: Partial<StudentProfile> = {
          ...firestoreProfile,
          id: firestoreProfile.id,
          name: firestoreProfile.name,
          email: firestoreProfile.email,
          classLevel: firestoreProfile.gradeLevel,
          board: firestoreProfile.board,
          weakSubjects: (firestoreProfile.weakSubjects || []).join(', '),
          isPro: isPro,
          proDailyRequests: firestoreProfile.proDailyRequests,
          proRequestTimestamps: firestoreProfile.proRequestTimestamps,
          isBlocked: firestoreProfile.isBlocked,
          weeklyTimeSpent: firestoreProfile.weeklyTimeSpent || 0,
          timeSpentLastReset: firestoreProfile.timeSpentLastReset || new Date().toISOString(),
        };
        
        const isNewDay = serverProfile.lastUsageDate && !isToday(new Date(serverProfile.lastUsageDate));
        const today = new Date();
        const lastTimeReset = new Date(serverProfile.timeSpentLastReset!);
        const isNewWeek = differenceInDays(today, lastTimeReset) >= 7;

        // Daily usage reset logic
        if (isNewDay) {
          const updatedUsage = { 
              dailyUsage: 0, 
              dailyQuizUsage: 0, 
              proDailyRequests: 0,
              lastUsageDate: today.toISOString() 
            };
          serverProfile = { ...serverProfile, ...updatedUsage };
          if (userProfileRef) {
            setDocumentNonBlocking(userProfileRef, { ...updatedUsage, proRequestTimestamps: [] }, { merge: true });
          }
          setHasShownFirstAdToday(false); // Reset ad flag for new day
        }

        // Weekly time spent reset
        if(isNewWeek) {
            serverProfile.weeklyTimeSpent = 0;
            serverProfile.timeSpentLastReset = today.toISOString();
            if (userProfileRef) {
                setDocumentNonBlocking(userProfileRef, { weeklyTimeSpent: 0, timeSpentLastReset: today.toISOString() }, { merge: true });
            }
        }
        
        const finalProfile: StudentProfile = {
            ...defaultProfile,
            ...serverProfile,
            email: user.email!, 
            id: user.uid,
            isPro, // Make sure we use the calculated value
        };

        setStudentProfileState(finalProfile);
        setWeeklyTimeSpent(finalProfile.weeklyTimeSpent);

        const isComplete = !!finalProfile.name && !!finalProfile.classLevel && !!finalProfile.board;
        setIsProfileComplete(isComplete);
        
    } else if (!firestoreProfile && !isProfileLoading) {
      // This is a new user who doesn't have a firestore doc yet.
      // Prime the state from the auth object.
      const newProfile: StudentProfile = {
        ...defaultProfile,
        id: user.uid,
        email: user.email!,
        name: user.displayName || '',
        isPro: false,
      };
      setStudentProfileState(newProfile);
      setWeeklyTimeSpent(0);
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
    recentlySaved.current = true;
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
  
  
  const addToChat = useCallback((message: ChatMessage, historyType: 'explanation' | 'teacher-companion' = 'explanation') => {
    if (!user || !firestore) return;

    setChat(prevChat => {
      const updatedChat = [...prevChat, message];
      let topic = '';
      
      const firstUserMessage = updatedChat.find(m => m.role === 'user');
      if (firstUserMessage) {
        const content = firstUserMessage.content;
        if (typeof content === 'string') {
          topic = content.substring(0, 50);
        } else if (typeof content === 'object' && 'text' in content) {
          topic = content.text.substring(0, 50);
        }
      }

      if (message.role === 'assistant' && topic) {
        addInteraction({ type: historyType === 'explanation' ? 'explanation' : 'teacher_companion_chat', topic, payload: { chat: updatedChat } });
      }

      if (activeHistoryId) {
        const docRef = doc(firestore, 'users', user.uid, 'history', activeHistoryId);
        setDocumentNonBlocking(docRef, { messages: updatedChat, timestamp: new Date().toISOString() }, { merge: true });
      } else if (topic) {
        const newHistoryId = doc(collection(firestore, 'users', user.uid, 'history')).id;
        const newHistoryItem: HistoryItem = {
          id: newHistoryId,
          timestamp: new Date().toISOString(),
          topic,
          messages: updatedChat,
          type: historyType,
        };
        setActiveHistoryId(newHistoryId);
        const docRef = doc(firestore, 'users', user.uid, 'history', newHistoryId);
        setDocumentNonBlocking(docRef, newHistoryItem, {});
      }
      
      return updatedChat;
    });
  }, [user, firestore, activeHistoryId, addInteraction]);

  
  const deleteFromHistory = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'history', id);
    deleteDocumentNonBlocking(docRef);

    if (activeHistoryId === id) {
      setChat([]);
      setActiveHistoryId(null);
    }
  };
  
  const clearHistory = (historyType: 'explanation' | 'teacher-companion') => {
     if (!user || !firestore) return;
     const itemsToClear = historyType === 'explanation' ? history : teacherHistory;
     itemsToClear.forEach(item => {
        const docRef = doc(firestore, 'users', user.uid, 'history', item.id);
        deleteDocumentNonBlocking(docRef);
     });

    if ((historyType === 'explanation' && (view === 'explanation' || view === 'welcome')) || 
        (historyType === 'teacher-companion' && view === 'teacher-companion')) {
        setChat([]);
        setActiveHistoryId(null);
    }
  };

  const loadChatFromHistory = (historyItem: HistoryItem) => {
    setChat(historyItem.messages);
    setActiveHistoryId(historyItem.id);
    setView(historyItem.type);
  };
  
  // Ad logic
  useEffect(() => {
    if (user && !studentProfile.isPro && !isAdOpen && !hasShownFirstAdToday && pathname === '/') {
        const timer = setTimeout(() => {
            showAd();
            setHasShownFirstAdToday(true);
        }, 30000); // 30 seconds
        return () => clearTimeout(timer);
    }
  }, [user, studentProfile.isPro, isAdOpen, hasShownFirstAdToday, showAd, pathname]);


  const value: AppContextType = { 
    studentProfile, setStudentProfile, saveProfileToFirestore, incrementUsage, view, setView, chat, setChat, addToChat, 
    quiz, setQuiz, history, teacherHistory, loadChatFromHistory, deleteFromHistory, clearHistory, isProfileComplete, 
    isAdOpen, showAd, hideAd, adContent, user, isUserLoading, activeHistoryId, setActiveHistoryId,
    postLoginAction, setPostLoginAction, clearPostLoginAction,
    interactions, addInteraction, progressData, setProgressData, progressError, setProgressError, isProgressLoading, setIsProgressLoading,
    weeklyTimeSpent,
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
