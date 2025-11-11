"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-foreground">Bienvenue sur War Machine App</h1>
        <p className="text-center text-muted-foreground">Connectez-vous ou inscrivez-vous pour commencer votre entraînement !</p>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Vous pouvez ajouter des fournisseurs comme 'google', 'github' ici
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light" // Utilisez 'dark' si votre thème par défaut est sombre
          redirectTo={window.location.origin + '/'} // Redirige vers la page d'accueil après connexion
        />
      </div>
    </div>
  );
};

export default Login;