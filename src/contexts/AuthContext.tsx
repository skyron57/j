// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from "../firebase";
import { ref, get, onValue } from "firebase/database";
import { AuthService } from '../services/AuthService';

interface AuthContextType {
  currentUser: User | null;
  userData: any | null;
  loading: boolean;
  register: (email: string, password: string, username: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        const userRef = ref(db, `users/${user.uid}`);
        
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setUserData(data);
            localStorage.setItem('username', data.username);
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('userRole', data.role); // Stocker le rôle
          }
        });
      } else {
        setUserData(null);
        setCurrentUser(null);
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    register: AuthService.register,
    login: AuthService.login,
    logout: AuthService.logout
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-xl prison-font text-gray-400">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Le hook useAuth
export const useAuth = () => {
  return useContext(AuthContext);
};
