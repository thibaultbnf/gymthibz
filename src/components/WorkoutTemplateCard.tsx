"use client";

import React from "react";
import { Dumbbell, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkoutTemplate } from "@/types/workout";
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

interface WorkoutTemplateCardProps {
  template: WorkoutTemplate;
  onEdit: (template: WorkoutTemplate) => void;
  onDelete: (id: string) => void;
}

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

const WorkoutTemplateCard: React.FC<WorkoutTemplateCardProps> = ({ template, onEdit, onDelete }) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{template.name}</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => onEdit(template)}>
            <Edit className="h-4 w-4" />
          </Button>
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
                  Cette action ne peut pas être annulée. Cela supprimera définitivement ce modèle
                  d'entraînement.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(template.id)}>Supprimer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {template.focus_area && (
          <CardDescription className="text-primary font-semibold">
            Zone de focus : {focusAreaLabels[template.focus_area] || template.focus_area}
          </CardDescription>
        )}
        {template.description && (
          <CardDescription className="mb-4">{template.description}</CardDescription>
        )}
        {template.exercises.length === 0 ? (
          <CardDescription>Aucun exercice défini pour ce modèle.</CardDescription>
        ) : (
          template.exercises.map((exercise) => (
            <div key={exercise.id} className="border-t pt-4 first:border-t-0 first:pt-0">
              <h3 className="text-lg font-semibold flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-primary" /> {exercise.name}
              </h3>
              <ul className="mt-2 space-y-1 pl-7">
                {exercise.targetSets.map((set, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    Série {index + 1} : {set.targetReps} reps @ {set.targetWeight} kg (cible)
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

export default WorkoutTemplateCard;