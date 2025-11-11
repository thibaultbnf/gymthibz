"use client";

import React from "react";
import AddWorkoutForm from "@/components/AddWorkoutForm";
import WorkoutCard from "@/components/WorkoutCard";
import { useWorkouts } from "@/hooks/use-workouts";
import { Workout } from "@/types/workout";

const WorkoutsPage = () => {
  const { workouts, addWorkout, deleteWorkout } = useWorkouts();

  const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Mes Entraînements</h1>

      <AddWorkoutForm onAddWorkout={addWorkout} />

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