import { TemplateExerciseSet } from "@/types/workout";

/**
 * Estime le 1RM (One-Rep Max) en utilisant la formule d'Epley.
 * @param weight Le poids soulevé.
 * @param reps Le nombre de répétitions effectuées.
 * @returns Le 1RM estimé.
 */
export const calculateOneRM = (weight: number, reps: number): number => {
  if (reps === 0) return 0;
  if (reps === 1) return weight;
  // Formule d'Epley: 1RM = Poids * (1 + Répétitions / 30)
  return Math.round(weight * (1 + reps / 30));
};

/**
 * Génère un plan d'entraînement (séries cibles) basé sur le 1RM et l'objectif de l'utilisateur,
 * avec des variations de poids/répétitions et une gestion spécifique pour les exercices au poids du corps.
 * @param oneRM Le 1RM calculé pour l'exercice (pour les poids libres/machines, c'est le poids total; pour le poids du corps, c'est le poids lesté max).
 * @param goal L'objectif d'entraînement de l'utilisateur (currently ignored for fixed scheme).
 * @param exerciseType Le type d'exercice ('free_weight', 'machine', 'bodyweight', 'cardio', 'other').
 * @returns Un tableau de TemplateExerciseSet avec les poids et répétitions cibles.
 */
export const generateTrainingPlan = (oneRM: number, goal: string, exerciseType: string): TemplateExerciseSet[] => {
  let sets: TemplateExerciseSet[] = [];

  // Fixed 3-set descending rep scheme with specific 1RM percentages
  const planDetails = [
    { reps: 12, percentage: 0.65 }, // Set 1: 12 reps @ 65% of 1RM
    { reps: 10, percentage: 0.70 }, // Set 2: 10 reps @ 70% of 1RM
    { reps: 8, percentage: 0.75 },  // Set 3: 8 reps @ 75% of 1RM
  ];

  planDetails.forEach(detail => {
    // Calculate the target weight based on the 1RM and percentage
    let calculatedWeight = oneRM * detail.percentage;

    // Round to the nearest 2.5 kg for practical weights
    calculatedWeight = Math.round(calculatedWeight / 2.5) * 2.5;
    
    // Ensure weight is not negative
    if (calculatedWeight < 0) calculatedWeight = 0;

    if (exerciseType === 'bodyweight') {
      sets.push({
        targetReps: detail.reps,
        targetWeight: 0, // Main weight is 0 for bodyweight exercises
        targetWeighted_kg: calculatedWeight, // The calculated weight is the added weight
      });
    } else {
      sets.push({
        targetReps: detail.reps,
        targetWeight: calculatedWeight,
        targetWeighted_kg: null, // No additional weighted_kg for non-bodyweight exercises
      });
    }
  });

  return sets;
};