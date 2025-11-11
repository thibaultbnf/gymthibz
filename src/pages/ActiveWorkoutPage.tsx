"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  PlusCircle,
  Trash2,
  Lightbulb,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Dumbbell,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
import { Workout, WorkoutTemplate } from "@/types/workout";
import { showSuccess, showError } from "@/utils/toast";
import { useWorkouts } from "@/hooks/use-workouts";
import { useWorkoutTemplates } from "@/hooks/use-workout-templates";
import { useExercises } from "@/hooks/use-exercises";
import { getExerciseHistory, checkLastWorkoutSuccess, getSmartSetSuggestion } from "@/utils/workoutCalculations"; // Import new helper functions
import { Separator } from "@/components/ui/separator";

const exerciseSetSchema = z.object({
  reps: z.coerce.number().min(0, "Répétitions requises"),
  weight: z.coerce.number().min(0, "Poids requis"),
  weighted_kg: z.coerce.number().min(0, "Poids lesté requis").optional().or(z.literal(0)),
});

const exerciseSchema = z.object({
  id: z.string().uuid().optional(),
  exercise_id: z.string().uuid().min(1, "Sélectionnez un exercice"),
  name: z.string().min(1, "Nom de l'exercice requis"),
  type: z.string().min(1, "Type d'exercice requis"),
  sets: z.array(exerciseSetSchema).min(1, "Au moins une série est requise"),
});

const formSchema = z.object({
  date: z.date({
    required_error: "Une date d'entraînement est requise.",
  }),
  templateId: z.string().optional(),
  exercises: z.array(exerciseSchema).min(1, "Au moins un exercice est requis"),
});

type ActiveWorkoutFormValues = z.infer<typeof formSchema>;

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

const REST_TIMER_DURATION = 60; // seconds

const ActiveWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFocusArea = searchParams.get("focusArea");

  const { workouts: allWorkouts, addWorkout } = useWorkouts();
  const { templates: workoutTemplates, loading: templatesLoading } = useWorkoutTemplates();
  const { exercises, loading: exercisesLoading } = useExercises();

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [timer, setTimer] = useState(REST_TIMER_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ActiveWorkoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      templateId: undefined,
      exercises: [
        {
          id: crypto.randomUUID(),
          exercise_id: "",
          name: "",
          type: "",
          sets: [{ reps: 0, weight: 0, weighted_kg: 0 }],
        },
      ],
    },
  });

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const selectedTemplateId = form.watch("templateId");

  const filteredTemplates = initialFocusArea
    ? workoutTemplates.filter(t => t.focus_area && initialFocusArea.split(',').includes(t.focus_area))
    : workoutTemplates;

  // Effect to set initial template based on focus area or first available
  useEffect(() => {
    if (!templatesLoading && !selectedTemplateId && filteredTemplates.length > 0) {
      form.setValue("templateId", filteredTemplates[0].id);
    }
  }, [templatesLoading, selectedTemplateId, filteredTemplates, form]);

  // Effect to load exercises from selected template and apply smart suggestions
  useEffect(() => {
    if (selectedTemplateId && !exercisesLoading && !templatesLoading) {
      const selectedTemplate = workoutTemplates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate) {
        const exercisesFromTemplate = selectedTemplate.exercises.map(templateEx => {
          const exerciseHistory = getExerciseHistory(allWorkouts, templateEx.name);
          const lastWorkoutSuccessful = checkLastWorkoutSuccess(exerciseHistory, templateEx.targetSets); // Check overall success

          return {
            id: crypto.randomUUID(),
            exercise_id: templateEx.exercise_id,
            name: templateEx.name,
            type: templateEx.type,
            sets: templateEx.targetSets.map(targetSet => {
              const suggestion = getSmartSetSuggestion(templateSet, templateEx.type, lastWorkoutSuccessful); // Pass overall success
              return {
                reps: suggestion.reps,
                weight: suggestion.weight,
                weighted_kg: suggestion.weighted_kg || 0,
              };
            }),
          };
        });
        form.setValue("exercises", exercisesFromTemplate);
        setActiveExerciseIndex(0);
        setActiveSetIndex(0);
      }
    } else if (!selectedTemplateId && !initialFocusArea) {
      // Reset if no template selected and no initial focus area
      form.setValue("exercises", [
        {
          id: crypto.randomUUID(),
          exercise_id: "",
          name: "",
          type: "",
          sets: [{ reps: 0, weight: 0, weighted_kg: 0 }],
        },
      ]);
    }
  }, [selectedTemplateId, workoutTemplates, form, initialFocusArea, allWorkouts, exercisesLoading, templatesLoading]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      showSuccess("Temps de repos terminé !");
    } else if (!isTimerRunning && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timer]);

  const startTimer = () => {
    setTimer(REST_TIMER_DURATION);
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimer(REST_TIMER_DURATION);
  };

  const handleSetComplete = () => {
    const currentExercise = form.getValues(`exercises.${activeExerciseIndex}`);
    const currentSets = currentExercise.sets;

    if (activeSetIndex < currentSets.length - 1) {
      setActiveSetIndex((prev) => prev + 1);
      startTimer(); // Start timer for rest between sets
    } else if (activeExerciseIndex < exerciseFields.length - 1) {
      setActiveExerciseIndex((prev) => prev + 1);
      setActiveSetIndex(0);
      startTimer(); // Start timer for rest between exercises
    } else {
      showSuccess("Toutes les séries sont terminées !");
      setIsTimerRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleExerciseSelect = (exerciseIndex: number, selectedExerciseId: string) => {
    const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);
    if (selectedExercise) {
      form.setValue(`exercises.${exerciseIndex}.exercise_id`, selectedExercise.id);
      form.setValue(`exercises.${exerciseIndex}.name`, selectedExercise.name);
      form.setValue(`exercises.${exerciseIndex}.type`, selectedExercise.type);
      form.clearErrors(`exercises.${exerciseIndex}.exercise_id`);
    }
  };

  const onSubmit = async (values: ActiveWorkoutFormValues) => {
    const newWorkout: Omit<Workout, "id"> = {
      date: format(values.date, "yyyy-MM-DD"),
      exercises: values.exercises.map(ex => ({
        id: ex.id || crypto.randomUUID(),
        exercise_id: ex.exercise_id,
        name: ex.name,
        type: ex.type,
        sets: ex.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          weighted_kg: ex.type === 'bodyweight' && set.weighted_kg && set.weighted_kg > 0 ? set.weighted_kg : null,
        })),
      })),
    };
    await addWorkout(newWorkout);
    showSuccess("Entraînement enregistré avec succès !");
    navigate("/workouts"); // Redirect to workouts history
  };

  if (templatesLoading || exercisesLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Chargement des données d'entraînement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Session d'entraînement active</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Détails de la séance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <h2 className="text-3xl font-bold mb-6">Exercices de la séance</h2>

          {exerciseFields.length === 0 ? (
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Ajoutez des exercices manuellement ou sélectionnez un modèle pour commencer.
            </p>
          ) : (
            exerciseFields.map((exercise, exerciseIndex) => {
              const currentExerciseType = form.watch(`exercises.${exerciseIndex}.type`);
              const isCurrentExercise = exerciseIndex === activeExerciseIndex;

              return (
                <Card key={exercise.id} className={cn("p-4", isCurrentExercise ? "border-primary-foreground border-2" : "")}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Dumbbell className="h-5 w-5 mr-2 text-primary" />
                      {exerciseIndex + 1}. {form.watch(`exercises.${exerciseIndex}.name`) || "Nouvel Exercice"}
                    </h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeExercise(exerciseIndex)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Supprimer
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

                  <div className="space-y-4 mt-6">
                    <FormLabel className="text-lg font-medium">Séries</FormLabel>
                    {form.watch(`exercises.${exerciseIndex}.sets`).map((set, setIndex) => (
                      <div key={setIndex} className={cn("flex items-end space-x-2 p-2 rounded-md", isCurrentExercise && activeSetIndex === setIndex ? "bg-muted/50" : "")}>
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <FormField
                            control={form.control}
                            name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reps</FormLabel>
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
                              <FormItem>
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
                                <FormItem>
                                  <FormLabel>Lesté (kg)</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.5" placeholder="0" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
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
                        {isCurrentExercise && activeSetIndex === setIndex && (
                          <Button
                            type="button"
                            variant="default"
                            size="icon"
                            onClick={handleSetComplete}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
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
            })
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              appendExercise({
                id: crypto.randomUUID(),
                exercise_id: "",
                name: "",
                type: "",
                sets: [{ reps: 0, weight: 0, weighted_kg: 0 }],
              })
            }
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un exercice
          </Button>

          <Separator className="my-8" />

          <Card className="p-4 text-center">
            <CardTitle className="mb-4">Temps de repos</CardTitle>
            <div className="text-6xl font-bold mb-4">
              {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
            </div>
            <div className="flex justify-center space-x-4">
              <Button onClick={startTimer} disabled={isTimerRunning}>
                <Play className="h-5 w-5 mr-2" /> Démarrer
              </Button>
              <Button onClick={pauseTimer} disabled={!isTimerRunning}>
                <Pause className="h-5 w-5 mr-2" /> Pause
              </Button>
              <Button onClick={resetTimer} variant="outline">
                <RotateCcw className="h-5 w-5 mr-2" /> Réinitialiser
              </Button>
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-8">
            <Button type="submit" className="w-full md:w-auto">Terminer et Enregistrer l'entraînement</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ActiveWorkoutPage;