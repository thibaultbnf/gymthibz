"use client";

import React, { useState, useEffect } from "react";
import WorkoutSessionForm from "@/components/WorkoutSessionForm"; // Renamed import
import WorkoutCard from "@/components/WorkoutCard";
import { useWorkouts } from "@/hooks/use-workouts";
import { useWorkoutTemplates } from "@/hooks/use-workout-templates";
import { Workout } from "@/types/workout";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const WorkoutsPage = () => {
  const { workouts, addWorkout, deleteWorkout } = useWorkouts();
  const { templates: workoutTemplates } = useWorkoutTemplates();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddForm, setShowAddForm] = useState(false);

  const initialFocusArea = searchParams.get("focusArea");

  useEffect(() => {
    if (initialFocusArea) {
      setShowAddForm(true);
    }
  }, [initialFocusArea]);

  const handleAddWorkoutClick = () => {
    setShowAddForm(true);
    setSearchParams({});
  };

  const handleFormSubmitted = () => {
    setShowAddForm(false);
    setSearchParams({});
  };

  const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Mes Entraînements</h1>

      {!showAddForm && (
        <Button onClick={handleAddWorkoutClick} className="mb-8">
          <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un nouvel entraînement
        </Button>
      )}

      {showAddForm && (
        <WorkoutSessionForm // Renamed component
          onAddWorkout={addWorkout}
          workoutTemplates={workoutTemplates}
          initialFocusArea={initialFocusArea || undefined}
          onFormSubmitted={handleFormSubmitted}
        />
      )}

      <h2 className="text-3xl font-bold mb-6 mt-12">Historique des entraînements</h2>
      {sortedWorkouts.length === 0 ? (
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Aucun entraînement enregistré pour le moment. Ajoutez votre première séance !
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sortedWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} onDelete={deleteWorkout} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutsPage;