"use client";

import { useState, useEffect } from "react";
import { Workout } from "@/types/workout";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError } from "@/utils/toast";

export function useWorkouts() {
  const { user, loading: sessionLoading } = useSession();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !user) {
      setLoading(sessionLoading);
      return;
    }

    const fetchWorkouts = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching workouts:", error);
        setError(error.message);
        showError(`Erreur lors du chargement des entraînements: ${error.message}`);
        setWorkouts([]);
      } else {
        setWorkouts(data as Workout[]);
      }
      setLoading(false);
    };

    fetchWorkouts();

    // Realtime subscription for workouts
    const channel = supabase
      .channel('workouts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workouts', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setWorkouts((prev) => [payload.new as Workout, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setWorkouts((prev) => prev.map((w) => (w.id === payload.old.id ? (payload.new as Workout) : w)));
          } else if (payload.eventType === 'DELETE') {
            setWorkouts((prev) => prev.filter((w) => w.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionLoading]);

  const addWorkout = async (newWorkout: Omit<Workout, "id">) => {
    if (!user) {
      showError("Vous devez être connecté pour ajouter un entraînement.");
      return;
    }
    const { data, error } = await supabase
      .from("workouts")
      .insert({ ...newWorkout, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error adding workout:", error);
      setError(error.message);
      showError(`Erreur lors de l'ajout de l'entraînement: ${error.message}`);
    } else if (data) {
      // The realtime subscription will handle updating the state
    }
  };

  const updateWorkout = async (updatedWorkout: Workout) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier un entraînement.");
      return;
    }
    const { data, error } = await supabase
      .from("workouts")
      .update({ ...updatedWorkout, user_id: user.id })
      .eq("id", updatedWorkout.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating workout:", error);
      setError(error.message);
      showError(`Erreur lors de la mise à jour de l'entraînement: ${error.message}`);
    } else if (data) {
      // The realtime subscription will handle updating the state
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    if (!user) {
      showError("Vous devez être connecté pour supprimer un entraînement.");
      return;
    }
    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", workoutId);

    if (error) {
      console.error("Error deleting workout:", error);
      setError(error.message);
      showError(`Erreur lors de la suppression de l'entraînement: ${error.message}`);
    } else {
      // The realtime subscription will handle updating the state
    }
  };

  return { workouts, addWorkout, updateWorkout, deleteWorkout, loading, error };
}