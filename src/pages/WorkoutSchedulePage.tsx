"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"; // Import Command components
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Badge } from "@/components/ui/badge"; // Import Badge
import { ChevronDown, X, Save } from "lucide-react"; // Import ChevronDown and X icons
import { useWorkoutSchedule } from "@/hooks/use-workout-schedule";
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils"; // Import cn for styling

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

const focusAreaLabels: { [key: string]: string } = {
  "back": "Dos",
  "chest": "Pectoraux",
  "shoulders": "Épaules",
  "legs": "Jambes",
  "arms": "Bras",
  "full_body": "Full Body",
  "cardio": "Cardio",
  "other": "Autre",
};

const WorkoutSchedulePage: React.FC = () => {
  const { schedule, upsertScheduleEntry, loading: scheduleLoading, error: scheduleError } = useWorkoutSchedule();
  const [localSchedule, setLocalSchedule] = useState<{ [key: number]: string[] | null }>({});

  useEffect(() => {
    const initialSchedule: { [key: number]: string[] | null } = {};
    daysOfWeek.forEach(day => {
      const entry = schedule.find(s => s.day_of_week === day.value);
      initialSchedule[day.value] = entry?.focus_area || null;
    });
    setLocalSchedule(initialSchedule);
  }, [schedule]);

  const handleToggleFocusArea = (dayOfWeek: number, focusArea: string) => {
    setLocalSchedule(prev => {
      const currentAreas = prev[dayOfWeek] || [];
      if (currentAreas.includes(focusArea)) {
        const newAreas = currentAreas.filter(area => area !== focusArea);
        return {
          ...prev,
          [dayOfWeek]: newAreas.length > 0 ? newAreas : null,
        };
      } else {
        const newAreas = [...currentAreas, focusArea];
        return {
          ...prev,
          [dayOfWeek]: newAreas,
        };
      }
    });
  };

  const handleSaveSchedule = async () => {
    try {
      for (const day of daysOfWeek) {
        await upsertScheduleEntry(day.value, localSchedule[day.value]);
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
          Impossible de charger les données : {scheduleError} {/* FIXED: Display error directly */}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-2/3 justify-between h-auto min-h-[38px]"
                  >
                    <div className="flex flex-wrap gap-1">
                      {localSchedule[day.value] && localSchedule[day.value]!.length > 0 ? (
                        localSchedule[day.value]!.map((area) => (
                          <Badge key={area} variant="secondary" className="flex items-center">
                            {focusAreaLabels[area] || area}
                            <X
                              className="ml-1 h-3 w-3 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent popover from closing
                                handleToggleFocusArea(day.value, area);
                              }}
                            />
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Jour de repos ou Sélectionner...</span>
                      )}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandGroup>
                      {focusAreaOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          onSelect={() => handleToggleFocusArea(day.value, option.value)}
                          className="cursor-pointer"
                        >
                          <Checkbox
                            checked={localSchedule[day.value]?.includes(option.value) || false}
                            onCheckedChange={() => handleToggleFocusArea(day.value, option.value)}
                            className="mr-2"
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                      <CommandItem
                        onSelect={() => setLocalSchedule(prev => ({ ...prev, [day.value]: null }))}
                        className={cn(
                          "cursor-pointer",
                          (!localSchedule[day.value] || localSchedule[day.value]?.length === 0) && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Checkbox
                          checked={!localSchedule[day.value] || localSchedule[day.value]?.length === 0}
                          onCheckedChange={() => setLocalSchedule(prev => ({ ...prev, [day.value]: null }))}
                          className="mr-2"
                        />
                        Jour de repos
                      </CommandItem>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
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