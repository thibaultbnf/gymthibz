"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setLoading(false);

      if (event === 'SIGNED_IN') {
        showSuccess("Connexion réussie !");
        if (location.pathname === '/login') {
          navigate('/'); // Redirige vers le tableau de bord après connexion
        }
      } else if (event === 'SIGNED_OUT') {
        showSuccess("Déconnexion réussie !");
        navigate('/login'); // Redirige vers la page de connexion après déconnexion
      } else if (event === 'USER_UPDATED') {
        showSuccess("Profil mis à jour !");
      } else if (event === 'PASSWORD_RECOVERY') {
        showSuccess("Lien de réinitialisation de mot de passe envoyé !");
      } else if (event === 'MFA_CHALLENGE_VERIFIED') {
        showSuccess("Authentification multi-facteurs vérifiée !");
      }
    });

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setLoading(false);
      if (!initialSession && location.pathname !== '/login') {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  // Redirect unauthenticated users from protected routes
  useEffect(() => {
    if (!loading && !user && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [loading, user, location.pathname, navigate]);

  return (
    <SessionContext.Provider value={{ session, user, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};