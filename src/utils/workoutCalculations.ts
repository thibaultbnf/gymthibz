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
 * Calcule le volume total d'entraînement pour chaque jour.
 * Volume = Somme (répétitions * (poids + poids_lesté)) pour toutes les séries de tous les exercices d'un entraînement.
 * @param workouts Tableau des entraînements.
 * @returns Tableau d'objets { date, totalVolume } trié par date.
 */
export const calculateWorkoutVolume = (workouts: Workout[]): WorkoutVolumeData[] => {
  const volumeMap = new Map<string, number>();

  workouts.forEach(workout => {
    let dailyVolume = 0;
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        const effectiveWeight = set.weight + (set.weighted_kg || 0);
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
 * @param workouts Tableau des entraînements.
 * @returns Tableau d'objets PersonalRecord.
 */
export const calculatePersonalRecords = (workouts: Workout[]): PersonalRecord[] => {
  const prMap = new Map<string, { maxWeight: number; date: string }>();

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        const effectiveWeight = set.weight + (set.weighted_kg || 0);
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
 * @returns An array of objects { date, reps, weight, weighted_kg } for the given exercise.
 */
export const getExerciseHistory = (
  workouts: Workout[],
  exerciseName: string
): { date: string; reps: number; weight: number; weighted_kg: number | null }[] => {
  const history: { date: string; reps: number; weight: number; weighted_kg: number | null }[] = [];

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
        exercise.sets.forEach(set => {
          history.push({
            date: workout.date,
            reps: set.reps,
            weight: set.weight,
            weighted_kg: set.weighted_kg || null,
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
 * @param templateTarget The target reps/weight from the workout template for this set.
 * @returns Suggested reps and weight, including weighted_kg.
 */
export const getSmartSetSuggestion = (
  history: { date: string; reps: number; weight: number; weighted_kg: number | null }[],
  templateTarget: TemplateExerciseSet
): ExerciseSet => {
  const { targetReps, targetWeight, targetWeighted_kg } = templateTarget;

  // Default to template target if no history or if template target is 0
  if (history.length === 0 || (targetReps === 0 && targetWeight === 0 && (targetWeighted_kg || 0) === 0)) {
    return { reps: targetReps, weight: targetWeight, weighted_kg: targetWeighted_kg };
  }

  // Find the most recent set that achieved or exceeded the target reps with a positive effective weight
  const lastSuccessfulSet = history.find(
    (h) => h.reps >= targetReps && (h.weight + (h.weighted_kg || 0)) > 0
  );

  if (lastSuccessfulSet) {
    // Suggest a slight increase in effective weight (e.g., 2.5kg)
    const lastEffectiveWeight = lastSuccessfulSet.weight + (lastSuccessfulSet.weighted_kg || 0);
    const suggestedEffectiveWeight = lastEffectiveWeight + 2.5;

    // Try to keep the weighted_kg if it was used, otherwise apply increase to main weight
    let suggestedWeight = lastSuccessfulSet.weight;
    let suggestedWeighted_kg = lastSuccessfulSet.weighted_kg || 0;

    if (suggestedWeighted_kg > 0) {
      // If weighted, try to increase weighted_kg
      suggestedWeighted_kg = suggestedEffectiveWeight - suggestedWeight;
      if (suggestedWeighted_kg < 0) { // If suggested effective weight is less than base weight, adjust base weight
        suggestedWeight = suggestedEffectiveWeight;
        suggestedWeighted_kg = 0;
      }
    } else {
      // If not weighted, increase main weight
      suggestedWeight = suggestedEffectiveWeight;
    }

    return { reps: targetReps, weight: suggestedWeight, weighted_kg: suggestedWeighted_kg };
  } else {
    // If no successful set found for target reps, suggest the template target weight
    // or the highest effective weight ever lifted for any reps if template target is 0
    const highestEffectiveWeightEver = history.reduce((max, h) => Math.max(max, h.weight + (h.weighted_kg || 0)), 0);
    const suggestedEffectiveWeight = (targetWeight + (targetWeighted_kg || 0)) > 0
      ? (targetWeight + (targetWeighted_kg || 0))
      : highestEffectiveWeightEver > 0
        ? highestEffectiveWeightEver
        : 0;

    // Distribute suggested effective weight back to weight and weighted_kg, prioritizing weighted_kg if template had it
    let finalSuggestedWeight = targetWeight;
    let finalSuggestedWeighted_kg = targetWeighted_kg;

    if (finalSuggestedWeighted_kg && finalSuggestedWeighted_kg > 0) {
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