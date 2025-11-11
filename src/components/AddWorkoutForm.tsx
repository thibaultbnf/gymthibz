"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Workout, WorkoutTemplate } from "@/types/workout";
import { showSuccess, showError } from "@/utils/toast";

const exerciseSetSchema = z.object({
  reps: z.coerce.number().min(0, "Répétitions requises"),
  weight: z.coerce.number().min(0, "Poids requis"),
});

const exerciseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nom de l'exercice requis"),
  sets: z.array(exerciseSetSchema).min(1, "Au moins une série est requise"),
});

const formSchema = z.object({
  date: z.date({
    required_error: "Une date d'entraînement est requise.",
  }),
  templateId: z.string().optional(), // Added for template selection
  exercises: z.array(exerciseSchema).min(1, "Au moins un exercice est requis"),
});

type WorkoutFormValues = z.infer<typeof formSchema>;

interface AddWorkoutFormProps {
  onAddWorkout: (workout: Workout) => void;
  workoutTemplates: WorkoutTemplate[];
  initialTemplateId?: string; // New prop for initial template selection
  onFormSubmitted?: () => void; // Callback to hide form after submission
}

const AddWorkoutForm: React.FC<AddWorkoutFormProps> = ({
  onAddWorkout,
  workoutTemplates,
  initialTemplateId,
  onFormSubmitted,
}) => {
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      templateId: initialTemplateId || "", // Use initialTemplateId if provided
      exercises: [
        {
          id: crypto.randomUUID(),
          name: "",
          sets: [{ reps: 0, weight: 0 }],
        },
      ],
    },
  });

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const selectedTemplateId = form.watch("templateId");

  React.useEffect(() => {
    // Only apply template if it's explicitly selected or provided initially
    if (selectedTemplateId) {
      const selectedTemplate = workoutTemplates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate) {
        const exercisesFromTemplate = selectedTemplate.exercises.map(templateEx => ({
          id: crypto.randomUUID(), // Generate new ID for the workout exercise
          name: templateEx.name,
          sets: templateEx.targetSets.map(targetSet => ({
            reps: targetSet.targetReps,
            weight: targetSet.targetWeight,
          })),
        }));
        form.setValue("exercises", exercisesFromTemplate);
      }
    } else if (!initialTemplateId) { // Only reset if no initial template and none selected
      // If no template selected, reset to a single empty exercise
      form.setValue("exercises", [
        {
          id: crypto.randomUUID(),
          name: "",
          sets: [{ reps: 0, weight: 0 }],
        },
      ]);
    }
  }, [selectedTemplateId, workoutTemplates, form, initialTemplateId]);


  const onSubmit = (values: WorkoutFormValues) => {
    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      date: format(values.date, "yyyy-MM-dd"),
      exercises: values.exercises.map(ex => ({
        ...ex,
        id: ex.id || crypto.randomUUID(),
      })),
    };
    onAddWorkout(newWorkout);
    form.reset({
      date: new Date(),
      templateId: "",
      exercises: [
        {
          id: crypto.randomUUID(),
          name: "",
          sets: [{ reps: 0, weight: 0 }],
        },
      ],
    });
    showSuccess("Entraînement ajouté avec succès !");
    if (onFormSubmitted) onFormSubmitted();
  };

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
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                      <SelectItem value="">Aucun modèle</SelectItem>
                      {workoutTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
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
                        { reps: 0, weight: 0 },
                      ])
                    }
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une série
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
                  sets: [{ reps: 0, weight: 0 }],
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