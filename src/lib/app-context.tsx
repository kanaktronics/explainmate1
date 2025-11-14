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
  addToChat: (message: ChatMessage) => void;
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
  
  const addToChat = (message: ChatMessage) => {
    setChat(prevChat => {
      const updatedChat = [...prevChat, message];
      // When a new message is added, update the history if it's the start of a new chat
      if (updatedChat.length === 2 && updatedChat[0].role === 'user' && updatedChat[1].role === 'assistant') {
        const userQuestion = updatedChat[0].content as string;
        addToHistory({ topic: userQuestion, messages: updatedChat });
      } else if (updatedChat.length > 2) {
        // Find the corresponding history item and update it
        const userQuestion = updatedChat[0].content as string;
        setHistory(prevHistory => {
            const historyIndex = prevHistory.findIndex(h => h.topic === userQuestion);
            if (historyIndex !== -1) {
                const newHistory = [...prevHistory];
                newHistory[historyIndex] = { ...newHistory[historyIndex], messages: updatedChat };
                try {
                    localStorage.setItem('explanationHistory', JSON.stringify(newHistory));
                } catch (error) {
                    console.error("Failed to save history to localStorage", error);
                }
                return newHistory;
            }
            return prevHistory;
        });
      }
      return updatedChat;
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
