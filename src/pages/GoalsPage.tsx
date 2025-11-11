"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Edit, Trash2, Target } from "lucide-react";
import { useUserGoals } from "@/hooks/use-user-goals";
import { UserGoal } from "@/types/workout";
import GoalForm from "@/components/GoalForm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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

const goalTypeLabels: { [key: string]: string } = {
  "weight_loss": "Perte de poids",
  "muscle_gain": "Gain de muscle",
  "strength": "Force",
  "endurance": "Endurance",
  "other": "Autre",
};

const GoalsPage: React.FC = () => {
  const { goals, loading, error, deleteGoal } = useUserGoals();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);

  const handleAddGoalClick = () => {
    setEditingGoal(null);
    setShowAddForm(true);
  };

  const handleEditGoal = (goal: UserGoal) => {
    setEditingGoal(goal);
    setShowAddForm(true);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingGoal(null);
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingGoal(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Chargement des objectifs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-destructive">
        <h1 className="text-4xl font-bold mb-8">Erreur de chargement</h1>
        <p className="text-lg">Impossible de charger les objectifs : {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Mes Objectifs Personnels</h1>

      {!showAddForm && (
        <Button onClick={handleAddGoalClick} className="mb-8">
          <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un nouvel objectif
        </Button>
      )}

      {showAddForm && (
        <GoalForm
          initialData={editingGoal || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      <h2 className="text-3xl font-bold mb-6 mt-12">Objectifs actuels</h2>
      {goals.length === 0 ? (
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Aucun objectif enregistré pour le moment. Ajoutez votre premier objectif !
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">{goal.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEditGoal(goal)}>
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
                          Cette action ne peut pas être annulée. Cela supprimera définitivement cet objectif.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteGoal(goal.id)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <CardDescription>Type : {goalTypeLabels[goal.goal_type] || goal.goal_type}</CardDescription>
                {goal.description && <CardDescription>{goal.description}</CardDescription>}
                {(goal.target_value !== null && goal.target_value > 0) && (
                  <p className="text-lg font-semibold">
                    Cible : {goal.target_value} {goal.target_unit}
                  </p>
                )}
                {goal.target_date && (
                  <p className="text-sm text-muted-foreground">
                    Date cible : {format(new Date(goal.target_date), "PPP", { locale: fr })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Créé le : {format(new Date(goal.created_at), "PPP", { locale: fr })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalsPage;