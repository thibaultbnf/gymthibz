"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkouts } from "@/hooks/use-workouts";
import WorkoutVolumeChart from "@/components/charts/WorkoutVolumeChart";
import { calculatePersonalRecords } from "@/utils/workoutCalculations"; // Import the new utility
import { Loader2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ProgressPage: React.FC = () => {
  const { workouts, loading, error } = useWorkouts();
  const personalRecords = calculatePersonalRecords(workouts); // Calculate PRs

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Chargement des données de progression...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-destructive">
        <h1 className="text-4xl font-bold mb-8">Erreur de chargement</h1>
        <p className="text-lg">Impossible de charger les données de progression : {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Suivi de ma Progression</h1>

      <div className="grid grid-cols-1 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Volume d'entraînement par date</CardTitle>
          </CardHeader>
          <CardContent>
            {workouts.length > 0 ? (
              <WorkoutVolumeChart workouts={workouts} />
            ) : (
              <p className="text-center text-muted-foreground">
                Enregistrez des entraînements pour voir votre progression ici !
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-3xl font-bold mb-6">Mes Records Personnels (PRs)</h2>
      {personalRecords.length === 0 ? (
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Aucun record personnel enregistré pour le moment. Continuez à vous entraîner !
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personalRecords.map((pr) => (
            <Card key={pr.exerciseName}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{pr.exerciseName}</CardTitle>
                <Trophy className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{pr.maxWeight} kg</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Atteint le {format(new Date(pr.date), "PPP", { locale: fr })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressPage;