'use client';

import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DataStore } from '@/lib/data';
import type { User, Person, Transaction, SortKey, SortDirection } from '@/lib/types';

interface AppContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  adminLogin: () => void;
  adminLogout: () => void;
  isDataReady: boolean;
  store: DataStore | null;
  isAdminAuthModalOpen: boolean;
  setAdminAuthModalOpen: (isOpen: boolean) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [store, setStore] = useState<DataStore | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isAdminAuthModalOpen, setAdminAuthModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const dataStore = new DataStore();
    setStore(dataStore);
    
    const loggedInUser = dataStore.getLoggedInUser();
    if (loggedInUser) {
      setUser(loggedInUser);
    }
    
    const adminStatus = sessionStorage.getItem('sarkia_isAdmin') === 'true';
    if(adminStatus) {
        setIsAdmin(true);
    }
    
    setIsDataReady(true);
  }, []);

  useEffect(() => {
    if (isDataReady) {
      const publicPaths = ['/']; // Corresponds to login page
      const isPublicPath = publicPaths.includes(pathname);
      
      if (!user && !isPublicPath) {
        router.push('/');
      }
      
      if (user && isPublicPath) {
        router.push('/dashboard');
      }

      if (pathname.startsWith('/admin') && !isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [user, isAdmin, isDataReady, pathname, router]);

  const login = (username: string, password: string): boolean => {
    if (!store) return false;
    const loggedInUser = store.login(username, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (!store) return;
    store.logout();
    setUser(null);
    setIsAdmin(false); // Also log out from admin
    sessionStorage.removeItem('sarkia_isAdmin');
    router.push('/');
  };
  
  const adminLogin = () => {
    setIsAdmin(true);
    sessionStorage.setItem('sarkia_isAdmin', 'true');
    setAdminAuthModalOpen(false);
    router.push('/admin');
  };

  const adminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('sarkia_isAdmin');
    router.push('/dashboard');
  };


  const value = {
    user,
    login,
    logout,
    isAdmin,
    adminLogin,
    adminLogout,
    isDataReady,
    store,
    isAdminAuthModalOpen,
    setAdminAuthModalOpen,
  };

  if (!isDataReady) {
    return null; // Or a loading spinner
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
