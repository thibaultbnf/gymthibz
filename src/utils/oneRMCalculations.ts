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
 * Génère un plan d'entraînement (séries cibles) basé sur le 1RM et l'objectif de l'utilisateur.
 * @param oneRM Le 1RM calculé pour l'exercice.
 * @param goal L'objectif d'entraînement de l'utilisateur ('strength', 'hypertrophy', 'endurance', etc.).
 * @returns Un tableau de TemplateExerciseSet avec les poids et répétitions cibles.
 */
export const generateTrainingPlan = (oneRM: number, goal: string): TemplateExerciseSet[] => {
  let sets: TemplateExerciseSet[] = [];
  let percentageRange: [number, number]; // [min_percentage, max_percentage]
  let repsRange: [number, number]; // [min_reps, max_reps]
  let numSets: number;

  switch (goal) {
    case 'strength':
      percentageRange = [0.80, 0.90]; // 80-90% du 1RM
      repsRange = [3, 5]; // 3-5 répétitions
      numSets = 4; // 3 à 5 séries, on prend 4 comme moyenne
      break;
    case 'hypertrophy':
      percentageRange = [0.70, 0.80]; // 70-80% du 1RM
      repsRange = [6, 10]; // 6-10 répétitions
      numSets = 3; // 3 à 4 séries, on prend 3 comme moyenne
      break;
    case 'endurance':
      percentageRange = [0.60, 0.70]; // 60-70% du 1RM
      repsRange = [12, 15]; // 12-15 répétitions
      numSets = 3; // 3 à 4 séries, on prend 3 comme moyenne
      break;
    default: // Default to hypertrophy if goal is not recognized or not set
      percentageRange = [0.70, 0.80];
      repsRange = [6, 10];
      numSets = 3;
      break;
  }

  const targetWeight = Math.round(oneRM * ((percentageRange[0] + percentageRange[1]) / 2) / 2.5) * 2.5; // Arrondi au 2.5 kg le plus proche
  const targetReps = Math.round((repsRange[0] + repsRange[1]) / 2);

  for (let i = 0; i < numSets; i++) {
    sets.push({
      targetReps: targetReps,
      targetWeight: targetWeight,
      targetWeighted_kg: null, // Par défaut, pas de poids lesté
    });
  }

  return sets;
};