"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { UserGoal } from "@/types/workout";

export function useUserGoals() {
  const { user, loading: sessionLoading } = useSession();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !user) {
      setLoading(sessionLoading);
      return;
    }

    const fetchGoals = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user goals:", error);
        setError(error.message);
        showError(`Erreur lors du chargement des objectifs: ${error.message}`);
        setGoals([]);
      } else {
        setGoals(data as UserGoal[]);
      }
      setLoading(false);
    };

    fetchGoals();

    // Realtime subscription for user goals
    const channel = supabase
      .channel('user_goals_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_goals', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGoals((prev) => [payload.new as UserGoal, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setGoals((prev) => prev.map((g) => (g.id === payload.old.id ? (payload.new as UserGoal) : g)));
          } else if (payload.eventType === 'DELETE') {
            setGoals((prev) => prev.filter((g) => g.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionLoading]);

  const addGoal = async (newGoal: Omit<UserGoal, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) {
      showError("Vous devez être connecté pour ajouter un objectif.");
      return;
    }
    const { data, error } = await supabase
      .from("user_goals")
      .insert({ ...newGoal, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error adding user goal:", error);
      setError(error.message);
      showError(`Erreur lors de l'ajout de l'objectif: ${error.message}`);
    } else if (data) {
      showSuccess("Objectif ajouté avec succès !");
      // Realtime subscription will handle updating the state
    }
  };

  const updateGoal = async (updatedGoal: UserGoal) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier un objectif.");
      return;
    }
    const { data, error } = await supabase
      .from("user_goals")
      .update({ ...updatedGoal, user_id: user.id })
      .eq("id", updatedGoal.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user goal:", error);
      setError(error.message);
      showError(`Erreur lors de la mise à jour de l'objectif: ${error.message}`);
    } else if (data) {
      showSuccess("Objectif mis à jour avec succès !");
      // Realtime subscription will handle updating the state
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) {
      showError("Vous devez être connecté pour supprimer un objectif.");
      return;
    }
    const { error } = await supabase
      .from("user_goals")
      .delete()
      .eq("id", goalId);

    if (error) {
      console.error("Error deleting user goal:", error);
      setError(error.message);
      showError(`Erreur lors de la suppression de l'objectif: ${error.message}`);
    } else {
      showSuccess("Objectif supprimé avec succès !");
      // Realtime subscription will handle updating the state
    }
  };

  return { goals, addGoal, updateGoal, deleteGoal, loading, error };
}