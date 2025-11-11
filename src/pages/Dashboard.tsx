"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AICoachSection from "@/components/AICoachSection";
import { useSession } from "@/contexts/SessionContext";
import { useWorkouts } from "@/hooks/use-workouts";
import { Dumbbell, CalendarDays, ListChecks } from "lucide-react"; // Import new icons

const Dashboard = () => {
  const { user } = useSession();
  const { workouts } = useWorkouts();

  // Calculate some basic stats
  const totalWorkouts = workouts.length;
  const lastWorkout = workouts.length > 0
    ? workouts.reduce((latest, current) => {
        return new Date(current.date) > new Date(latest.date) ? current : latest;
      }).date
    : null;
  
  const totalExercisesLogged = workouts.reduce((acc, workout) => acc + workout.exercises.length, 0);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Bienvenue, {user?.email || 'Future Machine de Guerre'} !</CardTitle>
          </CardHeader>
          <CardContent>
            <p>C'est ici que vous suivrez vos progrès et écraserez vos objectifs.</p>
            <p className="mt-2">Commencez par enregistrer un entraînement ou créez un modèle !</p>
          </CardContent>
        </Card>

        <AICoachSection />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Entraînements Totaux</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">Entraînements enregistrés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Dernier Entraînement</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastWorkout ? new Date(lastWorkout).toLocaleDateString('fr-FR') : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Date du dernier entraînement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Exercices Enregistrés</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExercisesLogged}</div>
            <p className="text-xs text-muted-foreground">Total des exercices effectués</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;