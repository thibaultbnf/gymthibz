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

const oneRMFormSchema = z.object({
  exercise_id: z.string().min(1, "Sélectionnez un exercice"),
  weight: z.coerce.number().min(1, "Le poids est requis"),
  reps: z.coerce.number().min(1, "Le nombre de répétitions est requis").max(10, "Max 10 répétitions pour une estimation fiable"),
});

type OneRMFormValues = z.infer<typeof oneRMFormSchema>;

const OneRMCalculatorModal: React.FC = () => {
  const { exercises, loading: exercisesLoading } = useExercises();
  const [estimated1RM, setEstimated1RM] = useState<number | null>(null);
  const [workingWeights, setWorkingWeights] = useState<{ percentage: number; weight: number }[]>([]);
  const [open, setOpen] = useState(false);

  const form = useForm<OneRMFormValues>({
    resolver: zodResolver(oneRMFormSchema),
    defaultValues: {
      exercise_id: "",
      weight: 0,
      reps: 0,
    },
  });

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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
      setEstimated1RM(null);
      setWorkingWeights([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Calculator className="mr-2 h-4 w-4" /> Calculateur 1RM & Poids de travail
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
            <Button type="submit" className="w-full">Calculer</Button>
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
              <h3 className="text-md font-semibold">Poids de travail suggérés :</h3>
              <div className="grid grid-cols-2 gap-2">
                {workingWeights.map((ww) => (
                  <div key={ww.percentage} className="flex justify-between items-center text-sm">
                    <span>{(ww.percentage * 100).toFixed(0)}% de 1RM :</span>
                    <span className="font-medium">{ww.weight.toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
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