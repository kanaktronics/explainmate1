

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import type { StudentProfile, ChatMessage, Quiz, HistoryItem, Interaction, ProgressData, ExamPlan } from '@/lib/types';
import { isToday, isPast, differenceInDays } from 'date-fns';
import { useFirebase, useDoc, useCollection, setDocument, addDocument, deleteDocument, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { runProgressEngineAction } from './actions';

interface AdContent {
    title: string;
    description: string;
}

type AppView = 'welcome' | 'explanation' | 'quiz' | 'auth' | 'forgot-password' | 'teacher-companion' | 'progress' | 'exam-prep';

type PostLoginAction = 'upgrade' | null;

interface AppContextType {
  studentProfile: StudentProfile;
  setStudentProfile: (profile: Partial<StudentProfile>) => void;
  saveProfileToFirestore: (profile: Partial<StudentProfile>) => Promise<void>;
  incrementUsage: (type?: 'explanation' | 'quiz' | 'teacher-companion') => void;
  view: AppView;
  setView: (view: AppView) => void;
  chat: ChatMessage[];
  setChat: (chat: ChatMessage[]) => void;
  addToChat: (message: ChatMessage) => void;
  setChatTopic: (topic: string) => void;
  quiz: Quiz | null;
  setQuiz: (quiz: Quiz | null) => void;
  setQuizTopic: (topic: string) => void;
  history: HistoryItem[];
  teacherHistory: HistoryItem[];
  examPrepHistory: HistoryItem[];
  loadChatFromHistory: (historyItem: HistoryItem) => void;
  loadExamPlanFromHistory: (historyItem: HistoryItem) => void;
  deleteFromHistory: (id: string) => Promise<void>;
  clearHistory: (historyType: 'explanation' | 'teacher-companion' | 'exam-prep') => Promise<void>;
  examPlan: ExamPlan | null;
  setExamPlan: (plan: ExamPlan | null) => void;
  saveExamPlanToHistory: (plan: ExamPlan, topic: string) => Promise<void>;
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
  const [quizTopic, setQuizTopic] = useState<string>('');
  const [chatTopic, setChatTopic] = useState<string>('');
  const [examPlan, setExamPlan] = useState<ExamPlan | null>(null);
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
  const isSavingRef = useRef(false);
  const chatRef = useRef(chat);

  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  // Firestore-based time tracking
  useEffect(() => {
      if (!user || !userProfileRef) return;

      const interval = setInterval(async () => {
          const newTime = (studentProfile.weeklyTimeSpent || 0) + 5;
          await setDocument(userProfileRef, { weeklyTimeSpent: newTime }, { merge: true });
          setStudentProfileState(prev => ({ ...prev, weeklyTimeSpent: newTime }));
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
  }, [user, userProfileRef, studentProfile.weeklyTimeSpent]);


  const clearPostLoginAction = useCallback(() => {
    setPostLoginAction(null);
  }, []);

  const setView = (view: AppView) => {
    const mainViews: AppView[] = ['welcome', 'explanation', 'quiz', 'teacher-companion', 'progress', 'exam-prep'];
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
  const examPrepHistory = useMemo(() => allHistoryItems?.filter(item => item.type === 'exam-prep') || [], [allHistoryItems]);
  
  const interactionsRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'interactions');
  }, [user, firestore]);
  
  const { data: interactions = [] } = useCollection<Interaction>(interactionsRef);


  const addInteraction = useCallback(async (interaction: Omit<Interaction, 'id' | 'timestamp'>) => {
    if (!interactionsRef) return;

    const newInteraction = {
      ...interaction,
      timestamp: new Date().toISOString(),
    };
    
    await addDocument(interactionsRef, newInteraction);

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
      setExamPlan(null);
      setProgressData(null);
      setActiveHistoryId(null);
      setStudentProfileState(defaultProfile);
    }
  }, [user, isUserLoading, pathname, router, postLoginAction]);


  // Effect to sync Firestore profile with local state
  useEffect(() => {
    if (isUserLoading || isProfileLoading || !user) return;

    if (firestoreProfile) {
      let currentProfileIsPro = firestoreProfile.isPro || false;
      
      if (currentProfileIsPro && firestoreProfile.proExpiresAt && isPast(new Date(firestoreProfile.proExpiresAt))) {
        currentProfileIsPro = false;
        if (userProfileRef) {
          setDoc(userProfileRef, { isPro: false }, { merge: true });
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
        isPro: currentProfileIsPro,
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

      if (isNewDay) {
        const updatedUsage = { 
            dailyUsage: 0, 
            dailyQuizUsage: 0, 
            proDailyRequests: 0,
            lastUsageDate: today.toISOString() 
          };
        serverProfile = { ...serverProfile, ...updatedUsage };
        if (userProfileRef) {
          setDoc(userProfileRef, { ...updatedUsage, proRequestTimestamps: [] }, { merge: true });
        }
        setHasShownFirstAdToday(false);
      }

      if(isNewWeek) {
          serverProfile.weeklyTimeSpent = 0;
          serverProfile.timeSpentLastReset = today.toISOString();
          if (userProfileRef) {
              setDoc(userProfileRef, { weeklyTimeSpent: 0, timeSpentLastReset: today.toISOString() }, { merge: true });
          }
      }
      
      const finalProfile: StudentProfile = {
          ...defaultProfile,
          ...serverProfile,
          email: user.email!, 
          id: user.uid,
      };

      setStudentProfileState(finalProfile);
      setWeeklyTimeSpent(finalProfile.weeklyTimeSpent);

      const isComplete = !!finalProfile.name && !!finalProfile.classLevel && !!finalProfile.board;
      setIsProfileComplete(isComplete);
      
    } else if (!firestoreProfile && !isProfileLoading) {
      const newProfile = {
        ...defaultProfile,
        id: user.uid,
        email: user.email!,
        name: user.displayName || '',
      };
      setStudentProfileState(newProfile);
      setWeeklyTimeSpent(0);
      setIsProfileComplete(false);
    }
  }, [firestoreProfile, user, isUserLoading, isProfileLoading, userProfileRef]);

  
  const setStudentProfile = (profile: Partial<StudentProfile>) => {
    setStudentProfileState(prev => ({...prev, ...profile}));
  };

  const saveProfileToFirestore = async (values: Partial<StudentProfile>) => {
    if (!user || !firestore) return;
    const profileRef = doc(firestore, 'users', user.uid);
    
    const dataToSave: any = {};
    if (values.name !== undefined) dataToSave.name = values.name;
    if (values.classLevel !== undefined) dataToSave.gradeLevel = values.classLevel;
    if (values.board !== undefined) dataToSave.board = values.board;
    if (values.weakSubjects !== undefined) dataToSave.weakSubjects = values.weakSubjects?.split(',').map(s => s.trim()).filter(Boolean) || [];

    if (Object.keys(dataToSave).length > 0) {
      await setDoc(profileRef, dataToSave, { merge: true });
    }

    const finalProfile = { ...studentProfile, ...values };
    setStudentProfileState(finalProfile);
    const isComplete = !!finalProfile.name && !!finalProfile.classLevel && !!finalProfile.board;
    setIsProfileComplete(isComplete);
  }


  const incrementUsage = async (type: 'explanation' | 'quiz' | 'teacher-companion' = 'explanation') => {
    if (!userProfileRef) return;
    
    const now = new Date().toISOString();
    
    if (studentProfile.isPro) {
        const newTimestamps = [...(studentProfile.proRequestTimestamps || []), now].slice(-100);
        const newDailyRequests = (studentProfile.proDailyRequests || 0) + 1;
        setStudentProfileState(prev => ({
            ...prev,
            proDailyRequests: newDailyRequests,
            proRequestTimestamps: newTimestamps,
            lastUsageDate: now
        }));
        await setDocument(userProfileRef, { 
            proDailyRequests: newDailyRequests,
            proRequestTimestamps: newTimestamps,
            lastUsageDate: now
        }, { merge: true });

    } else {
        if (type === 'explanation') {
            const newUsage = (studentProfile.dailyUsage || 0) + 1;
            setStudentProfileState(prev => ({ ...prev, dailyUsage: newUsage, lastUsageDate: now }));
            await setDocument(userProfileRef, { dailyUsage: newUsage, lastUsageDate: now }, { merge: true });
        } else if (type === 'quiz') {
            const newQuizUsage = (studentProfile.dailyQuizUsage || 0) + 1;
            setStudentProfileState(prev => ({ ...prev, dailyQuizUsage: newQuizUsage, lastUsageDate: now }));
            await setDocument(userProfileRef, { dailyQuizUsage: newQuizUsage, lastUsageDate: now }, { merge: true });
        }
    }
  }

  const generateHistoryTitle = (question: string): string => {
    const cleanQuestion = question
      .replace(/^(what is|what are|explain|can you explain|please explain|tell me about|who is|who are|define)\s+/i, '')
      .replace(/\?$/, '')
      .trim();
      
    const words = cleanQuestion.split(/\s+/);
    const shortTitleWords = words.slice(0, 5);
    let title = shortTitleWords.join(' ');
    
    if (words.length > 5) {
        title += '...';
    }
    
    if (!title) {
        return "New Chat";
    }

    return title.charAt(0).toUpperCase() + title.slice(1);
  };
  
  
  const addToChat = useCallback((message: ChatMessage) => {
    setChat(prevChat => [...prevChat, message]);
  }, []);

  const getHistoryType = useCallback((): 'explanation' | 'teacher-companion' => {
      return view === 'teacher-companion' ? 'teacher-companion' : 'explanation';
  }, [view]);

  // Effect to save chat to history
  useEffect(() => {
    const saveChatHistory = async () => {
        if (!user || !firestore || chat.length === 0 || isSavingRef.current) {
            return;
        }

        const historyType = getHistoryType();
        isSavingRef.current = true;

        try {
            if (activeHistoryId) {
                const docRef = doc(firestore, 'users', user.uid, 'history', activeHistoryId);
                await setDocument(docRef, { messages: chat, timestamp: new Date().toISOString() }, { merge: true });
            } else {
                const firstUserMessage = chat.find(m => m.role === 'user');
                if (firstUserMessage) {
                    const content = firstUserMessage.content;
                    let userQuestion = '';
                    if (typeof content === 'string') {
                        userQuestion = content;
                    } else if (typeof content === 'object' && 'text' in content) {
                        userQuestion = content.text;
                    }

                    if (userQuestion) {
                        const topic = generateHistoryTitle(userQuestion);
                        const historyCollection = collection(firestore, 'users', user.uid, 'history');
                        const newHistoryItem: Omit<HistoryItem, 'id'> = {
                            topic,
                            messages: chat,
                            timestamp: new Date().toISOString(),
                            type: historyType,
                        };
                        const newDocRef = await addDocument(historyCollection, newHistoryItem);
                        setActiveHistoryId(newDocRef.id);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to save chat history:", error);
        } finally {
            isSavingRef.current = false;
        }
    };

    saveChatHistory();
  }, [chat, user, firestore, activeHistoryId, getHistoryType]);


  const saveExamPlanToHistory = async (plan: ExamPlan, topic: string) => {
    if (!user || !firestore) return;

    let planToSave = plan;
    // For free users, only save the roadmap
    if (!studentProfile.isPro) {
        planToSave = { roadmap: plan.roadmap };
    }

    try {
      if (activeHistoryId) {
        const docRef = doc(firestore, 'users', user.uid, 'history', activeHistoryId);
        await setDocument(docRef, { examPlan: planToSave, timestamp: new Date().toISOString() }, { merge: true });
      } else {
        const historyCollection = collection(firestore, 'users', user.uid, 'history');
        const newHistoryItem: Omit<HistoryItem, 'id'> = {
            topic,
            examPlan: planToSave,
            timestamp: new Date().toISOString(),
            type: 'exam-prep',
        };
        const newDocRef = await addDocument(historyCollection, newHistoryItem);
        setActiveHistoryId(newDocRef.id);
      }
    } catch (error) {
        console.error("Failed to save exam plan history:", error);
    }
  };

  
  const deleteFromHistory = async (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'history', id);
    await deleteDocument(docRef);

    if (activeHistoryId === id) {
      setChat([]);
      setExamPlan(null);
      setActiveHistoryId(null);
    }
  };
  
  const clearHistory = async (historyType: 'explanation' | 'teacher-companion' | 'exam-prep') => {
     if (!user || !firestore) return;

     const itemsToClear = {
       'explanation': history,
       'teacher-companion': teacherHistory,
       'exam-prep': examPrepHistory,
     }[historyType];
     
     const deletePromises = itemsToClear.map(item => {
        const docRef = doc(firestore, 'users', user.uid, 'history', item.id);
        return deleteDocument(docRef);
     });
     await Promise.all(deletePromises);

    if ((historyType === 'explanation' && (view === 'explanation' || view === 'welcome')) || 
        (historyType === 'teacher-companion' && view === 'teacher-companion') ||
        (historyType === 'exam-prep' && view === 'exam-prep')) {
        setChat([]);
        setExamPlan(null);
        setActiveHistoryId(null);
    }
  };

  const loadChatFromHistory = (historyItem: HistoryItem) => {
    setChat(historyItem.messages || []);
    setExamPlan(null);
    setActiveHistoryId(historyItem.id);
    setView(historyItem.type);
  };

  const loadExamPlanFromHistory = (historyItem: HistoryItem) => {
    if (historyItem.examPlan) {
        setExamPlan(historyItem.examPlan);
        setChat([]);
        setActiveHistoryId(historyItem.id);
        setView('exam-prep');
    }
  };
  
  const setQuizTopicCallback = useCallback((topic: string) => {
    setQuiz(null); // Clear previous quiz
    setQuizTopic(topic);
  }, []);

  const setChatTopicCallback = useCallback((topic: string) => {
    // Pre-fill the chat with a user message to kickstart the explanation
    const userMessage: ChatMessage = { role: 'user', content: { text: `Explain ${topic}` } };
    setChat([userMessage]);
    setActiveHistoryId(null);
  }, []);


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
    quiz, setQuiz, setQuizTopic: setQuizTopicCallback, setChatTopic: setChatTopicCallback,
    history, teacherHistory, examPrepHistory, loadChatFromHistory, loadExamPlanFromHistory, deleteFromHistory, clearHistory, isProfileComplete, 
    examPlan, setExamPlan, saveExamPlanToHistory,
    isAdOpen, showAd, hideAd, adContent, user, isUserLoading, activeHistoryId, setActiveHistoryId,
    postLoginAction, setPostLoginAction, clearPostLoginAction,
    interactions, addInteraction, progressData, setProgressData, progressError, setProgressError, isProgressLoading, setIsProgressLoading,
    weeklyTimeSpent,
  };

  // This is a bit of a hack to pre-fill the topic when a user clicks 'start' or 'practice'
  // It's not ideal but works for this structure.
  useEffect(() => {
      if (view === 'quiz' && quizTopic) {
          setQuiz(null); // Ensure we are in setup mode
          // We can't set the form value directly here, so we'll do it in the QuizView component.
      }
  }, [view, quizTopic]);

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
