'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { StudentProfile, AppView, Explanation, Quiz, HistoryItem } from '@/lib/types';

interface AppContextType {
  studentProfile: StudentProfile;
  setStudentProfile: (profile: StudentProfile) => void;
  view: AppView;
  setView: (view: AppView) => void;
  explanation: Explanation | null;
  setExplanation: (explanation: Explanation | null) => void;
  quiz: Quiz | null;
  setQuiz: (quiz: Quiz | null) => void;
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
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
  const [explanation, setExplanation] = useState<Explanation | null>(null);
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

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newHistoryItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
    };
    setHistory(prevHistory => {
        const updatedHistory = [newHistoryItem, ...prevHistory];
        try {
            localStorage.setItem('explanationHistory', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }
        return updatedHistory;
    });
  };

  return (
    <AppContext.Provider value={{ studentProfile, setStudentProfile, view, setView, explanation, setExplanation, quiz, setQuiz, history, addToHistory, isProfileComplete, isProfileOpen, setIsProfileOpen }}>
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