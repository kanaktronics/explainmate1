'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { StudentProfile, AppView, ChatMessage, Quiz, HistoryItem } from '@/lib/types';

interface AppContextType {
  studentProfile: StudentProfile;
  setStudentProfile: (profile: StudentProfile) => void;
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
  isProfileComplete: boolean;
  isProfileOpen: boolean;
  setIsProfileOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [studentProfile, setStudentProfileState] = useState<StudentProfile>({
    name: '',
    classLevel: '',
    board: '',
    weakSubjects: '',
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
        setStudentProfileState(parsedProfile);
        if (parsedProfile.name && parsedProfile.classLevel && parsedProfile.board) {
          setIsProfileOpen(false);
        }
      }
      const storedHistory = localStorage.getItem('explanationHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
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
  
  const addToChat = (message: ChatMessage, currentChat: ChatMessage[]) => {
      const updatedChat = [...currentChat, message];
      setChat(updatedChat);

      const firstUserMessage = updatedChat.find(m => m.role === 'user');
      if (!firstUserMessage) return;
      const topic = firstUserMessage.content as string;

      setHistory(prevHistory => {
        const historyIndex = prevHistory.findIndex(h => h.topic === topic);
        let newHistory: HistoryItem[];

        if (historyIndex !== -1) {
            // Update existing history item
            newHistory = [...prevHistory];
            newHistory[historyIndex] = { ...newHistory[historyIndex], messages: updatedChat, timestamp: new Date().toISOString() };
        } else {
            // Add new history item if it's a new conversation
            const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                topic: topic,
                messages: updatedChat,
            };
            newHistory = [newHistoryItem, ...prevHistory];
        }

        try {
            localStorage.setItem('explanationHistory', JSON.stringify(newHistory));
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }

        return newHistory;
    });
  };

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newHistoryItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
    };
    setHistory(prevHistory => {
        // Avoid adding duplicates
        if (prevHistory.some(h => h.topic === newHistoryItem.topic)) {
            return prevHistory;
        }
        const updatedHistory = [newHistoryItem, ...prevHistory];
        try {
            localStorage.setItem('explanationHistory', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }
        return updatedHistory;
    });
  };

  const loadChatFromHistory = (messages: ChatMessage[]) => {
    setChat(messages);
    setView('explanation');
  };

  return (
    <AppContext.Provider value={{ studentProfile, setStudentProfile, view, setView, chat, setChat, addToChat, quiz, setQuiz, history, addToHistory, isProfileComplete, isProfileOpen, setIsProfileOpen, loadChatFromHistory }}>
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
