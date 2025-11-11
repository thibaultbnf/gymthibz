"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showError } from "@/utils/toast";
import { useExercises } from "@/hooks/use-exercises";
import OneRMCalculatorModal from "@/components/OneRMCalculatorModal";
import { generateTrainingPlan } from "@/utils/oneRMCalculations";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";

// Define the schema for a single exercise within the template
export const templateExerciseSchema = z.object({
  id: z.string().uuid().optional(),
  exercise_id: z.string().uuid().min(1, "Sélectionnez un exercice"),
  name: z.string().min(1, "Nom de l'exercice requis"),
  type: z.string().min(1, "Type d'exercice requis"),
  targetSets: z.array(z.object({
    targetReps: z.coerce.number().min(1, "Répétitions cibles requises"),
    targetWeight: z.coerce.number().min(0, "Poids cible requis"),
    targetWeighted_kg: z.coerce.number().min(0, "Poids lesté cible requis").optional().or(z.literal(0)),
  })).min(1, "Au moins une série cible est requise"),
});

interface TemplateExerciseInputProps {
  exerciseIndex: number;
  onRemove: (index: number) => void;
}

const exerciseTypeOptions = [
  { value: "free_weight", label: "Poids libres" },
  { value: "machine", label: "Machine" },
  { value: "bodyweight", label: "Poids du corps" },
  { value: "cardio", label: "Cardio" },
  { value: "other", label: "Autre" },
];

const TemplateExerciseInput: React.FC<TemplateExerciseInputProps> = ({
  exerciseIndex,
  onRemove,
}) => {
  const { user } = useSession();
  const { exercises } = useExercises();
  const { control, watch, setValue, clearErrors } = useFormContext();
  const [userGoal, setUserGoal] = React.useState<string | null>(null);
  const [showOneRMModal, setShowOneRMModal] = React.useState(false);
  const [currentExerciseNameFor1RM, setCurrentExerciseNameFor1RM] = React.useState<string>("");

  const { fields: setFields, append: appendSet, remove: removeSet } = useFieldArray({
    control,
    name: `exercises.${exerciseIndex}.targetSets`,
  });

  const currentExerciseType = watch(`exercises.${exerciseIndex}.type`);
  const currentExerciseName = watch(`exercises.${exerciseIndex}.name`);

  // Fetch user goal
  React.useEffect(() => {
    const fetchUserGoal = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("goal")
        .eq("id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(`Erreur lors du chargement de l'objectif utilisateur: ${error.message}`);
      } else if (data) {
        setUserGoal(data.goal);
      }
    };
    fetchUserGoal();
  }, [user]);

  const handleExerciseSelect = (selectedExerciseId: string) => {
    const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);
    if (selectedExercise) {
      setValue(`exercises.${exerciseIndex}.exercise_id`, selectedExercise.id);
      setValue(`exercises.${exerciseIndex}.name`, selectedExercise.name);
      setValue(`exercises.${exerciseIndex}.type`, selectedExercise.type);
      clearErrors(`exercises.${exerciseIndex}.exercise_id`);

      // Reset targetWeighted_kg if the new exercise type is not 'bodyweight'
      if (selectedExercise.type !== 'bodyweight') {
        setValue(`exercises.${exerciseIndex}.targetSets`, watch(`exercises.${exerciseIndex}.targetSets`).map((set: any) => ({
          ...set,
          targetWeighted_kg: 0,
        })));
      } else {
        setValue(`exercises.${exerciseIndex}.targetSets`, watch(`exercises.${exerciseIndex}.targetSets`).map((set: any) => ({
          ...set,
          targetWeighted_kg: set.targetWeighted_kg === null ? 0 : set.targetWeighted_kg,
        })));
      }

      // Trigger 1RM modal for new exercise selection
      setCurrentExerciseNameFor1RM(selectedExercise.name);
      setShowOneRMModal(true);
    }
  };

  const handleOneRMCalculated = (oneRM: number) => {
    if (userGoal) {
      const generatedSets = generateTrainingPlan(oneRM, userGoal);
      const currentExerciseType = watch(`exercises.${exerciseIndex}.type`);

      // Adjust targetWeighted_kg based on exercise type
      const finalGeneratedSets = generatedSets.map(set => ({
        ...set,
        targetWeighted_kg: currentExerciseType === 'bodyweight' ? (set.targetWeighted_kg || 0) : null,
      }));

      setValue(`exercises.${exerciseIndex}.targetSets`, finalGeneratedSets);
      showError("Plan d'entraînement généré et appliqué !"); // Using showError for now, will change to showSuccess later
    } else {
      showError("Veuillez définir votre objectif d'entraînement dans votre profil pour générer un plan.");
    }
  };

  const getWeightLabel = (exerciseType: string, exerciseName: string) => {
    if (exerciseType === 'free_weight' && exerciseName.toLowerCase().includes('haltère')) {
      return "Poids cible (par haltère, kg)";
    }
    return "Poids cible (kg)";
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Exercice {exerciseIndex + 1}</h3>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onRemove(exerciseIndex)}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Supprimer l'exercice
        </Button>
      </div>
      <FormField
        control={control}
        name={`exercises.${exerciseIndex}.exercise_id`}
        render={({ field }) => (
          <FormItem className="mb-4">
            <FormLabel>Nom de l'exercice</FormLabel>
            <Select
              onValueChange={(value) => handleExerciseSelect(value)}
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

      <div className="space-y-4">
        <FormLabel>Séries cibles</FormLabel>
        {setFields.map((set, setIndex) => (
          <div key={set.id} className="flex items-end space-x-2">
            <FormField
              control={control}
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
              control={control}
              name={`exercises.${exerciseIndex}.targetSets.${setIndex}.targetWeight`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>{getWeightLabel(currentExerciseType, currentExerciseName)}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {currentExerciseType === 'bodyweight' && (
              <FormField
                control={control}
                name={`exercises.${exerciseIndex}.targetSets.${setIndex}.targetWeighted_kg`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Poids lesté cible (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (setFields.length > 1) {
                  removeSet(setIndex);
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
            appendSet({ targetReps: 0, targetWeight: 0, targetWeighted_kg: 0 })
          }
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une série cible
        </Button>
      </div>
      {showOneRMModal && (
        <OneRMCalculatorModal
          isOpen={showOneRMModal}
          onClose={() => setShowOneRMModal(false)}
          exerciseName={currentExerciseNameFor1RM}
          onOneRMCalculated={handleOneRMCalculated}
        />
      )}
    </>
  );
};

export default TemplateExerciseInput;