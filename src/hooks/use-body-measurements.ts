"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { BodyMeasurement } from "@/types/workout";

export function useBodyMeasurements() {
  const { user, loading: sessionLoading } = useSession();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !user) {
      setLoading(sessionLoading);
      return;
    }

    const fetchMeasurements = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching body measurements:", error);
        setError(error.message);
        showError(`Erreur lors du chargement des mensurations: ${error.message}`);
        setMeasurements([]);
      } else {
        setMeasurements(data as BodyMeasurement[]);
      }
      setLoading(false);
    };

    fetchMeasurements();

    // Realtime subscription for body measurements
    const channel = supabase
      .channel('body_measurements_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'body_measurements', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMeasurements((prev) => [...prev, payload.new as BodyMeasurement].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setMeasurements((prev) => prev.map((m) => (m.id === payload.old.id ? (payload.new as BodyMeasurement) : m)));
          } else if (payload.eventType === 'DELETE') {
            setMeasurements((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionLoading]);

  const addMeasurement = async (newMeasurement: Omit<BodyMeasurement, "id">) => {
    if (!user) {
      showError("Vous devez être connecté pour ajouter une mensuration.");
      return;
    }
    const { data, error } = await supabase
      .from("body_measurements")
      .insert({ ...newMeasurement, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error adding body measurement:", error);
      setError(error.message);
      showError(`Erreur lors de l'ajout de la mensuration: ${error.message}`);
    } else if (data) {
      showSuccess("Mensuration ajoutée avec succès !");
      // Realtime subscription will handle updating the state
    }
  };

  const updateMeasurement = async (updatedMeasurement: BodyMeasurement) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier une mensuration.");
      return;
    }
    const { data, error } = await supabase
      .from("body_measurements")
      .update({ ...updatedMeasurement, user_id: user.id })
      .eq("id", updatedMeasurement.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating body measurement:", error);
      setError(error.message);
      showError(`Erreur lors de la mise à jour de la mensuration: ${error.message}`);
    } else if (data) {
      showSuccess("Mensuration mise à jour avec succès !");
      // Realtime subscription will handle updating the state
    }
  };

  const deleteMeasurement = async (measurementId: string) => {
    if (!user) {
      showError("Vous devez être connecté pour supprimer une mensuration.");
      return;
    }
    const { error } = await supabase
      .from("body_measurements")
      .delete()
      .eq("id", measurementId);

    if (error) {
      console.error("Error deleting body measurement:", error);
      setError(error.message);
      showError(`Erreur lors de la suppression de la mensuration: ${error.message}`);
    } else {
      showSuccess("Mensuration supprimée avec succès !");
      // Realtime subscription will handle updating the state
    }
  };

  return { measurements, addMeasurement, updateMeasurement, deleteMeasurement, loading, error };
}