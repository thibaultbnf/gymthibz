"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkouts } from "@/hooks/use-workouts";
import WorkoutVolumeChart from "@/components/charts/WorkoutVolumeChart";
import { Loader2 } from "lucide-react";

const ProgressPage: React.FC = () => {
  const { workouts, loading, error } = useWorkouts();

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

      <div className="grid grid-cols-1 gap-6">
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

        {/* Future charts and stats can be added here */}
      </div>
    </div>
  );
};

export default ProgressPage;