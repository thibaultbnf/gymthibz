"use client";

import { useState, useEffect } from "react";
import { WorkoutTemplate } from "@/types/workout";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError } from "@/utils/toast";

export function useWorkoutTemplates() {
  const { user, loading: sessionLoading } = useSession();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !user) {
      setLoading(sessionLoading);
      return;
    }

    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching workout templates:", error);
        setError(error.message);
        showError(`Erreur lors du chargement des modèles d'entraînement: ${error.message}`);
        setTemplates([]);
      } else {
        setTemplates(data as WorkoutTemplate[]);
      }
      setLoading(false);
    };

    fetchTemplates();

    // Realtime subscription for workout templates
    const channel = supabase
      .channel('workout_templates_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workout_templates', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTemplates((prev) => [...prev, payload.new as WorkoutTemplate].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'UPDATE') {
            setTemplates((prev) => prev.map((t) => (t.id === payload.old.id ? (payload.new as WorkoutTemplate) : t)));
          } else if (payload.eventType === 'DELETE') {
            setTemplates((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionLoading]);

  const addTemplate = async (newTemplate: Omit<WorkoutTemplate, "id">) => {
    if (!user) {
      showError("Vous devez être connecté pour ajouter un modèle d'entraînement.");
      return;
    }
    const { data, error } = await supabase
      .from("workout_templates")
      .insert({ ...newTemplate, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error adding workout template:", error);
      setError(error.message);
      showError(`Erreur lors de l'ajout du modèle d'entraînement: ${error.message}`);
    } else if (data) {
      // The realtime subscription will handle updating the state
    }
  };

  const updateTemplate = async (updatedTemplate: WorkoutTemplate) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier un modèle d'entraînement.");
      return;
    }
    const { data, error } = await supabase
      .from("workout_templates")
      .update({ ...updatedTemplate, user_id: user.id })
      .eq("id", updatedTemplate.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating workout template:", error);
      setError(error.message);
      showError(`Erreur lors de la mise à jour du modèle d'entraînement: ${error.message}`);
    } else if (data) {
      // The realtime subscription will handle updating the state
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user) {
      showError("Vous devez être connecté pour supprimer un modèle d'entraînement.");
      return;
    }
    const { error } = await supabase
      .from("workout_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      console.error("Error deleting workout template:", error);
      setError(error.message);
      showError(`Erreur lors de la suppression du modèle d'entraînement: ${error.message}`);
    } else {
      // The realtime subscription will handle updating the state
    }
  };

  return { templates, addTemplate, updateTemplate, deleteTemplate, loading, error };
}