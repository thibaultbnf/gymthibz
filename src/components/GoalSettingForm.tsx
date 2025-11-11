"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showSuccess, showError } from "@/utils/toast";

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
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const goalSettingFormSchema = z.object({
  goal: z.string().min(1, "L'objectif est requis"),
  training_days_per_week: z.coerce.number().min(1, "Au moins 1 jour d'entraînement est requis").max(7, "Maximum 7 jours"),
});

type GoalSettingFormValues = z.infer<typeof goalSettingFormSchema>;

const goalOptions = [
  { value: "gain_muscle", label: "Gain de muscle" },
  { value: "weight_loss", label: "Perte de poids" },
  { value: "strength", label: "Force" },
  { value: "endurance", label: "Endurance" },
  { value: "general_fitness", label: "Forme physique générale" },
  { value: "other", label: "Autre" },
];

interface GoalSettingFormProps {
  onGoalsSaved: () => void;
}

const GoalSettingForm: React.FC<GoalSettingFormProps> = ({ onGoalsSaved }) => {
  const { user } = useSession();
  const [loading, setLoading] = useState(true);

  const form = useForm<GoalSettingFormValues>({
    resolver: zodResolver(goalSettingFormSchema),
    defaultValues: {
      goal: "",
      training_days_per_week: 0,
    },
  });

  useEffect(() => {
    const getProfileGoals = async () => {
      if (!user) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("goal, training_days_per_week")
        .eq("id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        showError(`Erreur lors du chargement des objectifs: ${error.message}`);
      } else if (data) {
        form.reset({
          goal: data.goal || "",
          training_days_per_week: data.training_days_per_week || 0,
        });
      }
      setLoading(false);
    };

    getProfileGoals();
  }, [user, form]);

  const onSubmit = async (values: GoalSettingFormValues) => {
    if (!user) {
      showError("Vous devez être connecté pour mettre à jour vos objectifs.");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        goal: values.goal,
        training_days_per_week: values.training_days_per_week,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      showError(`Erreur lors de la mise à jour des objectifs: ${error.message}`);
    } else {
      showSuccess("Objectifs mis à jour avec succès !");
      onGoalsSaved(); // Notify parent component that goals are saved
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Chargement des objectifs...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Définir vos objectifs d'entraînement</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Votre objectif principal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner votre objectif" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {goalOptions.map((option) => (
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
            <FormField
              control={form.control}
              name="training_days_per_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jours d'entraînement visés par semaine</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                "Sauvegarder les objectifs"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default GoalSettingForm;