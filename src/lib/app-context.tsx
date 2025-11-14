'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { StudentProfile, AppView, Explanation, Quiz } from '@/lib/types';

interface AppContextType {
  studentProfile: StudentProfile;
  setStudentProfile: (profile: StudentProfile) => void;
  view: AppView;
  setView: (view: AppView) => void;
  explanation: Explanation | null;
  setExplanation: (explanation: Explanation | null) => void;
  quiz: Quiz | null;
  setQuiz: (quiz: Quiz | null) => void;
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
    } catch (error) {
      console.error("Failed to parse student profile from localStorage", error);
      localStorage.removeItem('studentProfile');
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

  return (
    <AppContext.Provider value={{ studentProfile, setStudentProfile, view, setView, explanation, setExplanation, quiz, setQuiz, isProfileComplete, isProfileOpen, setIsProfileOpen }}>
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
