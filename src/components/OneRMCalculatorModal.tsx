"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calculator, Dumbbell, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExercises } from "@/hooks/use-exercises";
import { estimateOneRepMax, calculateWorkingWeight } from "@/utils/workoutCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExerciseSet } from "@/types/workout";
import { showError } from "@/utils/toast";

const oneRMFormSchema = z.object({
  exercise_id: z.string().min(1, "Sélectionnez un exercice"),
  weight: z.coerce.number().min(1, "Le poids est requis"),
  reps: z.coerce.number().min(1, "Le nombre de répétitions est requis").max(10, "Max 10 répétitions pour une estimation fiable"),
  numSets: z.coerce.number().min(1, "Nombre de séries requis").max(10, "Max 10 séries").optional().or(z.literal(0)),
  targetRepsPerSet: z.coerce.number().min(1, "Répétitions cibles requises").optional().or(z.literal(0)),
  targetPercentage: z.coerce.number().min(0.1).max(1).optional(), // Percentage of 1RM for working weight
});

type OneRMFormValues = z.infer<typeof oneRMFormSchema>;

interface OneRMCalculatorModalProps {
  onApplySets?: (sets: ExerciseSet[]) => void; // Callback to apply generated sets
  triggerButtonText?: string;
  initialExerciseId?: string;
}

const OneRMCalculatorModal: React.FC<OneRMCalculatorModalProps> = ({
  onApplySets,
  triggerButtonText = "Calculateur 1RM & Poids de travail",
  initialExerciseId,
}) => {
  const { exercises, loading: exercisesLoading } = useExercises();
  const [estimated1RM, setEstimated1RM] = useState<number | null>(null);
  const [workingWeights, setWorkingWeights] = useState<{ percentage: number; weight: number }[]>([]);
  const [open, setOpen] = useState(false);

  const form = useForm<OneRMFormValues>({
    resolver: zodResolver(oneRMFormSchema),
    defaultValues: {
      exercise_id: initialExerciseId || "",
      weight: 0,
      reps: 0,
      numSets: 3, // Default to 3 sets
      targetRepsPerSet: 8, // Default to 8 reps
      targetPercentage: 0.75, // Default to 75% of 1RM
    },
  });

  React.useEffect(() => {
    if (initialExerciseId) {
      form.setValue("exercise_id", initialExerciseId);
    }
  }, [initialExerciseId, form]);

  const onSubmit = (values: OneRMFormValues) => {
    const oneRM = estimateOneRepMax(values.weight, values.reps);
    setEstimated1RM(oneRM);

    const percentages = [0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90]; // Common training percentages
    const calculatedWeights = percentages.map(p => ({
      percentage: p,
      weight: calculateWorkingWeight(oneRM, p),
    }));
    setWorkingWeights(calculatedWeights);
  };

  const handleApplySets = () => {
    if (!onApplySets) {
      showError("La fonction d'application des séries n'est pas disponible.");
      return;
    }
    if (estimated1RM === null) {
      showError("Veuillez d'abord calculer le 1RM.");
      return;
    }

    const values = form.getValues();
    const numSets = values.numSets || 0;
    const targetReps = values.targetRepsPerSet || 0;
    const targetPercentage = values.targetPercentage || 0;

    if (numSets <= 0 || targetReps <= 0 || targetPercentage <= 0) {
      showError("Veuillez spécifier le nombre de séries, les répétitions cibles et le pourcentage.");
      return;
    }

    const calculatedWorkingWeight = calculateWorkingWeight(estimated1RM, targetPercentage);
    const generatedSets: ExerciseSet[] = Array.from({ length: numSets }).map(() => ({
      reps: targetReps,
      weight: calculatedWorkingWeight,
      weighted_kg: null, // Default to null, user can adjust if bodyweight
    }));

    onApplySets(generatedSets);
    setOpen(false); // Close modal after applying
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset({
        exercise_id: initialExerciseId || "",
        weight: 0,
        reps: 0,
        numSets: 3,
        targetRepsPerSet: 8,
        targetPercentage: 0.75,
      });
      setEstimated1RM(null);
      setWorkingWeights([]);
    }
  };

  const selectedExercise = exercises.find(ex => ex.id === form.watch("exercise_id"));
  const isBodyweightExercise = selectedExercise?.type === 'bodyweight';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Calculator className="mr-2 h-4 w-4" /> {triggerButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Calculateur 1RM & Poids de travail</DialogTitle>
          <DialogDescription>
            Estimez votre One-Rep Max (1RM) et obtenez des suggestions de poids pour vos séries d'entraînement.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="exercise_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercice</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un exercice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {exercisesLoading ? (
                        <SelectItem value="loading" disabled>Chargement...</SelectItem>
                      ) : (
                        exercises.map((ex) => (
                          <SelectItem key={ex.id} value={ex.id}>
                            {ex.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poids soulevé (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" placeholder="Ex: 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Répétitions</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full">Calculer 1RM</Button>
          </form>
        </Form>

        {estimated1RM !== null && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dumbbell className="mr-2 h-5 w-5 text-primary" /> Résultats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-lg font-semibold">
                1RM Estimé : <span className="text-primary">{estimated1RM.toFixed(1)} kg</span>
              </div>
              <Separator />
              <h3 className="text-md font-semibold">Générer des séries de travail :</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numSets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de séries</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetRepsPerSet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Répétitions cibles</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="targetPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pourcentage du 1RM</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseFloat(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un pourcentage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workingWeights.map((ww) => (
                          <SelectItem key={ww.percentage} value={ww.percentage.toString()}>
                            {(ww.percentage * 100).toFixed(0)}% ({ww.weight.toFixed(1)} kg)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {onApplySets && (
                <Button type="button" onClick={handleApplySets} className="w-full mt-4">
                  Appliquer les séries au formulaire
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { OneRMCalculatorModal };