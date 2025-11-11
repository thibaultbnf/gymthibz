import { Workout, ExerciseSet, TemplateExerciseSet, TemplateExercise } from "@/types/workout";

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
 * Checks if all sets for a given exercise in its most recent workout were successfully completed
 * compared to its template targets.
 * @param exerciseHistory All historical sets for the specific exercise, sorted by date descending.
 * @param templateTargetSets The target sets from the workout template for this exercise.
 * @returns True if all sets in the last workout met or exceeded template targets, false otherwise.
 */
export const checkLastWorkoutSuccess = (
  exerciseHistory: { date: string; reps: number; weight: number; weighted_kg: number | null }[],
  templateTargetSets: TemplateExerciseSet[]
): boolean => {
  if (exerciseHistory.length === 0 || templateTargetSets.length === 0) {
    return false;
  }

  // Group history by workout date
  const workoutsByDate = new Map<string, { reps: number; weight: number; weighted_kg: number | null }[]>();
  exerciseHistory.forEach(h => {
    if (!workoutsByDate.has(h.date)) {
      workoutsByDate.set(h.date, []);
    }
    workoutsByDate.get(h.date)?.push(h);
  });

  const sortedWorkoutDates = Array.from(workoutsByDate.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const lastWorkoutDate = sortedWorkoutDates[0];
  const lastWorkoutSets = workoutsByDate.get(lastWorkoutDate) || [];

  // If the number of sets in the last workout doesn't match the template, it's not a clear success
  if (lastWorkoutSets.length !== templateTargetSets.length) {
    return false;
  }

  // Check each set against its corresponding template target
  for (let i = 0; i < templateTargetSets.length; i++) {
    const actualSet = lastWorkoutSets[i];
    const targetSet = templateTargetSets[i];

    const actualEffectiveWeight = actualSet.weight + (actualSet.weighted_kg || 0);
    const targetEffectiveWeight = targetSet.targetWeight + (targetSet.targetWeighted_kg || 0);

    // Check if reps met or exceeded target, and if weight was at least the target
    if (actualSet.reps < targetSet.targetReps || actualEffectiveWeight < targetEffectiveWeight) {
      return false; // At least one set failed to meet targets
    }
  }

  return true; // All sets met or exceeded targets
};


/**
 * Generates smart suggestions for reps and weight for a single set,
 * based on historical performance and template targets, implementing progressive overload.
 * @param templateTarget The target reps/weight from the workout template for this set.
 * @param exerciseType The type of exercise ('free_weight', 'machine', 'bodyweight', 'cardio', 'other').
 * @param lastWorkoutSuccessful A boolean indicating if the entire exercise was successful in the last workout.
 * @returns Suggested reps and weight, including weighted_kg.
 */
export const getSmartSetSuggestion = (
  templateTarget: TemplateExerciseSet,
  exerciseType: string,
  lastWorkoutSuccessful: boolean
): ExerciseSet => {
  const { targetReps, targetWeight, targetWeighted_kg } = templateTarget;
  const increment = 2.5; // Fixed increment for progressive overload

  let suggestedWeight = targetWeight;
  let suggestedWeighted_kg = targetWeighted_kg;

  if (lastWorkoutSuccessful) {
    // If all sets completed successfully, apply progressive overload (+2.5kg)
    if (exerciseType === 'bodyweight') {
      suggestedWeighted_kg = (targetWeighted_kg || 0) + increment;
    } else {
      suggestedWeight = targetWeight + increment;
    }
  }
  // If not successful, weights remain the same as the template target (no change needed here)

  // Round to nearest 0.5kg for practical weights
  suggestedWeight = Math.round(suggestedWeight * 2) / 2;
  if (suggestedWeighted_kg !== null) {
    suggestedWeighted_kg = Math.round(suggestedWeighted_kg * 2) / 2;
  }

  return {
    reps: targetReps,
    weight: suggestedWeight,
    weighted_kg: suggestedWeighted_kg,
  };
};