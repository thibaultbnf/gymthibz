"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2, Edit, Trash2, Calculator } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useExercises } from "@/hooks/use-exercises";
import { ExerciseDefinition } from "@/types/workout";
import { OneRMCalculatorModal } from "@/components/OneRMCalculatorModal"; // Import the new modal

const exerciseTypeOptions = [
  { value: "free_weight", label: "Poids libre" },
  { value: "bodyweight", label: "Poids du corps" },
  { value: "machine", label: "Machine" },
  { value: "cardio", label: "Cardio" },
  { value: "other", label: "Autre" },
];

const exerciseFormSchema = z.object({
  name: z.string().min(1, "Le nom de l'exercice est requis"),
  type: z.string().min(1, "Le type d'exercice est requis"),
});

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

const ExercisesPage: React.FC = () => {
  const { exercises, addExerciseDefinition, updateExerciseDefinition, deleteExerciseDefinition, loading, error } = useExercises();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseDefinition | null>(null);

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: "",
      type: "",
    },
  });

  React.useEffect(() => {
    if (editingExercise) {
      form.reset({
        name: editingExercise.name,
        type: editingExercise.type,
      });
      setShowAddForm(true);
    } else {
      form.reset({
        name: "",
        type: "",
      });
    }
  }, [editingExercise, form]);

  const onSubmit = async (values: ExerciseFormValues) => {
    if (editingExercise) {
      // When updating, ensure 'created_at' is preserved from the existing object
      await updateExerciseDefinition({
        id: editingExercise.id,
        name: values.name,
        type: values.type,
        created_at: editingExercise.created_at,
      });
    } else {
      const newExerciseData: Omit<ExerciseDefinition, "id" | "created_at"> = { // Explicitly type newExerciseData
        name: values.name,
        type: values.type,
      };
      await addExerciseDefinition(newExerciseData);
    }
    setShowAddForm(false);
    setEditingExercise(null);
    form.reset();
  };

  const handleEdit = (exercise: ExerciseDefinition) => {
    setEditingExercise(exercise);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingExercise(null);
    form.reset();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Chargement des exercices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-destructive">
        <h1 className="text-4xl font-bold mb-8">Erreur de chargement</h1>
        <p className="text-lg">Impossible de charger les exercices : {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Gestion des Exercices</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="flex-1">
            <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un nouvel exercice
          </Button>
        )}
        <OneRMCalculatorModal /> {/* Integrate the 1RM calculator modal here */}
      </div>

      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingExercise ? "Modifier l'exercice" : "Ajouter un nouvel exercice"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'exercice</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Développé couché" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'exercice</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exerciseTypeOptions.map((option) => (
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
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="ghost" onClick={handleCancel}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingExercise ? "Mettre à jour l'exercice" : "Ajouter l'exercice"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <h2 className="text-3xl font-bold mb-6 mt-12">Exercices existants</h2>
      {exercises.length === 0 ? (
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Aucun exercice enregistré pour le moment. Ajoutez votre premier exercice !
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">{exercise.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(exercise)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action ne peut pas être annulée. Cela supprimera définitivement cet exercice
                          de votre liste.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteExerciseDefinition(exercise.id)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Type : {exerciseTypeOptions.find(opt => opt.value === exercise.type)?.label || exercise.type}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExercisesPage;