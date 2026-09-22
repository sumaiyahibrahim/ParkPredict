import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Vehicle } from '../types';
import { LocalStore } from '../services/storage/LocalStore';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; pass: string; phone?: string; vehicle?: Partial<Vehicle> }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  confirmPasswordReset: (email: string, code: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'pp_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    return LocalStore.getItem<UserProfile | null>(AUTH_STORAGE_KEY, LocalStore.getUserProfile());
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const isAuthenticated = user !== null;
  const isGuest = user === null;

  useEffect(() => {
    if (user) {
      LocalStore.setItem(AUTH_STORAGE_KEY, user);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string, pass: string, rememberMe = true): Promise<{ success: boolean; error?: string }> => {
    await new Promise((res) => setTimeout(res, 400)); // realistic micro-delay

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!pass || pass.length < 6) {
      return { success: false, error: 'We couldn’t sign you in. Please check your email and password and try again.' };
    }

    const loggedInUser: UserProfile = {
      id: 'usr-' + Date.now(),
      name: email.split('@')[0].replace('.', ' ').replace(/^\w/, (c) => c.toUpperCase()),
      email,
      phone: '+91 98401 23456',
      loyaltyTier: 'Gold',
      ecoPoints: 380,
      tripsCount: 24,
      hoursSaved: 12.8,
    };

    setUser(loggedInUser);
    setAuthModalOpen(false);
    return { success: true };
  };

  const signup = async (data: {
    name: string;
    email: string;
    pass: string;
    phone?: string;
    vehicle?: Partial<Vehicle>;
  }): Promise<{ success: boolean; error?: string }> => {
    await new Promise((res) => setTimeout(res, 500));

    if (!data.name.trim()) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!data.email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (data.pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const newUser: UserProfile = {
      id: 'usr-' + Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone || '+91 98765 43210',
      loyaltyTier: 'Silver',
      ecoPoints: 100, // Welcome bonus!
      tripsCount: 0,
      hoursSaved: 0,
    };

    // If vehicle was provided during signup, register it
    if (data.vehicle && data.vehicle.plateNumber) {
      const existing = LocalStore.getVehicles();
      const newVeh: Vehicle = {
        id: 'veh-' + Date.now(),
        name: data.vehicle.name || 'Primary Vehicle',
        makeModel: data.vehicle.makeModel || 'Personal Car',
        plateNumber: data.vehicle.plateNumber.toUpperCase(),
        type: data.vehicle.type || 'sedan',
        isEv: !!data.vehicle.isEv,
        isDefault: true,
      };
      LocalStore.saveVehicles([newVeh, ...existing]);
    }

    setUser(newUser);
    setAuthModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string }> => {
    await new Promise((res) => setTimeout(res, 400));
    return {
      success: true,
      message: `Password reset instructions and security code have been sent to ${email}.`,
    };
  };

  const confirmPasswordReset = async (
    email: string,
    code: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    await new Promise((res) => setTimeout(res, 500));
    if (code.length < 4) {
      return { success: false, error: 'Please enter the 6-digit verification code.' };
    }
    if (newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }
    return { success: true };
  };

  const deleteAccount = () => {
    logout();
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isGuest,
        authModalOpen,
        authModalMode,
        login,
        signup,
        logout,
        openAuthModal,
        closeAuthModal,
        requestPasswordReset,
        confirmPasswordReset,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
