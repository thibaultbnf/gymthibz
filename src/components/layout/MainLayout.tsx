"use client";

import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { MadeWithDyad } from "@/components/made-with-dyad";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentPath={location.pathname} />
      <div className="flex flex-col flex-1">
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default MainLayout;