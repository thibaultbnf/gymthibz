"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Trash2, Lightbulb, Loader2, Calculator } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Workout, WorkoutTemplate, ExerciseSet } from "@/types/workout";
import { showSuccess, showError } from "@/utils/toast";
import { useWorkouts } from "@/hooks/use-workouts";
import { useExercises } from "@/hooks/use-exercises";
import { getExerciseHistory, getSmartSetSuggestion } from "@/utils/workoutCalculations";
import { OneRMCalculatorModal } from "@/components/OneRMCalculatorModal"; // Import the enhanced modal

const exerciseSetSchema = z.object({
  reps: z.coerce.number().min(0, "Répétitions requises"),
  weight: z.coerce.number().min(0, "Poids requis"),
  weighted_kg: z.coerce.number().min(0, "Poids lesté requis").optional().or(z.literal(0)),
});

const exerciseSchema = z.object({
  id: z.string().uuid().optional(),
  exercise_id: z.string().uuid().min(1, "Sélectionnez un exercice"),
  name: z.string().min(1, "Nom de l'exercice requis"),
  type: z.string().min(1, "Type d'exercice requis"), // ADDED: Type field
  sets: z.array(exerciseSetSchema).min(1, "Au moins une série est requise"),
});

const formSchema = z.object({
  date: z.date({
    required_error: "Une date d'entraînement est requise.",
  }),
  templateId: z.string().optional(),
  exercises: z.array(exerciseSchema).min(1, "Au moins un exercice est requis"),
});

type WorkoutFormValues = z.infer<typeof formSchema>;

interface AddWorkoutFormProps {
  onAddWorkout: (workout: Workout) => void;
  workoutTemplates: WorkoutTemplate[];
  initialFocusArea?: string;
  onFormSubmitted?: () => void;
}

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

const AddWorkoutForm: React.FC<AddWorkoutFormProps> = ({
  onAddWorkout,
  workoutTemplates,
  initialFocusArea,
  onFormSubmitted,
}) => {
  const { workouts: allWorkouts } = useWorkouts();
  const { exercises, loading: exercisesLoading, error: exercisesError } = useExercises();

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      templateId: undefined,
      exercises: [
        {
          id: crypto.randomUUID(),
          exercise_id: "",
          name: "",
          type: "", // ADDED: Initialize type
          sets: [{ reps: 0, weight: 0, weighted_kg: 0 }],
        },
      ],
    },
  });

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise, update: updateExercise } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const selectedTemplateId = form.watch("templateId");

  const initialFocusAreasArray = initialFocusArea ? initialFocusArea.split(',') : [];

  const filteredTemplates = initialFocusAreasArray.length > 0
    ? workoutTemplates.filter(t => t.focus_area && initialFocusAreasArray.includes(t.focus_area))
    : workoutTemplates;

  React.useEffect(() => {
    if (initialFocusAreasArray.length > 0 && filteredTemplates.length > 0 && !selectedTemplateId) {
      form.setValue("templateId", filteredTemplates[0].id);
    }
  }, [initialFocusAreasArray, filteredTemplates, form, selectedTemplateId]);

  React.useEffect(() => {
    if (selectedTemplateId) {
      const selectedTemplate = workoutTemplates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate) {
        const exercisesFromTemplate = selectedTemplate.exercises.map(templateEx => {
          const exerciseHistory = getExerciseHistory(allWorkouts, templateEx.name);
          return {
            id: crypto.randomUUID(),
            exercise_id: templateEx.exercise_id,
            name: templateEx.name,
            type: templateEx.type, // ADDED: Set type from template
            sets: templateEx.targetSets.map(targetSet => {
              const suggestion = getSmartSetSuggestion(exerciseHistory, targetSet);
              return {
                reps: suggestion.reps,
                weight: suggestion.weight,
                weighted_kg: suggestion.weighted_kg || 0,
              };
            }),
          };
        });
        form.setValue("exercises", exercisesFromTemplate);
      }
    } else if (initialFocusAreasArray.length === 0 && exerciseFields.length === 1 && form.getValues("exercises")[0].exercise_id === "") {
      // Only reset if it's the initial empty state and no template is selected
      form.setValue("exercises", [
        {
          id: crypto.randomUUID(),
          exercise_id: "",
          name: "",
          type: "", // ADDED: Initialize type
          sets: [{ reps: 0, weight: 0, weighted_kg: 0 }],
        },
      ]);
    }
  }, [selectedTemplateId, workoutTemplates, form, initialFocusAreasArray, allWorkouts, exerciseFields.length]);

  const handleExerciseSelect = (exerciseIndex: number, selectedExerciseId: string) => {
    const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);
    if (selectedExercise) {
      form.setValue(`exercises.${exerciseIndex}.exercise_id`, selectedExercise.id);
      form.setValue(`exercises.${exerciseIndex}.name`, selectedExercise.name);
      form.setValue(`exercises.${exerciseIndex}.type`, selectedExercise.type); // ADDED: Set type
      form.clearErrors(`exercises.${exerciseIndex}.exercise_id`);
    } else {
      // If selectedExercise is not found, reset related fields to default empty strings
      form.setValue(`exercises.${exerciseIndex}.exercise_id`, "");
      form.setValue(`exercises.${exerciseIndex}.name`, "");
      form.setValue(`exercises.${exerciseIndex}.type`, "");
    }
  };

  const handleApplySetsFrom1RM = (exerciseIndex: number, sets: ExerciseSet[]) => {
    const currentExercise = form.getValues(`exercises.${exerciseIndex}`);
    const selectedExerciseDefinition = exercises.find(ex => ex.id === currentExercise.exercise_id);
    const isBodyweightExercise = selectedExerciseDefinition?.type === 'bodyweight';

    updateExercise(exerciseIndex, {
      ...currentExercise,
      sets: sets.map(set => ({
        ...set,
        weighted_kg: isBodyweightExercise ? (set.weighted_kg || 0) : null,
      })),
    });
    showSuccess("Séries générées et appliquées avec succès !");
  };

  const onSubmit = (values: WorkoutFormValues) => {
    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      date: format(values.date, "yyyy-MM-DD"),
      exercises: values.exercises.map(ex => ({ // FIXED: Ensure all required fields are present
        id: ex.id || crypto.randomUUID(),
        exercise_id: ex.exercise_id,
        name: ex.name,
        type: ex.type, // ADDED: Ensure type is explicitly set
        sets: ex.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          weighted_kg: ex.type === 'bodyweight' && set.weighted_kg && set.weighted_kg > 0 ? set.weighted_kg : null, // Store null if 0 and not bodyweight
        })),
      })),
    };
    onAddWorkout(newWorkout);
    form.reset({
      date: new Date(),
      templateId: undefined,
      exercises: [
        {
          id: crypto.randomUUID(),
          exercise_id: "",
          name: "",
          type: "", // ADDED: Initialize type
          sets: [{ reps: 0, weight: 0, weighted_kg: 0 }],
        },
      ],
    });
    showSuccess("Entraînement ajouté avec succès !");
    if (onFormSubmitted) onFormSubmitted();
  };

  if (exercisesLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Chargement des exercices...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (exercisesError) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Erreur de chargement des exercices</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive">
          Impossible de charger la liste des exercices : {exercisesError} {/* FIXED: Display error directly */}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Ajouter un nouvel entraînement</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de l'entraînement</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <span> {/* Wrap content in a span */}
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </span>
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choisir un modèle d'entraînement</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un modèle (optionnel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} {template.focus_area ? `(${focusAreaLabels[template.focus_area] || template.focus_area})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {exerciseFields.map((exercise, exerciseIndex) => {
              const currentExerciseType = form.watch(`exercises.${exerciseIndex}.type`) || ""; // Ensure it's always a string
              return (
                <Card key={exercise.id} className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Exercice {exerciseIndex + 1}</h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeExercise(exerciseIndex)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Supprimer l'exercice
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`exercises.${exerciseIndex}.exercise_id`}
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Nom de l'exercice</FormLabel>
                        <Select
                          onValueChange={(value) => handleExerciseSelect(exerciseIndex, value)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un exercice" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {exercises.map((ex) => (
                              <SelectItem key={ex.id} value={ex.id}>
                                {ex.name} ({ex.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch(`exercises.${exerciseIndex}.exercise_id`) && (
                    <div className="mb-4">
                      <OneRMCalculatorModal
                        onApplySets={(sets) => handleApplySetsFrom1RM(exerciseIndex, sets)}
                        triggerButtonText="Générer les séries avec le calculateur 1RM"
                        initialExerciseId={form.watch(`exercises.${exerciseIndex}.exercise_id`)}
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <FormLabel>Séries</FormLabel>
                    {form.watch(`exercises.${exerciseIndex}.sets`).map((set, setIndex) => (
                      <div key={setIndex} className="flex items-end space-x-2">
                        <FormField
                          control={form.control}
                          name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Répétitions</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Poids (kg)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.5" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {currentExerciseType === 'bodyweight' && (
                          <FormField
                            control={form.control}
                            name={`exercises.${exerciseIndex}.sets.${setIndex}.weighted_kg`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Poids lesté (kg)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.5" placeholder="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const currentSets = form.getValues(`exercises.${exerciseIndex}.sets`);
                            if (currentSets.length > 1) {
                              const newSets = [...currentSets];
                              newSets.splice(setIndex, 1);
                              form.setValue(`exercises.${exerciseIndex}.sets`, newSets);
                            } else {
                              showError("Un exercice doit avoir au moins une série.");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        form.setValue(`exercises.${exerciseIndex}.sets`, [
                          ...form.getValues(`exercises.${exerciseIndex}.sets`),
                          { reps: 0, weight: 0, weighted_kg: 0 },
                        ])
                      }
                    >
                      <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une série
                    </Button>
                  </div>
                </Card>
              );
            })}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendExercise({
                  id: crypto.randomUUID(),
                  exercise_id: "",
                  name: "",
                  type: "", // ADDED: Initialize type
                  sets: [{ reps: 0, weight: 0, weighted_kg: 0 }],
                })
              }
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un exercice
            </Button>

            <Button type="submit" className="w-full">Enregistrer l'entraînement</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddWorkoutForm;