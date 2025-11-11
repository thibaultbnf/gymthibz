"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AICoachSection from "@/components/AICoachSection";
import { useSession } from "@/contexts/SessionContext";
import { useWorkouts } from "@/hooks/use-workouts";
import { useWorkoutSchedule } from "@/hooks/use-workout-schedule";
import { Dumbbell, CalendarDays, ListChecks, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const focusAreaLabels: { [key: string]: string } = {
  "back": "Dos",
  "chest": "Pectoraux",
  "shoulders": "Épaules",
  "legs": "Jambes",
  "arms": "Bras",
  "full_body": "Full Body",
  "cardio": "Cardio",
  "other": "Autre",
};

const Dashboard = () => {
  const { user } = useSession();
  const { workouts } = useWorkouts();
  const { schedule, loading: scheduleLoading } = useWorkoutSchedule();

  // Calculate some basic stats
  const totalWorkouts = workouts.length;
  const lastWorkout = workouts.length > 0
    ? workouts.reduce((latest, current) => {
        return new Date(current.date) > new Date(latest.date) ? current : latest;
      }).date
    : null;
  
  const totalExercisesLogged = workouts.reduce((acc, workout) => acc + workout.exercises.length, 0);

  // Determine today's workout focus
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const todaysScheduledWorkout = schedule.find(s => s.day_of_week === currentDayOfWeek);
  const todaysFocusAreas = todaysScheduledWorkout?.focus_area;

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

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Entraînement du jour ({format(today, "EEEE", { locale: fr })})</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {scheduleLoading ? (
              <p className="text-muted-foreground">Chargement du programme...</p>
            ) : todaysFocusAreas && todaysFocusAreas.length > 0 ? (
              <>
                <div className="text-2xl font-bold mb-2 flex flex-wrap gap-2">
                  Focus :
                  {todaysFocusAreas.map(area => (
                    <Badge key={area} variant="default">
                      {focusAreaLabels[area] || area}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Choisissez un modèle d'entraînement pour votre séance.
                </p>
                <Button asChild className="w-full">
                  <Link to={`/workouts?focusArea=${todaysFocusAreas.join(',')}`}>
                    <Play className="h-4 w-4 mr-2" /> Démarrer l'entraînement
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-lg text-muted-foreground mb-4">Aucun entraînement programmé pour aujourd'hui.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/workout-schedule">
                    <CalendarDays className="h-4 w-4 mr-2" /> Définir mon programme
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

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