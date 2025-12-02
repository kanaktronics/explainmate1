'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { StudentProfile, AppView, ChatMessage, Quiz, HistoryItem } from '@/lib/types';
import { isToday } from 'date-fns';

interface AppContextType {
  studentProfile: StudentProfile;
  setStudentProfile: (profile: StudentProfile) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const sortHistory = (history: HistoryItem[]) => {
  return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [studentProfile, setStudentProfileState] = useState<StudentProfile>({
    name: '',
    classLevel: '',
    board: '',
    weakSubjects: '',
    isPro: false,
    dailyUsage: 0,
    lastUsageDate: new Date().toISOString(),
  });
  const [view, setView] = useState<AppView>('welcome');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(true);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('studentProfile');
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        
        // Reset usage if it's a new day
        if (!isToday(new Date(parsedProfile.lastUsageDate))) {
            parsedProfile.dailyUsage = 0;
            parsedProfile.lastUsageDate = new Date().toISOString();
        }

        setStudentProfileState(parsedProfile);
        if (parsedProfile.name && parsedProfile.classLevel && parsedProfile.board) {
          setIsProfileOpen(false);
        }
      } else {
        setIsProfileOpen(true);
      }
      const storedHistory = localStorage.getItem('explanationHistory');
      if (storedHistory) {
        setHistory(sortHistory(JSON.parse(storedHistory)));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      localStorage.removeItem('studentProfile');
      localStorage.removeItem('explanationHistory');
    }
  }, []);

  useEffect(() => {
    const { name, classLevel, board } = studentProfile;
    setIsProfileComplete(!!name && !!classLevel && !!board);
  }, [studentProfile]);
  
  const setStudentProfile = (profile: StudentProfile) => {
    setStudentProfileState(profile);
    try {
      localStorage.setItem('studentProfile', JSON.stringify(profile));
    } catch (error) {
      console.error("Failed to save student profile to localStorage", error);
    }
  };

  const incrementUsage = () => {
    const newProfile = {
        ...studentProfile,
        dailyUsage: studentProfile.dailyUsage + 1,
        lastUsageDate: new Date().toISOString(),
    };
    setStudentProfile(newProfile);
  }
  
  const updateAndSaveHistory = (newHistory: HistoryItem[]) => {
    const sorted = sortHistory(newHistory);
    setHistory(sorted);
    try {
        localStorage.setItem('explanationHistory', JSON.stringify(sorted));
    } catch (error) {
        console.error("Failed to save history to localStorage", error);
    }
  };

  const addToChat = (message: ChatMessage, currentChat: ChatMessage[]) => {
      const updatedChat = [...currentChat, message];
      setChat(updatedChat);

      const firstUserMessage = updatedChat.find(m => m.role === 'user');
      if (!firstUserMessage) return;
      
      const topicContent = firstUserMessage.content;
      let topic = '';

      if (typeof topicContent === 'string') {
        topic = topicContent.substring(0, 50);
      } else if (typeof topicContent === 'object' && 'text' in topicContent) {
        topic = topicContent.text.substring(0,50);
      }

      setHistory(prevHistory => {
        const existingItemIndex = prevHistory.findIndex(h => h.topic === topic);
        
        let newHistory: HistoryItem[];

        if (existingItemIndex > -1) {
            newHistory = [...prevHistory];
            newHistory[existingItemIndex] = { ...newHistory[existingItemIndex], messages: updatedChat, timestamp: new Date().toISOString() };
        } else {
            const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                topic: topic,
                messages: updatedChat,
            };
            newHistory = [newHistoryItem, ...prevHistory];
        }
        
        updateAndSaveHistory(newHistory);
        return sortHistory(newHistory);
    });
  };

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newHistoryItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
    };
    setHistory(prevHistory => {
        if (prevHistory.some(h => h.topic === newHistoryItem.topic)) {
            return prevHistory;
        }
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

  return (
    <AppContext.Provider value={{ studentProfile, setStudentProfile, incrementUsage, view, setView, chat, setChat, addToChat, quiz, setQuiz, history, addToHistory, deleteFromHistory, clearHistory, isProfileComplete, isProfileOpen, setIsProfileOpen, loadChatFromHistory }}>
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
