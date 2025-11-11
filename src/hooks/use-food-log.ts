"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { FoodEntry } from "@/types/workout";

export function useFoodLog() {
  const { user, loading: sessionLoading } = useSession();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !user) {
      setLoading(sessionLoading);
      return;
    }

    const fetchFoodEntries = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("food_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching food entries:", error);
        setError(error.message);
        showError(`Erreur lors du chargement du journal alimentaire: ${error.message}`);
        setFoodEntries([]);
      } else {
        setFoodEntries(data as FoodEntry[]);
      }
      setLoading(false);
    };

    fetchFoodEntries();

    // Realtime subscription for food entries
    const channel = supabase
      .channel('food_entries_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'food_entries', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFoodEntries((prev) => [payload.new as FoodEntry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setFoodEntries((prev) => prev.map((e) => (e.id === payload.old.id ? (payload.new as FoodEntry) : e)));
          } else if (payload.eventType === 'DELETE') {
            setFoodEntries((prev) => prev.filter((e) => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionLoading]);

  const addFoodEntry = async (newEntry: Omit<FoodEntry, "id">) => {
    if (!user) {
      showError("Vous devez être connecté pour ajouter une entrée alimentaire.");
      return;
    }
    const { data, error } = await supabase
      .from("food_entries")
      .insert({ ...newEntry, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error adding food entry:", error);
      setError(error.message);
      showError(`Erreur lors de l'ajout de l'entrée alimentaire: ${error.message}`);
    } else if (data) {
      // Realtime subscription will handle updating the state
    }
  };

  const updateFoodEntry = async (updatedEntry: FoodEntry) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier une entrée alimentaire.");
      return;
    }
    const { data, error } = await supabase
      .from("food_entries")
      .update({ ...updatedEntry, user_id: user.id })
      .eq("id", updatedEntry.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating food entry:", error);
      setError(error.message);
      showError(`Erreur lors de la mise à jour de l'entrée alimentaire: ${error.message}`);
    } else if (data) {
      // Realtime subscription will handle updating the state
    }
  };

  const deleteFoodEntry = async (entryId: string) => {
    if (!user) {
      showError("Vous devez être connecté pour supprimer une entrée alimentaire.");
      return;
    }
    const { error } = await supabase
      .from("food_entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting food entry:", error);
      setError(error.message);
      showError(`Erreur lors de la suppression de l'entrée alimentaire: ${error.message}`);
    } else {
      // Realtime subscription will handle updating the state
    }
  };

  return { foodEntries, addFoodEntry, updateFoodEntry, deleteFoodEntry, loading, error };
}