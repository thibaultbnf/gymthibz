"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError } from "@/utils/toast";
import { WorkoutTemplate } from "@/types/workout";

export interface ScheduledWorkout {
  id: string;
  day_of_week: number;
  workout_template_id: string | null;
  workout_templates?: WorkoutTemplate; // Joined template data
}

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
          workout_template_id,
          workout_templates (
            id,
            name,
            description,
            exercises
          )
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
            // Refetch to get joined data
            fetchSchedule();
          } else if (payload.eventType === 'UPDATE') {
            // Refetch to get joined data
            fetchSchedule();
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

  const upsertScheduleEntry = async (dayOfWeek: number, workoutTemplateId: string | null) => {
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
          workout_template_id: workoutTemplateId,
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