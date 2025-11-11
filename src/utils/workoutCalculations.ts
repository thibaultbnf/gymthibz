import { Workout, ExerciseSet, TemplateExerciseSet } from "@/types/workout";

export interface WorkoutVolumeData {
  date: string;
  totalVolume: number;
}

export interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  date: string; // Date when the PR was achieved
}

/**
 * Helper to determine if an exercise is a dumbbell exercise based on type and name.
 */
const isDumbbellExercise = (exerciseType: string, exerciseName: string): boolean => {
  return exerciseType === 'free_weight' && exerciseName.toLowerCase().includes('haltère');
};

/**
 * Calculates the effective total weight for a single set, considering dumbbells.
 */
const getEffectiveWeight = (exerciseType: string, exerciseName: string, set: ExerciseSet | TemplateExerciseSet): number => {
  const baseWeight = set.weight || set.targetWeight || 0;
  const weightedKg = set.weighted_kg || set.targetWeighted_kg || 0;
  
  if (isDumbbellExercise(exerciseType, exerciseName)) {
    return (2 * baseWeight) + weightedKg;
  }
  return baseWeight + weightedKg;
};

/**
 * Calcule le volume total d'entraînement pour chaque jour.
 * Volume = Somme (répétitions * (poids + poids_lesté)) pour toutes les séries de tous les exercices d'un entraînement.
 * Pour les haltères, le poids est doublé.
 * @param workouts Tableau des entraînements.
 * @returns Tableau d'objets { date, totalVolume } trié par date.
 */
export const calculateWorkoutVolume = (workouts: Workout[]): WorkoutVolumeData[] => {
  const volumeMap = new Map<string, number>();

  workouts.forEach(workout => {
    let dailyVolume = 0;
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        const effectiveWeight = getEffectiveWeight(exercise.type, exercise.name, set);
        dailyVolume += set.reps * effectiveWeight;
      });
    });

    // Si plusieurs entraînements le même jour, additionner les volumes
    volumeMap.set(workout.date, (volumeMap.get(workout.date) || 0) + dailyVolume);
  });

  const data = Array.from(volumeMap.entries()).map(([date, totalVolume]) => ({
    date,
    totalVolume,
  }));

  // Trier par date
  data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return data;
};

/**
 * Calcule les records personnels (max poids) pour chaque exercice, en incluant le poids lesté.
 * Pour les haltères, le poids est doublé.
 * @param workouts Tableau des entraînements.
 * @returns Tableau d'objets PersonalRecord.
 */
export const calculatePersonalRecords = (workouts: Workout[]): PersonalRecord[] => {
  const prMap = new Map<string, { maxWeight: number; date: string }>();

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        const effectiveWeight = getEffectiveWeight(exercise.type, exercise.name, set);
        const currentMax = prMap.get(exercise.name);
        if (!currentMax || effectiveWeight > currentMax.maxWeight) {
          prMap.set(exercise.name, { maxWeight: effectiveWeight, date: workout.date });
        } else if (effectiveWeight === currentMax.maxWeight && new Date(workout.date) < new Date(currentMax.date)) {
          // If same weight, keep the earliest date
          prMap.set(exercise.name, { maxWeight: effectiveWeight, date: workout.date });
        }
      });
    });
  });

  const prs: PersonalRecord[] = Array.from(prMap.entries()).map(([exerciseName, data]) => ({
    exerciseName,
    maxWeight: data.maxWeight,
    date: data.date,
  }));

  // Sort PRs alphabetically by exercise name
  prs.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

  return prs;
};

/**
 * Extracts all sets for a specific exercise from the user's entire workout history,
 * sorted by date descending.
 * @param workouts All user workouts.
 * @param exerciseName The name of the exercise to get history for.
 * @returns An array of objects { date, reps, weight, weighted_kg, type } for the given exercise.
 */
export const getExerciseHistory = (
  workouts: Workout[],
  exerciseName: string
): { date: string; reps: number; weight: number; weighted_kg: number | null; type: string }[] => {
  const history: { date: string; reps: number; weight: number; weighted_kg: number | null; type: string }[] = [];

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
        exercise.sets.forEach(set => {
          history.push({
            date: workout.date,
            reps: set.reps,
            weight: set.weight,
            weighted_kg: set.weighted_kg || null,
            type: exercise.type, // Include exercise type in history
          });
        });
      }
    });
  });

  // Sort by date descending (most recent first)
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return history;
};

/**
 * Generates smart suggestions for reps and weight for a single set,
 * based on historical performance and template targets.
 * @param history All historical sets for the specific exercise, sorted by date descending.
 * @param exerciseType The type of the current exercise.
 * @param exerciseName The name of the current exercise.
 * @param templateTarget The target reps/weight from the workout template for this set.
 * @returns Suggested reps and weight, including weighted_kg.
 */
export const getSmartSetSuggestion = (
  history: { date: string; reps: number; weight: number; weighted_kg: number | null; type: string }[],
  exerciseType: string,
  exerciseName: string,
  templateTarget: TemplateExerciseSet
): ExerciseSet => {
  const { targetReps, targetWeight, targetWeighted_kg } = templateTarget;

  // Default to template target if no history or if template target is 0
  if (history.length === 0 || (targetReps === 0 && targetWeight === 0 && (targetWeighted_kg || 0) === 0)) {
    return { reps: targetReps, weight: targetWeight, weighted_kg: targetWeighted_kg };
  }

  // Find the most recent set that achieved or exceeded the target reps with a positive effective weight
  const lastSuccessfulSet = history.find(
    (h) => h.reps >= targetReps && getEffectiveWeight(h.type, exerciseName, h) > 0
  );

  if (lastSuccessfulSet) {
    const lastEffectiveWeight = getEffectiveWeight(lastSuccessfulSet.type, exerciseName, lastSuccessfulSet);
    const suggestedEffectiveWeight = lastEffectiveWeight + 2.5; // Suggest a slight increase

    let suggestedWeight = lastSuccessfulSet.weight;
    let suggestedWeighted_kg = lastSuccessfulSet.weighted_kg || 0;

    if (isDumbbellExercise(exerciseType, exerciseName)) {
      // For dumbbells, distribute increase to per-dumbbell weight
      const currentPerDumbbellWeight = lastSuccessfulSet.weight;
      const currentTotalWeight = (2 * currentPerDumbbellWeight) + suggestedWeighted_kg;
      const diff = suggestedEffectiveWeight - currentTotalWeight;
      
      if (diff > 0) {
        // Try to add to per-dumbbell weight first
        suggestedWeight = currentPerDumbbellWeight + (diff / 2);
      } else {
        suggestedWeight = currentPerDumbbellWeight; // No increase if effective weight decreased
      }
    } else {
      // For other exercises, apply increase to main weight
      suggestedWeight = suggestedEffectiveWeight - suggestedWeighted_kg;
      if (suggestedWeight < 0) { // If main weight becomes negative, put all on weighted_kg
        suggestedWeighted_kg = suggestedEffectiveWeight;
        suggestedWeight = 0;
      }
    }

    return { reps: targetReps, weight: suggestedWeight, weighted_kg: suggestedWeighted_kg };
  } else {
    // If no successful set found for target reps, suggest the template target weight
    // or the highest effective weight ever lifted for any reps if template target is 0
    const highestEffectiveWeightEver = history.reduce((max, h) => Math.max(max, getEffectiveWeight(h.type, exerciseName, h)), 0);
    const suggestedEffectiveWeight = getEffectiveWeight(exerciseType, exerciseName, templateTarget) > 0
      ? getEffectiveWeight(exerciseType, exerciseName, templateTarget)
      : highestEffectiveWeightEver > 0
        ? highestEffectiveWeightEver
        : 0;

    // Distribute suggested effective weight back to weight and weighted_kg, prioritizing weighted_kg if template had it
    let finalSuggestedWeight = templateTarget.targetWeight;
    let finalSuggestedWeighted_kg = templateTarget.targetWeighted_kg;

    if (isDumbbellExercise(exerciseType, exerciseName)) {
      // For dumbbells, distribute total effective weight to per-dumbbell weight
      finalSuggestedWeight = (suggestedEffectiveWeight - (finalSuggestedWeighted_kg || 0)) / 2;
      if (finalSuggestedWeight < 0) {
        finalSuggestedWeighted_kg = suggestedEffectiveWeight;
        finalSuggestedWeight = 0;
      }
    } else if (finalSuggestedWeighted_kg && finalSuggestedWeighted_kg > 0) {
      // If template had weighted_kg, try to maintain it and adjust main weight
      finalSuggestedWeight = suggestedEffectiveWeight - finalSuggestedWeighted_kg;
      if (finalSuggestedWeight < 0) { // If main weight becomes negative, put all on weighted_kg
        finalSuggestedWeighted_kg = suggestedEffectiveWeight;
        finalSuggestedWeight = 0;
      }
    } else {
      // Otherwise, put all on main weight
      finalSuggestedWeight = suggestedEffectiveWeight;
      finalSuggestedWeighted_kg = 0;
    }

    return { reps: targetReps, weight: finalSuggestedWeight, weighted_kg: finalSuggestedWeighted_kg };
  }
};