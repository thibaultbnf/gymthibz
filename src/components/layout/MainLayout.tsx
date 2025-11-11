"use client";

import React from "react";
import { useLocation, Outlet } from "react-router-dom"; // Import Outlet
import Sidebar from "./Sidebar";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/contexts/SessionContext"; // Import useSession
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const MainLayout: React.FC = () => { // No children prop needed with Outlet
  const location = useLocation();
  const { user, loading } = useSession();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showSuccess("Déconnexion réussie !");
    } catch (error: any) {
      showError(`Erreur de déconnexion: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Chargement de la session...
      </div>
    );
  }

  if (!user) {
    // If not logged in, the SessionContextProvider will redirect to /login
    // This component should not render its children if user is null
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentPath={location.pathname} />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between h-16 border-b px-6 lg:px-8 bg-card">
          <h1 className="text-xl font-semibold">War Machine App</h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <a href="/profile"> {/* Link to a future profile page */}
                <UserCircle className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet /> {/* Renders the matched child route component */}
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default MainLayout;