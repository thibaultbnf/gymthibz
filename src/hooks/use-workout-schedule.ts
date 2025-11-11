"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError } from "@/utils/toast";
import { ScheduledWorkout } from "@/types/workout"; // Import ScheduledWorkout from types

export function useWorkoutSchedule() {
  const { user, loading: sessionLoading } = useSession();
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !user) {
      setLoading(sessionLoading);
      return;
    }

    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("workout_schedule")
        .select(`
          id,
          day_of_week,
          focus_area
        `)
        .eq("user_id", user.id)
        .order("day_of_week", { ascending: true });

      if (error) {
        console.error("Error fetching workout schedule:", error);
        setError(error.message);
        showError(`Erreur lors du chargement du programme d'entraînement: ${error.message}`);
        setSchedule([]);
      } else {
        setSchedule(data as ScheduledWorkout[]);
      }
      setLoading(false);
    };

    fetchSchedule();

    // Realtime subscription for workout schedule
    const channel = supabase
      .channel('workout_schedule_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workout_schedule', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSchedule((prev) => [...prev, payload.new as ScheduledWorkout].sort((a, b) => a.day_of_week - b.day_of_week));
          } else if (payload.eventType === 'UPDATE') {
            setSchedule((prev) => prev.map((s) => (s.id === payload.old.id ? (payload.new as ScheduledWorkout) : s)));
          } else if (payload.eventType === 'DELETE') {
            setSchedule((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionLoading]);

  const upsertScheduleEntry = async (dayOfWeek: number, focusArea: string[] | null) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier le programme.");
      return;
    }

    const { error } = await supabase
      .from("workout_schedule")
      .upsert(
        {
          user_id: user.id,
          day_of_week: dayOfWeek,
          focus_area: focusArea && focusArea.length > 0 ? focusArea : null, // Store null if array is empty
        },
        { onConflict: 'user_id, day_of_week' } // Conflict on user_id and day_of_week
      );

    if (error) {
      console.error("Error upserting workout schedule entry:", error);
      setError(error.message);
      showError(`Erreur lors de la mise à jour du programme: ${error.message}`);
    } else {
      // Realtime subscription will handle state update
    }
  };

  const deleteScheduleEntry = async (id: string) => {
    if (!user) {
      showError("Vous devez être connecté pour supprimer une entrée du programme.");
      return;
    }
    const { error } = await supabase
      .from("workout_schedule")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting workout schedule entry:", error);
      setError(error.message);
      showError(`Erreur lors de la suppression de l'entrée du programme: ${error.message}`);
    } else {
      // Realtime subscription will handle state update
    }
  };

  return { schedule, upsertScheduleEntry, deleteScheduleEntry, loading, error };
}