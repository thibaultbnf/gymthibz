"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { ExerciseDefinition } from "@/types/workout";

export function useExercises() {
  const { user, loading: sessionLoading } = useSession();
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !user) {
      setLoading(sessionLoading);
      return;
    }

    const fetchExercises = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching exercises:", error);
        setError(error.message);
        showError(`Erreur lors du chargement des exercices: ${error.message}`);
        setExercises([]);
      } else {
        setExercises(data as ExerciseDefinition[]);
      }
      setLoading(false);
    };

    fetchExercises();

    // Realtime subscription for exercises
    const channel = supabase
      .channel('exercises_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exercises' }, // No user_id filter as exercises are global
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setExercises((prev) => [...prev, payload.new as ExerciseDefinition].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'UPDATE') {
            setExercises((prev) => prev.map((e) => (e.id === payload.old.id ? (payload.new as ExerciseDefinition) : e)));
          } else if (payload.eventType === 'DELETE') {
            setExercises((prev) => prev.filter((e) => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionLoading]);

  const addExerciseDefinition = async (newExercise: Omit<ExerciseDefinition, "id" | "created_at">) => {
    if (!user) {
      showError("Vous devez être connecté pour ajouter un exercice.");
      return;
    }
    const { data, error } = await supabase
      .from("exercises")
      .insert(newExercise)
      .select()
      .single();

    if (error) {
      console.error("Error adding exercise definition:", error);
      setError(error.message);
      showError(`Erreur lors de l'ajout de l'exercice: ${error.message}`);
    } else if (data) {
      showSuccess("Exercice ajouté avec succès !");
      // Realtime subscription will handle updating the state
    }
  };

  const updateExerciseDefinition = async (updatedExercise: ExerciseDefinition) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier un exercice.");
      return;
    }
    const { data, error } = await supabase
      .from("exercises")
      .update(updatedExercise)
      .eq("id", updatedExercise.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating exercise definition:", error);
      setError(error.message);
      showError(`Erreur lors de la mise à jour de l'exercice: ${error.message}`);
    } else if (data) {
      showSuccess("Exercice mis à jour avec succès !");
      // Realtime subscription will handle updating the state
    }
  };

  const deleteExerciseDefinition = async (exerciseId: string) => {
    if (!user) {
      showError("Vous devez être connecté pour supprimer un exercice.");
      return;
    }
    const { error } = await supabase
      .from("exercises")
      .delete()
      .eq("id", exerciseId);

    if (error) {
      console.error("Error deleting exercise definition:", error);
      setError(error.message);
      showError(`Erreur lors de la suppression de l'exercice: ${error.message}`);
    } else {
      showSuccess("Exercice supprimé avec succès !");
      // Realtime subscription will handle updating the state
    }
  };

  return { exercises, addExerciseDefinition, updateExerciseDefinition, deleteExerciseDefinition, loading, error };
}