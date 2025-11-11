"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserGoal } from "@/types/workout";
import { useUserGoals } from "@/hooks/use-user-goals";

const goalTypeOptions = [
  { value: "weight_loss", label: "Perte de poids" },
  { value: "muscle_gain", label: "Gain de muscle" },
  { value: "strength", label: "Force" },
  { value: "endurance", label: "Endurance" },
  { value: "other", label: "Autre" },
];

const goalFormSchema = z.object({
  name: z.string().min(1, "Le nom de l'objectif est requis."),
  description: z.string().optional(),
  goal_type: z.enum(['weight_loss', 'muscle_gain', 'strength', 'endurance', 'other'], {
    required_error: "Le type d'objectif est requis.",
  }),
  target_value: z.coerce.number().min(0, "La valeur cible doit être positive.").optional().or(z.literal(0)),
  target_unit: z.string().optional(),
  target_date: z.date().optional().nullable(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  initialData?: UserGoal;
  onSuccess: () => void;
  onCancel: () => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { addGoal, updateGoal } = useUserGoals();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          target_date: initialData.target_date ? new Date(initialData.target_date) : null,
          target_value: initialData.target_value || 0,
        }
      : {
          name: "",
          description: "",
          goal_type: "other",
          target_value: 0,
          target_unit: "",
          target_date: null,
        },
  });

  const onSubmit = async (values: GoalFormValues) => {
    setLoading(true);
    const goalToSave = {
      name: values.name,
      description: values.description || null,
      goal_type: values.goal_type,
      target_value: values.target_value && values.target_value > 0 ? values.target_value : null,
      target_unit: values.target_unit || null,
      target_date: values.target_date ? format(values.target_date, "yyyy-MM-dd") : null,
    };

    if (initialData) {
      await updateGoal({ ...initialData, ...goalToSave });
    } else {
      await addGoal(goalToSave);
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Modifier l'objectif" : "Ajouter un nouvel objectif"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'objectif</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Atteindre 100kg au développé couché" {...field} />
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
                    <Textarea placeholder="Détails de mon objectif..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'objectif</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type d'objectif" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {goalTypeOptions.map((option) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur cible</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Ex: 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité cible (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: kg, cm, reps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="target_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date cible (optionnel)</FormLabel>
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
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  initialData ? "Mettre à jour l'objectif" : "Ajouter l'objectif"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default GoalForm;