"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Home, Dumbbell, LayoutTemplate, UserCircle } from "lucide-react"; // Added UserCircle icon
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, label, isActive }) => (
  <Button
    asChild
    variant={isActive ? "secondary" : "ghost"}
    className={cn(
      "w-full justify-start",
      isActive && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90",
    )}
  >
    <Link to={to} className="flex items-center space-x-3">
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  </Button>
);

const Sidebar: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const navItems = [
    { to: "/", icon: Home, label: "Tableau de bord" },
    { to: "/workouts", icon: Dumbbell, label: "Entraînements" },
    { to: "/workout-templates", icon: LayoutTemplate, label: "Modèles d'entraînements" },
    { to: "/profile", icon: UserCircle, label: "Mon Profil" }, // New link to profile page
  ];

  return (
    <aside className="hidden md:flex flex-col h-full w-64 border-r bg-sidebar p-4">
      <div className="flex items-center justify-center h-16 border-b">
        <h2 className="text-2xl font-bold text-sidebar-primary">War Machine App</h2>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.to}
            />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;