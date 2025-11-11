"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dumbbell, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workout } from "@/types/workout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WorkoutCardProps {
  workout: Workout;
  onDelete: (id: string) => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onDelete }) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">
          Entraînement du {format(new Date(workout.date), "PPP", { locale: fr })}
        </CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cela supprimera définitivement cet entraînement
                de vos enregistrements.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(workout.id)}>Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {workout.exercises.length === 0 ? (
          <CardDescription>Aucun exercice enregistré pour cet entraînement.</CardDescription>
        ) : (
          workout.exercises.map((exercise) => (
            <div key={exercise.id} className="border-t pt-4 first:border-t-0 first:pt-0">
              <h3 className="text-lg font-semibold flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-primary" /> {exercise.name}
              </h3>
              <ul className="mt-2 space-y-1 pl-7">
                {exercise.sets.map((set, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    Série {index + 1} : {set.reps} reps @ {set.weight} kg
                    {set.weighted_kg && set.weighted_kg > 0 ? ` (+${set.weighted_kg} kg lesté)` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default WorkoutCard;