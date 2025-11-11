"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Trash2 } from "lucide-react";

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
import { WorkoutTemplate } from "@/types/workout";
import { showSuccess, showError } from "@/utils/toast";

const templateExerciseSetSchema = z.object({
  targetReps: z.coerce.number().min(1, "Répétitions cibles requises"),
  targetWeight: z.coerce.number().min(0, "Poids cible requis"),
});

const templateExerciseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nom de l'exercice requis"),
  targetSets: z.array(templateExerciseSetSchema).min(1, "Au moins une série cible est requise"),
});

const formSchema = z.object({
  name: z.string().min(1, "Nom du modèle requis"),
  description: z.string().optional(),
  exercises: z.array(templateExerciseSchema).min(1, "Au moins un exercice est requis"),
});

type WorkoutTemplateFormValues = z.infer<typeof formSchema>;

interface AddWorkoutTemplateFormProps {
  onAddTemplate: (template: WorkoutTemplate) => void;
  initialData?: WorkoutTemplate;
  onUpdateTemplate?: (template: WorkoutTemplate) => void;
  onCancel?: () => void;
}

const AddWorkoutTemplateForm: React.FC<AddWorkoutTemplateFormProps> = ({
  onAddTemplate,
  initialData,
  onUpdateTemplate,
  onCancel,
}) => {
  const form = useForm<WorkoutTemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          exercises: initialData.exercises.map(ex => ({
            ...ex,
            targetSets: ex.targetSets || [{ targetReps: 0, targetWeight: 0 }], // Ensure targetSets exist
          })),
        }
      : {
          name: "",
          description: "",
          exercises: [
            {
              id: crypto.randomUUID(),
              name: "",
              targetSets: [{ targetReps: 0, targetWeight: 0 }],
            },
          ],
        },
  });

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const onSubmit = (values: WorkoutTemplateFormValues) => {
    const templateToSave: WorkoutTemplate = {
      id: initialData?.id || crypto.randomUUID(),
      name: values.name,
      description: values.description,
      exercises: values.exercises.map(ex => ({
        ...ex,
        id: ex.id || crypto.randomUUID(),
      })),
    };

    if (initialData && onUpdateTemplate) {
      onUpdateTemplate(templateToSave);
      showSuccess("Modèle d'entraînement mis à jour avec succès !");
    } else {
      onAddTemplate(templateToSave);
      showSuccess("Modèle d'entraînement ajouté avec succès !");
    }
    form.reset();
    if (onCancel) onCancel();
  };

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

            {exerciseFields.map((exercise, exerciseIndex) => (
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
                  name={`exercises.${exerciseIndex}.name`}
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Nom de l'exercice</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Développé couché" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            <FormLabel>Poids cible (kg)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                        { targetReps: 0, targetWeight: 0 },
                      ])
                    }
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une série cible
                  </Button>
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendExercise({
                  id: crypto.randomUUID(),
                  name: "",
                  targetSets: [{ targetReps: 0, targetWeight: 0 }],
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