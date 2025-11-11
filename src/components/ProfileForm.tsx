"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Profile } from "@/types/workout";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const profileFormSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis").optional().or(z.literal("")),
  last_name: z.string().min(1, "Le nom est requis").optional().or(z.literal("")),
  height_cm: z.coerce.number().min(1, "La taille doit être supérieure à 0").optional().or(z.literal(0)),
  weight_kg: z.coerce.number().min(0.1, "Le poids doit être supérieur à 0").optional().or(z.literal(0)),
  goal: z.string().optional().or(z.literal("")), // Changed to string for select
  training_days_per_week: z.coerce.number().min(0, "Le nombre de jours doit être positif").max(7, "Maximum 7 jours").optional().or(z.literal(0)), // New field
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const goalOptions = [
  { value: "gain_muscle", label: "Gain de muscle" },
  { value: "weight_loss", label: "Perte de poids" },
  { value: "strength", label: "Force" },
  { value: "endurance", label: "Endurance" },
  { value: "general_fitness", label: "Forme physique générale" },
  { value: "other", label: "Autre" },
];

const ProfileForm: React.FC = () => {
  const { user } = useSession();
  const [loading, setLoading] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      height_cm: 0,
      weight_kg: 0,
      goal: "",
      training_days_per_week: 0,
    },
  });

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, height_cm, weight_kg, goal, training_days_per_week")
        .eq("id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        showError(`Erreur lors du chargement du profil: ${error.message}`);
      } else if (data) {
        form.reset({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          height_cm: data.height_cm || 0,
          weight_kg: data.weight_kg || 0,
          goal: data.goal || "",
          training_days_per_week: data.training_days_per_week || 0,
        });
      }
      setLoading(false);
    };

    getProfile();
  }, [user, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      showError("Vous devez être connecté pour mettre à jour votre profil.");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        height_cm: values.height_cm && values.height_cm > 0 ? values.height_cm : null,
        weight_kg: values.weight_kg && values.weight_kg > 0 ? values.weight_kg : null,
        goal: values.goal || null,
        training_days_per_week: values.training_days_per_week && values.training_days_per_week > 0 ? values.training_days_per_week : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      showError(`Erreur lors de la mise à jour du profil: ${error.message}`);
    } else {
      showSuccess("Profil mis à jour avec succès !");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Chargement du profil...</CardTitle>
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
        <CardTitle>Mon Profil</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre prénom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="height_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taille (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 175" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poids (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Ex: 70.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objectif</FormLabel>
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
                  <FormLabel>Jours d'entraînement par semaine</FormLabel>
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
                "Sauvegarder le profil"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;