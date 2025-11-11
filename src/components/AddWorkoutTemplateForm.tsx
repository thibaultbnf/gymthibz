"use client";

import React, { useState } from "react"; // Import useState
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Trash2, Loader2, Calculator } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkoutTemplate, ExerciseSet, TemplateExerciseSet } from "@/types/workout";
import { showSuccess, showError } from "@/utils/toast";
import { useExercises } from "@/hooks/use-exercises";
import { useWorkouts } from "@/hooks/use-workouts";
import { getExerciseHistory, getSmartSetSuggestion } from "@/utils/workoutCalculations";
import { OneRMCalculatorModal } from "@/components/OneRMCalculatorModal";

const templateExerciseSetSchema = z.object({
  targetReps: z.coerce.number().min(1, "Répétitions cibles requises"),
  targetWeight: z.coerce.number().min(0, "Poids cible requis"),
  targetWeighted_kg: z.coerce.number().min(0, "Poids lesté cible requis").optional().or(z.literal(0)),
});

const templateExerciseSchema = z.object({
  id: z.string().uuid().optional(),
  exercise_id: z.string().uuid().min(1, "Sélectionnez un exercice"),
  name: z.string().min(1, "Nom de l'exercice requis"),
  type: z.string().min(1, "Type d'exercice requis"),
  targetSets: z.array(templateExerciseSetSchema).min(1, "Au moins une série cible est requise"),
});

const formSchema = z.object({
  name: z.string().min(1, "Nom du modèle requis"),
  description: z.string().optional(),
  focus_area: z.string().optional(),
  exercises: z.array(templateExerciseSchema).min(1, "Au moins un exercice est requis"),
});

type WorkoutTemplateFormValues = z.infer<typeof formSchema>;

interface AddWorkoutTemplateFormProps {
  onAddTemplate: (template: WorkoutTemplate) => void;
  initialData?: WorkoutTemplate;
  onUpdateTemplate?: (template: WorkoutTemplate) => void;
  onCancel?: () => void;
}

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

const AddWorkoutTemplateForm: React.FC<AddWorkoutTemplateFormProps> = ({
  onAddTemplate,
  initialData,
  onUpdateTemplate,
  onCancel,
}) => {
  const { exercises, loading: exercisesLoading, error: exercisesError } = useExercises();
  const { workouts: allWorkouts } = useWorkouts();

  // State to control opening the 1RM calculator for a specific exercise index
  const [open1RMCalculatorForExerciseIndex, setOpen1RMCalculatorForExerciseIndex] = useState<number | null>(null);

  const form = useForm<WorkoutTemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description ?? "",
          focus_area: initialData.focus_area ?? undefined,
          exercises: initialData.exercises.map(ex => ({
            id: ex.id,
            exercise_id: ex.exercise_id,
            name: ex.name,
            type: ex.type,
            targetSets: ex.targetSets.map(set => ({
              targetReps: set.targetReps,
              targetWeight: set.targetWeight,
              targetWeighted_kg: set.targetWeighted_kg ?? 0,
            })),
          })),
        }
      : {
          name: "",
          description: "",
          focus_area: undefined,
          exercises: [
            {
              id: crypto.randomUUID(),
              exercise_id: "",
              name: "",
              type: "",
              targetSets: [{ targetReps: 0, targetWeight: 0, targetWeighted_kg: 0 }],
            },
          ],
        },
  });

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise, update: updateExercise } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const handleExerciseSelect = (exerciseIndex: number, selectedExerciseId: string) => {
    const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);
    if (selectedExercise) {
      form.setValue(`exercises.${exerciseIndex}.exercise_id`, selectedExercise.id);
      form.setValue(`exercises.${exerciseIndex}.name`, selectedExercise.name);
      form.setValue(`exercises.${exerciseIndex}.type`, selectedExercise.type);
      form.clearErrors(`exercises.${exerciseIndex}.exercise_id`);

      const exerciseHistory = getExerciseHistory(allWorkouts, selectedExercise.name);

      if (exerciseHistory.length === 0) {
        // If no history, automatically open the 1RM calculator and provide guidance
        setOpen1RMCalculatorForExerciseIndex(exerciseIndex);
        showSuccess("Veuillez utiliser le calculateur 1RM pour définir les séries cibles de cet exercice.");
        // Ensure default sets are present if none exist
        if (form.getValues(`exercises.${exerciseIndex}.targetSets`).length === 0) {
            form.setValue(`exercises.${exerciseIndex}.targetSets`, [{ targetReps: 0, targetWeight: 0, targetWeighted_kg: 0 }]);
        }
      } else {
        // Existing logic for smart suggestions if history is available
        const currentTargetSets = form.getValues(`exercises.${exerciseIndex}.targetSets`);
        const updatedTargetSets = currentTargetSets.map((set: TemplateExerciseSet) => { // Explicitly type 'set' here
          const suggestion = getSmartSetSuggestion(exerciseHistory, set);
          return {
            targetReps: suggestion.reps,
            targetWeight: suggestion.weight,
            targetWeighted_kg: selectedExercise.type === 'bodyweight' ? (suggestion.weighted_kg || 0) : null, // Explicitly set to null for non-bodyweight
          };
        });
        form.setValue(`exercises.${exerciseIndex}.targetSets`, updatedTargetSets);

        // If the exercise type is not 'bodyweight', ensure targetWeighted_kg is 0
        if (selectedExercise.type !== 'bodyweight') { // <--- HERE
          form.setValue(`exercises.${exerciseIndex}.targetSets`, form.getValues(`exercises.${exerciseIndex}.targetSets`).map(set => ({
            ...set,
            targetWeighted_kg: null, // Ensure it's null for non-bodyweight
          })));
        }
      }
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

    const newTargetSets: TemplateExerciseSet[] = sets.map(set => ({
      targetReps: set.reps,
      targetWeight: set.weight,
      targetWeighted_kg: isBodyweightExercise ? (set.weighted_kg || 0) : null, // Explicitly set to null for non-bodyweight
    }));
    updateExercise(exerciseIndex, {
      ...currentExercise,
      targetSets: newTargetSets,
    });
    showSuccess("Séries générées et appliquées avec succès au modèle !");
    setOpen1RMCalculatorForExerciseIndex(null); // Close the modal after applying
  };

  const getWeightLabel = (exerciseType: string, exerciseName: string) => {
    if (exerciseType === 'free_weight' && exerciseName.toLowerCase().includes('haltère')) {
      return "Poids cible (par haltère, kg)";
    }
    return "Poids cible (kg)";
  };

  const onSubmit = async (values: WorkoutTemplateFormValues) => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.error("Form validation errors:", form.formState.errors);
      showError("Veuillez corriger les erreurs dans le formulaire.");
      return;
    }

    const templateToSave: WorkoutTemplate = {
      id: initialData?.id || crypto.randomUUID(),
      name: values.name,
      description: values.description,
      focus_area: values.focus_area || null,
      exercises: values.exercises.map(ex => ({
        id: ex.id || crypto.randomUUID(),
        exercise_id: ex.exercise_id,
        name: ex.name,
        type: ex.type,
        targetSets: ex.targetSets.map(set => ({
          targetReps: set.targetReps,
          targetWeight: set.targetWeight,
          targetWeighted_kg: ex.type === 'bodyweight' && set.targetWeighted_kg && set.targetWeighted_kg > 0 ? set.targetWeighted_kg : null,
        })),
      })),
    };

    console.log("Template data being sent to Supabase:", templateToSave);

    try {
      if (initialData && onUpdateTemplate) {
        await onUpdateTemplate(templateToSave);
        showSuccess("Modèle d'entraînement mis à jour avec succès !");
      } else {
        await onAddTemplate(templateToSave);
        showSuccess("Modèle d'entraînement ajouté avec succès !");
      }
      form.reset();
      if (onCancel) onCancel();
    } catch (error: any) {
      console.error("Form submission error:", error);
      showError(`Erreur lors de la soumission du formulaire: ${error.message}`);
    }
  };

  const handleRemoveExercise = (index: number) => {
    if (exerciseFields.length === 1) {
      showError("Un modèle d'entraînement doit contenir au moins un exercice.");
      return;
    }
    removeExercise(index);
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
          Impossible de charger la liste des exercices : {exercisesError}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{initialData ? "Modifier le modèle d'entraînement" : "Créer un nouveau modèle d'entraînement"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du modèle</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Full Body Force" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Entraînement complet pour la force générale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="focus_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone de focus (optionnel)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une zone de focus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {focusAreaOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              const currentExerciseName = form.watch(`exercises.${exerciseIndex}.name`) || ""; // Ensure it's always a string
              const currentExerciseId = form.watch(`exercises.${exerciseIndex}.exercise_id`);

              return (
                <Card key={exercise.id} className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Exercice {exerciseIndex + 1}</h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveExercise(exerciseIndex)}
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

                  {currentExerciseId && ( // Only show 1RM calculator if an exercise is selected
                    <div className="mb-4">
                      <OneRMCalculatorModal
                        onApplySets={(sets) => handleApplySetsFrom1RM(exerciseIndex, sets)}
                        triggerButtonText="Générer les séries avec le calculateur 1RM"
                        initialExerciseId={currentExerciseId}
                        open={open1RMCalculatorForExerciseIndex === exerciseIndex} // Control open state
                        onOpenChange={(isOpen) => {
                          if (!isOpen) {
                            setOpen1RMCalculatorForExerciseIndex(null); // Close the modal
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <FormLabel>Séries cibles</FormLabel>
                    {form.watch(`exercises.${exerciseIndex}.targetSets`).map((set, setIndex) => (
                      <div key={setIndex} className="flex items-end space-x-2">
                        <FormField
                          control={form.control}
                          name={`exercises.${exerciseIndex}.targetSets.${setIndex}.targetReps`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Répétitions cibles</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`exercises.${exerciseIndex}.targetSets.${setIndex}.targetWeight`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>{getWeightLabel(currentExerciseType, currentExerciseName)}</FormLabel>
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
                            name={`exercises.${exerciseIndex}.targetSets.${setIndex}.targetWeighted_kg`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Poids lesté cible (kg)</FormLabel>
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
                            const currentSets = form.getValues(`exercises.${exerciseIndex}.targetSets`);
                            if (currentSets.length > 1) {
                              const newSets = [...currentSets];
                              newSets.splice(setIndex, 1);
                              form.setValue(`exercises.${exerciseIndex}.targetSets`, newSets);
                            } else {
                              showError("Un exercice doit avoir au moins une série cible.");
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
                        form.setValue(`exercises.${exerciseIndex}.targetSets`, [
                          ...form.getValues(`exercises.${exerciseIndex}.targetSets`),
                          { targetReps: 0, targetWeight: 0, targetWeighted_kg: 0 },
                        ])
                      }
                    >
                      <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une série cible
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
                  type: "",
                  targetSets: [{ targetReps: 0, targetWeight: 0, targetWeighted_kg: 0 }],
                })
              }
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un exercice
            </Button>

            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Annuler
                </Button>
              )}
              <Button type="submit">{initialData ? "Mettre à jour le modèle" : "Créer le modèle"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddWorkoutTemplateForm;