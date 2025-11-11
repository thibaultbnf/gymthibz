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
 * based on historical performance and template targets, implementing progressive overload.
 * @param history All historical sets for the specific exercise, sorted by date descending.
 * @param templateTarget The target reps/weight from the workout template for this set.
 * @returns Suggested reps and weight, including weighted_kg.
 */
export const getSmartSetSuggestion = (
  history: { date: string; reps: number; weight: number; weighted_kg: number | null }[],
  templateTarget: TemplateExerciseSet
): ExerciseSet => {
  const { targetReps, targetWeight, targetWeighted_kg } = templateTarget;
  const defaultSuggestion: ExerciseSet = { reps: targetReps, weight: targetWeight, weighted_kg: targetWeighted_kg };

  if (history.length === 0) {
    return defaultSuggestion;
  }

  // Find the most recent workout that included this exercise
  const mostRecentWorkoutForExercise = history.find(h => h.reps > 0 || h.weight > 0 || (h.weighted_kg || 0) > 0);

  if (!mostRecentWorkoutForExercise) {
    return defaultSuggestion;
  }

  // Analyze performance from the most recent workout for this exercise
  // We need to group sets by workout date to analyze a "session"
  const workoutsByDate = new Map<string, { reps: number; weight: number; weighted_kg: number | null }[]>();
  history.forEach(h => {
    if (!workoutsByDate.has(h.date)) {
      workoutsByDate.set(h.date, []);
    }
    workoutsByDate.get(h.date)?.push(h);
  });

  const sortedWorkoutDates = Array.from(workoutsByDate.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const lastWorkoutDate = sortedWorkoutDates[0];
  const lastWorkoutSets = workoutsByDate.get(lastWorkoutDate) || [];

  // Determine if the user successfully completed all target sets in the last workout
  let allSetsCompletedSuccessfully = true;
  let partialFailureCount = 0; // 1-2 reps missing
  let totalFailureCount = 0; // more than 2 reps missing or multiple sets failed

  // For simplicity, we'll check if *any* set in the last workout met or exceeded the target reps
  // and if the weight was close to the target. This is a heuristic.
  // A more robust system would compare each set to its corresponding target.
  // For now, let's assume the template target is for *all* sets.
  const lastWorkoutEffectiveWeight = lastWorkoutSets.length > 0
    ? lastWorkoutSets[0].weight + (lastWorkoutSets[0].weighted_kg || 0)
    : 0;

  const targetEffectiveWeight = targetWeight + (targetWeighted_kg || 0);

  if (lastWorkoutSets.length > 0) {
    for (const set of lastWorkoutSets) {
      if (set.reps < targetReps) {
        const repsDifference = targetReps - set.reps;
        if (repsDifference <= 2) {
          partialFailureCount++;
        } else {
          totalFailureCount++;
        }
        allSetsCompletedSuccessfully = false;
      }
      // Also consider if the weight was significantly lower than target
      if ((set.weight + (set.weighted_kg || 0)) < (targetEffectiveWeight * 0.9)) { // If actual weight was less than 90% of target
        totalFailureCount++;
        allSetsCompletedSuccessfully = false;
      }
    }
  } else {
    allSetsCompletedSuccessfully = false; // No sets recorded for this exercise in the last workout
  }

  let suggestedWeight = targetWeight;
  let suggestedWeighted_kg = targetWeighted_kg;
  const increment = 2.5; // Fixed increment as per example

  if (allSetsCompletedSuccessfully) {
    // If all sets completed successfully, apply progressive overload (+2.5kg)
    let newEffectiveWeight = targetEffectiveWeight + increment;
    if (targetWeighted_kg !== null && targetWeighted_kg > 0) {
      // If it was a weighted bodyweight exercise, prioritize increasing weighted_kg
      suggestedWeighted_kg = (targetWeighted_kg || 0) + increment;
      suggestedWeight = targetWeight;
    } else {
      // Otherwise, increase the main weight
      suggestedWeight = targetWeight + increment;
      suggestedWeighted_kg = null;
    }
  } else if (partialFailureCount > 0 && totalFailureCount === 0) {
    // If partially failed (1-2 reps missing on some sets), keep same weight
    suggestedWeight = targetWeight;
    suggestedWeighted_kg = targetWeighted_kg;
  } else if (totalFailureCount > 0) {
    // If failed multiple times or significantly, reduce weight (-2.5kg)
    let newEffectiveWeight = targetEffectiveWeight - increment;
    if (newEffectiveWeight < 0) newEffectiveWeight = 0; // Ensure weight doesn't go negative

    if (targetWeighted_kg !== null && targetWeighted_kg > 0) {
      suggestedWeighted_kg = Math.max(0, (targetWeighted_kg || 0) - increment);
      suggestedWeight = targetWeight;
    } else {
      suggestedWeight = Math.max(0, targetWeight - increment);
      suggestedWeighted_kg = null;
    }
  }

  // Round to nearest 0.5kg for practical weights
  suggestedWeight = Math.round(suggestedWeight * 2) / 2;
  if (suggestedWeighted_kg !== null) {
    suggestedWeighted_kg = Math.round(suggestedWeighted_kg * 2) / 2;
  }

  return {
    reps: targetReps, // Reps usually stay the same for progressive overload
    weight: suggestedWeight,
    weighted_kg: suggestedWeighted_kg,
  };
};