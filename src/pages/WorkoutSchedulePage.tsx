"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkoutSchedule } from "@/hooks/use-workout-schedule";
import { Loader2, Save } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const daysOfWeek = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

const focusAreaOptions = [
  { value: "back", label: "Dos" },
  { value: "chest", label: "Pectoraux" },
  { value: "shoulders", label: "Épaules" },
  { value: "legs", label: "Jambes" },
  { value: "arms", label: "Bras" },
  { value: "full_body", label: "Full Body" },
  { value: "cardio", label: "Cardio" },
  { value: "other", label: "Autre" },
];

const WorkoutSchedulePage: React.FC = () => {
  const { schedule, upsertScheduleEntry, loading: scheduleLoading, error: scheduleError } = useWorkoutSchedule();
  const [localSchedule, setLocalSchedule] = useState<{ [key: number]: string | null }>({});

  useEffect(() => {
    const initialSchedule: { [key: number]: string | null } = {};
    daysOfWeek.forEach(day => {
      const entry = schedule.find(s => s.day_of_week === day.value);
      initialSchedule[day.value] = entry?.focus_area || null;
    });
    setLocalSchedule(initialSchedule);
  }, [schedule]);

  const handleSelectChange = (dayOfWeek: number, focusArea: string) => {
    setLocalSchedule(prev => ({
      ...prev,
      [dayOfWeek]: focusArea === "none" ? null : focusArea, // Set to null if "none" is selected
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      for (const dayOfWeek of daysOfWeek) {
        await upsertScheduleEntry(dayOfWeek.value, localSchedule[dayOfWeek.value]);
      }
      showSuccess("Programme d'entraînement mis à jour avec succès !");
    } catch (err: any) {
      showError(`Erreur lors de la sauvegarde du programme: ${err.message}`);
    }
  };

  if (scheduleLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Chargement du programme d'entraînement...</p>
      </div>
    );
  }

  if (scheduleError) {
    return (
      <div className="container mx-auto py-8 text-center text-destructive">
        <h1 className="text-4xl font-bold mb-8">Erreur de chargement</h1>
        <p className="text-lg">
          Impossible de charger les données : {scheduleError?.message}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Mon Programme Hebdomadaire</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Définir votre programme d'entraînement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {daysOfWeek.map((day) => (
            <div key={day.value} className="flex items-center justify-between">
              <label className="w-1/3 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{day.label}</label>
              <Select
                value={localSchedule[day.value] === null ? "none" : localSchedule[day.value] || ""} // Map null to "none" for Select component
                onValueChange={(value) => handleSelectChange(day.value, value)}
              >
                <SelectTrigger className="w-2/3">
                  <SelectValue placeholder="Sélectionner une zone de focus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Jour de repos</SelectItem> {/* Changed value to "none" */}
                  {focusAreaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <Button onClick={handleSaveSchedule} className="w-full">
            <Save className="h-4 w-4 mr-2" /> Sauvegarder le programme
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutSchedulePage;