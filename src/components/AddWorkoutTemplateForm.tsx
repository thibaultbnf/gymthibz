"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form"; // Import FormProvider
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2 } from "lucide-react";

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
import { WorkoutTemplate } from "@/types/workout";
import { showSuccess, showError } from "@/utils/toast";
import { useExercises } from "@/hooks/use-exercises";
import { templateExerciseSchema, default as TemplateExerciseInput } from "@/components/TemplateExerciseInput"; // Import the new component and its schema

const formSchema = z.object({
  name: z.string().min(1, "Nom du modèle requis"),
  description: z.string().optional(),
  focus_area: z.string().optional(),
  exercises: z.array(templateExerciseSchema).min(1, "Au moins un exercice est requis"),
});

type WorkoutTemplateFormValues = z.infer<typeof formSchema>;

interface AddWorkoutTemplateFormProps {
  onAddTemplate: (template: Omit<WorkoutTemplate, "id">) => void; // Changed to Omit<WorkoutTemplate, "id">
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
  const { loading: exercisesLoading, error: exercisesError } = useExercises();
  const [profileLoading, setProfileLoading] = useState(false); // Keep this for future profile-related loading

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

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const onSubmit = async (values: WorkoutTemplateFormValues) => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.error("Form validation errors:", form.formState.errors);
      showError("Veuillez corriger les erreurs dans le formulaire.");
      return;
    }

    const templateToSave: Omit<WorkoutTemplate, "id"> = { // Ensure 'id' is omitted for new templates
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

    try {
      if (initialData && onUpdateTemplate) {
        await onUpdateTemplate({ ...templateToSave, id: initialData.id }); // Add id back for update
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

  if (exercisesLoading || profileLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Chargement des données...</CardTitle>
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
        <FormProvider {...form}> {/* Wrap with FormProvider */}
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

            {exerciseFields.map((exercise, exerciseIndex) => (
              <Card key={exercise.id} className="p-4">
                <TemplateExerciseInput
                  exerciseIndex={exerciseIndex}
                  onRemove={handleRemoveExercise}
                />
              </Card>
            ))}

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
        </FormProvider>
      </CardContent>
    </Card>
  );
};

export default AddWorkoutTemplateForm;