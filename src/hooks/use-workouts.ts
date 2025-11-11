"use client";

import { useState, useEffect } from "react";
import { Workout } from "@/types/workout";

const LOCAL_STORAGE_KEY = "war-machine-workouts";

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    try {
      const storedWorkouts = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedWorkouts) {
        setWorkouts(JSON.parse(storedWorkouts));
      }
    } catch (error) {
      console.error("Failed to load workouts from localStorage", error);
      setWorkouts([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(workouts));
    } catch (error) {
      console.error("Failed to save workouts to localStorage", error);
    }
  }, [workouts]);

  const addWorkout = (newWorkout: Workout) => {
    setWorkouts((prevWorkouts) => [...prevWorkouts, newWorkout]);
  };

  const updateWorkout = (updatedWorkout: Workout) => {
    setWorkouts((prevWorkouts) =>
      prevWorkouts.map((w) => (w.id === updatedWorkout.id ? updatedWorkout : w))
    );
  };

  const deleteWorkout = (workoutId: string) => {
    setWorkouts((prevWorkouts) => prevWorkouts.filter((w) => w.id !== workoutId));
  };

  return { workouts, addWorkout, updateWorkout, deleteWorkout };
}